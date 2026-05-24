import type { SupabaseClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { aiChat } from '@/lib/ai/ai-service';

const SYSTEM_PROMPT = `You are Ellie — the AI operations assistant for Elevate for Humanity, a DOL-registered apprenticeship sponsor and Indiana ETPL/WIOA/WRG/JRI-approved workforce development organization based in Indianapolis, Indiana.

You are NOT a generic chatbot. You are deeply embedded in this organization. You know the staff, the programs, the students, the funding sources, the compliance requirements, and the live operational data. You speak like a knowledgeable colleague — direct, warm, and specific. Never say "I don't have access to that" when the live data is provided to you.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORGANIZATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: Elevate for Humanity
Website: www.elevateforhumanity.org
Admin portal: admin.elevateforhumanity.org
Phone: (317) 314-3757
Address: Indianapolis, Indiana
Approvals: Indiana ETPL, WIOA Title I, Workforce Ready Grant (WRG), Job Ready Indy (JRI), DOL Registered Apprenticeship Sponsor, FSSA IMPACT, EmployIndy partner
Tax entity: Also operates Selfish Inc. (501(c)(3)) for VITA free tax prep
Testing: Certiport Authorized Testing Center (CATC), EPA 608 Certified Proctor (ESCO #358010 and Mainstream Engineering)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STAFF — know these people by name
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Elizabeth Greene — Founder & CEO. U.S. Army veteran. IRS Enrolled Agent (EA), EFIN/PTIN holder, ERO, SBIN-authorized federal tax software submitter. Licensed barber. Indiana substitute teacher. OSHA 10-Hour certified. EPA 608 Certified Proctor. Leads all tax operations and Selfish Inc. Email: elizabethpowell6262@gmail.com

Jozanna George — Director of Enrollment & Beauty Industry Programs. Multi-licensed: Nail Technician, Nail Instructor, Esthetician. Oversees nail program at Textures Institute of Cosmetology. Email: jozanna@elevateforhumanity.org

Dr. Carlina Wilkes — Executive Director of Financial Operations & Organizational Compliance. 24+ years federal experience with DFAS. DoD Financial Management Certification Level II. Email: carlina@elevateforhumanity.org

Leslie Wafford — Director of Community Services. Housing access and eviction prevention. Email: leslie@elevateforhumanity.org

Delores Reynolds — Social Media & Digital Engagement Coordinator. Email: delores@elevateforhumanity.org

Clystjah Woodley — Program Coordinator. Student services and enrollment support. Email: clystjah@elevateforhumanity.org

Naomi Jordan — Director of Healthcare Administration. Owner of Rebuilds Mind and Body Studio LLC. Credentials: CNA, HHA, Phlebotomy Technician, QMA. Oversees all healthcare programs. Email: naomi@elevateforhumanity.org

Ameco Martin — Director of Information Technology. Owner of Ameco's Enterprise LLC. BS Computer Programming. Oversees all IT/tech programs. Career Coach at Warren Central High School (WIOA In-School Youth). Email: amecosenterprise@gmail.com

Alberta Davis — Testing Center Coordinator & Exam Proctor. Coordinates certification exams. Email: alberta@elevateforhumanity.org

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROGRAMS & PRICING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HEALTHCARE (Director: Naomi Jordan)
- CNA — $1,850 — 6 weeks — State certification
- Medical Assistant — $5,565 — 20 weeks — NHA CCMA
- Phlebotomy Technician — $4,750 — 6 weeks — NHA CPT
- Pharmacy Technician — $5,200 — 16 weeks
- Home Health Aide — $575
- Drug & Alcohol Specimen Collector — $1,800 — 2 weeks
- Dental Assistant — $4,500 — 12 weeks
- Community Healthcare Worker — $1,200
- Peer Recovery Specialist — WIOA-funded

SKILLED TRADES
- HVAC Technician — $5,000 — 8 weeks — EPA 608
- CDL Training — $4,550 — 4 weeks
- Welding — $5,500
- Building Maintenance Technician — $4,730 — 12 weeks — WRG eligible
- Solar Panel Installation — $4,200 — 12 weeks
- Manufacturing Technician — $4,200 — 12 weeks
- Automotive Technician — $9,500 — 32 weeks
- Diesel Mechanic — $9,500 — 32 weeks
- Electrical Apprenticeship — DOL registered
- Plumbing Apprenticeship — DOL registered

APPRENTICESHIPS (DOL Registered)
- Barber Apprenticeship — $4,980 — 52 weeks — Indiana State Barber License
- Cosmetology Apprenticeship — $4,950 — 52 weeks — Indiana State Cosmetology License
- Esthetician Apprenticeship — State license
- Nail Technician Apprenticeship — State license
- Culinary Apprenticeship — 40 weeks
- EMT Apprenticeship — 12 weeks

TECHNOLOGY (Director: Ameco Martin)
- IT Help Desk / CompTIA A+ — Certification
- Cybersecurity Analyst — $9,100 — 24 weeks
- Network Administration — Certification
- Web Development — $8,120 — 24 weeks
- Software Development — Certification
- Data Analytics — $7,280 — 20 weeks
- Graphic Design — Certification
- CAD/Drafting — Certification

BUSINESS & FINANCE
- Bookkeeping — $2,800 — 16 weeks
- Administrative Assistant — $4,200 — 12 weeks
- Business Start-Up — $5,200
- Real Estate Agent — $4,200 — 12 weeks
- Insurance Agent — $2,800 — 8 weeks
- Tax Preparation — $2,800

SPECIAL PROGRAMS
- JRI (Justice-Reinvestment Initiative) — Reentry workforce training
- Life Coach Certification — $750 — 12 weeks — WIOA eligible
- NRF Rise Up — $399 — Retail/hospitality
- Reentry Specialist — WIOA-funded

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FUNDING SOURCES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- WIOA Title I (WorkOne) — covers most programs for eligible adults/dislocated workers/youth
- Workforce Ready Grant (WRG) — Indiana state grant for high-demand occupations
- Job Ready Indy (JRI) — Marion County workforce grant
- FSSA IMPACT — Indiana welfare-to-work funding
- EmployIndy — Indianapolis workforce board, WIOA In-School Youth contracts
- Self-pay — 35% deposit + payment plan, Affirm and Sezzle BNPL available
- Employer-sponsored — employers can sponsor employees

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW YOU RESPOND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Use the LIVE DATA snapshot provided with every message — it has real numbers
- Be specific — use real names, real prices, real program names
- Format responses clearly — use bullet points and headers for operational data
- For compliance questions, be precise and cite the relevant funding source
- Never make up data — if something is not in the live snapshot, say so
- Suggest admin actions with specific URLs: "Go to /admin/applications to review these"
- Keep responses concise for simple questions, detailed for operational queries
- You remember the full conversation — refer back to earlier messages when relevant
- When someone asks about a student by name, use the ADDITIONAL LOOKUP DATA if provided`;

async function getLiveDataSnapshot(db: SupabaseClient): Promise<string> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    pendingApps, totalApps, activeEnrollments, totalStudents,
    revenueMonth, revenueAll, certs, atRisk,
    complianceAlerts, pendingWioa, pendingSignatures,
    openContracts, activeGrants, staleLeads,
    pendingWorkflows, publishedLessons, programBreakdown,
  ] = await Promise.all([
    db.from('applications').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'pending_admin_review', 'under_review']),
    db.from('applications').select('id', { count: 'exact', head: true }),
    db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    db.from('program_enrollments').select('amount_paid_cents').eq('payment_status', 'paid').gte('created_at', monthStart),
    db.from('program_enrollments').select('amount_paid_cents').eq('payment_status', 'paid'),
    db.from('program_completion_certificates').select('id', { count: 'exact', head: true }),
    db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active').or(`last_activity_at.lt.${cutoff7d},last_activity_at.is.null`),
    db.from('compliance_alerts').select('id', { count: 'exact', head: true }).neq('status', 'resolved'),
    db.from('wioa_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('document_signatures').select('id', { count: 'exact', head: true }).is('signed_at', null),
    db.from('mou_documents').select('id', { count: 'exact', head: true }),
    db.from('grants').select('id', { count: 'exact', head: true }).in('status', ['draft', 'in_progress', 'submitted']),
    db.from('crm_leads').select('id', { count: 'exact', head: true }).or(`last_contact_at.lt.${cutoff7d},last_contact_at.is.null`).neq('status', 'closed'),
    db.from('workflows').select('id', { count: 'exact', head: true }).in('status', ['pending', 'in_progress']),
    db.from('curriculum_lessons').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    db.from('program_enrollments').select('programs(name), status').eq('status', 'active').limit(200),
  ]);

  const sum = (rows: Record<string, unknown>[]) =>
    rows.reduce((s, r) => s + ((r.amount_paid_cents as number) ?? 0), 0);
  const monthCents = sum(revenueMonth.data ?? []);
  const allCents   = sum(revenueAll.data   ?? []);

  const programCounts: Record<string, number> = {};
  for (const row of (programBreakdown.data ?? []) as any[]) {
    const name = (row.programs as any)?.name ?? 'Unknown';
    programCounts[name] = (programCounts[name] ?? 0) + 1;
  }
  const topPrograms = Object.entries(programCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([name, count]) => `  ${name}: ${count} active`).join('\n') || '  (none)';

  return `LIVE DATA (${now.toLocaleString('en-US', { timeZone: 'America/Indiana/Indianapolis' })} ET):

STUDENTS & ENROLLMENT
- Total students: ${totalStudents.count ?? 0}
- Active enrollments: ${activeEnrollments.count ?? 0}
- At-risk learners (inactive 7d+): ${atRisk.count ?? 0}
- Certificates issued: ${certs.count ?? 0}

TOP ACTIVE PROGRAMS
${topPrograms}

APPLICATIONS
- Pending review: ${pendingApps.count ?? 0}
- Total applications: ${totalApps.count ?? 0}

REVENUE
- This month: $${(monthCents / 100).toLocaleString('en-US')}
- All time: $${(allCents / 100).toLocaleString('en-US')}

COMPLIANCE & DOCUMENTS
- Open compliance alerts: ${complianceAlerts.count ?? 0}
- Pending WIOA documents: ${pendingWioa.count ?? 0}
- Pending signatures: ${pendingSignatures.count ?? 0}

CONTRACTS & GRANTS
- Active contracts/MOUs: ${openContracts.count ?? 0}
- Active/in-progress grants: ${activeGrants.count ?? 0}

CRM & WORKFLOWS
- Stale CRM leads (7d+ no contact): ${staleLeads.count ?? 0}
- Active workflows: ${pendingWorkflows.count ?? 0}

CURRICULUM
- Published lessons: ${publishedLessons.count ?? 0}`;
}

async function resolveIntent(message: string, db: SupabaseClient): Promise<string> {
  const lower = message.toLowerCase();

  // Name lookup
  const nameMatch = message.match(
    /(?:find|look up|search|show|who is|tell me about|status of|check on|what about)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i
  );
  if (nameMatch && !lower.includes('program') && !lower.includes('grant')) {
    const query = nameMatch[1].trim();
    const parts = query.split(' ');
    const firstName = parts[0];
    const lastName = parts[1] ?? '';

    const { data: profiles } = await db
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .or(lastName
        ? `full_name.ilike.%${firstName}%,full_name.ilike.%${lastName}%`
        : `full_name.ilike.%${firstName}%`)
      .limit(5);

    if (profiles && profiles.length > 0) {
      const results = await Promise.all(profiles.map(async (p: any) => {
        const { data: enrollments } = await db
          .from('program_enrollments')
          .select('programs(name), status, created_at, amount_paid_cents')
          .eq('user_id', p.id)
          .order('created_at', { ascending: false })
          .limit(3);

        const { data: apps } = await db
          .from('applications')
          .select('status, created_at, programs(name)')
          .eq('user_id', p.id)
          .order('created_at', { ascending: false })
          .limit(3);

        const enrollStr = (enrollments ?? []).map((e: any) =>
          `    • ${(e.programs as any)?.name ?? 'Unknown'} — ${e.status} ($${((e.amount_paid_cents ?? 0) / 100).toLocaleString()} paid)`
        ).join('\n') || '    None';

        const appStr = (apps ?? []).map((a: any) =>
          `    • ${(a.programs as any)?.name ?? 'Unknown'} — ${a.status} (${new Date(a.created_at).toLocaleDateString()})`
        ).join('\n') || '    None';

        return `${p.full_name} | ${p.role} | ${p.email}\n  Enrollments:\n${enrollStr}\n  Applications:\n${appStr}`;
      }));
      return `PERSON LOOKUP — "${query}":\n${results.join('\n\n')}`;
    }
    return `PERSON LOOKUP: No profiles found matching "${query}".`;
  }

  // Recent applications
  if ((lower.includes('recent') || lower.includes('latest') || lower.includes('new')) && lower.includes('application')) {
    const { data } = await db
      .from('applications')
      .select('created_at, status, profiles(full_name, email), programs(name)')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data?.length) {
      return `RECENT APPLICATIONS:\n${data.map((a: any) =>
        `• ${(a.profiles as any)?.full_name ?? 'Unknown'} → ${(a.programs as any)?.name ?? 'Unknown'} (${a.status}) — ${new Date(a.created_at).toLocaleDateString()}`
      ).join('\n')}`;
    }
  }

  // Pending applications list
  if (lower.includes('pending') && lower.includes('application')) {
    const { data } = await db
      .from('applications')
      .select('created_at, status, profiles(full_name, email), programs(name)')
      .in('status', ['submitted', 'pending_admin_review', 'under_review'])
      .order('created_at', { ascending: false })
      .limit(15);
    if (data?.length) {
      return `PENDING APPLICATIONS (${data.length}):\n${data.map((a: any) =>
        `• ${(a.profiles as any)?.full_name ?? 'Unknown'} → ${(a.programs as any)?.name ?? 'Unknown'} (${a.status}) — ${new Date(a.created_at).toLocaleDateString()}`
      ).join('\n')}`;
    }
  }

  // Revenue detail
  if (lower.includes('revenue') || (lower.includes('how much') && lower.includes('paid'))) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data } = await db
      .from('program_enrollments')
      .select('amount_paid_cents, programs(name), created_at')
      .eq('payment_status', 'paid')
      .gte('created_at', monthStart)
      .order('amount_paid_cents', { ascending: false })
      .limit(20);
    if (data?.length) {
      const total = data.reduce((s: number, r: any) => s + (r.amount_paid_cents ?? 0), 0);
      return `REVENUE THIS MONTH — $${(total / 100).toLocaleString()} total:\n${data.map((r: any) =>
        `• ${(r.programs as any)?.name ?? 'Unknown'}: $${((r.amount_paid_cents ?? 0) / 100).toLocaleString()}`
      ).join('\n')}`;
    }
  }

  return '';
}

async function loadMemory(db: SupabaseClient, userId: string, sessionId: string) {
  const { data } = await db
    .from('ai_conversation_memory')
    .select('role, content')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(30);
  return (data ?? []) as { role: string; content: string }[];
}

async function saveMemory(db: SupabaseClient, userId: string, sessionId: string, role: 'user' | 'assistant', content: string) {
  // Non-fatal — if the table doesn't exist yet the conversation still works,
  // it just won't have cross-message memory until the migration is applied.
  await db.from('ai_conversation_memory').insert({
    user_id: userId,
    session_id: sessionId,
    role,
    content,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }).then(() => {}, () => {});
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const userMessage: string = body.message ?? '';
  const sessionId: string = body.sessionId ?? 'default';

  if (!userMessage.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const db = await requireAdminClient();

  const [dataSnapshot, intentData, history] = await Promise.all([
    getLiveDataSnapshot(db),
    resolveIntent(userMessage, db),
    loadMemory(db, auth.user.id, sessionId),
  ]);

  await saveMemory(db, auth.user.id, sessionId, 'user', userMessage);

  const contextBlock = intentData
    ? `${dataSnapshot}\n\nADDITIONAL LOOKUP DATA:\n${intentData}`
    : dataSnapshot;

  const systemPrompt = `${SYSTEM_PROMPT}\n\n${contextBlock}`;
  const recentHistory = history.slice(-20);
  const messages = [
    ...recentHistory.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: userMessage },
  ];

  let reply = '';

  try {
    const result = await aiChat({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.4,
      maxTokens: 1000,
    });
    reply = result.content ?? '';
  } catch {
    try {
      const result = await aiChat({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.4,
        maxTokens: 1000,
      });
      reply = result.content ?? '';
    } catch {
      reply = `AI service unavailable right now. Here is the live data:\n\n${dataSnapshot}\n\nCheck /admin/api-keys to verify your OpenAI and Groq keys are active.`;
    }
  }

  if (reply) await saveMemory(db, auth.user.id, sessionId, 'assistant', reply);

  return NextResponse.json({ reply, sessionId, dataSnapshot });
}

export async function DELETE(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { sessionId } = await request.json().catch(() => ({ sessionId: 'default' }));
  const db = await requireAdminClient();

  await db.from('ai_conversation_memory').delete()
    .eq('user_id', auth.user.id)
    .eq('session_id', sessionId ?? 'default');

  return NextResponse.json({ ok: true });
}
