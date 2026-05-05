/**
 * /api/devstudio/execute
 *
 * SSE endpoint. Accepts a plain-English command, uses GPT-4.1 tool-calling to
 * map it to an action, then streams progress back line-by-line.
 *
 * Supported actions:
 *   generate_course         → POST /api/admin/courses/generate
 *   generate_video          → POST /api/video/generate
 *   run_report              → GET  /api/admin/reports/:type
 *   get_analytics           → GET  /api/admin/analytics
 *   list_applications       → GET  /api/admin/applications
 *   approve_application     → POST /api/admin/applications/:id/approve
 *   list_students           → GET  /api/admin/students
 *   list_enrollments        → GET  /api/admin/enrollments
 *   enroll_student          → POST /api/admin/enrollments
 *   issue_certificate       → POST /api/admin/certificates/bulk
 *   list_cohorts            → GET  /api/admin/cohorts
 *   list_wioa               → GET  /api/admin/wioa
 *   run_export              → GET  /api/admin/export/:type
 *   list_programs           → GET  /api/admin/programs
 *   flag_at_risk            → POST /api/admin/at-risk/flag
 *   send_reminder           → POST /api/admin/send-reminder
 *   list_payout_queue       → GET  /api/admin/enrollments/payout-queue
 *   mark_payout_paid        → POST /api/admin/enrollments/mark-payout-paid
 *   upload_document         → POST /api/documents/upload  (multipart)
 *   send_document_for_sign  → POST /api/admin/sign-documents/send
 *   send_test_email         → POST /api/admin/test-email
 *   check_system_health     → GET  /api/admin/webhook-health
 *   ask_question            → answered directly by the AI (no action)
 */

import { NextRequest } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { hydrateProcessEnv } from '@/lib/secrets';
import { safeError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { isGroqConfigured, getGroqClient } from '@/lib/groq-client';
import { isGeminiConfigured } from '@/lib/gemini-client';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// ── AI provider — Groq first (free), Gemini fallback (free) ────────────────
async function callAI(systemPrompt: string, userPrompt: string, tools?: unknown[]): Promise<{ content: string | null; toolCalls?: unknown[] }> {
  // Try Groq first
  if (isGroqConfigured()) {
    try {
      const groq = getGroqClient();
      const params: Parameters<typeof groq.chat.completions.create>[0] = {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      };
      if (tools && tools.length > 0) {
        (params as any).tools = tools;
        (params as any).tool_choice = 'auto';
      }
      const res = await groq.chat.completions.create(params);
      const choice = res.choices[0];
      return {
        content: choice.message.content,
        toolCalls: (choice.message as any).tool_calls,
      };
    } catch (err) {
      logger.warn('[devstudio/execute] Groq failed, trying Gemini', err);
    }
  }

  // Fallback to Gemini
  if (isGeminiConfigured()) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt,
      });
      const result = await model.generateContent(userPrompt);
      return { content: result.response.text() };
    } catch (err) {
      logger.warn('[devstudio/execute] Gemini failed', err);
    }
  }

  throw new Error('No AI provider available. Set GROQ_API_KEY or GEMINI_API_KEY.');
}

// ── Tool definitions ────────────────────────────────────────────────────────

const TOOLS: unknown[] = [
  {
    type: 'function',
    function: {
      name: 'generate_course',
      description: 'Generate a new course from a topic, blueprint, or syllabus description',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Course topic or title' },
          program_id: {
            type: 'string',
            description: 'Program UUID to attach the course to (optional)',
          },
          blueprint: {
            type: 'string',
            description: 'Blueprint ID if using an existing blueprint (optional)',
          },
        },
        required: ['topic'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_video',
      description: 'Generate a lesson video using AI (D-ID or HeyGen)',
      parameters: {
        type: 'object',
        properties: {
          script: { type: 'string', description: 'Video script or topic' },
          lesson_id: { type: 'string', description: 'Lesson ID to attach the video to (optional)' },
        },
        required: ['script'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_report',
      description: 'Run an operational report',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: [
              'daily',
              'enrollment',
              'financial',
              'leads',
              'partners',
              'users',
              'cohort-outcomes',
              'reconciliation',
            ],
            description: 'Report type',
          },
        },
        required: ['type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_analytics',
      description: 'Get platform analytics overview — enrollments, revenue, active users',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_applications',
      description: 'List recent applications with optional status filter',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'approved', 'rejected', 'all'],
            description: 'Filter by status',
          },
          limit: { type: 'number', description: 'Max results (default 20)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_students',
      description: 'List students with optional search',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Name or email search term' },
          limit: { type: 'number', description: 'Max results (default 20)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_enrollments',
      description: 'List recent enrollments',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max results (default 20)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_system_health',
      description: 'Check system and webhook health status',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_test_email',
      description: 'Send a test email to verify email configuration',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
        },
        required: ['to'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'approve_application',
      description: 'Approve a student application by application ID',
      parameters: {
        type: 'object',
        properties: {
          application_id: { type: 'string', description: 'Application UUID to approve' },
          program_id: { type: 'string', description: 'Program UUID to enroll into (optional)' },
          funding_type: {
            type: 'string',
            description: 'Funding type e.g. wioa, self_pay, employer (optional)',
          },
        },
        required: ['application_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'enroll_student',
      description: 'Enroll a student into a course or program',
      parameters: {
        type: 'object',
        properties: {
          user_id: { type: 'string', description: 'Student user UUID' },
          course_id: { type: 'string', description: 'Course UUID to enroll into' },
          program_id: { type: 'string', description: 'Program UUID (optional)' },
        },
        required: ['user_id', 'course_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'issue_certificate',
      description: 'Issue completion certificates to one or more students by enrollment ID',
      parameters: {
        type: 'object',
        properties: {
          enrollment_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of enrollment UUIDs',
          },
          template_id: { type: 'string', description: 'Certificate template UUID' },
          signed_by: { type: 'string', description: 'Name of the signing authority (optional)' },
        },
        required: ['enrollment_ids', 'template_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_cohorts',
      description: 'List cohorts with optional program filter',
      parameters: {
        type: 'object',
        properties: {
          program_id: { type: 'string', description: 'Filter by program UUID (optional)' },
          limit: { type: 'number', description: 'Max results (default 20)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_wioa',
      description: 'List WIOA cases with optional status filter',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'approved', 'denied', 'all'],
            description: 'Filter by status',
          },
          limit: { type: 'number', description: 'Max results (default 20)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_export',
      description: 'Export data as CSV — students, enrollments, or weekly hours',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['students', 'enrollments', 'weekly-hours'],
            description: 'Export type',
          },
        },
        required: ['type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_programs',
      description: 'List all programs in the catalog',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['published', 'draft', 'all'],
            description: 'Filter by status',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'flag_at_risk',
      description: 'Flag a student as at-risk with a reason',
      parameters: {
        type: 'object',
        properties: {
          user_id: { type: 'string', description: 'Student user UUID' },
          reason: { type: 'string', description: 'Reason for flagging' },
        },
        required: ['user_id', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_reminder',
      description: 'Send a reminder email to a student or group',
      parameters: {
        type: 'object',
        properties: {
          user_id: {
            type: 'string',
            description: 'Student user UUID (optional — omit to send to all inactive)',
          },
          message: { type: 'string', description: 'Custom reminder message (optional)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_payout_queue',
      description: 'List enrollments in the payout queue awaiting payment',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max results (default 20)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mark_payout_paid',
      description: 'Mark one or more enrollments as payout paid',
      parameters: {
        type: 'object',
        properties: {
          enrollment_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Enrollment UUIDs to mark paid',
          },
        },
        required: ['enrollment_ids'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_email',
      description: 'Compose and send an email to any recipient from inside the dev container',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
          subject: { type: 'string', description: 'Email subject line' },
          body: { type: 'string', description: 'Email body — plain text or HTML' },
          from_name: {
            type: 'string',
            description: 'Sender display name (optional, defaults to Elevate for Humanity)',
          },
        },
        required: ['to', 'subject', 'body'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_document_for_sign',
      description:
        'Generate and send a document (W-9, ACH, MOU, grant form) for e-signature via email',
      parameters: {
        type: 'object',
        properties: {
          document_type: {
            type: 'string',
            enum: ['w9', 'ach', 'mou', 'grant_application', 'enrollment_agreement'],
            description: 'Type of document to generate and send',
          },
          recipient_email: { type: 'string', description: 'Email address to send the document to' },
          recipient_name: { type: 'string', description: 'Full name of the recipient' },
        },
        required: ['document_type', 'recipient_email'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ask_question',
      description:
        'Answer a general question about the platform, data, or operations without running an action',
      parameters: {
        type: 'object',
        properties: {
          answer: { type: 'string', description: 'The answer to the question' },
        },
        required: ['answer'],
      },
    },
  },
];

// ── SSE helpers ─────────────────────────────────────────────────────────────

function encode(text: string) {
  return new TextEncoder().encode(`data: ${JSON.stringify({ line: text })}\n\n`);
}

function encodeDone() {
  return new TextEncoder().encode('data: [DONE]\n\n');
}

// ── Action executors ─────────────────────────────────────────────────────────

async function executeAction(
  name: string,
  args: Record<string, unknown>,
  baseUrl: string,
  authHeader: string,
  write: (line: string) => void,
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Cookie: authHeader,
  };

  switch (name) {
    case 'generate_course': {
      write('\x1b[33m⚙  Generating course...\x1b[0m');
      write(`   Topic: ${args.topic}`);
      if (args.blueprint) write(`   Blueprint: ${args.blueprint}`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/courses/generate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            topic: args.topic,
            program_id: args.program_id,
            blueprint: args.blueprint,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Course generation started\x1b[0m');
          if (data.courseId) write(`   Course ID: ${data.courseId}`);
          if (data.title) write(`   Title: ${data.title}`);
          write(`   View at: /admin/courses`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error contacting course generator\x1b[0m');
      }
      break;
    }

    case 'generate_video': {
      write('\x1b[33m⚙  Generating video...\x1b[0m');
      write(`   Script: ${String(args.script).substring(0, 80)}...`);
      try {
        const res = await fetch(`${baseUrl}/api/video/generate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ script: args.script, lesson_id: args.lesson_id }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Video generation queued\x1b[0m');
          if (data.jobId) write(`   Job ID: ${data.jobId}`);
          write(`   View at: /admin/video-manager`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'run_report': {
      const type = args.type as string;
      write(`\x1b[33m⚙  Running ${type} report...\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/reports/${type}`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write(`\x1b[32m✓  ${type} report complete\x1b[0m`);
          // Print top-level keys as summary
          for (const [k, v] of Object.entries(data)) {
            if (typeof v === 'number' || typeof v === 'string') {
              write(`   ${k}: ${v}`);
            }
          }
          write(`   Full report: /admin/reports/${type}`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'get_analytics': {
      write('\x1b[33m⚙  Fetching analytics...\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/analytics`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Analytics loaded\x1b[0m');
          for (const [k, v] of Object.entries(data)) {
            if (typeof v === 'number' || typeof v === 'string') {
              write(`   ${k}: ${v}`);
            }
          }
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'list_applications': {
      const status = (args.status as string) || 'all';
      const limit = (args.limit as number) || 20;
      write(`\x1b[33m⚙  Loading applications (${status})...\x1b[0m`);
      try {
        const url = new URL(`${baseUrl}/api/admin/applications`);
        if (status !== 'all') url.searchParams.set('status', status);
        url.searchParams.set('limit', String(limit));
        const res = await fetch(url.toString(), { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const apps = Array.isArray(data) ? data : (data.applications ?? []);
          write(`\x1b[32m✓  ${apps.length} application(s)\x1b[0m`);
          apps.slice(0, 10).forEach((a: Record<string, unknown>) => {
            write(
              `   ${a.first_name ?? ''} ${a.last_name ?? ''} — ${a.status ?? ''} — ${a.program_interest ?? ''}`,
            );
          });
          if (apps.length > 10) write(`   ... and ${apps.length - 10} more`);
          write(`   Full list: /admin/applications`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'list_students': {
      const limit = (args.limit as number) || 20;
      write('\x1b[33m⚙  Loading students...\x1b[0m');
      try {
        const url = new URL(`${baseUrl}/api/admin/students`);
        if (args.search) url.searchParams.set('search', args.search as string);
        url.searchParams.set('limit', String(limit));
        const res = await fetch(url.toString(), { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const students = Array.isArray(data) ? data : (data.students ?? []);
          write(`\x1b[32m✓  ${students.length} student(s)\x1b[0m`);
          students.slice(0, 10).forEach((s: Record<string, unknown>) => {
            write(`   ${s.first_name ?? ''} ${s.last_name ?? ''} — ${s.email ?? ''}`);
          });
          if (students.length > 10) write(`   ... and ${students.length - 10} more`);
          write(`   Full list: /admin/students`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'list_enrollments': {
      const limit = (args.limit as number) || 20;
      write('\x1b[33m⚙  Loading enrollments...\x1b[0m');
      try {
        const url = new URL(`${baseUrl}/api/admin/enrollments`);
        url.searchParams.set('limit', String(limit));
        const res = await fetch(url.toString(), { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const enrollments = Array.isArray(data) ? data : (data.enrollments ?? []);
          write(`\x1b[32m✓  ${enrollments.length} enrollment(s)\x1b[0m`);
          enrollments.slice(0, 10).forEach((e: Record<string, unknown>) => {
            write(
              `   ${e.student_name ?? e.user_id ?? ''} — ${e.program_name ?? e.program_id ?? ''} — ${e.status ?? ''}`,
            );
          });
          if (enrollments.length > 10) write(`   ... and ${enrollments.length - 10} more`);
          write(`   Full list: /admin/enrollments`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'check_system_health': {
      write('\x1b[33m⚙  Checking system health...\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/webhook-health`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Health check complete\x1b[0m');
          for (const [k, v] of Object.entries(data)) {
            if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
              const icon =
                v === true || v === 'ok' || v === 'healthy'
                  ? '\x1b[32m✓\x1b[0m'
                  : '\x1b[33m⚠\x1b[0m';
              write(`   ${icon} ${k}: ${v}`);
            }
          }
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'send_test_email': {
      write(`\x1b[33m⚙  Sending test email to ${args.to}...\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/test-email`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ to: args.to }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Test email sent\x1b[0m');
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'approve_application': {
      write(`\x1b[33m⚙  Approving application ${args.application_id}...\x1b[0m`);
      try {
        const res = await fetch(
          `${baseUrl}/api/admin/applications/${args.application_id}/approve`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ program_id: args.program_id, funding_type: args.funding_type }),
          },
        );
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Application approved\x1b[0m');
          if (data.enrollmentId) write(`   Enrollment ID: ${data.enrollmentId}`);
          write(`   View at: /admin/applications`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'enroll_student': {
      write(`\x1b[33m⚙  Enrolling student ${args.user_id} into course ${args.course_id}...\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/enrollments`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            user_id: args.user_id,
            course_id: args.course_id,
            program_id: args.program_id,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Student enrolled\x1b[0m');
          if (data.data?.id) write(`   Enrollment ID: ${data.data.id}`);
          write(`   View at: /admin/enrollments`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'issue_certificate': {
      const ids = args.enrollment_ids as string[];
      write(`\x1b[33m⚙  Issuing certificates for ${ids.length} enrollment(s)...\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/certificates/bulk`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            enrollmentIds: ids,
            templateId: args.template_id,
            issueDate: new Date().toISOString().split('T')[0],
            signedBy: args.signed_by || 'Elevate for Humanity',
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Certificates issued\x1b[0m');
          if (data.issued !== undefined) write(`   Issued: ${data.issued}`);
          if (data.failed !== undefined) write(`   Failed: ${data.failed}`);
          write(`   View at: /admin/certificates`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'list_cohorts': {
      const limit = (args.limit as number) || 20;
      write('\x1b[33m⚙  Loading cohorts...\x1b[0m');
      try {
        const url = new URL(`${baseUrl}/api/admin/cohorts`);
        if (args.program_id) url.searchParams.set('program_id', args.program_id as string);
        url.searchParams.set('limit', String(limit));
        const res = await fetch(url.toString(), { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const cohorts = Array.isArray(data) ? data : (data.cohorts ?? []);
          write(`\x1b[32m✓  ${cohorts.length} cohort(s)\x1b[0m`);
          cohorts.slice(0, 10).forEach((c: Record<string, unknown>) => {
            write(`   ${c.name ?? c.id} — ${c.status ?? ''} — starts: ${c.start_date ?? 'TBD'}`);
          });
          write(`   Full list: /admin/cohorts`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'list_wioa': {
      const status = (args.status as string) || 'all';
      const limit = (args.limit as number) || 20;
      write(`\x1b[33m⚙  Loading WIOA cases (${status})...\x1b[0m`);
      try {
        const url = new URL(`${baseUrl}/api/admin/wioa`);
        if (status !== 'all') url.searchParams.set('status', status);
        url.searchParams.set('limit', String(limit));
        const res = await fetch(url.toString(), { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const cases = Array.isArray(data) ? data : (data.cases ?? data.data ?? []);
          write(`\x1b[32m✓  ${cases.length} WIOA case(s)\x1b[0m`);
          cases.slice(0, 10).forEach((c: Record<string, unknown>) => {
            write(`   ${c.full_name ?? c.user_id ?? ''} — ${c.status ?? ''} — ${c.program ?? ''}`);
          });
          write(`   Full list: /admin/wioa`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'run_export': {
      const type = args.type as string;
      write(`\x1b[33m⚙  Exporting ${type}...\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/export/${type}`, { headers });
        if (res.ok) {
          const contentDisposition = res.headers.get('content-disposition') || '';
          const filename = contentDisposition.match(/filename="?([^"]+)"?/)?.[1] || `${type}.csv`;
          write(`\x1b[32m✓  Export ready: ${filename}\x1b[0m`);
          write(`   Download at: /admin/students/export (${type})`);
        } else {
          const data = await res.json().catch(() => ({}));
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'list_programs': {
      const status = (args.status as string) || 'all';
      write('\x1b[33m⚙  Loading programs...\x1b[0m');
      try {
        const url = new URL(`${baseUrl}/api/admin/programs`);
        if (status !== 'all') url.searchParams.set('status', status);
        const res = await fetch(url.toString(), { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const programs = Array.isArray(data) ? data : (data.programs ?? data.data ?? []);
          write(`\x1b[32m✓  ${programs.length} program(s)\x1b[0m`);
          programs.slice(0, 15).forEach((p: Record<string, unknown>) => {
            write(`   ${p.title ?? p.name ?? p.id} — ${p.status ?? ''}`);
          });
          write(`   Full list: /admin/programs`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'flag_at_risk': {
      write(`\x1b[33m⚙  Flagging student ${args.user_id} as at-risk...\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/at-risk/flag`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ user_id: args.user_id, reason: args.reason }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Student flagged as at-risk\x1b[0m');
          write(`   View at: /admin/at-risk`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'send_reminder': {
      write('\x1b[33m⚙  Sending reminder...\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/send-reminder`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ user_id: args.user_id, message: args.message }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Reminder sent\x1b[0m');
          if (data.sent) write(`   Sent to: ${data.sent} recipient(s)`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'list_payout_queue': {
      const limit = (args.limit as number) || 20;
      write('\x1b[33m⚙  Loading payout queue...\x1b[0m');
      try {
        const url = new URL(`${baseUrl}/api/admin/enrollments/payout-queue`);
        url.searchParams.set('limit', String(limit));
        const res = await fetch(url.toString(), { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const queue = Array.isArray(data) ? data : (data.queue ?? data.data ?? []);
          write(`\x1b[32m✓  ${queue.length} payout(s) pending\x1b[0m`);
          queue.slice(0, 10).forEach((p: Record<string, unknown>) => {
            write(
              `   ${p.student_name ?? p.user_id ?? ''} — $${p.amount ?? '?'} — ${p.program_name ?? ''}`,
            );
          });
          write(`   Full queue: /admin/payout-queue`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'mark_payout_paid': {
      const ids = args.enrollment_ids as string[];
      write(`\x1b[33m⚙  Marking ${ids.length} payout(s) as paid...\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/enrollments/mark-payout-paid`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ enrollmentIds: ids }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Payouts marked as paid\x1b[0m');
          if (data.updated) write(`   Updated: ${data.updated}`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'send_email': {
      write(`\x1b[33m⚙  Sending email to ${args.to}...\x1b[0m`);
      write(`   Subject: ${args.subject}`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/send-email`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            to: args.to,
            subject: args.subject,
            html: String(args.body).includes('<')
              ? args.body
              : `<p>${String(args.body).replace(/\n/g, '<br/>')}</p>`,
            fromName: args.from_name || 'Elevate for Humanity',
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write(`\x1b[32m✓  Email sent to ${args.to}\x1b[0m`);
          if (data.messageId) write(`   Message ID: ${data.messageId}`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'send_document_for_sign': {
      write(`\x1b[33m⚙  Generating ${args.document_type} for ${args.recipient_email}...\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/sign-documents/send`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            documentType: args.document_type,
            recipientEmail: args.recipient_email,
            recipientName: args.recipient_name,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write(
            `\x1b[32m✓  ${args.document_type?.toString().toUpperCase()} generated and sent\x1b[0m`,
          );
          write(`   Sent to: ${args.recipient_email}`);
          if (data.messageId) write(`   Message ID: ${data.messageId}`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'ask_question': {
      write('\x1b[32m✓  \x1b[0m' + String(args.answer));
      break;
    }

    default:
      write(`\x1b[31m✗  Unknown action: ${name}\x1b[0m`);
  }
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  // Hydrate app_secrets so executed commands have full secret access
  await hydrateProcessEnv();

  const { command, history = [] } = await req.json();
  if (!command?.trim()) {
    return new Response('data: [DONE]\n\n', {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const cookieHeader = req.headers.get('cookie') || '';

  const stream = new ReadableStream({
    async start(controller) {
      const write = (line: string) => {
        try {
          controller.enqueue(encode(line));
        } catch {
          /* stream closed */
        }
      };

      try {
        write(`\x1b[90m$ ${command}\x1b[0m`);
        write('');

        const systemPrompt = `You are the Elevate for Humanity admin command assistant.
The admin speaks to you in plain English and you execute the right action.
Always use a tool — never respond with plain text unless using ask_question.
Be decisive. If the intent is clear, act. If ambiguous, use ask_question to clarify.`;

        const userPrompt = [...history.map((m: { role: string; content: string }) =>
          `${m.role}: ${m.content}`
        ), `user: ${command}`].join('\n');

        const aiResponse = await callAI(systemPrompt, userPrompt, TOOLS);

        const msg = {
          content: aiResponse.content,
          tool_calls: aiResponse.toolCalls,
        };

        if (msg.tool_calls?.length) {
          for (const call of msg.tool_calls as { function: { name: string; arguments: string } }[]) {
            const args = JSON.parse(call.function.arguments || '{}');
            await executeAction(call.function.name, args, baseUrl, cookieHeader, write);
            write('');
          }
        } else if (msg.content) {
          write(msg.content);
        }

        write('\x1b[90m─────────────────────────────────────\x1b[0m');
      } catch (err) {
        logger.error('[devstudio/execute]', err);
        // Write a safe message to the terminal — never expose raw error details
        write('\x1b[31m✗  An error occurred. Check server logs for details.\x1b[0m');
      } finally {
        try {
          controller.enqueue(encodeDone());
        } catch {
          /* already closed */
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store',
      Connection: 'keep-alive',
    },
  });
}
