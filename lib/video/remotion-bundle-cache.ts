/**
 * Remotion webpack bundle cache — lazy, on-demand only.
 * Release after renders to avoid holding hundreds of MB on idle admin pods.
 */

import path from 'node:path';
import os from 'node:os';
import { readdir, rm } from 'node:fs/promises';
import { bundle } from '@remotion/bundler';
import { logger } from '@/lib/logger';

let _bundleUrl: string | null = null;

const DEFAULT_ENTRY = path.join(process.cwd(), 'remotion-src', 'index.ts');

export async function getRemotionBundleUrl(
  entryPoint: string = DEFAULT_ENTRY,
): Promise<string> {
  if (_bundleUrl) return _bundleUrl;

  logger.info('[RemotionBundle] Bundling composition (first use this process)...');
  _bundleUrl = await bundle({
    entryPoint,
    webpackOverride: (config) => ({
      ...config,
      externals: [
        ...(Array.isArray(config.externals) ? config.externals : []),
        'edge-tts',
      ],
    }),
  });
  logger.info('[RemotionBundle] Bundle ready');
  return _bundleUrl;
}

/** Drop in-memory bundle reference and best-effort webpack temp dirs under os.tmpdir(). */
export async function releaseRemotionBundle(): Promise<void> {
  _bundleUrl = null;
  const tmp = os.tmpdir();
  const entries = await readdir(tmp).catch(() => [] as string[]);
  let removed = 0;
  for (const name of entries) {
    if (
      name.startsWith('remotion-webpack-bundle-') ||
      name.startsWith('esbuild-') ||
      name.startsWith('remotion-')
    ) {
      await rm(path.join(tmp, name), { recursive: true, force: true }).catch(() => {});
      removed++;
    }
  }
  if (removed > 0) {
    logger.info('[RemotionBundle] Released bundle cache', { removedDirs: removed });
  }
}

/** Default: release after each render/batch unless explicitly disabled. */
export function shouldReleaseRemotionBundleAfterJob(): boolean {
  return process.env.REMOTION_RELEASE_BUNDLE_AFTER_RENDER !== 'false';
}
