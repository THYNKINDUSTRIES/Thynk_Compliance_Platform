import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the poller config
const configPath = path.join(process.cwd(), 'supabase/functions/cannabis-hemp-poller/index.ts');
const configContent = fs.readFileSync(configPath, 'utf8');

// Simple approach: find all state definitions
const lines = configContent.split('\n');
const states = [];
let currentState = null;
let inStateBlock = false;
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  if (line.match(/^'([A-Z]{2})':\s*{$/)) {
    currentState = line.match(/^'([A-Z]{2})':/)[1];
    inStateBlock = true;
    braceCount = 1;
    states.push({ state: currentState, newsPages: 0, regulationPages: 0 });
  } else if (inStateBlock) {
    if (line.includes('{')) braceCount++;
    if (line.includes('}')) braceCount--;

    if (braceCount === 0) {
      inStateBlock = false;
      currentState = null;
    } else if (line.includes('newsPages:')) {
      // Count URLs in newsPages array
      let j = i + 1;
      let count = 0;
      while (j < lines.length && !lines[j].trim().includes(']')) {
        if (lines[j].trim().startsWith("'http")) count++;
        j++;
      }
      states[states.length - 1].newsPages = count;
    } else if (line.includes('regulationPages:')) {
      // Count URLs in regulationPages array
      let j = i + 1;
      let count = 0;
      while (j < lines.length && !lines[j].trim().includes(']')) {
        if (lines[j].trim().startsWith("'http")) count++;
        j++;
      }
      states[states.length - 1].regulationPages = count;
    }
  }
}

states.forEach(s => s.total = s.newsPages + s.regulationPages);
states.sort((a, b) => a.total - b.total);

console.log('States by total sources (lowest first):');
states.slice(0, 15).forEach(s =>
  console.log(`${s.state}: ${s.total} (${s.newsPages} news, ${s.regulationPages} reg)`)
);