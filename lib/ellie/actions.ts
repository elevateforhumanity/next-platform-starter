/**
 * Ellie action registry.
 *
 * Every action Ellie can propose is defined here:
 *   - type: machine identifier used in DB and API
 *   - label: human-readable name shown in approval cards
 *   - description: what the action does (shown to the user before approval)
 *   - requiresApproval: always true — Ellie never executes without a human confirm
 *   - bulk: whether this action can target multiple records at once
 *   - dangerLevel: 'low' | 'medium' | 'high' — controls UI warning color
 */

export type EllieActionType =
  | 'send_reminder'
  | 'flag_at_risk'
  | 'unflag_at_risk'
  | 'approve_application'
  | 'reject_application'
  | 'approve_program_holder'
  | 'reject_program_holder'
  | 'issue_certificate'
  | 'send_magic_link'
  | 'assign_case_manager'
  | 'schedule_exam'
  | 'cancel_exam'
  | 'run_workflow'
  | 'navigate';

export interface EllieActionDef {
  type: EllieActionType;
  label: string;
  description: string;
  bulk: boolean;
  dangerLevel: 'low' | 'medium' | 'high';
}

export const ELLIE_ACTION_REGISTRY: Record<EllieActionType, EllieActionDef> = {
  send_reminder: {
    type: 'send_reminder',
    label: 'Send Reminder',
    description: 'Send an email reminder to the selected student(s).',
    bulk: true,
    dangerLevel: 'low',
  },
  flag_at_risk: {
    type: 'flag_at_risk',
    label: 'Flag At-Risk',
    description: 'Mark enrollment(s) as at-risk and notify the assigned case manager.',
    bulk: true,
    dangerLevel: 'medium',
  },
  unflag_at_risk: {
    type: 'unflag_at_risk',
    label: 'Remove At-Risk Flag',
    description: 'Clear the at-risk flag on the selected enrollment(s).',
    bulk: true,
    dangerLevel: 'low',
  },
  approve_application: {
    type: 'approve_application',
    label: 'Approve Application',
    description: 'Approve the application and move the student to enrollment.',
    bulk: false,
    dangerLevel: 'medium',
  },
  reject_application: {
    type: 'reject_application',
    label: 'Reject Application',
    description: 'Reject the application and notify the applicant.',
    bulk: false,
    dangerLevel: 'high',
  },
  approve_program_holder: {
    type: 'approve_program_holder',
    label: 'Approve Program Holder',
    description: 'Approve the program holder application and activate their account.',
    bulk: false,
    dangerLevel: 'medium',
  },
  reject_program_holder: {
    type: 'reject_program_holder',
    label: 'Reject Program Holder',
    description: 'Reject the program holder application and notify the applicant.',
    bulk: false,
    dangerLevel: 'high',
  },
  issue_certificate: {
    type: 'issue_certificate',
    label: 'Issue Certificate',
    description: 'Manually issue a completion certificate to the student.',
    bulk: false,
    dangerLevel: 'medium',
  },
  send_magic_link: {
    type: 'send_magic_link',
    label: 'Send Magic Link',
    description: 'Send a passwordless login link to the user\'s email.',
    bulk: false,
    dangerLevel: 'low',
  },
  assign_case_manager: {
    type: 'assign_case_manager',
    label: 'Assign Case Manager',
    description: 'Assign a case manager to the selected student.',
    bulk: false,
    dangerLevel: 'low',
  },
  schedule_exam: {
    type: 'schedule_exam',
    label: 'Schedule Exam',
    description: 'Schedule a certification exam for the student at the testing center.',
    bulk: false,
    dangerLevel: 'low',
  },
  cancel_exam: {
    type: 'cancel_exam',
    label: 'Cancel Exam Booking',
    description: 'Cancel the exam booking and notify the student.',
    bulk: false,
    dangerLevel: 'medium',
  },
  run_workflow: {
    type: 'run_workflow',
    label: 'Run Workflow',
    description: 'Trigger the selected automation workflow.',
    bulk: false,
    dangerLevel: 'medium',
  },
  navigate: {
    type: 'navigate',
    label: 'Navigate',
    description: 'Open a page in the admin portal.',
    bulk: false,
    dangerLevel: 'low',
  },
};
