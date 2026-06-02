#!/usr/bin/env node
/**
 * Quick public DNS audit — confirms site DNS is not pointing at AWS ALB/CloudFront.
 *
 *   node scripts/northflank/audit-public-dns.mjs
 */

const HOSTS = [
  'elevateforhumanity.org',
  'www.elevateforhumanity.org',
  'admin.elevateforhumanity.org',
];

const AWS_MARKERS = [
  'amazonaws.com',
  'cloudfront.net',
  'awsglobalaccelerator',
  'elasticbeanstalk',
  '20.232.216.67',
];

async function resolve(name, type) {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.Answer ?? []).map((a) => a.data).filter(Boolean);
}

async function main() {
  let failed = false;
  for (const host of HOSTS) {
    const rows = [];
    for (const type of ['A', 'CNAME', 'AAAA']) {
      const answers = await resolve(host, type);
      if (answers.length) rows.push(...answers);
    }
    const awsHits = rows.filter((r) =>
      AWS_MARKERS.some((m) => r.toLowerCase().includes(m)),
    );
    const northflank = rows.some((r) => r.includes('northflank.app') || r.includes('northflank.com'));
    console.log(`\n${host}`);
    console.log(`  records: ${rows.length ? rows.join(' → ') : '(none)'}`);
    if (awsHits.length) {
      console.log(`  FAIL: still references AWS/old IP: ${awsHits.join(', ')}`);
      failed = true;
    } else if (host.startsWith('www.') || host.startsWith('admin.')) {
      console.log(northflank ? '  OK: Northflank' : '  WARN: no Northflank hostname in chain');
      if (!northflank && host.startsWith('www.')) failed = true;
    } else {
      console.log('  OK: apex should use Durable URL forward (no A to AWS)');
    }
  }
  console.log(failed ? '\nAudit: FIX DNS' : '\nAudit: OK (not on AWS)');
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
