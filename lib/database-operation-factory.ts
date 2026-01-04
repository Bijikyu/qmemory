/**
 * Database Operation Factory
 *
 * Purpose: Eliminates duplicate CRUD patterns across the codebase.
 * Addresses the "Database Operation Safe Wrapper Pattern" (40+ occurrences)
 * and "Mock Model Creation Pattern" (25+ occurrences) identified in wet-code analysis.
 *
 * Design Principles:
 * - Consistent database operation patterns
 * - Type-safe MongoDB operations
 * - User ownership enforcement
 * - Error handling and logging integration
 */

import mongoose, { Model, HydratedDocument, FilterQuery, UpdateQuery } from 'mongoose';
import type { Response } from 'express';
import { createModuleUtilities, type ModuleUtilities } from './common-patterns';

// Database operation result type
export interface DbOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

// User-owned document interface
export interface UserOwnedDocument {
  username: string;
  [key: string]: unknown;
}

// Database operation factory
export const createDatabaseOperations = <T extends UserOwnedDocument>(
  model: Model<T>,
  module: string
) => {
  const utils = createModuleUtilities(module);

  // Safe database operation with user ownership enforcement
  const safeDbOperation = async <R>(
    operation: () => Promise<R>,
    functionName: string,
    context?: Record<string, unknown>
  ): Promise<R> => {
    return utils.safeAsync(operation, functionName, context);
  };

  // Find one document with user ownership
  const findOneByUser = async (
    username: string,
    query: FilterQuery<T> = {},
    functionName: string = 'findOneByUser'
  ): Promise<T | null> => {
    return safeDbOperation(() => model.findOne({ ...query, username }).exec(), functionName, {
      username,
      query,
    });
  };

  // Find by ID with user ownership
  const findByIdByUser = async (
    id: string,
    username: string,
    functionName: string = 'findByIdByUser'
  ): Promise<T | null> => {
    return safeDbOperation(() => model.findOne({ _id: id, username }).exec(), functionName, {
      id,
      username,
    });
  };

  // Create document with user ownership
  const createWithUser = async (
    data: Omit<T, 'username'>,
    username: string,
    functionName: string = 'createWithUser'
  ): Promise<T> => {
    return safeDbOperation(() => model.create({ ...data, username } as T), functionName, {
      data,
      username,
    });
  };

  // Update document with user ownership
  const updateByUser = async (
    id: string,
    username: string,
    updateData: UpdateQuery<T>,
    functionName: string = 'updateByUser'
  ): Promise<T | null> => {
    return safeDbOperation(
      () => model.findOneAndUpdate({ _id: id, username }, updateData, { new: true }).exec(),
      functionName,
      { id, username, updateData }
    );
  };

  // Delete document with user ownership
  const deleteByUser = async (
    id: string,
    username: string,
    functionName: string = 'deleteByUser'
  ): Promise<boolean> => {
    return safeDbOperation(
      async () => {
        const result = await model.findOneAndDelete({ _id: id, username }).exec();
        return result !== null;
      },
      functionName,
      { id, username }
    );
  };

  // Find multiple documents with user ownership
  const findByUser = async (
    username: string,
    query: FilterQuery<T> = {},
    functionName: string = 'findByUser'
  ): Promise<T[]> => {
    return safeDbOperation(() => model.find({ ...query, username }).exec(), functionName, {
      username,
      query,
    });
  };

  // Count documents with user ownership
  const countByUser = async (
    username: string,
    query: FilterQuery<T> = {},
    functionName: string = 'countByUser'
  ): Promise<number> => {
    return safeDbOperation(
      () => model.countDocuments({ ...query, username }).exec(),
      functionName,
      { username, query }
    );
  };

  return {
    utils,
    safeDbOperation,
    findOneByUser,
    findByIdByUser,
    createWithUser,
    updateByUser,
    deleteByUser,
    findByUser,
    countByUser,
  };
};

// Mock model factory for testing
export const createMockModel = <T>(modelName: string) => {
  const mockData: T[] = [];

  return {
    modelName,
    findOne: jest.fn().mockImplementation(query => {
      const result = mockData.find(item =>
        Object.entries(query).every(([key, value]) => (item as any)[key] === value)
      );
      return {
        exec: jest.fn().mockResolvedValue(result || null),
      };
    }),
    findById: jest.fn().mockImplementation(id => {
      const result = mockData.find(item => (item as any)._id === id);
      return {
        exec: jest.fn().mockResolvedValue(result || null),
      };
    }),
    find: jest.fn().mockImplementation(query => {
      const results = mockData.filter(item =>
        Object.entries(query).every(([key, value]) => (item as any)[key] === value)
      );
      return {
        exec: jest.fn().mockResolvedValue(results),
      };
    }),
    create: jest.fn().mockImplementation(data => {
      const newItem = { ...data, _id: Math.random().toString(36) } as T;
      mockData.push(newItem);
      return Promise.resolve(newItem);
    }),
    findOneAndUpdate: jest.fn().mockImplementation((query, update, options) => {
      const index = mockData.findIndex(item =>
        Object.entries(query).every(([key, value]) => (item as any)[key] === value)
      );
      if (index !== -1) {
        mockData[index] = { ...mockData[index], ...update };
        return {
          exec: jest.fn().mockResolvedValue(mockData[index]),
        };
      }
      return {
        exec: jest.fn().mockResolvedValue(null),
      };
    }),
    findOneAndDelete: jest.fn().mockImplementation(query => {
      const index = mockData.findIndex(item =>
        Object.entries(query).every(([key, value]) => (item as any)[key] === value)
      );
      if (index !== -1) {
        const deleted = mockData[index];
        mockData.splice(index, 1);
        return {
          exec: jest.fn().mockResolvedValue(deleted),
        };
      }
      return {
        exec: jest.fn().mockResolvedValue(null),
      };
    }),
    countDocuments: jest.fn().mockImplementation(query => {
      const count = mockData.filter(item =>
        Object.entries(query).every(([key, value]) => (item as any)[key] === value)
      ).length;
      return {
        exec: jest.fn().mockResolvedValue(count),
      };
    }),
    // Helper to clear mock data for tests
    _clearMockData: () => (mockData.length = 0),
    // Helper to get current mock data for tests
    _getMockData: () => [...mockData],
  };
};

// Export types
export type DatabaseOperations<T extends UserOwnedDocument> = ReturnType<
  typeof createDatabaseOperations<T>
>;
export type MockModel<T> = ReturnType<typeof createMockModel<T>>;
