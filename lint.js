// Pre-deploy syntax checker for BranchLive
// Extracts inline <script> from HTML and validates with Node's parser
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, 'dashboard.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Extract the inline script with data-cfasync
const scriptMatch = html.match(/<script[^>]*data-cfasync[^>]*>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('❌ No script tag with data-cfasync found in dashboard.html');
  process.exit(1);
}

const js = scriptMatch[1].trim();
if (!js) {
  console.error('❌ Script tag is empty');
  process.exit(1);
}

// Node's parser catches syntax errors AND await-in-non-async
try {
  new vm.Script(js, { filename: 'dashboard.html' });
  const funcCount = (js.match(/function\s+(\w+)/g) || []).length;
  console.log(`✅ Lint passed — ${funcCount} functions, zero syntax errors`);
  process.exit(0);
} catch (e) {
  console.error(`❌ ${e.message}`);
  process.exit(1);
}
