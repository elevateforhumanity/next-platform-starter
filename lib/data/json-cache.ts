/**
 * Process-level JSON file cache.
 *
 * Server-side: reads from public/data/ via fs, caches per process.
 * Client-side: returns empty object — data must be passed as props from server.
 *
 * Avoid static Node built-in imports so this module is safe to import from
 * client components that only need the empty-object fallback.
 */

const _cache = new Map<string, unknown>();

type NodeRequire = (id: string) => unknown;

let nodeRequire: NodeRequire | null = null;

function getNodeRequire(): NodeRequire {
  if (nodeRequire) return nodeRequire;

  const globalRequire = (globalThis as { __non_webpack_require__?: NodeRequire })
    .__non_webpack_require__;
  nodeRequire =
    typeof globalRequire === 'function'
      ? globalRequire
      : ((0, eval)('require') as NodeRequire);

  return nodeRequire;
}

export function loadJsonOnce<T = unknown>(filename: string): T {
  if (typeof window !== 'undefined') {
    // Client — never read from fs; data must come via server props
    return {} as T;
  }
  if (_cache.has(filename)) return _cache.get(filename) as T;
  const nodeRequire = getNodeRequire();
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
