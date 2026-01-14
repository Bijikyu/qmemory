/**
 * Native MongoDB Database Operations
 *
 * Provides standardized database operation patterns using the native MongoDB driver.
 * Complements Mongoose-based operations in database-operation-factory.ts and
 * crud-service-factory.ts for projects using the native driver.
 *
 * Features:
 * - Type-safe CRUD operations
 * - Consistent error handling with qerrors integration
 * - ObjectId validation
 * - Singleton DatabaseManager for connection management
 */

import type { Db, Collection, Document, Filter, ObjectId as ObjectIdType } from 'mongodb';
import { ObjectId } from 'mongodb';
import qerrors from 'qerrors';

type OptionalId<T> = Omit<T, '_id'> & { _id?: ObjectIdType };

export interface FindManyOptions {
  limit?: number;
  sort?: Record<string, 1 | -1>;
  skip?: number;
}

export class MongoDBOperations<T extends Document> {
  private collection: Collection<T>;
  private collectionName: string;

  constructor(db: Db, collectionName: string) {
    this.collection = db.collection(collectionName);
    this.collectionName = collectionName;
  }

  async findOne(filter: Filter<T> = {}): Promise<T | null> {
    try {
      return (await this.collection.findOne(filter)) as T | null;
    } catch (error) {
      qerrors.qerrors(error as Error, `${this.collectionName}.findOne`, { filter });
      throw error;
    }
  }

  async findMany(filter: Filter<T> = {}, options: FindManyOptions = {}): Promise<T[]> {
    try {
      let cursor = this.collection.find(filter);

      if (options.skip) {
        cursor = cursor.skip(options.skip);
      }

      if (options.limit) {
        cursor = cursor.limit(options.limit);
      }

      if (options.sort) {
        cursor = cursor.sort(options.sort);
      }

      return (await cursor.toArray()) as T[];
    } catch (error) {
      qerrors.qerrors(error as Error, `${this.collectionName}.findMany`, { filter, options });
      throw error;
    }
  }

  async insertOne(doc: OptionalId<T>): Promise<{ insertedId: ObjectIdType; acknowledged: boolean }> {
    try {
      const result = await this.collection.insertOne(doc as any);
      return { insertedId: result.insertedId, acknowledged: result.acknowledged };
    } catch (error) {
      qerrors.qerrors(error as Error, `${this.collectionName}.insertOne`, {});
      throw error;
    }
  }

  async insertMany(
    docs: OptionalId<T>[]
  ): Promise<{ insertedIds: Record<number, ObjectIdType>; insertedCount: number }> {
    try {
      const result = await this.collection.insertMany(docs as any);
      return { insertedIds: result.insertedIds, insertedCount: result.insertedCount };
    } catch (error) {
      qerrors.qerrors(error as Error, `${this.collectionName}.insertMany`, { count: docs.length });
      throw error;
    }
  }

  async updateOne(
    filter: Filter<T>,
    update: Partial<T>
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    try {
      const updateDoc = { $set: update };
      const result = await this.collection.updateOne(filter, updateDoc);
      return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount };
    } catch (error) {
      qerrors.qerrors(error as Error, `${this.collectionName}.updateOne`, { filter });
      throw error;
    }
  }

  async updateMany(
    filter: Filter<T>,
    update: Partial<T>
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    try {
      const updateDoc = { $set: update };
      const result = await this.collection.updateMany(filter, updateDoc);
      return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount };
    } catch (error) {
      qerrors.qerrors(error as Error, `${this.collectionName}.updateMany`, { filter });
      throw error;
    }
  }

  async deleteOne(filter: Filter<T>): Promise<{ deletedCount: number }> {
    try {
      const result = await this.collection.deleteOne(filter);
      return { deletedCount: result.deletedCount };
    } catch (error) {
      qerrors.qerrors(error as Error, `${this.collectionName}.deleteOne`, { filter });
      throw error;
    }
  }

  async deleteMany(filter: Filter<T>): Promise<{ deletedCount: number }> {
    try {
      const result = await this.collection.deleteMany(filter);
      return { deletedCount: result.deletedCount };
    } catch (error) {
      qerrors.qerrors(error as Error, `${this.collectionName}.deleteMany`, { filter });
      throw error;
    }
  }

  async count(filter: Filter<T> = {}): Promise<number> {
    try {
      return await this.collection.countDocuments(filter);
    } catch (error) {
      qerrors.qerrors(error as Error, `${this.collectionName}.count`, { filter });
      throw error;
    }
  }

  async exists(filter: Filter<T>): Promise<boolean> {
    try {
      const count = await this.collection.countDocuments(filter, { limit: 1 });
      return count > 0;
    } catch (error) {
      qerrors.qerrors(error as Error, `${this.collectionName}.exists`, { filter });
      throw error;
    }
  }

  async findById(id: string): Promise<T | null> {
    try {
      if (!ObjectId.isValid(id)) {
        throw new Error(`Invalid ObjectId: ${id}`);
      }

      const objectId = new ObjectId(id);
      const result = await this.collection.findOne({ _id: objectId } as Filter<T>);
      return result as T | null;
    } catch (error) {
      qerrors.qerrors(error as Error, `${this.collectionName}.findById`, { id });
      throw new Error(`Database operation failed for id: ${id}`);
    }
  }

  async updateById(
    id: string,
    update: Partial<T>
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    try {
      if (!ObjectId.isValid(id)) {
        throw new Error(`Invalid ObjectId: ${id}`);
      }
      return await this.updateOne({ _id: new ObjectId(id) } as Filter<T>, update);
    } catch (error) {
      qerrors.qerrors(error as Error, `${this.collectionName}.updateById`, { id });
      throw error;
    }
  }

  async deleteById(id: string): Promise<{ deletedCount: number }> {
    try {
      if (!ObjectId.isValid(id)) {
        throw new Error(`Invalid ObjectId: ${id}`);
      }
      return await this.deleteOne({ _id: new ObjectId(id) } as Filter<T>);
    } catch (error) {
      qerrors.qerrors(error as Error, `${this.collectionName}.deleteById`, { id });
      throw error;
    }
  }

  getCollection(): Collection<T> {
    return this.collection;
  }
}

export class MongoDBManager {
  private static instance: MongoDBManager;
  private db: Db | null = null;

  private constructor() {}

  public static getInstance(): MongoDBManager {
    if (!MongoDBManager.instance) {
      MongoDBManager.instance = new MongoDBManager();
    }
    return MongoDBManager.instance;
  }

  public static resetInstance(): void {
    MongoDBManager.instance = undefined as unknown as MongoDBManager;
  }

  public setDatabase(db: Db): void {
    this.db = db;
  }

  public getDatabase(): Db | null {
    return this.db;
  }

  public isConnected(): boolean {
    return this.db !== null;
  }

  public getOperations<T extends Document>(collectionName: string): MongoDBOperations<T> {
    if (!this.db) {
      throw new Error('Database not initialized. Call setDatabase() first.');
    }
    return new MongoDBOperations<T>(this.db, collectionName);
  }
}

export const createMongoDBOperations = <T extends Document>(
  db: Db,
  collectionName: string
): MongoDBOperations<T> => {
  return new MongoDBOperations<T>(db, collectionName);
};

export const getMongoDBManager = (): MongoDBManager => {
  return MongoDBManager.getInstance();
};
