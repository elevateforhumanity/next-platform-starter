#!/usr/bin/env tsx
/**
 * Delete spam/duplicate host shop rows; email pending hosts (Calvin, Chris).
 *
 *   pnpm tsx scripts/barber-host-shop-cleanup-and-outreach.ts --dry-run
 *   pnpm tsx scripts/barber-host-shop-cleanup-and-outreach.ts --execute
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { hydrateProcessEnv } from '@/lib/secrets';
import { sendEmail } from '@/lib/email/sendgrid';
import {
  buildBarberHostShopFundingInterestEmail,
  HOST_SHOP_REPLY_TO,
} from '@/lib/email/barber-host-shop-outreach';
import { writeFileSync, mkdirSync } from 'fs';

const EXECUTE = process.argv.includes('--execute');
const SEND_EMAILS = process.argv.includes('--send-emails') || EXECUTE;

const DELETE_PARTNER_IDS = [
  'cd8ed2fc-8cbc-4237-b9fb-b86110e3d628', // #1 spam dfvdxvc / elizabethpowell6262
  '5a08bc18-b901-4f86-913f-589eaf743cb3', // Prestige duplicate — keep host_shop_applications only
];

const EMAIL_RECIPIENTS = [
  {
    email: 'calvincutz1985@gmail.com',
    name: 'Calvin Pena',
    shop: "Cal's Kutz Studio",
  },
  {
    email: 'christopherd.newkirk@gmail.com',
    name: 'Chris Newkirk',
    shop: "B-52's Barber Shop LLC",
  },
];

async function main() {
  await hydrateProcessEnv();
  const db = createAdminClient();

  console.log(EXECUTE ? '=== EXECUTE MODE ===' : '=== DRY RUN ===');

  for (const id of DELETE_PARTNER_IDS) {
    const { data: row } = await db
      .from('barbershop_partner_applications')
      .select('id, shop_legal_name, contact_email')
      .eq('id', id)
      .maybeSingle();
    if (!row) {
      console.log(`Skip delete (not found): ${id}`);
      continue;
    }
    console.log(`Delete partner app: ${row.shop_legal_name} <${row.contact_email}> (${id})`);
    if (EXECUTE) {
      const { error } = await db.from('barbershop_partner_applications').delete().eq('id', id);
      if (error) {
        console.error('Delete failed', id, error.message);
        process.exit(1);
      }
    }
  }

  const { data: remaining } = await db
    .from('barbershop_partner_applications')
    .select('id, shop_legal_name, contact_email, status, created_at')
    .order('created_at', { ascending: false });
  const { data: hostRows } = await db
    .from('host_shop_applications')
    .select('id, shop_name, email, status')
    .order('created_at', { ascending: false });

  console.log('\nRemaining partner applications:', remaining?.length);
  for (const r of remaining ?? []) console.log(`  ${r.status} | ${r.shop_legal_name} | ${r.contact_email}`);

  console.log('\nHost shop applications (canonical for Prestige):', hostRows?.length);
  for (const r of hostRows ?? []) console.log(`  ${r.status} | ${r.shop_name} | ${r.email}`);

  const subject = 'Barber host shop — workforce funding for apprentices & next steps';

  for (const r of EMAIL_RECIPIENTS) {
    const html = buildBarberHostShopFundingInterestEmail(r.name, r.shop);
    if (!SEND_EMAILS) {
      console.log(`[dry-run] would email ${r.email} (${r.shop})`);
      continue;
    }
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SENDGRID_API_KEY required');
      process.exit(1);
    }
    const result = await sendEmail({
      to: r.email,
      subject,
      html,
      replyTo: HOST_SHOP_REPLY_TO,
    });
    if (result.success) console.log(`Sent: ${r.email}`);
    else {
      console.error(`Failed: ${r.email}`, result.error);
      process.exit(1);
    }
    await new Promise((res) => setTimeout(res, 400));
  }

  const adminHtml = `
<div style="font-family:Arial,sans-serif;max-width:800px">
  <h1 style="color:#dc2626">Barber host shop cleanup & outreach</h1>
  <p><strong>Deleted partner applications:</strong> ${DELETE_PARTNER_IDS.length} (spam #1 + Prestige partner duplicate)</p>
  <p><strong>Prestige canonical record:</strong> host_shop_applications only (approved)</p>
  <p><strong>Emailed:</strong> ${EMAIL_RECIPIENTS.map((r) => r.email).join(', ')}</p>
  <h2>Remaining partner apps</h2>
  <ul>${(remaining ?? []).map((r) => `<li>${r.shop_legal_name} — ${r.contact_email} (${r.status})</li>`).join('')}</ul>
  <h2>Host shop applications table</h2>
  <ul>${(hostRows ?? []).map((r) => `<li>${r.shop_name} — ${r.email} (${r.status})</li>`).join('')}</ul>
  <h2>Misplaced / failed host applications</h2>
  <p>No applications found with barber-host or host-shop program slugs. Apprentice applications with &quot;Has Host Shop&quot; in notes are student enrollments (correct table).</p>
</div>`;

  if (SEND_EMAILS) {
    await sendEmail({
      to: [HOST_SHOP_REPLY_TO],
      subject: 'Barber host shop cleanup — Calvin & Chris emailed',
      html: adminHtml,
      replyTo: HOST_SHOP_REPLY_TO,
    });
  }

  mkdirSync('exports', { recursive: true });
  writeFileSync(
    'exports/barbershop-host-after-cleanup.json',
    JSON.stringify(
      {
        at: new Date().toISOString(),
        deleted_partner_ids: DELETE_PARTNER_IDS,
        remaining_partner: remaining,
        host_shop_applications: hostRows,
        emailed: EMAIL_RECIPIENTS,
      },
      null,
      2,
    ),
  );

  console.log('\nWrote exports/barbershop-host-after-cleanup.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
