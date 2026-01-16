/**
 * Dual DB routing + PostgreSQL adapter unit tests (no external DB)
 *
 * These tests validate:
 * - `DBTYPE=postgres` routes DB-centric exports to the Postgres implementation.
 * - Ownership enforcement (`WHERE ownerColumn = $n`) prevents cross-user access.
 * - Uniqueness enforcement returns 409 conflicts rather than silently inserting duplicates.
 *
 * Note:
 * - Networked Postgres is intentionally NOT used; we mock the Pool surface.
 * - This aligns with the repo policy: no external service calls in tests.
 */

import {
  createPostgresResource,
  createUniqueDoc,
  findUserDoc,
  updateUserDoc,
  listUserDocs,
  createCrudService,
  getDbType,
  optimizeQuery,
} from '../../index';

type Row = {
  id: number;
  user: string;
  title: string;
  createdAt: string;
  deleted: boolean;
  deletedAt: string | null;
};

function createMockRes() {
  // Minimal Express-like Response mock for http-utils helpers.
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as any;
}

class MockPostgresPool {
  private rows: Row[] = [];
  private nextId = 1;

  // `pg.Pool` surface: query(text, params)
  async query(text: string, params: unknown[] = []) {
    const sql = String(text);

    // Fast path: `SELECT 1` health check.
    if (/^SELECT 1\b/i.test(sql)) {
      return { rows: [{ '?column?': 1 }], rowCount: 1 };
    }

    // Uniqueness check used by ensureUniquePostgres:
    // `SELECT "id" AS id FROM "posts" WHERE "user" = $1 AND "title" = $2 LIMIT 1`
    if (/^SELECT\s+"id"\s+AS\s+id\s+FROM\s+"posts"\s+WHERE/i.test(sql)) {
      const user = params[0] as string;
      const title = params[1] as string;
      const excludeId = sql.includes('<>') ? (params[2] as number) : null;
      const found = this.rows.find(
        r => r.user === user && r.title === title && (excludeId == null || r.id !== excludeId)
      );
      return { rows: found ? [{ id: found.id }] : [], rowCount: found ? 1 : 0 };
    }

    // Duplicate check used by validateUniqueFieldPostgres:
    // `SELECT "id" AS id FROM "posts" WHERE LOWER("title") = LOWER($1) LIMIT 1`
    if (/^SELECT\s+"id"\s+AS\s+id\s+FROM\s+"posts"\s+WHERE\s+LOWER\("title"\)/i.test(sql)) {
      const title = String(params[0] ?? '');
      const found = this.rows.find(r => r.title.toLowerCase() === title.toLowerCase());
      return { rows: found ? [{ id: found.id }] : [], rowCount: found ? 1 : 0 };
    }

    // Insert used by createUniqueDocPostgres and CRUD service create:
    // `INSERT INTO "posts" (...) VALUES (...) RETURNING *`
    if (/^INSERT\s+INTO\s+"posts"/i.test(sql)) {
      const user = String(params[0]);
      const title = String(params[1]);
      const row: Row = {
        id: this.nextId++,
        user,
        title,
        createdAt: new Date().toISOString(),
        deleted: false,
        deletedAt: null,
      };
      this.rows.push(row);
      return { rows: [row], rowCount: 1 };
    }

    // Find by id+owner used by findUserDocPostgres:
    if (/^SELECT\s+\*\s+FROM\s+"posts"\s+WHERE\s+"id"\s+=\s+\$1\s+AND\s+"user"\s+=\s+\$2/i.test(sql)) {
      const id = Number(params[0]);
      const user = String(params[1]);
      const found = this.rows.find(r => r.id === id && r.user === user);
      return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
    }

    // Update with ownership used by updateUserDocPostgres:
    if (/^UPDATE\s+"posts"\s+SET\s+"title"\s+=\s+\$3\s+WHERE\s+"id"\s+=\s+\$1\s+AND\s+"user"\s+=\s+\$2\s+RETURNING\s+\*/i.test(sql)) {
      const id = Number(params[0]);
      const user = String(params[1]);
      const title = String(params[2]);
      const row = this.rows.find(r => r.id === id && r.user === user);
      if (!row) return { rows: [], rowCount: 0 };
      row.title = title;
      return { rows: [row], rowCount: 1 };
    }

    // List by owner used by listUserDocsLeanPostgres:
    if (/^SELECT\s+\*\s+FROM\s+"posts"\s+WHERE\s+"user"\s+=\s+\$1/i.test(sql)) {
      const user = String(params[0]);
      const limit = Number(params[1]);
      const offset = Number(params[2]);
      const rows = this.rows.filter(r => r.user === user).slice(offset, offset + limit);
      return { rows, rowCount: rows.length };
    }

    // Search used by CRUD service (ILIKE):
    if (/ILIKE/i.test(sql) && /^SELECT\s+\*\s+FROM\s+"posts"\s+WHERE/i.test(sql)) {
      const pattern = String(params[0] ?? '').toLowerCase().replace(/%/g, '');
      const limit = Number(params[1]);
      const offset = Number(params[2]);
      const rows = this.rows
        .filter(r => r.title.toLowerCase().includes(pattern))
        .slice(offset, offset + limit);
      return { rows, rowCount: rows.length };
    }

    // Count queries used by pagination helpers:
    if (/^SELECT\s+COUNT\(\*\)::int\s+AS\s+total\s+FROM\s+"posts"/i.test(sql)) {
      return { rows: [{ total: this.rows.length }], rowCount: 1 };
    }

    // Emit diagnostic output before throwing so failures are actionable even when
    // upstream code catches the thrown error and converts it to an HTTP 500.
    // Note: Jest setup replaces console.* with jest.fn(); write directly to stderr.
    process.stderr.write(
      `[MockPostgresPool] unexpected SQL: ${sql} | params: ${JSON.stringify(params)}\n`
    );
    throw new Error(`MockPostgresPool received unexpected SQL: ${sql}`);
  }

  // `pg.Pool.connect()` surface used by cascadeDeleteDocumentPostgres (not exercised here).
  async connect() {
    return {
      query: this.query.bind(this),
      release: jest.fn(),
    } as any;
  }
}

describe('Dual DB + PostgreSQL adapter', () => {
  const originalDbType = process.env.DBTYPE;

  afterEach(() => {
    // Restore DBTYPE so other test files are not impacted by this suite.
    if (originalDbType === undefined) {
      delete process.env.DBTYPE;
    } else {
      process.env.DBTYPE = originalDbType;
    }
  });

  test('getDbType defaults to mongodb when unset', () => {
    delete process.env.DBTYPE;
    expect(getDbType()).toBe('mongodb');
  });

  test('getDbType throws on unsupported values', () => {
    process.env.DBTYPE = 'not-a-db';
    expect(() => getDbType()).toThrow(/Unsupported DBTYPE/);
  });

  test('DBTYPE=postgres routes createUniqueDoc + enforces uniqueness', async () => {
    process.env.DBTYPE = 'postgres';

    const pool = new MockPostgresPool();
    const posts = createPostgresResource({
      pool: pool as any,
      tableName: 'posts',
      allowedColumns: ['id', 'user', 'title', 'createdAt', 'deleted', 'deletedAt'],
      ownerColumn: 'user',
      idColumn: 'id',
      createdAtColumn: 'createdAt',
      deletedColumn: 'deleted',
      deletedAtColumn: 'deletedAt',
    });

    const res1 = createMockRes();
    const created = await createUniqueDoc(
      posts as any,
      { user: 'alice', title: 'Hello' },
      { user: 'alice', title: 'Hello' },
      res1 as any
    );

    expect(created).toBeTruthy();
    expect((created as any).id).toBe(1);
    expect(res1.status).not.toHaveBeenCalled();

    const res2 = createMockRes();
    const dup = await createUniqueDoc(
      posts as any,
      { user: 'alice', title: 'Hello' },
      { user: 'alice', title: 'Hello' },
      res2 as any
    );

    expect(dup).toBeUndefined();
    expect(res2.status).toHaveBeenCalledWith(409);
  });

  test('DBTYPE=postgres enforces ownership in findUserDoc/updateUserDoc', async () => {
    process.env.DBTYPE = 'postgres';

    const pool = new MockPostgresPool();
    const posts = createPostgresResource({
      pool: pool as any,
      tableName: 'posts',
      allowedColumns: ['id', 'user', 'title', 'createdAt', 'deleted', 'deletedAt'],
      ownerColumn: 'user',
      idColumn: 'id',
      createdAtColumn: 'createdAt',
      deletedColumn: 'deleted',
      deletedAtColumn: 'deletedAt',
    });

    const resCreate = createMockRes();
    const created = (await createUniqueDoc(
      posts as any,
      { user: 'alice', title: 'Hello' },
      { user: 'alice', title: 'Hello' },
      resCreate as any
    )) as any;

    const foundByOwner = await findUserDoc(posts as any, created.id, 'alice');
    expect(foundByOwner).toBeTruthy();

    const foundByOther = await findUserDoc(posts as any, created.id, 'bob');
    expect(foundByOther).toBeNull();

    const resUpdate = createMockRes();
    const updated = await updateUserDoc(
      posts as any,
      created.id,
      'alice',
      { title: 'Hello 2' },
      { user: 'alice', title: 'Hello 2' },
      resUpdate as any
    );
    expect(updated).toBeTruthy();
    expect((updated as any).title).toBe('Hello 2');

    const resUpdateOther = createMockRes();
    const updatedByOther = await updateUserDoc(
      posts as any,
      created.id,
      'bob',
      { title: 'Hacked' },
      { user: 'bob', title: 'Hacked' },
      resUpdateOther as any
    );
    expect(updatedByOther).toBeUndefined();
    expect(resUpdateOther.status).toHaveBeenCalledWith(404);
  });

  test('DBTYPE=postgres routes listUserDocs and createCrudService', async () => {
    process.env.DBTYPE = 'postgres';

    const pool = new MockPostgresPool();
    const posts = createPostgresResource({
      pool: pool as any,
      tableName: 'posts',
      allowedColumns: ['id', 'user', 'title', 'createdAt', 'deleted', 'deletedAt'],
      ownerColumn: 'user',
      idColumn: 'id',
      createdAtColumn: 'createdAt',
      deletedColumn: 'deleted',
      deletedAtColumn: 'deletedAt',
    });

    // Seed two posts for alice via CRUD service (tests routing for createCrudService).
    const service = createCrudService(posts as any, 'post', {
      uniqueField: 'title',
      searchableFields: ['title'] as any,
    }) as any;

    await service.create({ user: 'alice', title: 'A' });
    await service.create({ user: 'alice', title: 'B' });

    const listed = await listUserDocs(posts as any, 'alice', { limit: 10 });
    expect(listed.length).toBe(2);

    const search = await service.search('A', { page: 1, limit: 10 });
    expect(search.data.length).toBe(1);
    expect(search.data[0].title).toBe('A');
  });

  test('DBTYPE=postgres causes optimizeQuery to throw (Mongo-only)', () => {
    process.env.DBTYPE = 'postgres';
    expect(() => optimizeQuery(undefined as any)).toThrow(/not supported/i);
  });
});
