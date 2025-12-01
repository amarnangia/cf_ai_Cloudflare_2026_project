const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Read and parse the actual dance_resources.ts file
function loadDanceResources() {
  const filePath = path.join(__dirname, 'nrityaai-worker', 'src', 'dance_resources.ts');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Extract the danceResources object from the TypeScript file
  const startMatch = fileContent.match(/export const danceResources = {/);
  if (!startMatch) {
    throw new Error('Could not find danceResources export in the file');
  }
  
  const startIndex = startMatch.index + startMatch[0].length - 1;
  let braceCount = 0;
  let endIndex = startIndex;
  
  // Find the matching closing brace
  for (let i = startIndex; i < fileContent.length; i++) {
    if (fileContent[i] === '{') braceCount++;
    if (fileContent[i] === '}') braceCount--;
    if (braceCount === 0) {
      endIndex = i + 1;
      break;
    }
  }
  
  const objectString = fileContent.substring(startIndex, endIndex);
  const danceResources = eval(`(${objectString})`);
  return danceResources;
}

const danceResources = loadDanceResources();
console.log('Loaded dance resources from actual file');

function checkUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http;
    
    const req = client.get(url, { timeout: 10000 }, (res) => {
      resolve({
        url,
        status: res.statusCode,
        working: res.statusCode >= 200 && res.statusCode < 400
      });
    });
    
    req.on('error', (err) => {
      resolve({
        url,
        status: 'ERROR',
        working: false,
        error: err.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        working: false,
        error: 'Request timeout'
      });
    });
  });
}

async function checkAllUrls() {
  const allUrls = [];
  
  // Extract all URLs from the dance resources
  function extractUrls(obj, path = '') {
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        if (item.url) {
          allUrls.push({
            title: item.title,
            url: item.url,
            path: `${path}[${index}]`
          });
        }
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        extractUrls(obj[key], path ? `${path}.${key}` : key);
      });
    }
  }
  
  extractUrls(danceResources);
  
  console.log(`Loaded ${Object.keys(danceResources).length} dance categories`);
  console.log(`Checking ${allUrls.length} URLs...\n`);
  
  const results = [];
  const batchSize = 5; // Check 5 URLs at a time to avoid overwhelming servers
  
  for (let i = 0; i < allUrls.length; i += batchSize) {
    const batch = allUrls.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => checkUrl(item.url).then(result => ({
        ...result,
        title: item.title,
        path: item.path
      })))
    );
    
    results.push(...batchResults);
    
    // Show progress
    console.log(`Checked ${Math.min(i + batchSize, allUrls.length)}/${allUrls.length} URLs`);
    
    // Small delay between batches
    if (i + batchSize < allUrls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Report results
  const broken = results.filter(r => !r.working);
  const working = results.filter(r => r.working);
  
  console.log('\n=== RESULTS ===');
  console.log(`✅ Working URLs: ${working.length}`);
  console.log(`❌ Broken URLs: ${broken.length}`);
  
  if (broken.length > 0) {
    console.log('\n=== BROKEN URLS ===');
    broken.forEach(item => {
      console.log(`❌ ${item.title}`);
      console.log(`   URL: ${item.url}`);
      console.log(`   Status: ${item.status}`);
      if (item.error) console.log(`   Error: ${item.error}`);
      console.log(`   Path: ${item.path}`);
      console.log('');
    });
  }
  
  console.log('\n=== SUMMARY ===');
  console.log(`Total URLs checked: ${results.length}`);
  console.log(`Success rate: ${Math.round((working.length / results.length) * 100)}%`);
}

checkAllUrls().catch(console.error);