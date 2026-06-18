// Fixed inquiry route - uses applications table with service role key directly
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || !body.email) {
      return new Response(JSON.stringify({ error: 'Name and email are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create Supabase client with service role key directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const nameParts = body.name.trim().split(' ');
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || 'Inquiry';
    const programId = body.program || body.program_interest || 'general-inquiry';

    // Insert directly to applications table
    const insertData = {
      first_name: firstName,
      last_name: lastName,
      email: body.email.toLowerCase(),
      phone: body.phone || '',
      city: body.city || 'Not provided',
      zip: body.zip || '00000',
      program_interest: programId,
      status: 'submitted',
      source: 'inquiry_form',
      contact_preference: body.contactPreference || 'email',
    };

    const { data, error } = await supabase
      .from('applications')
      .insert(insertData)
      .select('id, email')
      .single();

    if (error) {
      console.error('Inquiry insert error:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to save inquiry',
        details: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      id: data.id,
      email: data.email,
      program: programId,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Inquiry error:', error);
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const POST = _POST;
