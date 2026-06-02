#!/usr/bin/env tsx
/**
 * Print Northflank CNAME targets for Durable DNS (after TXT verification).
 *
 *   pnpm tsx scripts/northflank/print-cname-targets.ts
 */

import { nfFetch, resolveTeamId } from './lib';

type SubdomainRow = {
  fullName?: string;
  content?: string;
  verified?: boolean;
};

async function printDomain(domain: string) {
  const teamId = resolveTeamId();
  if (!teamId) throw new Error('Set NORTHFLANK_TEAM_ID');
  const row = await nfFetch<SubdomainRow>(
    `/teams/${teamId}/domains/${encodeURIComponent(domain)}/subdomains/@`,
  );
  console.log(`${row.fullName ?? domain}`);
  console.log(`  CNAME host: @ (or ${domain})`);
  console.log(`  Target:     ${row.content ?? '(unknown)'}`);
  console.log(`  Verified:   ${row.verified ? 'yes' : 'no — update DNS in Durable, wait ~15–60 min'}`);
  console.log('');
}

async function resolveNorthflankApexIp(cnameTarget: string): Promise<string | null> {
  try {
    const { execSync } = await import('child_process');
    const out = execSync(`dig +short ${cnameTarget} A | head -1`, { encoding: 'utf8' }).trim();
    return out || null;
  } catch {
    return null;
  }
}

async function main() {
  console.log('\n=== Northflank CNAME records for Durable ===\n');
  await printDomain('www.elevateforhumanity.org');
  await printDomain('admin.elevateforhumanity.org');
  await printDomain('elevateforhumanity.org');

  const apexCname = 'elevateforhumanity.org.elev-5vfk.dns.northflank.app';
  const apexIp = await resolveNorthflankApexIp(apexCname);
  if (apexIp) {
    console.log('=== Apex A-record fallback (if @ cannot be CNAME) ===\n');
    console.log('elevateforhumanity.org');
    console.log(`  A host: @`);
    console.log(`  Target: ${apexIp}  (from ${apexCname})`);
    console.log('  Remove any A record pointing at 20.232.216.67 — it breaks HTTPS/mobile.\n');
  }

  console.log('Full runbook: docs/northflank-dns-durable.md');
  console.log('After DNS propagates:');
  console.log('  pnpm tsx scripts/northflank/configure-domains.ts --execute\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
