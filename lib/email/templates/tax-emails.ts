/**
 * Tax Services Email Templates
 * PART A: Rise Up Foundation (FREE - VITA Compliant)
 * PART B: SupersonicFastCash (PAID)
 *
 * CRITICAL: These must remain completely separated for IRS compliance
 */

// ============================================================================
// PART A: RISE UP FOUNDATION (FREE TAX - VITA)
// ============================================================================

export const riseUpFoundationEmails = {
  /**
   * EMAIL 1: Free Tax Intake Received
   */
  intakeReceived: {
    from: 'noreply@riseupfoundation.org',
    subject: 'Free tax appointment request received',
    getHtml: (data: { firstName: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hello ${data.firstName},</p>

        <p>We've received your request for free tax preparation services through the Rise Up Foundation.</p>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #e5e7eb;">
          <p style="margin: 0;"><strong>What happens next:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Eligibility review</li>
            <li>Appointment scheduling</li>
            <li>Document verification</li>
          </ul>
        </div>

        <p><strong>There is no cost for services provided through this program.</strong><br />
        No paid services are offered.</p>

        <p>You'll receive a follow-up shortly with scheduling details.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>Rise Up Foundation</strong><br />
          Free Community Tax Services
        </p>
      </div>
    `,
    getText: (data: { firstName: string }) => `
Hello ${data.firstName},

We've received your request for free tax preparation services through the Rise Up Foundation.

What happens next:
• Eligibility review
• Appointment scheduling
• Document verification

There is no cost for services provided through this program.
No paid services are offered.

You'll receive a follow-up shortly with scheduling details.

—
Rise Up Foundation
Free Community Tax Services
    `,
  },

  /**
   * EMAIL 2: Free Tax Appointment Confirmed
   */
  appointmentConfirmed: {
    from: 'noreply@riseupfoundation.org',
    subject: 'Your free tax appointment is scheduled',
    getHtml: (data: { firstName: string; date: string; time: string; location: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hello ${data.firstName},</p>

        <p>Your free tax appointment is confirmed.</p>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #e5e7eb;">
          <p style="margin: 0;">📅 <strong>Date:</strong> ${data.date}</p>
          <p style="margin: 10px 0;">⏰ <strong>Time:</strong> ${data.time}</p>
          <p style="margin: 10px 0;">📍 <strong>Location / Virtual:</strong> ${data.location}</p>
        </div>

        <p><strong>Please bring or upload the following:</strong></p>
        <ul>
          <li>Government-issued ID</li>
          <li>Social Security card or ITIN</li>
          <li>W-2 / 1099 forms</li>
          <li>Last year's return (if available)</li>
        </ul>

        <p style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 10px; border-radius: 4px; font-size: 14px;">
          <strong>Note:</strong> All services are provided by trained volunteers following IRS VITA/TCE guidelines.
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>Rise Up Foundation</strong>
        </p>
      </div>
    `,
    getText: (data: { firstName: string; date: string; time: string; location: string }) => `
Hello ${data.firstName},

Your free tax appointment is confirmed.

📅 Date: ${data.date}
⏰ Time: ${data.time}
📍 Location / Virtual: ${data.location}

Please bring or upload the following:
• Government-issued ID
• Social Security card or ITIN
• W-2 / 1099 forms
• Last year's return (if available)

All services are provided by trained volunteers following IRS VITA/TCE guidelines.

—
Rise Up Foundation
    `,
  },

  /**
   * EMAIL 3: Free Tax Return Completed
   */
  returnCompleted: {
    from: 'noreply@riseupfoundation.org',
    subject: 'Your tax return has been completed',
    getHtml: (data: { firstName: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hello ${data.firstName},</p>

        <p>Your tax return has been completed and submitted.</p>

        <p>You'll receive copies of your return and confirmation details during or after your appointment.</p>

        <p>Thank you for allowing us to support you.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>Rise Up Foundation</strong>
        </p>
      </div>
    `,
    getText: (data: { firstName: string }) => `
Hello ${data.firstName},

Your tax return has been completed and submitted.

You'll receive copies of your return and confirmation details during or after your appointment.

Thank you for allowing us to support you.

—
Rise Up Foundation
    `,
  },
};

// ============================================================================