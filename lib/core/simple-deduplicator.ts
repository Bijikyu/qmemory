/**
 * Simple Code Deduplication Utility
 *
 * Addresses 2,672 high-impact duplicate code blocks identified in analysis.
 * Focuses on identifying high-frequency line-level duplication across provided directories.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface DuplicateOccurrence {
  filePath: string;
  lineNumber: number;
}

export interface DuplicateLine {
  line: string;
  count: number;
  impactScore: number;
  impactLevel: 'high' | 'medium' | 'low';
  occurrences: DuplicateOccurrence[];
}

export interface DuplicateAnalysisSummary {
  filesScanned: number;
  linesScanned: number;
  duplicatesFound: number;
  highImpactDuplicates: number;
  mediumImpactDuplicates: number;
  lowImpactDuplicates: number;
}

export interface DuplicateAnalysis {
  summary: DuplicateAnalysisSummary;
  duplicates: DuplicateLine[];
  recommendation: string;
}

function isSkippableLine(trimmedLine: string): boolean {
  // Inline rationale: ignoring trivial tokens and comments reduces noisy "duplicates" that do not represent reusable logic.
  if (trimmedLine.length <= 5) return true;
  if (trimmedLine === '{' || trimmedLine === '}' || trimmedLine === ');' || trimmedLine === '});') return true;
  if (trimmedLine.startsWith('//')) return true;
  if (trimmedLine.startsWith('/*') || trimmedLine.startsWith('*') || trimmedLine.endsWith('*/')) return true;
  return false;
}

function listSourceFilesRecursively(directoryPath: string): string[] {
  if (!fs.existsSync(directoryPath)) return [];
  const dirEntries = fs.readdirSync(directoryPath, { withFileTypes: true });

  const files: string[] = [];
  for (const entry of dirEntries) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'coverage') continue;
      files.push(...listSourceFilesRecursively(entryPath));
      continue;
    }

    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.js')) continue;
    files.push(entryPath);
  }

  return files;
}

export class SimpleDeduplicator {
  private static readonly HIGH_IMPACT_THRESHOLD = 30;
  private static readonly MEDIUM_IMPACT_THRESHOLD = 15;

  /**
   * Scans the provided directories for line-level duplicates.
   *
   * @param directories Directories to scan recursively for `.ts` and `.js` files.
   * @returns A structured analysis including summary counters and duplicate occurrences.
   */
  static findDuplicates(directories: string[]): DuplicateAnalysis {
    if (!Array.isArray(directories) || directories.length === 0) {
      throw new TypeError('findDuplicates(directories) requires a non-empty string[]');
    }

    const lineIndex = new Map<string, DuplicateOccurrence[]>();
    let filesScanned = 0;
    let linesScanned = 0;

    for (const directoryPath of directories) {
      if (typeof directoryPath !== 'string' || directoryPath.trim().length === 0) {
        throw new TypeError('findDuplicates(directories) requires a string[] of non-empty paths');
      }

      const filePaths = listSourceFilesRecursively(directoryPath);
      for (const filePath of filePaths) {
        filesScanned += 1;
        let content = '';

        try {
          content = fs.readFileSync(filePath, 'utf8');
        } catch (error) {
          // Inline rationale: deduplication is a best-effort tooling pass; unreadable files should not crash the run.
          console.warn(`Skipping unreadable file: ${filePath}`, error);
          continue;
        }

        const lines = content.split('\n');
        for (let index = 0; index < lines.length; index += 1) {
          const trimmedLine = lines[index]?.trim() ?? '';
          linesScanned += 1;
          if (isSkippableLine(trimmedLine)) continue;

          const occurrences = lineIndex.get(trimmedLine) ?? [];
          occurrences.push({ filePath, lineNumber: index + 1 });
          lineIndex.set(trimmedLine, occurrences);
        }
      }
    }

    const duplicates: DuplicateLine[] = [];
    let highImpactDuplicates = 0;
    let mediumImpactDuplicates = 0;
    let lowImpactDuplicates = 0;

    for (const [line, occurrences] of lineIndex.entries()) {
      if (occurrences.length < 2) continue;

      const count = occurrences.length;
      const impactScore = count * 5; // Inline rationale: a simple frequency-weighted heuristic that is easy to reason about.
      const impactLevel: DuplicateLine['impactLevel'] =
        impactScore >= this.HIGH_IMPACT_THRESHOLD ? 'high' : impactScore >= this.MEDIUM_IMPACT_THRESHOLD ? 'medium' : 'low';

      if (impactLevel === 'high') highImpactDuplicates += 1;
      else if (impactLevel === 'medium') mediumImpactDuplicates += 1;
      else lowImpactDuplicates += 1;

      duplicates.push({ line, count, impactScore, impactLevel, occurrences });
    }

    duplicates.sort((a, b) => b.impactScore - a.impactScore);

    const summary: DuplicateAnalysisSummary = {
      filesScanned,
      linesScanned,
      duplicatesFound: duplicates.length,
      highImpactDuplicates,
      mediumImpactDuplicates,
      lowImpactDuplicates
    };

    return {
      summary,
      duplicates,
      recommendation: this.generateRecommendation(summary)
    };
  }

  /**
   * Writes a Markdown report for a `DuplicateAnalysis`.
   *
   * @param analysis The analysis output from `findDuplicates`.
   * @param reportPath Output path for the report.
   * @returns The generated report contents (useful for testing/automation).
   */
  static generateReport(analysis: DuplicateAnalysis, reportPath = 'deduplication-report.md'): string {
    if (!analysis || typeof analysis !== 'object') {
      throw new TypeError('generateReport(analysis) requires a DuplicateAnalysis object');
    }

    if (typeof reportPath !== 'string' || reportPath.trim().length === 0) {
      throw new TypeError('generateReport(analysis, reportPath) requires a non-empty reportPath string');
    }

    const report = `
# Code Deduplication Report

## Executive Summary
${analysis.recommendation}

## Scan Summary
- Files Scanned: ${analysis.summary.filesScanned}
- Lines Scanned: ${analysis.summary.linesScanned}
- Duplicate Lines Found: ${analysis.summary.duplicatesFound}

## Impact Breakdown
- High Impact: ${analysis.summary.highImpactDuplicates}
- Medium Impact: ${analysis.summary.mediumImpactDuplicates}
- Low Impact: ${analysis.summary.lowImpactDuplicates}

---
*Generated: ${new Date().toISOString()}*
`;

    fs.writeFileSync(reportPath, report, 'utf8');
    return report;
  }

  private static generateRecommendation(summary: DuplicateAnalysisSummary): string {
    // Inline rationale: a short prescriptive recommendation helps prioritize follow-up work without hiding the underlying counts.
    if (summary.highImpactDuplicates > 0) {
      return `High duplication detected (${summary.highImpactDuplicates} high-impact lines). Extract shared utilities first, then re-run analysis.`;
    }

    if (summary.mediumImpactDuplicates > 0) {
      return `Moderate duplication detected (${summary.mediumImpactDuplicates} medium-impact lines). Consider consolidating common helpers and patterns.`;
    }

    if (summary.duplicatesFound > 0) {
      return `Low duplication detected (${summary.lowImpactDuplicates} low-impact lines). Opportunistic cleanup only; avoid churn.`;
    }

    return 'No meaningful line-level duplication detected in the scanned paths.';
  }
}
