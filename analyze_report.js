const fs = require('fs');

const data = JSON.parse(fs.readFileSync('poller-sources-review-report.json', 'utf8'));

// Get all sources: topSources and failedSources
const allSources = [...(data.topSources || []), ...(data.failedSources || [])];

// Filter only cannabis-hemp-poller sources
const sources = allSources.filter(s => s.poller === 'cannabis-hemp-poller');

console.log(`Total cannabis-hemp-poller sources: ${sources.length}`);

// Group by state
const stateGroups = {};
sources.forEach(source => {
  if (!stateGroups[source.state]) {
    stateGroups[source.state] = [];
  }
  stateGroups[source.state].push(source);
});

// Calculate metrics per state
const stateMetrics = {};
Object.keys(stateGroups).forEach(state => {
  const stateSources = stateGroups[state];
  const totalSources = stateSources.length;
  const accessibleSources = stateSources.filter(s => s.accessible).length;
  const scores = stateSources.filter(s => s.score !== undefined).map(s => s.score);
  const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  stateMetrics[state] = {
    totalSources,
    accessibleSources,
    averageScore: averageScore.toFixed(4),
    sources: stateSources
  };
});

// Identify problematic states: average score < 0.3 or < 3 accessible sources
const problematicStates = Object.keys(stateMetrics).filter(state => {
  const metrics = stateMetrics[state];
  return parseFloat(metrics.averageScore) < 0.3 || metrics.accessibleSources < 3;
});

const output = {
  totalCannabisSources: sources.length,
  stateMetrics,
  problematicStates
};

fs.writeFileSync('analysis_output.json', JSON.stringify(output, null, 2));

console.log('Analysis complete. Output saved to analysis_output.json');