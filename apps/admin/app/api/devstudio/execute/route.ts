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
 *   build_courses           → POST /api/autopilots/build-courses
 *   deploy_autopilot        → POST /api/autopilots/deploy
 *   run_tests               → POST /api/autopilots/run-tests
 *   manage_app_trial        → POST /api/apps/trial/start|status or /api/apps/upgrade
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
import { getAdminUrl } from '@/lib/utils/siteUrl';

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
  {
    type: 'function',
    function: {
      name: 'build_courses',
      description: 'Build and push course content files to the GitHub repository via the autopilot system',
      parameters: {
        type: 'object',
        properties: {
          course_id: { type: 'string', description: 'Optional course ID to build a specific course. Omit to build all.' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deploy_autopilot',
      description: 'Trigger an autopilot deployment — prepares build artifacts and initiates ECS deploy',
      parameters: {
        type: 'object',
        properties: {
          service: { type: 'string', enum: ['lms', 'admin', 'both'], description: 'Which service to deploy' },
        },
        required: ['service'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_tests',
      description: 'Run autopilot test suite — scans course metadata and validates structure',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'manage_app_trial',
      description: 'Start, check status of, or upgrade an app trial subscription for a user',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['start', 'status', 'upgrade'], description: 'What to do with the trial' },
          user_id: { type: 'string', description: 'User ID to manage trial for' },
          app_id: { type: 'string', description: 'App ID (e.g. sam-gov, grants, website-builder)' },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_at_risk',
      description: 'List at-risk learners who have not been active recently',
      parameters: { type: 'object', properties: { limit: { type: 'number' } }, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_completions',
      description: 'List recent program/course completions',
      parameters: { type: 'object', properties: { limit: { type: 'number' } }, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'export_catalog',
      description: 'Export the full program catalog as a downloadable file',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_monitoring',
      description: 'Check platform monitoring status, uptime, memory, and recent errors',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_users',
      description: 'List platform users with optional search by name or email',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Name or email search term' },
          limit: { type: 'number' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_user_role',
      description: 'Update a user\'s role (student, staff, admin, super_admin, instructor)',
      parameters: {
        type: 'object',
        properties: {
          user_id: { type: 'string', description: 'User UUID' },
          role: { type: 'string', enum: ['student', 'staff', 'admin', 'super_admin', 'instructor'] },
        },
        required: ['user_id', 'role'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_bulk_email',
      description: 'Send a bulk email to students or all users',
      parameters: {
        type: 'object',
        properties: {
          subject: { type: 'string' },
          body: { type: 'string' },
          audience: { type: 'string', enum: ['all', 'students', 'active', 'inactive'], description: 'Who to send to' },
        },
        required: ['subject', 'body'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_wioa_export',
      description: 'Run the WIOA PIRL data export',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_backup',
      description: 'Trigger a platform data backup',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_automation',
      description: 'Trigger a named automation workflow',
      parameters: {
        type: 'object',
        properties: {
          automation_id: { type: 'string', description: 'Automation ID or name to run' },
        },
        required: ['automation_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_shops',
      description: 'List barber/cosmetology shops in the system',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_promo_codes',
      description: 'List active promo codes and discount codes',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_social_campaigns',
      description: 'List social media campaigns',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'export_audit_log',
      description: 'Export the admin audit log',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'smoke_test',
      description: 'Run a full platform smoke test — checks all critical endpoints, DB, storage, AI providers, env vars, and ECS services. Use when asked to smoke test, health check, or verify the platform is working.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_payroll',
      description: 'Create and run a payroll run for a pay period. Use when asked to run payroll, process payroll, or pay staff.',
      parameters: {
        type: 'object',
        properties: {
          pay_period_start: { type: 'string', description: 'Start date YYYY-MM-DD' },
          pay_period_end:   { type: 'string', description: 'End date YYYY-MM-DD' },
          pay_date:         { type: 'string', description: 'Pay date YYYY-MM-DD' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'export_payroll',
      description: 'Export payroll data as a downloadable file.',
      parameters: {
        type: 'object',
        properties: {
          run_id: { type: 'string', description: 'Specific payroll run ID to export (optional)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_reports',
      description: 'Run a platform report. Types: overall, program, site, funder, dol, activity, wioa, outcomes, participants, rapids, grants, compliance, enrollment.',
      parameters: {
        type: 'object',
        properties: {
          report_type: {
            type: 'string',
            enum: ['overall','program','site','funder','dol','activity','wioa','outcomes','participants','rapids','grants','compliance','enrollment'],
            description: 'Which report to run',
          },
        },
        required: ['report_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'repo_commits',
      description: 'Fetch recent commits from the GitHub repository. Can filter by file path or date. Use when asked about recent changes, what changed, commit history, or signing code commits.',
      parameters: {
        type: 'object',
        properties: {
          path:  { type: 'string', description: 'File or directory path to filter commits (e.g. components/SignaturePad.tsx)' },
          since: { type: 'string', description: 'ISO date to fetch commits since (e.g. 2026-05-01T00:00:00Z)' },
          limit: { type: 'number', description: 'Max commits to return (default 20, max 50)' },
        },
        required: [],
      },
    },
  },
];

// ── SSE helpers ─────────────────────────────────────────────────────────────

function encode(text: string) {
  // Key must be "text" — the frontend reads parsed.text ?? parsed.output
  return new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`);
}

function encodeDone() {
  return new TextEncoder().encode('data: [DONE]\n\n');
}

// ── Keyword-based command router (no AI required) ────────────────────────────
// Maps plain-English command strings to action names so the autopilot quick
// buttons work even when no AI provider key is configured.

const KEYWORD_MAP: Array<{ patterns: RegExp; action: string; args?: Record<string, unknown> }> = [
  { patterns: /run.*test|test.*suite|autopilot.*test/i,                    action: 'run_tests',           args: {} },
  { patterns: /health|system.*health|check.*health/i,                      action: 'check_system_health', args: {} },
  { patterns: /build.*course|course.*build/i,                              action: 'build_courses',       args: {} },
  { patterns: /deploy.*lms/i,                                              action: 'deploy_autopilot',    args: { service: 'lms' } },
  { patterns: /deploy.*admin/i,                                            action: 'deploy_autopilot',    args: { service: 'admin' } },
  { patterns: /deploy/i,                                                   action: 'deploy_autopilot',    args: { service: 'both' } },
  // Reports — keyword-matched so they work without an AI key
  { patterns: /enrollment.*report|report.*enrollment|run.*enrollment/i,    action: 'run_report',          args: { type: 'enrollment' } },
  { patterns: /financial.*report|report.*financial|run.*financial/i,       action: 'run_report',          args: { type: 'financial' } },
  { patterns: /wioa.*report|report.*wioa|run.*wioa/i,                      action: 'run_report',          args: { type: 'wioa' } },
  { patterns: /overall.*report|daily.*report|run.*overall|run.*report/i,   action: 'run_report',          args: { type: 'overall' } },
  { patterns: /payroll.*report|report.*payroll|run.*payroll/i,             action: 'run_report',          args: { type: 'payroll' } },
  // Listings
  { patterns: /list.*student|show.*student/i,                              action: 'list_students',       args: {} },
  { patterns: /list.*application|show.*application|pending.*application/i, action: 'list_applications',   args: {} },
  { patterns: /list.*enrollment|show.*enrollment/i,                        action: 'list_enrollments',    args: {} },
  { patterns: /list.*program|show.*program/i,                              action: 'list_programs',       args: {} },
  { patterns: /list.*wioa|show.*wioa|wioa.*case/i,                         action: 'list_wioa',           args: {} },
  { patterns: /list.*cohort|show.*cohort/i,                                action: 'list_cohorts',        args: {} },
  { patterns: /payout.*queue|list.*payout/i,                               action: 'list_payout_queue',   args: {} },
  { patterns: /at.?risk|flag.*risk/i,                                      action: 'flag_at_risk',        args: {} },
  { patterns: /analytics|overview/i,                                       action: 'get_analytics',       args: {} },
  { patterns: /trial.*status|check.*trial/i,                               action: 'manage_app_trial',    args: { action: 'status' } },
  { patterns: /export.*student|student.*export/i,                          action: 'run_export',          args: { type: 'students' } },
  { patterns: /export.*enrollment|enrollment.*export/i,                    action: 'run_export',          args: { type: 'enrollments' } },
  { patterns: /recent.*commit|git.*log|commit.*history/i,                  action: 'repo_commits',        args: {} },
];

function matchKeyword(command: string): { action: string; args: Record<string, unknown> } | null {
  for (const entry of KEYWORD_MAP) {
    if (entry.patterns.test(command)) {
      return { action: entry.action, args: entry.args ?? {} };
    }
  }
  return null;
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
      logger.info('[devstudio/execute] check_system_health → GET /api/admin/webhook-health');
      try {
        const res = await fetch(`${baseUrl}/api/admin/webhook-health`, { headers });
        const data = await res.json().catch(() => ({}));
        logger.info('[devstudio/execute] check_system_health response', { status: res.status });
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
          write(`\x1b[31m✗  Failed (HTTP ${res.status}): ${data.error || res.statusText}\x1b[0m`);
        }
      } catch (fetchErr) {
        const reason = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        logger.error('[devstudio/execute] check_system_health fetch error', { reason });
        write(`\x1b[31m✗  Could not reach /api/admin/webhook-health: ${reason}\x1b[0m`);
        write(`   baseUrl: ${baseUrl}`);
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

    case 'build_courses': {
      // Pre-flight: verify GITHUB_TOKEN is set before attempting the push
      if (!process.env.GITHUB_TOKEN) {
        write('\x1b[31m✗  GITHUB_TOKEN is not set\x1b[0m');
        write('');
        write('   To fix:');
        write('   1. Generate a GitHub Personal Access Token with repo + workflow scopes');
        write('      → https://github.com/settings/tokens/new');
        write('   2. Add it to AWS SSM: /elevate/GITHUB_TOKEN');
        write('   3. Redeploy the admin service to pick up the new secret');
        break;
      }
      write('⚙️  Building courses...');
      logger.info('[devstudio/execute] build_courses → POST /api/autopilots/build-courses');
      try {
        const body: Record<string, unknown> = {};
        if (args.course_id) body.course_id = args.course_id;
        const res = await fetch(`${baseUrl}/api/autopilots/build-courses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', cookie: authHeader },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        logger.info('[devstudio/execute] build_courses response', { status: res.status });
        if (!res.ok) {
          write(`\x1b[31m✗  Build failed (HTTP ${res.status}): ${data.error ?? res.statusText}\x1b[0m`);
          if (data.message) write(`   Detail: ${data.message}`);
          if (res.status === 401) {
            write('');
            write('   GITHUB_TOKEN may be expired or missing repo/workflow scopes.');
            write('   Regenerate at: https://github.com/settings/tokens/new');
            write('   Then update SSM /elevate/GITHUB_TOKEN and redeploy.');
          }
        } else {
          write(`\x1b[32m✓  Build complete\x1b[0m`);
          if (data.files_written) write(`   Files written: ${data.files_written}`);
          if (data.commit_url) write(`   Commit: ${data.commit_url}`);
        }
      } catch (fetchErr) {
        const reason = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        logger.error('[devstudio/execute] build_courses fetch error', { reason });
        write(`\x1b[31m✗  Could not reach /api/autopilots/build-courses: ${reason}\x1b[0m`);
      }
      break;
    }

    case 'deploy_autopilot': {
      const service = String(args.service ?? 'lms');
      // Pre-flight: GITHUB_TOKEN is required to trigger GitHub Actions workflows
      if (!process.env.GITHUB_TOKEN) {
        write(`\x1b[31m✗  GITHUB_TOKEN is not set — cannot trigger ${service} deploy\x1b[0m`);
        write('');
        write('   To fix:');
        write('   1. Generate a GitHub PAT with repo + workflow scopes');
        write('      → https://github.com/settings/tokens/new');
        write('   2. Add it to AWS SSM: /elevate/GITHUB_TOKEN');
        write('   3. Redeploy the admin service to pick up the new secret');
        break;
      }
      write(`🚀  Triggering ${service} deploy...`);
      logger.info('[devstudio/execute] deploy_autopilot', { service });
      try {
        const res = await fetch(`${baseUrl}/api/autopilots/deploy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', cookie: authHeader },
          body: JSON.stringify({ service }),
        });
        const data = await res.json().catch(() => ({}));
        logger.info('[devstudio/execute] deploy_autopilot response', { status: res.status });
        if (!res.ok) {
          write(`\x1b[31m✗  Deploy failed (HTTP ${res.status}): ${data.error ?? res.statusText}\x1b[0m`);
          if (data.message) write(`   Detail: ${data.message}`);
          if (res.status === 401) {
            write('');
            write('   GITHUB_TOKEN may be expired or missing workflow scope.');
            write('   Regenerate at: https://github.com/settings/tokens/new');
            write('   Then update SSM /elevate/GITHUB_TOKEN and redeploy.');
          }
        } else {
          write(`\x1b[32m✓  Deploy triggered\x1b[0m`);
          if (data.run_url) write(`   GitHub Actions: ${data.run_url}`);
          if (data.message) write(`   ${data.message}`);
        }
      } catch (fetchErr) {
        const reason = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        logger.error('[devstudio/execute] deploy_autopilot fetch error', { reason });
        write(`\x1b[31m✗  Could not reach /api/autopilots/deploy: ${reason}\x1b[0m`);
      }
      break;
    }

    case 'run_tests': {
      write('🧪  Running autopilot test suite...');
      logger.info('[devstudio/execute] run_tests → POST /api/autopilots/run-tests');
      try {
        const res = await fetch(`${baseUrl}/api/autopilots/run-tests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', cookie: authHeader },
          body: JSON.stringify({}),
        });
        const data = await res.json().catch(() => ({}));
        logger.info('[devstudio/execute] run_tests response', { status: res.status, ok: res.ok });
        if (!res.ok) {
          write(`\x1b[31m✗  Tests failed (HTTP ${res.status})\x1b[0m`);
          if (data.error)   write(`   Error: ${data.error}`);
          if (data.message) write(`   Detail: ${data.message}`);
        } else {
          const summary = data.summary ?? {};
          const passed  = summary.passed  ?? data.passed  ?? 0;
          const total   = summary.total   ?? data.total   ?? (passed + (summary.failed ?? 0));
          const rate    = summary.passRate ?? (total > 0 ? ((passed / total) * 100).toFixed(1) : '—');
          write(`\x1b[32m✓  Tests complete — ${passed}/${total} passed (${rate}%)\x1b[0m`);
          const results = data.results ?? {};
          if (results.missingMetadata?.length) {
            write(`   Missing metadata (${results.missingMetadata.length}):`);
            (results.missingMetadata as string[]).slice(0, 5).forEach((f: string) => write(`     • ${f}`));
            if (results.missingMetadata.length > 5) write(`     … and ${results.missingMetadata.length - 5} more`);
          }
          if (results.missingLessons?.length) {
            write(`   Empty lesson files (${results.missingLessons.length}):`);
            (results.missingLessons as string[]).slice(0, 5).forEach((f: string) => write(`     • ${f}`));
            if (results.missingLessons.length > 5) write(`     … and ${results.missingLessons.length - 5} more`);
          }
          if (data.message) write(`   ${data.message}`);
        }
      } catch (fetchErr) {
        const reason = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        logger.error('[devstudio/execute] run_tests fetch error', { reason });
        write(`\x1b[31m✗  Could not reach /api/autopilots/run-tests: ${reason}\x1b[0m`);
        write(`   baseUrl: ${baseUrl}`);
      }
      break;
    }

    case 'manage_app_trial': {
      const action = String(args.action);
      const endpoint = action === 'start'
        ? '/api/apps/trial/start'
        : action === 'status'
          ? '/api/apps/trial/status'
          : '/api/apps/upgrade';
      write(`📦  ${action === 'start' ? 'Starting' : action === 'status' ? 'Checking' : 'Upgrading'} app trial...`);
      logger.info('[devstudio/execute] manage_app_trial', { action, endpoint });
      try {
        const res = await fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', cookie: authHeader },
          body: JSON.stringify({ user_id: args.user_id, app_id: args.app_id }),
        });
        const data = await res.json().catch(() => ({}));
        logger.info('[devstudio/execute] manage_app_trial response', { status: res.status });
        if (!res.ok) {
          write(`\x1b[31m✗  Failed (HTTP ${res.status}): ${data.error ?? res.statusText}\x1b[0m`);
          if (data.message) write(`   Detail: ${data.message}`);
        } else {
          write(`\x1b[32m✓  Done\x1b[0m`);
          if (data.status) write(`   Status: ${data.status}`);
          if (data.expires_at) write(`   Expires: ${data.expires_at}`);
          if (data.checkout_url) write(`   Checkout: ${data.checkout_url}`);
        }
      } catch (fetchErr) {
        const reason = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        logger.error('[devstudio/execute] manage_app_trial fetch error', { reason });
        write(`\x1b[31m✗  Could not reach ${endpoint}: ${reason}\x1b[0m`);
        write(`   baseUrl: ${baseUrl}`);
      }
      break;
    }

    // ── At-risk learners ──────────────────────────────────────────────────
    case 'list_at_risk': {
      write('\x1b[33m⚙  Fetching at-risk learners…\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/at-risk`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const items = data.learners ?? data.students ?? data.data ?? [];
          write(`\x1b[32m✓  ${items.length} at-risk learner(s)\x1b[0m`);
          items.slice(0, 10).forEach((s: Record<string, unknown>) =>
            write(`   • ${s.full_name ?? s.email ?? s.id} — ${s.reason ?? s.status ?? ''}`));
          if (items.length > 10) write(`   … and ${items.length - 10} more`);
          write(`   View at: /admin/at-risk`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Completions ───────────────────────────────────────────────────────
    case 'list_completions': {
      write('\x1b[33m⚙  Fetching completions…\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/completions?limit=${args.limit ?? 20}`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const items = data.completions ?? data.data ?? [];
          write(`\x1b[32m✓  ${items.length} completion(s)\x1b[0m`);
          items.slice(0, 10).forEach((c: Record<string, unknown>) =>
            write(`   • ${c.student_name ?? c.user_id} — ${c.program_name ?? c.course_name ?? ''}`));
          write(`   View at: /admin/completions`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Catalog export ────────────────────────────────────────────────────
    case 'export_catalog': {
      write('\x1b[33m⚙  Exporting program catalog…\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/catalog/export`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Catalog exported\x1b[0m');
          if (data.url) write(`   Download: ${data.url}`);
          write(`   View at: /admin/programs`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Monitoring ────────────────────────────────────────────────────────
    case 'check_monitoring': {
      write('\x1b[33m⚙  Checking monitoring status…\x1b[0m');
      try {
        const [statusRes, errorsRes] = await Promise.all([
          fetch(`${baseUrl}/api/admin/monitoring/status`, { headers }),
          fetch(`${baseUrl}/api/admin/monitoring/errors?limit=5`, { headers }),
        ]);
        const status = await statusRes.json().catch(() => ({}));
        const errors = await errorsRes.json().catch(() => ({}));
        write('\x1b[32m✓  Monitoring status\x1b[0m');
        if (status.uptime) write(`   Uptime: ${status.uptime}`);
        if (status.memory) write(`   Memory: ${status.memory}`);
        const errs = errors.errors ?? errors.data ?? [];
        if (errs.length > 0) {
          write(`\x1b[33m   Recent errors (${errs.length}):\x1b[0m`);
          errs.slice(0, 5).forEach((e: Record<string, unknown>) =>
            write(`   • ${e.message ?? e.error ?? JSON.stringify(e)}`));
        } else write('   No recent errors');
        write(`   View at: /admin/monitoring`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Users / role management ───────────────────────────────────────────
    case 'list_users': {
      write('\x1b[33m⚙  Fetching users…\x1b[0m');
      try {
        const q = args.search ? `?search=${encodeURIComponent(String(args.search))}` : `?limit=${args.limit ?? 20}`;
        const res = await fetch(`${baseUrl}/api/admin/users${q}`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const items = data.users ?? data.data ?? [];
          write(`\x1b[32m✓  ${items.length} user(s)\x1b[0m`);
          items.slice(0, 10).forEach((u: Record<string, unknown>) =>
            write(`   • ${u.full_name ?? u.email} — ${u.role ?? 'student'}`));
          write(`   View at: /admin/users`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    case 'update_user_role': {
      write(`\x1b[33m⚙  Updating role for user ${args.user_id}…\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/users/update-role`, {
          method: 'POST', headers,
          body: JSON.stringify({ user_id: args.user_id, role: args.role }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) write(`\x1b[32m✓  Role updated to ${args.role}\x1b[0m`);
        else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Bulk email ────────────────────────────────────────────────────────
    case 'send_bulk_email': {
      write('\x1b[33m⚙  Sending bulk email…\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/send-onboarding-emails`, {
          method: 'POST', headers,
          body: JSON.stringify({ subject: args.subject, body: args.body, audience: args.audience ?? 'all' }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Bulk email queued\x1b[0m');
          if (data.count) write(`   Recipients: ${data.count}`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── WIOA export ───────────────────────────────────────────────────────
    case 'run_wioa_export': {
      write('\x1b[33m⚙  Running WIOA PIRL export…\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/wioa/pirl-export`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  WIOA export complete\x1b[0m');
          if (data.url) write(`   Download: ${data.url}`);
          if (data.count) write(`   Records: ${data.count}`);
          write(`   View at: /admin/wioa`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Backup ────────────────────────────────────────────────────────────
    case 'run_backup': {
      write('\x1b[33m⚙  Triggering platform backup…\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/backup`, { method: 'POST', headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Backup initiated\x1b[0m');
          if (data.backupId) write(`   Backup ID: ${data.backupId}`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Automations ───────────────────────────────────────────────────────
    case 'run_automation': {
      write(`\x1b[33m⚙  Running automation: ${args.automation_id}…\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/automations/run`, {
          method: 'POST', headers,
          body: JSON.stringify({ automation_id: args.automation_id }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) write('\x1b[32m✓  Automation triggered\x1b[0m');
        else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Shops ─────────────────────────────────────────────────────────────
    case 'list_shops': {
      write('\x1b[33m⚙  Fetching shops…\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/shops`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const items = data.shops ?? data.data ?? [];
          write(`\x1b[32m✓  ${items.length} shop(s)\x1b[0m`);
          items.slice(0, 10).forEach((s: Record<string, unknown>) =>
            write(`   • ${s.name ?? s.id} — ${s.city ?? ''} ${s.state ?? ''}`));
          write(`   View at: /admin/shops`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Promo codes ───────────────────────────────────────────────────────
    case 'list_promo_codes': {
      write('\x1b[33m⚙  Fetching promo codes…\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/promo-codes`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const items = data.codes ?? data.data ?? [];
          write(`\x1b[32m✓  ${items.length} promo code(s)\x1b[0m`);
          items.slice(0, 10).forEach((c: Record<string, unknown>) =>
            write(`   • ${c.code} — ${c.discount_percent ?? c.discount_amount ?? ''}% off · ${c.uses ?? 0} uses`));
          write(`   View at: /admin/promo-codes`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Social campaigns ──────────────────────────────────────────────────
    case 'list_social_campaigns': {
      write('\x1b[33m⚙  Fetching social campaigns…\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/social-campaigns`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const items = data.campaigns ?? data.data ?? [];
          write(`\x1b[32m✓  ${items.length} campaign(s)\x1b[0m`);
          items.slice(0, 10).forEach((c: Record<string, unknown>) =>
            write(`   • ${c.title ?? c.name ?? c.id} — ${c.status ?? ''}`));
          write(`   View at: /admin/social-media`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Smoke test ────────────────────────────────────────────────────────
    case 'smoke_test': {
      write('\x1b[1mRunning platform smoke test…\x1b[0m');
      try {
        const res = await fetch(`${baseUrl.replace('www.elevateforhumanity.org', 'admin.elevateforhumanity.org')}/api/devstudio/smoke-test`, {
          headers: { Cookie: authHeader },
          signal: AbortSignal.timeout(55000),
        });
        if (!res.ok || !res.body) {
          write(`\x1b[31m✗  Smoke test endpoint returned HTTP ${res.status}\x1b[0m`);
          break;
        }
        // Stream SSE lines directly to the caller
        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        while (true) {
          const { done: d, value } = await reader.read();
          if (d) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split('\n');
          buf = parts.pop() ?? '';
          for (const part of parts) {
            if (!part.startsWith('data: ')) continue;
            const payload = part.slice(6).trim();
            if (payload === '[DONE]') continue;
            try {
              const p = JSON.parse(payload);
              const text: string = p.line ?? p.text ?? payload;
              if (text.trim()) write(text);
            } catch { if (payload.trim()) write(payload); }
          }
        }
      } catch (err) {
        write(`\x1b[31m✗  Smoke test failed: ${(err as Error).message}\x1b[0m`);
      }
      break;
    }

    // ── Audit export ──────────────────────────────────────────────────────
    case 'export_audit_log': {
      write('\x1b[33m⚙  Exporting audit log…\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/audit-export`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Audit log exported\x1b[0m');
          if (data.url) write(`   Download: ${data.url}`);
          write(`   View at: /admin/audit-logs`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Run payroll ───────────────────────────────────────────────────────
    case 'run_payroll': {
      write('\x1b[33m⚙  Running payroll…\x1b[0m');
      try {
        const body: Record<string, unknown> = {};
        if (args.pay_period_start) body.pay_period_start = args.pay_period_start;
        if (args.pay_period_end)   body.pay_period_end   = args.pay_period_end;
        if (args.pay_date)         body.pay_date         = args.pay_date;
        const res = await fetch(`${baseUrl}/api/hr/payroll`, {
          method: 'POST', headers,
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Payroll run created\x1b[0m');
          if (data.id)          write(`   Run ID: ${data.id}`);
          if (data.total_gross) write(`   Gross: $${Number(data.total_gross).toLocaleString()}`);
          if (data.total_net)   write(`   Net:   $${Number(data.total_net).toLocaleString()}`);
          if (data.employee_count) write(`   Employees: ${data.employee_count}`);
          write(`   View at: /admin/hr/payroll`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    case 'export_payroll': {
      write('\x1b[33m⚙  Exporting payroll data…\x1b[0m');
      try {
        const q = args.run_id ? `?run_id=${args.run_id}` : '';
        const res = await fetch(`${baseUrl}/api/payroll/export${q}`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Payroll export ready\x1b[0m');
          if (data.url) write(`   Download: ${data.url}`);
          write(`   View at: /admin/hr/payroll`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Run reports ───────────────────────────────────────────────────────
    case 'run_reports': {
      const reportType = String(args.report_type ?? 'overall');
      const reportRoutes: Record<string, string> = {
        overall:      '/api/reporting/overall-metrics',
        program:      '/api/reporting/program-metrics',
        site:         '/api/reporting/site-metrics',
        funder:       '/api/reporting/funder-metrics',
        dol:          '/api/reporting/dol-dwd',
        activity:     '/api/reporting/recent-activity',
        wioa:         '/api/reports/wioa',
        outcomes:     '/api/reports/outcomes',
        participants: '/api/reports/participants',
        rapids:       '/api/reports/rapids/export?format=json',
        grants:       '/api/admin/grant-report/export',
        compliance:   '/api/compliance/report',
        enrollment:   '/api/admin/analytics/overview',
      };
      const route = reportRoutes[reportType] ?? reportRoutes.overall;
      write(`\x1b[33m⚙  Running ${reportType} report…\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}${route}`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write(`\x1b[32m✓  ${reportType} report complete\x1b[0m`);
          // Surface top-level numeric fields
          const nums = Object.entries(data)
            .filter(([, v]) => typeof v === 'number')
            .slice(0, 8);
          nums.forEach(([k, v]) => write(`   ${k}: ${v}`));
          if (data.url) write(`   Download: ${data.url}`);
          write(`   View at: /admin/reports`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Repo commits ──────────────────────────────────────────────────────
    case 'repo_commits': {
      const ghToken = process.env.GITHUB_TOKEN;
      if (!ghToken) { write('\x1b[31m✗  GITHUB_TOKEN not set\x1b[0m'); break; }
      const owner = 'elevateforhumanity';
      const repo  = 'Elevate-lms';
      const path  = args.path ? String(args.path) : '';
      const since = args.since ? String(args.since) : '';
      const limit = Math.min(Number(args.limit ?? 20), 50);

      write(`\x1b[33m⚙  Fetching commits${path ? ` for ${path}` : ''}…\x1b[0m`);
      try {
        const params = new URLSearchParams({ per_page: String(limit) });
        if (path)  params.set('path', path);
        if (since) params.set('since', since);
        const res = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits?${params}`,
          { headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' } },
        );
        if (!res.ok) { write(`\x1b[31m✗  GitHub API ${res.status}\x1b[0m`); break; }
        const commits = await res.json() as Array<{
          sha: string;
          commit: { message: string; author: { date: string; name: string } };
          html_url: string;
        }>;
        write(`\x1b[32m✓  ${commits.length} commit(s)\x1b[0m`);
        commits.forEach((c) => {
          const short = c.sha.slice(0, 7);
          const msg   = c.commit.message.split('\n')[0].slice(0, 72);
          const date  = c.commit.author.date.slice(0, 10);
          const author = c.commit.author.name;
          write(`   \x1b[33m${short}\x1b[0m  ${date}  \x1b[2m${author}\x1b[0m`);
          write(`          ${msg}`);
        });
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
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

  // All /api/admin/* routes live on the admin app, not the public LMS.
  // In production: https://admin.elevateforhumanity.org
  // In dev: http://localhost:3001 (or NEXT_PUBLIC_ADMIN_URL)
  const baseUrl = getAdminUrl();
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

        logger.info('[devstudio/execute] command received', { command: command.substring(0, 120) });

        // ── Step 1: try keyword match (works without any AI key) ──────────
        const keywordMatch = matchKeyword(command);

        if (keywordMatch) {
          logger.info('[devstudio/execute] keyword match', { action: keywordMatch.action });
          await executeAction(keywordMatch.action, keywordMatch.args, baseUrl, cookieHeader, write);
          write('');
        } else {
          // ── Step 2: AI-assisted routing ──────────────────────────────────
          const aiAvailable = isGroqConfigured() || isGeminiConfigured();
          if (!aiAvailable) {
            write('\x1b[33m⚠  No AI provider configured (GROQ_API_KEY / GEMINI_API_KEY missing).\x1b[0m');
            write('   Use one of the quick-action buttons above, or set an AI key to enable');
            write('   natural-language commands.');
            write('');
            write('\x1b[90m─────────────────────────────────────\x1b[0m');
            return;
          }

          const systemPrompt = `You are the Elevate for Humanity admin command assistant.
The admin speaks to you in plain English and you execute the right action.
Always use a tool — never respond with plain text unless using ask_question.
Be decisive. If the intent is clear, act. If ambiguous, use ask_question to clarify.`;

          const userPrompt = [...history.map((m: { role: string; content: string }) =>
            `${m.role}: ${m.content}`
          ), `user: ${command}`].join('\n');

          let aiResponse: Awaited<ReturnType<typeof callAI>>;
          try {
            aiResponse = await callAI(systemPrompt, userPrompt, TOOLS);
          } catch (aiErr) {
            const reason = aiErr instanceof Error ? aiErr.message : String(aiErr);
            logger.error('[devstudio/execute] AI call failed', { reason });
            write(`\x1b[31m✗  AI routing failed: ${reason}\x1b[0m`);
            write('   Check that GROQ_API_KEY or GEMINI_API_KEY is set in AWS Secrets Manager.');
            write('\x1b[90m─────────────────────────────────────\x1b[0m');
            return;
          }

          const msg = {
            content: aiResponse.content,
            tool_calls: aiResponse.toolCalls,
          };

          if (msg.tool_calls?.length) {
            for (const call of msg.tool_calls as { function: { name: string; arguments: string } }[]) {
              const actionName = call.function.name;
              const args = JSON.parse(call.function.arguments || '{}');
              logger.info('[devstudio/execute] executing action', { action: actionName });
              await executeAction(actionName, args, baseUrl, cookieHeader, write);
              write('');
            }
          } else if (msg.content) {
            write(msg.content);
          } else {
            write('\x1b[33m⚠  AI returned no action. Try rephrasing your command.\x1b[0m');
          }
        }

        write('\x1b[90m─────────────────────────────────────\x1b[0m');
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        logger.error('[devstudio/execute] unexpected error', { reason });
        write(`\x1b[31m✗  Unexpected error: ${reason}\x1b[0m`);
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
