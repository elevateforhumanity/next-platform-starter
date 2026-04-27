/**
 * Post-approval actions by program slug.
 *
 * Called after approveApplication() succeeds. Sends approval email with
 * Elevate LMS access instructions. All actions are non-fatal.
 */

import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';
import { sendTeamsMessage } from '@/lib/notifications/teams';

export interface PostApprovalInput {
  db: SupabaseClient;
  applicationId: string;
  programSlug: string | null | undefined;
  studentEmail: string;
  studentName: string | null | undefined;
  studentPhone?: string | null;
  passwordSetupLink?: string | null;
  enrollmentId?: string | null;
}

export async function runPostApprovalActions(input: PostApprovalInput): Promise<void> {
  const { programSlug, studentEmail, studentName, passwordSetupLink } = input;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  const firstName = studentName?.split(' ')[0] || 'there';
  const onboardingUrl = `${siteUrl}/onboarding/learner`;
  const dashboardUrl = `${siteUrl}/learner/dashboard`;
  const lmsUrl = `${siteUrl}/lms/courses`;

  if (programSlug === 'barber-apprenticeship') {
    await sendBarberApprovalEmail({
      studentEmail,
      firstName,
      passwordSetupLink: passwordSetupLink ?? null,
      onboardingUrl,
      dashboardUrl,
      lmsUrl,
      siteUrl,
    });
  } else {
    await sendGenericApprovalEmail({
      studentEmail,
      firstName,
      passwordSetupLink: passwordSetupLink ?? null,
      onboardingUrl,
      dashboardUrl,
      siteUrl,
    });
  }

  // Teams notification — non-fatal
  await sendTeamsMessage(
    'Application Approved',
    `${studentName || studentEmail} has been approved${programSlug ? ` for **${programSlug}**` : ''}.`,
    {
      Student: studentEmail,
      Program: programSlug ?? 'Unknown',
      'Onboarding URL': onboardingUrl,
    },
  ).catch((err) => logger.error('[post-approval] Teams notification failed', err));
}

async function sendBarberApprovalEmail({
  studentEmail,
  firstName,
  passwordSetupLink,
  onboardingUrl,
  dashboardUrl,
  lmsUrl,
  siteUrl,
}: {
  studentEmail: string;
  firstName: string;
  passwordSetupLink: string | null;
  onboardingUrl: string;
  dashboardUrl: string;
  lmsUrl: string;
  siteUrl: string;
}) {
  try {
    const { sendEmail } = await import('@/lib/email/sendgrid');

    const step1 = passwordSetupLink
      ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;">
           <h3 style="margin-top:0;color:#166534;">Step 1 — Set Your Password</h3>
           <p style="margin-bottom:16px;">Your student account is ready. Set your password to access your dashboard and coursework:</p>
           <p style="text-align:center;margin:16px 0;">
             <a href="${passwordSetupLink}" style="display:inline-block;background:#16a34a;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">Set Password &amp; Log In →</a>
           </p>
           <p style="color:#64748b;font-size:12px;margin:0;">Link expires in 24 hours. Log in at <a href="${siteUrl}/login">${siteUrl}/login</a></p>
         </div>`
      : `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;">
           <h3 style="margin-top:0;color:#166534;">Step 1 — Log In to Your Dashboard</h3>
           <p style="text-align:center;margin:16px 0;">
             <a href="${dashboardUrl}" style="display:inline-block;background:#16a34a;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">Go to Student Dashboard →</a>
           </p>
         </div>`;

    await sendEmail({
      to: studentEmail,
      subject: "You're Approved — Start Your Onboarding | Barber Apprenticeship",
      html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <div style="background:#1e293b;padding:24px 32px;border-radius:8px 8px 0 0;">
    <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">Elevate for Humanity</p>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Barber Apprenticeship Program</p>
  </div>
  <div style="padding:32px;background:#ffffff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
    <h1 style="margin:0 0 8px;font-size:24px;color:#0f172a;">Congratulations, ${firstName}! You're approved.</h1>
    <p style="color:#475569;margin:0 0 24px;">Your Barber Apprenticeship enrollment is confirmed.</p>

    ${step1}

    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin-top:0;color:#92400e;">Step 2 — Complete Onboarding (10 minutes)</h3>
      <p style="margin-bottom:16px;">Unlocks your coursework and training schedule.</p>
      <p style="text-align:center;margin:16px 0;">
        <a href="${onboardingUrl}" style="display:inline-block;background:#d97706;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">Start Onboarding →</a>
      </p>
    </div>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin-top:0;color:#1e40af;">Step 3 — Start Your Coursework</h3>
      <p style="margin-bottom:12px;">Your related instruction is in the <strong>Elevate LMS</strong> — lessons, quizzes, and checkpoints are all in your student portal.</p>
      <p style="text-align:center;margin:16px 0;">
        <a href="${lmsUrl}" style="display:inline-block;background:#2563eb;color:white;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">Go to My Courses →</a>
      </p>
    </div>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">
      <h3 style="margin-top:0;color:#0f172a;font-size:15px;">Next Steps</h3>
      <ol style="margin:0;padding-left:20px;color:#374151;font-size:14px;">
        <li style="margin-bottom:8px;">Log in to your student dashboard</li>
        <li style="margin-bottom:8px;">Complete the 10-minute onboarding module</li>
        <li style="margin-bottom:8px;">Begin your coursework in the Elevate LMS</li>
        <li style="margin-bottom:0;">Your advisor will contact you within 1–2 business days to confirm your host shop and start date</li>
      </ol>
    </div>

    <p style="color:#475569;font-size:14px;">Questions? Call <a href="tel:3173143757" style="color:#ea580c;font-weight:bold;">317-314-3757</a> or email <a href="mailto:info@elevateforhumanity.org" style="color:#ea580c;">info@elevateforhumanity.org</a></p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Elevate for Humanity Career &amp; Technical Institute<br />8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240</p>
  </div>
</div>`,
    });
    logger.info('[post-approval] Barber approval email sent', { to: studentEmail });
  } catch (err) {
    logger.error('[post-approval] Barber approval email failed (non-fatal)', err);
  }
}

async function sendGenericApprovalEmail({
  studentEmail,
  firstName,
  passwordSetupLink,
  onboardingUrl,
  dashboardUrl,
  siteUrl,
}: {
  studentEmail: string;
  firstName: string;
  passwordSetupLink: string | null;
  onboardingUrl: string;
  dashboardUrl: string;
  siteUrl: string;
}) {
  try {
    const { sendEmail } = await import('@/lib/email/sendgrid');

    // Primary CTA: set password for new users, go to dashboard for existing users
    const primaryUrl = passwordSetupLink ?? `${siteUrl}/login?redirect=/onboarding/learner`;
    const primaryLabel = passwordSetupLink
      ? 'Create My Account &amp; Start Onboarding →'
      : 'Go to My Onboarding →';
    const primaryColor = passwordSetupLink ? '#16a34a' : '#2563eb';

    await sendEmail({
      to: studentEmail,
      subject: `You're Approved — Start Your Onboarding | Elevate for Humanity`,
      html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">

  <!-- Header -->
  <div style="background:#1e293b;padding:24px 32px;border-radius:8px 8px 0 0;">
    <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">Elevate for Humanity</p>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Career &amp; Technical Institute</p>
  </div>

  <div style="padding:32px;background:#ffffff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">

    <!-- Headline -->
    <h1 style="margin:0 0 8px;font-size:26px;color:#0f172a;">🎉 Congratulations, ${firstName}!</h1>
    <p style="color:#475569;font-size:16px;margin:0 0 28px;">Your application has been <strong style="color:#16a34a;">approved</strong>. Your enrollment is confirmed — follow the steps below to get started.</p>

    <!-- Primary CTA -->
    <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:10px;padding:24px;margin:0 0 24px;text-align:center;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.05em;">Step 1 — Do This First</p>
      <h2 style="margin:0 0 12px;font-size:20px;color:#14532d;">${passwordSetupLink ? 'Create Your Account' : 'Log In &amp; Start Onboarding'}</h2>
      <p style="margin:0 0 20px;color:#166534;font-size:14px;">${passwordSetupLink ? 'Set your password to activate your student account. Takes less than 2 minutes.' : 'Log in to your student account and complete your onboarding steps.'}</p>
      <a href="${primaryUrl}" style="display:inline-block;background:${primaryColor};color:white;padding:16px 36px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">${primaryLabel}</a>
      ${passwordSetupLink ? `<p style="margin:12px 0 0;color:#6b7280;font-size:12px;">Link expires in 24 hours. After setting your password you can always log in at <a href="${siteUrl}/login" style="color:#2563eb;">${siteUrl}/login</a></p>` : ''}
    </div>

    <!-- Onboarding steps -->
    <h3 style="margin:0 0 16px;font-size:16px;color:#0f172a;">Your onboarding checklist</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:12px 16px;border:1px solid #e2e8f0;border-radius:8px;vertical-align:top;background:#f8fafc;">
          <p style="margin:0 0 4px;font-weight:700;color:#0f172a;font-size:14px;">📋 Complete your profile</p>
          <p style="margin:0;color:#64748b;font-size:13px;">Confirm your contact info, emergency contact, and program details.</p>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;border:1px solid #e2e8f0;border-radius:8px;vertical-align:top;background:#f8fafc;">
          <p style="margin:0 0 4px;font-weight:700;color:#0f172a;font-size:14px;">🪪 Upload your ID</p>
          <p style="margin:0;color:#64748b;font-size:13px;">Upload a government-issued photo ID and proof of residence. Required before courses unlock.</p>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;border:1px solid #e2e8f0;border-radius:8px;vertical-align:top;background:#f8fafc;">
          <p style="margin:0 0 4px;font-weight:700;color:#0f172a;font-size:14px;">✍️ Sign your enrollment agreement</p>
          <p style="margin:0;color:#64748b;font-size:13px;">Review and sign your enrollment agreement and student handbook acknowledgment.</p>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;border:1px solid #e2e8f0;border-radius:8px;vertical-align:top;background:#f8fafc;">
          <p style="margin:0 0 4px;font-weight:700;color:#0f172a;font-size:14px;">🎓 Complete orientation (10 min)</p>
          <p style="margin:0;color:#64748b;font-size:13px;">A short module covering program expectations, your schedule, and what to expect on day one.</p>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;border:1px solid #e2e8f0;border-radius:8px;vertical-align:top;background:#eff6ff;">
          <p style="margin:0 0 4px;font-weight:700;color:#1e40af;font-size:14px;">📚 Start your courses</p>
          <p style="margin:0;color:#3730a3;font-size:13px;">Once onboarding is complete your courses unlock automatically in your student dashboard.</p>
        </td>
      </tr>
    </table>

    <!-- Secondary CTA -->
    <div style="text-align:center;margin:28px 0 0;">
      <a href="${onboardingUrl}" style="display:inline-block;background:#d97706;color:white;padding:13px 30px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;">Go to My Onboarding Page →</a>
    </div>

    <!-- Contact -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:28px 0 0;">
      <p style="margin:0 0 6px;font-weight:700;font-size:14px;color:#0f172a;">Need help?</p>
      <p style="margin:0;color:#475569;font-size:13px;">
        Call us: <a href="tel:3173143757" style="color:#ea580c;font-weight:bold;">317-314-3757</a> &nbsp;|&nbsp;
        Email: <a href="mailto:info@elevateforhumanity.org" style="color:#ea580c;">info@elevateforhumanity.org</a> &nbsp;|&nbsp;
        <a href="${siteUrl}/booking" style="color:#2563eb;">Schedule a meeting</a>
      </p>
    </div>

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Elevate for Humanity Career &amp; Technical Institute<br />8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240</p>
  </div>
</div>`,
    });
    logger.info('[post-approval] Approval + onboarding email sent', { to: studentEmail });
  } catch (err) {
    logger.error('[post-approval] Approval email failed (non-fatal)', err);
  }
}
