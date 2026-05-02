// scripts/fix-client-reference-manifests.mjs
//
// Next.js 15 renames client-reference-manifest files:
//   OLD (expected by @netlify/plugin-nextjs ≤5.15.10):
//     page_client-reference-manifest.js
//   NEW (produced by Next.js 15):
//     page.client-reference-manifest.js
//
// This script creates symlinks from the old name → new name so the
// Netlify plugin's file-copy step doesn't ENOENT.
// Run after `next build`, before the Netlify plugin's onBuild step.

import fs from 'node:fs';
import path from 'node:path';

const SERVER_APP = path.join(process.cwd(), '.next', 'server', 'app');

if (!fs.existsSync(SERVER_APP)) {
  console.log('[fix-manifests] .next/server/app not found — skipping (run after next build)');
  process.exit(0);
}

let fixed = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name.endsWith('.client-reference-manifest.js') && entry.name.includes('.')) {
      // New name: page.client-reference-manifest.js
      // Old name: page_client-reference-manifest.js
      const oldName = entry.name.replace('.client-reference-manifest.js', '_client-reference-manifest.js');
      const oldPath = path.join(dir, oldName);
      if (!fs.existsSync(oldPath)) {
        fs.copyFileSync(full, oldPath);
        console.log(`[fix-manifests] copied ${entry.name} → ${oldName}`);
        fixed++;
      }
    }
  }
}

walk(SERVER_APP);
console.log(`[fix-manifests] done — ${fixed} manifest(s) shimmed`);
