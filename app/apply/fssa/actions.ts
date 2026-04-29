'use server';

import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export interface FssaApplicationData {
  // Personal
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  // Address
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  // Benefits
  receivesSnap: boolean;
  receivesTanf: boolean;
  snapCaseNumber: string;
  tanfCaseNumber: string;
  // Case manager
  hasCaseManager: boolean;
  caseManagerName: string;
  caseManagerAgency: string;
  caseManagerPhone: string;
  caseManagerEmail: string;
  // Program
  programInterest: string;
  educationLevel: string;
  employed: boolean;
  employerName: string;
  // Barriers
  transportation: string;
  childcare: boolean;
  housingStable: boolean;
  additionalBarriers: string;
  // Consent
  consentTruth: boolean;
  consentContact: boolean;
  consentRelease: boolean;
  signature: string;
}

export async function submitFssaApplication(
  data: FssaApplicationData,
): Promise<{ success: boolean; error?: string; applicationId?: string }> {
  try {
    const supabase = await requireAdminClient();

    const { data: inserted, error } = await supabase
      .from('applications')
      .insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        date_of_birth: data.dateOfBirth || null,
        street_address: data.streetAddress,
        city: data.city,
        state: data.state || 'IN',
        zip_code: data.zipCode,
        program_interest: data.programInterest,
        funding_source: 'fssa_impact',
        application_type: 'fssa',
        status: 'pending_review',
        metadata: {
          receivesSnap: data.receivesSnap,
          receivesTanf: data.receivesTanf,
          snapCaseNumber: data.snapCaseNumber,
          tanfCaseNumber: data.tanfCaseNumber,
          hasCaseManager: data.hasCaseManager,
          caseManagerName: data.caseManagerName,
          caseManagerAgency: data.caseManagerAgency,
          caseManagerPhone: data.caseManagerPhone,
          caseManagerEmail: data.caseManagerEmail,
          educationLevel: data.educationLevel,
          employed: data.employed,
          employerName: data.employerName,
          transportation: data.transportation,
          childcare: data.childcare,
          housingStable: data.housingStable,
          additionalBarriers: data.additionalBarriers,
          signature: data.signature,
          submittedAt: new Date().toISOString(),
        },
      })
      .select('id')
      .single();

    if (error) {
      console.error('[fssa-apply] DB error:', error.message);
      return { success: false, error: 'Submission failed. Please try again or call us.' };
    }

    // Notify admin
    await sendEmail({
      to: 'admin@elevateforhumanity.org',
      subject: `New FSSA IMPACT Application — ${data.firstName} ${data.lastName}`,
      text: `
New FSSA IMPACT application received.

Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
Phone: ${data.phone}
Program: ${data.programInterest}
SNAP: ${data.receivesSnap ? 'Yes' : 'No'} ${data.snapCaseNumber ? `(Case: ${data.snapCaseNumber})` : ''}
TANF: ${data.receivesTanf ? 'Yes' : 'No'} ${data.tanfCaseNumber ? `(Case: ${data.tanfCaseNumber})` : ''}
Case Manager: ${data.hasCaseManager ? `${data.caseManagerName} — ${data.caseManagerAgency}` : 'None listed'}

Review at: https://www.elevateforhumanity.org/admin/applications
      `.trim(),
    }).catch(() => {}); // non-blocking

    return { success: true, applicationId: inserted.id };
  } catch (err) {
    console.error('[fssa-apply] Unexpected error:', err);
    return { success: false, error: 'An unexpected error occurred. Please call us at (317) 559-4999.' };
  }
}
