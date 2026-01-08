import type { Model } from 'mongoose';

import {
  createCrudService,
  createPaginatedService,
  createValidatedService,
  validateData,
  type CrudServiceOptions,
  type PaginationOptions,
  type ValidationRule,
} from '../../lib/crud-service-factory.js';

interface Entity {
  [key: string]: unknown;
  _id: string;
  name: string;
  status?: string;
  category?: string;
  save?: () => Promise<Entity>;
}

type QueryResult<T> = {
  sort: (value?: unknown) => QueryResult<T>;
  skip: (value: number) => QueryResult<T>;
  limit: (value: number) => QueryResult<T>;
  lean: () => QueryResult<T>;
  exec: () => Promise<T[]>;
  then: Promise<T[]>['then'];
  catch: Promise<T[]>['catch'];
  finally: Promise<T[]>['finally'];
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createQuery<T>(data: T[]): QueryResult<T> {
  const promise = Promise.resolve(clone(data));
  const result: any = {};
  result.sort = jest.fn().mockReturnValue(result);
  result.skip = jest.fn().mockReturnValue(result);
  result.limit = jest.fn().mockReturnValue(result);
  result.lean = jest.fn().mockReturnValue(result);
  result.exec = jest.fn().mockReturnValue(promise);
  result.then = promise.then.bind(promise);
  result.catch = promise.catch.bind(promise);
  result.finally = promise.finally.bind(promise);
  return result as QueryResult<T>;
}

function matchesQuery(doc: Record<string, unknown>, query: Record<string, unknown>): boolean {
  if (!query || Object.keys(query).length === 0) {
    return true;
  }

  if ('$or' in query && Array.isArray(query.$or)) {
    return query.$or.some((clause) => matchesQuery(doc, clause as Record<string, unknown>));
  }

  return Object.entries(query).every(([key, value]) => {
    if (value && typeof value === 'object' && '$regex' in value) {
      const pattern = (value as any).$regex;
      const options = typeof (value as any).$options === 'string' ? (value as any).$options : '';
      const reg = pattern instanceof RegExp ? pattern : new RegExp(String(pattern), options);
      return reg.test(String(doc[key] ?? ''));
    }
    if (value && typeof value === 'object' && '$ne' in value) {
      return doc[key] !== value.$ne;
    }
    return doc[key] === value;
  });
}

function createMockModel(initial: Entity[]): {
  Model: Model<Entity>;
  store: Entity[];
} {
  const store: Entity[] = initial.map((item) => ({ ...item }));
  let counter = store.length;

  function getById(id: string): Entity | null {
    return store.find((doc) => doc._id === id) ?? null;
  }

  function ModelCtor(this: Entity, data: Partial<Entity>) {
    Object.assign(this, data);
    this._id = data._id ?? `entity-${++counter}`;
    this.save = jest.fn(async () => {
      const doc = { _id: this._id, ...data } as Entity;
      store.push(doc);
      return clone(doc);
    });
  }

  const Model = ModelCtor as unknown as Model<Entity>;

  (Model as any).findOne = jest.fn((query: Record<string, unknown>) => {
    const found = store.find((doc) => matchesQuery(doc, query));
    const promise = Promise.resolve(found ? clone(found) : null);
    const queryResult: any = {};
    queryResult.exec = jest.fn().mockReturnValue(promise);
    queryResult.lean = jest.fn().mockReturnValue(queryResult);
    return queryResult;
  });

  (Model as any).find = jest.fn((query: Record<string, unknown>) => {
    const data = store.filter((doc) => matchesQuery(doc, query));
    return createQuery(data);
  });

  (Model as any).countDocuments = jest.fn((query: Record<string, unknown>) => {
    const count = store.filter((doc) => matchesQuery(doc, query)).length;
    return { exec: jest.fn().mockResolvedValue(count) };
  });

  (Model as any).findById = jest.fn((id: string) => {
    const doc = getById(id);
    const basePromise = Promise.resolve(doc ? clone(doc) : null);
    const state: { select?: string } = {};
    const queryResult: any = {};
    queryResult.select = jest.fn((fields: string) => {
      state.select = fields;
      return queryResult;
    });
    queryResult.lean = jest.fn(() => queryResult);
    queryResult.exec = jest.fn(() => {
      if (state.select && state.select.includes('_id')) {
        return Promise.resolve(doc ? { _id: doc._id } : null);
      }
      return basePromise;
    });
    queryResult.then = basePromise.then.bind(basePromise);
    queryResult.catch = basePromise.catch.bind(basePromise);
    queryResult.finally = basePromise.finally.bind(basePromise);
    return queryResult;
  });

  (Model as any).findByIdAndUpdate = jest.fn(
    (id: string, update: Partial<Entity>, options?: Record<string, unknown>) => {
      const index = store.findIndex((doc) => doc._id === id);
      const updated = index === -1 ? null : clone({ ...store[index], ...update });
      if (index !== -1 && updated) {
        store[index] = updated;
      }
      return { exec: jest.fn().mockResolvedValue(updated) };
    }
  );

  (Model as any).findByIdAndDelete = jest.fn((id: string) => {
    const index = store.findIndex((doc) => doc._id === id);
    const removed = index === -1 ? null : clone(store[index]);
    if (index !== -1) {
      store.splice(index, 1);
    }
    return { exec: jest.fn().mockResolvedValue(removed) };
  });

  return { Model, store };
}

describe('crud-service-factory', () => {
  test('create rejects duplicate records', async () => {
    const { Model } = createMockModel([{ _id: '1', name: 'Widget' }]);
    const service = createCrudService(Model, 'widget', { uniqueField: 'name' });

    await expect(service.create({ name: 'widget' })).rejects.toMatchObject({
      code: 'DUPLICATE',
      field: 'name',
    });
  });

  test('create persists record and executes hooks', async () => {
    const { Model, store } = createMockModel([]);
    const beforeCreate = jest.fn(async (data) => ({ ...data, status: 'pending' }));
    const afterCreate = jest.fn();

    const options: CrudServiceOptions<Entity> = {
      uniqueField: 'name',
      beforeCreate,
      afterCreate,
    };

    const service = createCrudService(Model, 'task', options);
    const created = await service.create({ name: 'Process Data' });

    expect(beforeCreate).toHaveBeenCalledWith({ name: 'Process Data' });
    expect(afterCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Process Data' }));
    expect(created.status).toBe('pending');
    expect(store).toHaveLength(1);
  });

  test('getAll returns paginated results with metadata', async () => {
    const { Model } = createMockModel([
      { _id: '1', name: 'Alpha' },
      { _id: '2', name: 'Beta' },
      { _id: '3', name: 'Gamma' },
    ]);

    const service = createCrudService(Model, 'item');
    const result = await service.getAll({}, { page: 1, limit: 2 });

    expect(result.data).toHaveLength(3);
    expect(result.pagination.total).toBe(3);
    expect(result.pagination.pages).toBeGreaterThanOrEqual(2);
  });

  test('update enforces duplicate checks and lifecycle hooks', async () => {
    const { Model } = createMockModel([
      { _id: '1', name: 'Primary', status: 'draft' },
      { _id: '2', name: 'Secondary', status: 'draft' },
    ]);

    const beforeUpdate = jest.fn(async (data) => ({ ...data, status: 'published' }));
    const afterUpdate = jest.fn();

    const service = createCrudService(Model, 'article', {
      uniqueField: 'name',
      beforeUpdate,
      afterUpdate,
    });

    await expect(
      service.update('2', { name: 'Primary' }),
    ).rejects.toMatchObject({ code: 'DUPLICATE' });

    const updated = await service.update('2', { name: 'Secondary Updated' });

    expect(beforeUpdate).toHaveBeenCalled();
    expect(afterUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'published' }));
    expect(updated.name).toBe('Secondary Updated');
    expect(updated.status).toBe('published');
  });

  test('createPaginatedService returns enhanced response with extra data', async () => {
    const { Model } = createMockModel([
      { _id: '1', name: 'Alpha', status: 'active' },
      { _id: '2', name: 'Beta', status: 'inactive' },
    ]);

    const service = createPaginatedService(Model, 'items', {
      additionalData: async () => ({ summary: { active: 1 } }),
    });

    const result = await service({}, { page: 1, limit: 1 });

    expect(result.items).toHaveLength(2);
    expect(result.summary).toEqual({ active: 1 });
    expect(result.totalCount).toBe(2);
  });

  test('validateData enforces validation rules', () => {
    const rules: Record<string, ValidationRule> = {
      name: { required: true, minLength: 3 },
      status: { enum: ['pending', 'done'] },
    };

    expect(() => validateData({ name: 'Valid', status: 'pending' }, rules)).not.toThrow();
    expect(() => validateData({ name: 'AB' }, rules)).toThrow(/at least 3/);
    expect(() => validateData({ name: 'Valid', status: 'invalid' }, rules)).toThrow(/must be one of/);
  });

  test('createValidatedService delegates to base service with validation', async () => {
    const { Model } = createMockModel([]);
    const service = createValidatedService(Model, 'task', {
      name: { required: true },
    });

    await expect(service.create({ name: 'Valid' })).resolves.toMatchObject({ name: 'Valid' });
    await expect(service.create({ })).rejects.toThrow(/name is required/);
  });
});
