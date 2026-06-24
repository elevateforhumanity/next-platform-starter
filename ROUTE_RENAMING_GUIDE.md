# Route Renaming Guide

This document maps generic `[id]` routes to semantic names.

## How to Rename

```bash
# Example: Rename a single route
mv app/admin/students/[id] app/admin/students/[studentId]
mv app/admin/enrollments/[id] app/admin/enrollments/[enrollmentId]
mv app/admin/contracts/[id] app/admin/contracts/[contractId]
```

After renaming, update `useParams()` in affected pages:
```typescript
// Before
const { id } = useParams();

// After
const { studentId } = useParams();
```

## Admin Routes (23)

| Current | New |
|---------|-----|
| `/admin/accreditation/standards/[id]` | `/admin/accreditation/standards/[standardId]` |
| `/admin/applications/review/[id]` | `/admin/applications/review/[applicationId]` |
| `/admin/barber-shop-applications/[id]` | `/admin/barber-shop-applications/[barberAppId]` |
| `/admin/contracts/[id]` | `/admin/contracts/[contractId]` |
| `/admin/crm/leads/[id]` | `/admin/crm/leads/[leadId]` |
| `/admin/documents/[id]` | `/admin/documents/[documentId]` |
| `/admin/documents/review/[id]` | `/admin/documents/review/[docReviewId]` |
| `/admin/employers/[id]` | `/admin/employers/[employerId]` |
| `/admin/enrollments/[id]` | `/admin/enrollments/[enrollmentId]` |
| `/admin/fssa-impact/participants/[id]` | `/admin/fssa-impact/participants/[participantId]` |
| `/admin/grants/applications/[id]` | `/admin/grants/applications/[grantAppId]` |
| `/admin/hr/employees/[id]` | `/admin/hr/employees/[employeeId]` |
| `/admin/partners/applications/[id]` | `/admin/partners/applications/[partnerAppId]` |
| `/admin/partners/lms-integrations/[id]` | `/admin/partners/lms-integrations/[integrationId]` |
| `/admin/program-holders/[id]` | `/admin/program-holders/[programHolderId]` |
| `/admin/program-holders/verification/[id]` | `/admin/program-holders/verification/[verificationId]` |
| `/admin/review-queue/[id]` | `/admin/review-queue/[queueItemId]` |
| `/admin/staff-portal/cases/[id]` | `/admin/staff-portal/cases/[caseId]` |
| `/admin/students/[id]` | `/admin/students/[studentId]` |
| `/admin/studio/workflows/[id]` | `/admin/studio/workflows/[workflowId]` |
| `/admin/submissions/opportunities/[id]` | `/admin/submissions/opportunities/[opportunityId]` |
| `/admin/tenants/[id]` | `/admin/tenants/[tenantId]` |
| `/admin/verifications/review/[id]` | `/admin/verifications/review/[verificationId]` |
| `/admin/wioa/iep/[id]` | `/admin/wioa/iep/[iepId]` |
| `/admin/workflows/[id]` | `/admin/workflows/[workflowId]` |

## API Routes (32)

| Current | New |
|---------|-----|
| `/api/admin/hr/employees/[id]` | `/api/admin/hr/employees/[employeeId]` |
| `/api/admin/tenants/[id]` | `/api/admin/tenants/[tenantId]` |
| `/api/admin/workflows/[id]` | `/api/admin/workflows/[workflowId]` |
| `/api/admin/workflows/dead-letters/[id]` | `/api/admin/workflows/dead-letters/[deadLetterId]` |
| `/api/applications/[id]` | `/api/applications/[applicationId]` |
| `/api/assignments/[id]` | `/api/assignments/[assignmentId]` |
| `/api/case-manager/participants/[id]` | `/api/case-manager/participants/[participantId]` |
| `/api/case-manager/placements/[id]` | `/api/case-manager/placements/[placementId]` |
| `/api/cash-advances/applications/[id]` | `/api/cash-advances/applications/[cashAdvanceId]` |
| `/api/certification/[id]` | `/api/certification/[certificationId]` |
| `/api/content-library/[id]` | `/api/content-library/[contentId]` |
| `/api/employers/onboard/[id]` | `/api/employers/onboard/[onboardId]` |
| `/api/enrollments/[id]` | `/api/enrollments/[enrollmentId]` |
| `/api/events/[id]` | `/api/events/[eventId]` |
| `/api/messages/[id]` | `/api/messages/[messageId]` |
| `/api/notes/[id]` | `/api/notes/[noteId]` |
| `/api/page-builder/pages/[id]` | `/api/page-builder/pages/[pageId]` |
| `/api/partner/applications/[id]` | `/api/partner/applications/[partnerAppId]` |
| `/api/placements/[id]` | `/api/placements/[placementId]` |
| `/api/proctor/sessions/[id]` | `/api/proctor/sessions/[sessionId]` |
| `/api/program-holder/notifications/[id]` | `/api/program-holder/notifications/[notificationId]` |
| `/api/provider/programs/[id]` | `/api/provider/programs/[providerProgramId]` |
| `/api/pwa/api-pwa/shop-owner/apprentices/[id]` | `/api/pwa/api-pwa/shop-owner/apprentices/[apprenticeId]` |
| `/api/pwa/shop-owner/apprentices/[id]` | `/api/pwa/shop-owner/apprentices/[apprenticeId]` |
| `/api/recaps/[id]` | `/api/recaps/[recapId]` |
| `/api/reviews/[id]` | `/api/reviews/[reviewId]` |
| `/api/secrets/[id]` | `/api/secrets/[secretId]` |
| `/api/signature/documents/[id]` | `/api/signature/documents/[documentId]` |
| `/api/study-groups/[id]` | `/api/study-groups/[studyGroupId]` |
| `/api/support/tickets/[id]` | `/api/support/tickets/[ticketId]` |
| `/api/testing/bookings/[id]` | `/api/testing/bookings/[bookingId]` |
| `/api/wioa/case-management/[id]` | `/api/wioa/case-management/[caseId]` |
| `/api/wioa/iep/[id]` | `/api/wioa/iep/[iepId]` |
| `/api/wioa/support-services/[id]` | `/api/wioa/support-services/[serviceId]` |
| `/api/workone/[id]` | `/api/workone/[workoneId]` |
| `/api/workspace/[id]` | `/api/workspace/[workspaceId]` |

## Public Routes (10)

| Current | New |
|---------|-----|
| `/careers/[id]` | `/careers/[careerId]` |
| `/case-manager/participants/[id]` | `/case-manager/participants/[participantId]` |
| `/employer/postings/[id]` | `/employer/postings/[jobPostingId]` |
| `/employer/programs/[id]` | `/employer/programs/[employerProgramId]` |
| `/help/articles/article/[id]` | `/help/articles/article/[articleId]` |
| `/lms/(app)/assignments/[id]` | `/lms/(app)/assignments/[assignmentId]` |
| `/lms/(app)/certificates/[id]` | `/lms/(app)/certificates/[certificateId]` |
| `/marketplace/product/[id]` | `/marketplace/product/[productId]` |
| `/proctor/session/[id]` | `/proctor/session/[sessionId]` |
| `/pwa/shop-owner/apprentices/[id]` | `/pwa/shop-owner/apprentices/[apprenticeId]` |
| `/staff/cases/[id]` | `/staff/cases/[caseId]` |

## Batch Rename Script

Run this from `/workspace/project/Elevate-lms`:

```bash
#!/bin/bash
# Admin routes
mv app/admin/accreditation/standards/[id] app/admin/accreditation/standards/[standardId]
mv app/admin/applications/review/[id] app/admin/applications/review/[applicationId]
mv app/admin/barber-shop-applications/[id] app/admin/barber-shop-applications/[barberAppId]
mv app/admin/contracts/[id] app/admin/contracts/[contractId]
mv app/admin/crm/leads/[id] app/admin/crm/leads/[leadId]
mv app/admin/documents/[id] app/admin/documents/[documentId]
mv app/admin/documents/review/[id] app/admin/documents/review/[docReviewId]
mv app/admin/employers/[id] app/admin/employers/[employerId]
mv app/admin/enrollments/[id] app/admin/enrollments/[enrollmentId]
mv app/admin/fssa-impact/participants/[id] app/admin/fssa-impact/participants/[participantId]
mv app/admin/grants/applications/[id] app/admin/grants/applications/[grantAppId]
mv app/admin/hr/employees/[id] app/admin/hr/employees/[employeeId]
mv app/admin/partners/applications/[id] app/admin/partners/applications/[partnerAppId]
mv app/admin/partners/lms-integrations/[id] app/admin/partners/lms-integrations/[integrationId]
mv app/admin/program-holders/[id] app/admin/program-holders/[programHolderId]
mv app/admin/program-holders/verification/[id] app/admin/program-holders/verification/[verificationId]
mv app/admin/review-queue/[id] app/admin/review-queue/[queueItemId]
mv app/admin/staff-portal/cases/[id] app/admin/staff-portal/cases/[caseId]
mv app/admin/students/[id] app/admin/students/[studentId]
mv app/admin/studio/workflows/[id] app/admin/studio/workflows/[workflowId]
mv app/admin/submissions/opportunities/[id] app/admin/submissions/opportunities/[opportunityId]
mv app/admin/tenants/[id] app/admin/tenants/[tenantId]
mv app/admin/verifications/review/[id] app/admin/verifications/review/[verificationId]
mv app/admin/wioa/iep/[id] app/admin/wioa/iep/[iepId]
mv app/admin/workflows/[id] app/admin/workflows/[workflowId]

# API routes
mv app/api/admin/hr/employees/[id] app/api/admin/hr/employees/[employeeId]
mv app/api/admin/tenants/[id] app/api/admin/tenants/[tenantId]
mv app/api/admin/workflows/[id] app/api/admin/workflows/[workflowId]
mv app/api/admin/workflows/dead-letters/[id] app/api/admin/workflows/dead-letters/[deadLetterId]
mv app/api/applications/[id] app/api/applications/[applicationId]
mv app/api/assignments/[id] app/api/assignments/[assignmentId]
mv app/api/case-manager/participants/[id] app/api/case-manager/participants/[participantId]
mv app/api/case-manager/placements/[id] app/api/case-manager/placements/[placementId]
mv app/api/cash-advances/applications/[id] app/api/cash-advances/applications/[cashAdvanceId]
mv app/api/certification/[id] app/api/certification/[certificationId]
mv app/api/content-library/[id] app/api/content-library/[contentId]
mv app/api/employers/onboard/[id] app/api/employers/onboard/[onboardId]
mv app/api/enrollments/[id] app/api/enrollments/[enrollmentId]
mv app/api/events/[id] app/api/events/[eventId]
mv app/api/messages/[id] app/api/messages/[messageId]
mv app/api/notes/[id] app/api/notes/[noteId]
mv app/api/page-builder/pages/[id] app/api/page-builder/pages/[pageId]
mv app/api/partner/applications/[id] app/api/partner/applications/[partnerAppId]
mv app/api/placements/[id] app/api/placements/[placementId]
mv app/api/proctor/sessions/[id] app/api/proctor/sessions/[sessionId]
mv app/api/program-holder/notifications/[id] app/api/program-holder/notifications/[notificationId]
mv app/api/provider/programs/[id] app/api/provider/programs/[providerProgramId]
mv app/api/pwa/api-pwa/shop-owner/apprentices/[id] app/api/pwa/api-pwa/shop-owner/apprentices/[apprenticeId]
mv app/api/pwa/shop-owner/apprentices/[id] app/api/pwa/shop-owner/apprentices/[apprenticeId]
mv app/api/recaps/[id] app/api/recaps/[recapId]
mv app/api/reviews/[id] app/api/reviews/[reviewId]
mv app/api/secrets/[id] app/api/secrets/[secretId]
mv app/api/signature/documents/[id] app/api/signature/documents/[documentId]
mv app/api/study-groups/[id] app/api/study-groups/[studyGroupId]
mv app/api/support/tickets/[id] app/api/support/tickets/[ticketId]
mv app/api/testing/bookings/[id] app/api/testing/bookings/[bookingId]
mv app/api/wioa/case-management/[id] app/api/wioa/case-management/[caseId]
mv app/api/wioa/iep/[id] app/api/wioa/iep/[iepId]
mv app/api/wioa/support-services/[id] app/api/wioa/support-services/[serviceId]
mv app/api/workone/[id] app/api/workone/[workoneId]
mv app/api/workspace/[id] app/api/workspace/[workspaceId]

# Public routes
mv app/careers/[id] app/careers/[careerId]
mv app/case-manager/participants/[id] app/case-manager/participants/[participantId]
mv app/employer/postings/[id] app/employer/postings/[jobPostingId]
mv app/employer/programs/[id] app/employer/programs/[employerProgramId]
mv app/help/articles/article/[id] app/help/articles/article/[articleId]
mv app/lms/\\(app\\)/assignments/[id] app/lms/\\(app\\)/assignments/[assignmentId]
mv app/lms/\\(app\\)/certificates/[id] app/lms/\\(app\\)/certificates/[certificateId]
mv app/marketplace/product/[id] app/marketplace/product/[productId]
mv app/proctor/session/[id] app/proctor/session/[sessionId]
mv app/pwa/shop-owner/apprentices/[id] app/pwa/shop-owner/apprentices/[apprenticeId]
mv app/staff/cases/[id] app/staff/cases/[caseId]
```

## After Renaming

1. Update `useParams()` calls in affected pages
2. Update TypeScript interfaces that reference `id`
3. Run `npm run build` to verify no breaking changes
4. Test affected routes manually

## Impact

- **72 routes** need renaming
- Estimated **~150 files** need `useParams()` updates
- Total **~200 files** affected

## Status

- [ ] Create backup of codebase
- [ ] Run batch rename script
- [ ] Update all `useParams()` calls
- [ ] Update TypeScript types
- [ ] Run build verification
- [ ] Test affected routes
- [ ] Commit changes
