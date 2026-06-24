import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';

// Command handlers
const COMMAND_HANDLERS: Record<string, () => Promise<string>> = {
  'Show system health': async () => {
    return JSON.stringify({
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    }, null, 2);
  },

  'List recent deployments': async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from('deployments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    return JSON.stringify(data || [], null, 2);
  },

  'Check database status': async () => {
    const supabase = await createClient();
    const [{ count: users }, { count: courses }, { count: enrollments }] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }),
    ]);
    return JSON.stringify({
      users: users || 0,
      courses: courses || 0,
      enrollments: enrollments || 0,
      status: 'connected',
    }, null, 2);
  },

  'View error logs': async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    return JSON.stringify(data || [], null, 2);
  },
};

export async function POST(request: NextRequest) {
  try {
    // Auth check
    await requireRole('operator');

    const { command } = await request.json();

    if (!command) {
      return NextResponse.json({ error: 'Command required' }, { status: 400 });
    }

    // Log command to audit
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('audit_log').insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        action: 'command_execute',
        resource: 'command_center',
        details: JSON.stringify({ command }),
        created_at: new Date().toISOString(),
      });
    }

    // Execute command
    let output: string;
    if (COMMAND_HANDLERS[command]) {
      output = await COMMAND_HANDLERS[command]();
    } else {
      // Fallback: treat as AI query
      output = `Command "${command}" received. This would be processed by AI assistant.`;
    }

    return NextResponse.json({ output, command });

  } catch (error) {
    console.error('Command execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute command' },
      { status: 500 }
    );
  }
}
