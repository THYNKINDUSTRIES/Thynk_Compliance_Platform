import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testUrl(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', timeout: 8000 }, (res) => {
      resolve({ url, status: res.statusCode, accessible: res.statusCode < 400 });
    });
    req.on('error', () => resolve({ url, status: null, accessible: false }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ url, status: null, accessible: false });
    });
    req.end();
  });
}

async function cleanPollerSources() {
  const configPath = path.join(process.cwd(), 'supabase/functions/cannabis-hemp-poller/index.ts');
  let configContent = fs.readFileSync(configPath, 'utf8');

  // Extract all URLs from the config
  const urlRegex = /'https?:\/\/[^']+'/g;
  const urls = configContent.match(urlRegex)?.map(url => url.slice(1, -1)) || [];

  console.log(`Found ${urls.length} total URLs to test...`);

  // Test URLs in batches to avoid overwhelming
  const batchSize = 10;
  const workingUrls = new Set();
  const brokenUrls = new Set();

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const promises = batch.map(url => testUrl(url));

    const results = await Promise.all(promises);

    results.forEach(result => {
      if (result.accessible) {
        workingUrls.add(result.url);
      } else {
        brokenUrls.add(result.url);
      }
    });

    console.log(`Tested ${Math.min(i + batchSize, urls.length)}/${urls.length} URLs...`);
  }

  console.log(`\nResults:`);
  console.log(`Working URLs: ${workingUrls.size}`);
  console.log(`Broken URLs: ${brokenUrls.size}`);

  // Remove broken URLs from config
  let cleanedContent = configContent;
  for (const brokenUrl of brokenUrls) {
    // Remove the URL and any trailing comma
    const urlPattern = new RegExp(`'${brokenUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',?\\s*`, 'g');
    cleanedContent = cleanedContent.replace(urlPattern, '');
  }

  // Clean up any double commas or empty lines that might result
  cleanedContent = cleanedContent.replace(/,,\s*/g, ',\n');
  cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n');

  fs.writeFileSync(configPath, cleanedContent);
  console.log('Cleaned poller configuration by removing broken URLs');

  // Regenerate CSV
  console.log('Regenerating CSV files...');
  const { execSync } = await import('child_process');
  execSync('node export-poller-sources.js', { stdio: 'inherit' });

  return {
    total: urls.length,
    working: workingUrls.size,
    broken: brokenUrls.size,
    removed: brokenUrls.size
  };
}

cleanPollerSources().then(result => {
  console.log(`\nCleanup complete:`);
  console.log(`Total URLs: ${result.total}`);
  console.log(`Working: ${result.working}`);
  console.log(`Removed: ${result.removed}`);
  console.log(`Remaining: ${result.working}`);
}).catch(console.error);