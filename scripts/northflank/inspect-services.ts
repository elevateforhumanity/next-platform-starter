#!/usr/bin/env tsx
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

async function main() {
  const pid = resolveProjectId();
  if (!pid) process.exit(1);
  for (const sid of ['elevate-admin', 'elevate-lms']) {
    const s = await nfFetch<Record<string, unknown>>(projectApiPath(pid, `/services/${sid}`));
    const vcs = s.vcsData as { projectBranch?: string } | undefined;
    const bs = s.buildSettings as { dockerfile?: { dockerFilePath?: string; buildkit?: unknown } } | undefined;
    console.log(
      JSON.stringify(
        {
          id: sid,
          branch: vcs?.projectBranch,
          dockerfile: bs?.dockerfile?.dockerFilePath,
          buildkit: bs?.dockerfile?.buildkit,
          deploymentStatus: (s.deploymentStatus as { status?: string })?.status,
        },
        null,
        2,
      ),
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
