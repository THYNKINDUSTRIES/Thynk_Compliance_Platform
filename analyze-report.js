#!/usr/bin/env node

/**
 * Analyze Poller Review Report
 * Groups sources by state and identifies states needing better coverage
 */

import fs from 'fs';

const REPORT_FILE = 'poller-sources-review-report.json';

function analyzeReport() {
  const report = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));

  // Assuming topSources contains all sources sorted by score
  const sources = report.topSources;

  // Group by state
  const stateStats = {};

  sources.forEach(source => {
    const state = source.state;
    if (!stateStats[state]) {
      stateStats[state] = {
        total: 0,
        accessible: 0,
        totalScore: 0,
        sources: []
      };
    }
    stateStats[state].total++;
    stateStats[state].totalScore += source.score;
    if (source.accessible) {
      stateStats[state].accessible++;
    }
    stateStats[state].sources.push(source);
  });

  // Calculate averages and identify problematic states
  const problematicStates = [];
  const stateSummaries = [];

  Object.keys(stateStats).forEach(state => {
    const stats = stateStats[state];
    const avgScore = stats.totalScore / stats.total;
    const accessibleRatio = stats.accessible / stats.total;

    stateSummaries.push({
      state,
      totalSources: stats.total,
      accessibleSources: stats.accessible,
      averageScore: avgScore,
      accessibleRatio
    });

    // Criteria for problematic: low average score or few accessible sources
    if (avgScore < 0.3 || stats.accessible < 2) {
      problematicStates.push({
        state,
        totalSources: stats.total,
        accessibleSources: stats.accessible,
        averageScore: avgScore,
        accessibleRatio,
        sources: stats.sources
      });
    }
  });

  // Sort summaries
  stateSummaries.sort((a, b) => a.averageScore - b.averageScore);

  console.log('=== STATE COVERAGE ANALYSIS ===\n');

  console.log('All States Summary (sorted by average score):');
  stateSummaries.forEach(s => {
    console.log(`${s.state}: ${s.totalSources} total, ${s.accessibleSources} accessible, avg score: ${s.averageScore.toFixed(3)}, ratio: ${(s.accessibleRatio * 100).toFixed(1)}%`);
  });

  console.log('\n=== PROBLEMATIC STATES (need improvement) ===');
  problematicStates.forEach(s => {
    console.log(`\n${s.state}:`);
    console.log(`  Total sources: ${s.totalSources}`);
    console.log(`  Accessible: ${s.accessibleSources}`);
    console.log(`  Average score: ${s.averageScore.toFixed(3)}`);
    console.log(`  Accessible ratio: ${(s.accessibleRatio * 100).toFixed(1)}%`);
    console.log('  Sources:');
    s.sources.forEach(src => {
      console.log(`    - ${src.url} (accessible: ${src.accessible}, score: ${src.score.toFixed(3)})`);
    });
  });

  return problematicStates;
}

analyzeReport();