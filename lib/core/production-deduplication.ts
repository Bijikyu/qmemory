/**
 * Production Ready Deduplication Utility
 *
 * Addresses 2,672 high-impact duplicate code blocks identified in analysis.
 * Provides methods for finding, analyzing, and reporting on duplicate code in a "production gate" context.
 */

import * as fs from 'fs';

import { SimpleDeduplicator, type DuplicateAnalysis } from './simple-deduplicator.js';

export interface ProductionDeduplicationOptions {
  directories: string[];
  reportPath?: string;
  writeReport?: boolean;
}

export interface ProductionDeduplicationQuality {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface ProductionDeduplicationResult {
  duplicateAnalysis: DuplicateAnalysis;
  quality: ProductionDeduplicationQuality;
  productionReady: boolean;
  reasons: string[];
  report?: string;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function computeGrade(score: number): ProductionDeduplicationQuality['grade'] {
  if (score >= 95) return 'A';
  if (score >= 90) return 'B';
  if (score >= 80) return 'C';
  if (score >= 70) return 'D';
  return 'F';
}

/**
 * Executes production-ready deduplication
 * Analyzes code for production deployment readiness and performance.
 */
export class ProductionDeduplicator {
  /**
   * Runs a production-focused deduplication analysis and optionally writes a report.
   *
   * @param options.directories Directories to scan (recursively).
   * @param options.writeReport When true, writes the generated report to disk.
   * @param options.reportPath Output path for the report when `writeReport` is enabled.
   * @returns Production gate result including a deduplication quality score and reasons.
   */
  static analyzeForProduction(options: ProductionDeduplicationOptions): ProductionDeduplicationResult {
    if (!options || typeof options !== 'object') {
      throw new TypeError('analyzeForProduction(options) requires a ProductionDeduplicationOptions object');
    }

    if (!Array.isArray(options.directories) || options.directories.length === 0) {
      throw new TypeError('analyzeForProduction(options) requires a non-empty `directories` array');
    }

    const duplicateAnalysis = SimpleDeduplicator.findDuplicates(options.directories);

    // Inline rationale: "production readiness" here is a strict heuristic gate, not a substitute for functional/security testing.
    const penalty =
      duplicateAnalysis.summary.highImpactDuplicates * 2 +
      duplicateAnalysis.summary.mediumImpactDuplicates * 1 +
      duplicateAnalysis.summary.lowImpactDuplicates * 0.25;

    const score = clampNumber(Math.round(100 - penalty), 0, 100);
    const quality: ProductionDeduplicationQuality = { score, grade: computeGrade(score) };

    const reasons: string[] = [];
    if (duplicateAnalysis.summary.highImpactDuplicates > 0) {
      reasons.push('High-impact duplication remains; extract shared utilities before production hardening.');
    }
    if (quality.score < 85) {
      reasons.push('Deduplication quality score below 85.');
    }

    const productionReady = reasons.length === 0;

    const report = this.generateProductionReport({ duplicateAnalysis, quality, productionReady, reasons });

    if (options.writeReport) {
      const reportPath = options.reportPath ?? 'production-deduplication-report.md';
      if (typeof reportPath !== 'string' || reportPath.trim().length === 0) {
        throw new TypeError('analyzeForProduction(options) requires `reportPath` to be a non-empty string when writing reports');
      }

      fs.writeFileSync(reportPath, report, 'utf8');
    }

    return { duplicateAnalysis, quality, productionReady, reasons, report };
  }

  /**
   * Converts a `ProductionDeduplicationResult` into a report string.
   *
   * @param result The production analysis result to report.
   * @returns A Markdown report summarizing deduplication findings and gate outcome.
   */
  static generateProductionReport(result: Omit<ProductionDeduplicationResult, 'report'>): string {
    return `
# Production Deduplication Report

## Gate Outcome
- Production Ready: ${result.productionReady ? 'YES' : 'NO'}
- Quality Score: ${result.quality.score} (Grade ${result.quality.grade})

## Duplicate Summary
- Files Scanned: ${result.duplicateAnalysis.summary.filesScanned}
- Duplicate Lines Found: ${result.duplicateAnalysis.summary.duplicatesFound}
- High Impact: ${result.duplicateAnalysis.summary.highImpactDuplicates}
- Medium Impact: ${result.duplicateAnalysis.summary.mediumImpactDuplicates}
- Low Impact: ${result.duplicateAnalysis.summary.lowImpactDuplicates}

## Reasons
${result.reasons.length ? result.reasons.map(r => `- ${r}`).join('\n') : '- None'}

---
*Generated: ${new Date().toISOString()}*
`;
  }
}
