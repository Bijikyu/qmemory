/**
 * Database Connection Utilities
 *
 * Handles MongoDB connection state and health checking.
 * Single Responsibility: Database connection management
 */

import mongoose from 'mongoose';
import type { Response } from 'express';
import { sendServiceUnavailable } from '../http-utils.js';
import { createModuleUtilities } from '../common-patterns.js';

const utils = createModuleUtilities('database-connection');

/**
 * Checks if MongoDB connection is ready and available
 * @param res Express response object for error handling
 * @returns True if connection is healthy, false otherwise
 */
export const ensureMongoDB = (res: Response): boolean => {
  return (
    utils.safeSync(
      () => {
        utils
          .getFunctionLogger('ensureMongoDB')
          .debug('is running', { readyState: mongoose.connection.readyState });
        const isReady = mongoose.connection.readyState === 1;
        if (!isReady) {
          sendServiceUnavailable(res, 'Database functionality unavailable');
          utils.debugLog('Database connection not ready when ensureMongoDB executed');
          return false;
        }
        utils.debugLog('ensureMongoDB confirmed healthy database connection');
        return true;
      },
      'ensureMongoDB',
      { readyState: mongoose.connection.readyState }
    ) || false
  );
};

export { ensureMongoDB as default };
