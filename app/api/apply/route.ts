// PUBLIC ROUTE: general program application form
import { logger } from '@/lib/logger';
import { sendTeamsMessage } from '@/lib/notifications/teams';

import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { contactRateLimit } from '@/lib/rate-limit';
import { applicationSchema } from '@/lib/api/validation-schemas';
import { sendEmail } from '@/lib/email/sendgrid';
import { sendApplicationWelcomeEmail } from '@/lib/email/application-welcome';
import { sendOnboardingEmail } from '@/lib/email/send-onboarding';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';
import { getRoutingRecommendations } from '@/lib/automation/shop-routing';
import { insertWithPreAuthCheck } from '@/lib/pre-auth-guard';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { resolveProgramId } from '@/lib/programs/resolve';
export const runtime = 'nodejs';
export const maxDuration = 30;

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';
const ADMIN_SMS = process.env.ADMIN_SMS_GATEWAY || '';

export const POST = withRateLimit(
  async (req: Request) => {
    try {
      const contentType = req.headers.get('content-type');
      let data;

      if (contentType?.includes('application/json')) {
        data = await req.json();
      } else {
        const formData = await req.formData();
        data = {
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          program: formData.get('program'),
          funding: formData.get('funding'),
        };
      }

      const validatedData = applicationSchema.parse(data);

      const { program, funding, name, email, phone, pathway_slug, source } = validatedData;
      const eligible = funding !== 'Self Pay' && program !== 'Not Sure';

      // Funding sources that require WorkOne / Indiana Career Connect intake first
      const WORKFORCE_FUNDING_KEYS = [
        'wioa',
        'workone',
        'workforce ready',
        'workforce_ready',
        'fssa',
        'employindy',
        'employ_indy',
        'impact',
        'dwd',
      ];
      const needsWorkOneIntake = WORKFORCE_FUNDING_KEYS.some((k) =>
        (funding ?? '').toLowerCase().includes(k),
      );
      const isWorkforceFunded = WORKFORCE_FUNDING_KEYS.some((k) =>
        (funding ?? '').toLowerCase().includes(k),
      );
      const applicationStatus = needsWorkOneIntake
        ? 'pending_workone'
        : isWorkforceFunded
          ? 'pending_admin_review'
          : 'submitted';

      // Split name into first and last
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const supabase = await requireAdminClient();

      if (!supabase) {
        return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
      }

      // Resolve program_id from slug or title so the review page can approve without guessing
      const resolvedProgramId = await resolveProgramId(supabase, program);

      // Dedup: block same email + program within 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentApp } = await supabase
        .from('applications')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .eq('program_interest', program)
        .gte('created_at', oneDayAgo)
        .limit(1)
        .maybeSingle();

      if (recentApp) {
        return NextResponse.json(
          { error: 'An application for this program was already submitted with this email in the last 24 hours. Please call 317-314-3757 if you need to make changes.' },
          { status: 409 },
        );
      }

      const referenceNumber = `EFH-${Date.now().toString(36).toUpperCase()}`;

      // Build insert object - only include pathway_slug/source if migration has been run
      const insertData: Record<string, any> = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        normalized_email: email.toLowerCase().trim(),
        normalized_phone: phone.replace(/\D/g, ''),
        city: 'Not provided',
        zip: '00000',
        program_interest: program,
        program_id: resolvedProgramId,
        reference_number: referenceNumber,
        status: applicationStatus,
        type: 'student',
        funding_type: funding || null,
        source: source || 'website',
        support_notes: `Funding: ${funding}. ${eligible ? 'Prescreen pass' : 'Manual review'}${pathway_slug ? `. Pathway: ${pathway_slug}` : ''}`,
      };

      // @preAuthWrite table=applications mode=reconcile
      // Try with new columns first, fall back without them
      let application, error;
      if (pathway_slug || source) {
        const result = await insertWithPreAuthCheck(supabase, 'applications', {
          ...insertData,
          pathway_slug: pathway_slug || null,
        })
          .select('id')
          .maybeSingle();

        if (result.error?.message?.includes('column') || result.error?.code === '42703') {
          // Columns don't exist yet, insert without them
          const fallback = await insertWithPreAuthCheck(supabase, 'applications', insertData)
            .select('id')
            .maybeSingle();
          application = fallback.data;
          error = fallback.error;
        } else {
          application = result.data;
          error = result.error;
        }
      } else {
        const result = await supabase.from('applications').insert(insertData).select('id').single();
        application = result.data;
        error = result.error;
      }

      if (error) {
        logger.error('Supabase insert error:', error);
        return NextResponse.json(
          { error: 'Failed to submit application. Please call 317-314-3757 for assistance.' },
          { status: 500 },
        );
      }

      await auditLog({
        actorRole: 'student',
        action: AuditAction.CASE_CREATED,
        entity: AuditEntity.APPLICATION,
        entityId: application?.id,
        metadata: { program, funding, email, eligible },
      });

      // Trigger routing automation for apprenticeship programs (non-blocking)
      // Teams alert — non-fatal
      sendTeamsMessage(
        'New Application Received',
        `**${firstName} ${lastName}** applied for **${program ?? 'Unknown program'}**.`,
        { Email: email, Program: program ?? 'Unknown', Funding: funding ?? 'Unknown' },
      ).catch((err) => logger.error('[apply] Teams notification failed', err));

      if (process.env.AUTOMATION_ENABLE_TRIGGERS !== 'false' && application?.id) {
        if (program?.toLowerCase().includes('apprentice')) {
          getRoutingRecommendations(application.id).catch((err) => {
            logger.error('Routing automation error (non-blocking):', err);
          });
        }
      }

      // Welcome and onboarding emails are sent when the application moves to
      // 'in_review' via the transition route — not on submission.
      // Sending them here would email applicants before any review has occurred.

      // Send notification email to admin
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `New Application: ${firstName} ${lastName} - ${program}`,
        html: `
          <h2>New Application Received</h2>
          <table style="border-collapse: collapse; width: 100%;">
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Name</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${firstName} ${lastName}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><a href="tel:${phone}">${phone}</a></td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Program</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${program}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Funding</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${funding}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Pre-screen</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${eligible ? '✅ Pass' : '⚠️ Manual Review'}</td></tr>
          </table>
          <p style="margin-top: 20px;"><a href="https://www.elevateforhumanity.org/admin/applications" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Admin Dashboard</a></p>
        `,
      });

      // SMS alert via email-to-SMS gateway (only if configured)
      if (ADMIN_SMS) {
        await sendEmail({
          to: ADMIN_SMS,
          subject: 'New App',
          html: `${firstName} ${lastName}\n${program}\n${phone}`,
        }).catch((err) => logger.warn('[apply] SMS alert failed:', err));
      }

      // Trigger routing automation asynchronously (non-blocking)
      // On error: creates review_queue item, never blocks user flow
      if (application?.id) {
        try {
          fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/automation/routing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId: application.id, program }),
          }).catch((err) => {
            logger.error('[apply] Routing automation trigger failed (non-fatal):', err);
          });
        } catch (triggerError) {
          // Never block user flow - log and continue
          logger.error('[apply] Routing automation trigger error (non-fatal):', triggerError);
        }
      }

      if (contentType?.includes('application/json')) {
        return NextResponse.json({
          success: true,
          status: applicationStatus,
          pending_workone: needsWorkOneIntake,
        });
      }

      // Workforce-funded applicants → WorkOne intake page
      if (needsWorkOneIntake) {
        const dest = new URL('/apply/pending-workone', req.url);
        if (funding) dest.searchParams.set('funding', funding);
        if (program) dest.searchParams.set('program', program);
        return NextResponse.redirect(dest, { status: 303 });
      }

      // All other applicants → success page with funding param so Career Connect prompt can show
      const dest = new URL('/apply/success', req.url);
      if (funding) dest.searchParams.set('funding', funding);
      if (program) dest.searchParams.set('program', program);
      return NextResponse.redirect(dest, { status: 303 });
    } catch (err: any) {
      logger.error('Apply route error:', err);

      // Handle validation errors specifically
      if (err?.name === 'ZodError' || err?.issues) {
        const issues = err.issues || err.errors || [];
        const fieldErrors = issues
          .map((e: any) => `${e.path?.join('.') || 'field'}: ${e.message}`)
          .join(', ');
        return NextResponse.json({ error: `Please fix: ${fieldErrors}` }, { status: 400 });
      }

      return NextResponse.json(
        { error: 'Submission failed. Please call 317-314-3757.' },
        { status: 500 },
      );
    }
  },
  { limiter: contactRateLimit, skipOnMissing: true },
);
