#!/usr/bin/env node
const { spawnSync } = require('child_process');
const args = process.argv.slice(2);
if (args[0] === 'versions' && args[1] === 'upload' && !args.some(a => a.startsWith('--assets'))) {
  args.push('--assets=./dist');
}
const r = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', ...args], { stdio: 'inherit' });
process.exit(r.status || 0);
