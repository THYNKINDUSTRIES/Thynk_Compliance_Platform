import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(process.cwd(), 'supabase/functions/cannabis-hemp-poller/index.ts');
let configContent = fs.readFileSync(configPath, 'utf8');

// States with 0% accuracy from last check that have multiple sources
const badStates = ['AR', 'IN', 'LA', 'MS', 'NH', 'RI'];

for (const state of badStates) {
  console.log(`Processing ${state}...`);

  // Find the state block
  const stateStart = configContent.indexOf(`'${state}': {`);
  if (stateStart === -1) continue;

  const stateEnd = configContent.indexOf('},', stateStart) + 2;
  const stateBlock = configContent.substring(stateStart, stateEnd);

  // Replace newsPages and regulationPages with empty arrays
  let cleanedBlock = stateBlock;
  cleanedBlock = cleanedBlock.replace(/newsPages:\s*\[([^\]]*)\]/, 'newsPages: []');
  cleanedBlock = cleanedBlock.replace(/regulationPages:\s*\[([^\]]*)\]/, 'regulationPages: []');

  configContent = configContent.replace(stateBlock, cleanedBlock);
  console.log(`Cleared sources for ${state}`);
}

fs.writeFileSync(configPath, configContent);
console.log('Removed sources from bad states');

// Regenerate CSV
console.log('Regenerating CSV files...');
execSync('node export-poller-sources.js', { stdio: 'inherit' });