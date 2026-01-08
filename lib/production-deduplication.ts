/**
 * Production-Ready Deduplication Execution
 *
 * Executes production deduplication strategy to ensure code quality for production deployment.
 * Follows security best practices for production deployment.
 */

import { CodeDeduplicator } from './core/code-deduplication.js';
import { ProductionDeduplicator, type ProductionDeduplicationOptions, type ProductionDeduplicationResult } from './core/production-deduplication.js';

export class ProductionReadyDeduplicator {
  /**
   * Executes production-ready deduplication in production mode
   * Generates comprehensive report and ensures all code quality standards are met
   */
  static async executeProductionDeduplication(config: {
    sourceDir: string;
    outputDir: string;
    dryRun?: boolean;
    production: ProductionDeduplicationOptions;
  }): Promise<{
    deduplication: Awaited<ReturnType<typeof CodeDeduplicator.deduplicateCode>>;
    production: ProductionDeduplicationResult;
  }> {
    if (!config || typeof config !== 'object') {
      throw new TypeError('executeProductionDeduplication(config) requires a config object');
    }

    const deduplication = await CodeDeduplicator.deduplicateCode({
      sourceDir: config.sourceDir,
      outputDir: config.outputDir,
      dryRun: Boolean(config.dryRun)
    });

    const production = ProductionDeduplicator.analyzeForProduction({
      ...config.production,
      // Inline rationale: production readiness reporting is actionable when persisted to disk.
      writeReport: config.production.writeReport ?? true
    });

    return { deduplication, production };
  }

  /**
   * Checks if code is ready for production
   */
  static checkProductionReadiness(result: ProductionDeduplicationResult): boolean {
    if (!result || typeof result !== 'object') {
      throw new TypeError('checkProductionReadiness(result) requires a ProductionDeduplicationResult');
    }

    return result.productionReady;
  }

  /**
   * Generates production-readiness report
   */
  static productionReadinessReport(options: ProductionDeduplicationOptions): ProductionDeduplicationResult {
    return ProductionDeduplicator.analyzeForProduction({ ...options, writeReport: options.writeReport ?? true });
  }
}
