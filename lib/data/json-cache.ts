/**
 * Process-level JSON file cache.
 *
 * Server-side: reads from public/data/ via fs, caches per process.
 * Client-side: returns empty object — data must be passed as props from server.
 *
 * Uses createRequire() so tsx/ESM scripts and server runtime can both read
 * JSON synchronously without exposing fs to client execution.
 */

import { createRequire } from 'module';

const _cache = new Map<string, unknown>();
const nodeRequire = createRequire(import.meta.url);

export function loadJsonOnce<T = unknown>(filename: string): T {
  if (typeof window !== 'undefined') {
    // Client — never read from fs; data must come via server props
    return {} as T;
  }
  if (_cache.has(filename)) return _cache.get(filename) as T;
  const fs = nodeRequire('fs') as typeof import('fs');
  const nodePath = nodeRequire('path') as typeof import('path');
  const raw = fs.readFileSync(nodePath.join(process.cwd(), 'public/data', filename), 'utf8');
  const parsed = JSON.parse(raw) as T;
  _cache.set(filename, parsed);
  return parsed;
}

export function clearJsonCache() {
  _cache.clear();
}
