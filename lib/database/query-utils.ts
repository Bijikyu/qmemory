/**
 * Database Query Optimization Utilities
 *
 * Handles query optimization and aggregation pipeline creation.
 * Single Responsibility: Database query optimization
 */

import type { FilterQuery, PipelineStage, QueryOptions } from 'mongoose';
import type { AnyDocumentShape } from './operation-utils.js';
import { createModuleUtilities } from '../common-patterns.js';

const utils = createModuleUtilities('database-query');

/**
 * Optimizes database queries for better performance
 * @param model Mongoose model
 * @param filter Query filter object
 * @param options Query options for optimization
 * @returns Optimized query object
 */
export const optimizeQuery = <TSchema extends AnyDocumentShape>(
  model: any,
  filter: FilterQuery<TSchema>,
  options: QueryOptions<TSchema> = {}
): any => {
  // Add lean option for better performance (no Mongoose documents)
  const optimizedOptions: any = { ...options, lean: true };

  // Ensure select fields are specified to limit data transfer
  if (!optimizedOptions.select && options.select) {
    optimizedOptions.select = options.select;
  }

  const query = model.find(filter, null, optimizedOptions);

  utils.debugLog('Query optimized', {
    filter: JSON.stringify(filter),
    options: optimizedOptions,
  });

  return query;
};

/**
 * Creates an aggregation pipeline for complex queries
 * @param stages Array of aggregation stages
 * @param options Pipeline options
 * @returns Aggregation pipeline with options
 */
export const createAggregationPipeline = (
  stages: PipelineStage[],
  options: { allowDiskUse?: boolean; maxTimeMS?: number } = {}
): { pipeline: PipelineStage[]; options: any } => {
  const pipelineOptions: any = {
    allowDiskUse: options.allowDiskUse || false,
    maxTimeMS: options.maxTimeMS || 30000,
  };

  utils.debugLog('Aggregation pipeline created', {
    stageCount: stages.length,
    options: pipelineOptions,
  });

  return { pipeline: stages, options: pipelineOptions };
};

/**
 * Creates database indexes for better query performance
 * @param model Mongoose model
 * @param indexSpec Index specification
 * @returns Promise resolving when indexes are created
 */
export const createDocumentIndexes = async <TSchema extends AnyDocumentShape>(
  model: any,
  indexSpec: Array<{ [key: string]: number | 'text' | '2dsphere' }>
): Promise<void> => {
  try {
    await model.createIndexes(indexSpec);
    utils.debugLog('Indexes created successfully', { indexSpec });
  } catch (error) {
    utils.debugLog('Failed to create indexes', { error: (error as Error).message, indexSpec });
    throw error;
  }
};

/**
 * Adds pagination to database queries
 * @param query Base query object
 * @param page Page number (1-based)
 * @param limit Items per page
 * @returns Query with pagination added
 */
export const addPaginationToQuery = (query: any, page: number = 1, limit: number = 10): any => {
  const skip = (page - 1) * limit;

  return {
    ...query,
    skip,
    limit,
  };
};

/**
 * Creates a text search filter for MongoDB
 * @param field Field to search in
 * @param searchTerm Search term
 * @param options Search options
 * @returns Text search filter object
 */
export const createTextSearchFilter = (
  field: string,
  searchTerm: string,
  options: { caseSensitive?: boolean; wholeWord?: boolean } = {}
): FilterQuery<any> => {
  const { caseSensitive = false, wholeWord = false } = options;

  let searchRegex = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  if (wholeWord) {
    searchRegex = `\\b${searchRegex}\\b`;
  }

  const searchOptions = caseSensitive ? '' : 'i';

  return {
    [field]: {
      $regex: searchRegex,
      $options: searchOptions,
    },
  };
};

/**
 * Validates and sanitizes sort parameters
 * @param sort Sort object
 * @param allowedFields Fields that are allowed to be sorted
 * @returns Validated and sanitized sort object
 */
export const validateSortParameter = (
  sort: Record<string, 1 | -1> | undefined,
  allowedFields: string[]
): Record<string, 1 | -1> => {
  const validatedSort: Record<string, 1 | -1> = {};

  if (!sort) return validatedSort;

  for (const [field, direction] of Object.entries(sort)) {
    // Only allow sorting on specified fields
    if (!allowedFields.includes(field)) {
      utils.debugLog('Invalid sort field rejected', { field, allowedFields });
      continue;
    }

    // Validate direction
    if (direction !== 1 && direction !== -1) {
      utils.debugLog('Invalid sort direction rejected', { field, direction });
      continue;
    }

    validatedSort[field] = direction;
  }

  return validatedSort;
};
