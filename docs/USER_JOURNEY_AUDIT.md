# USER JOURNEY AUDIT
**Date:** June 17, 2026  
**Platform:** Elevate Workforce Operating System  
**Status:** AUDITED

---

## 1. USER ROLES & PERSONAS

### 1.1 Platform Roles

| Role | Portal | Primary Functions |
|------|-------|-------------------|
| Student | `/student/*` | Courses, Progress, Credentials |
| Apprentice | `/student/*` + `/apprentice/*` | Training, Hours, Compliance |
| Employer | `/employer/*` | Apprentices, OJT, Compliance |
| Partner | `/partner/*` | Collaborations, Reporting |
| Instructor | `/instructor/*` | Teaching, Grading |
| Staff | `/admin/staff-portal/*` | Applications, Enrollments |
| Admin | `/admin/*` | Platform Management |
| Host Shop | `/host-shop/*` | Apprentice Oversight |

---

## 2. STUDENT JOURNEY

### 2.1 Student Portal

**Route:** `/student/*`

| Section | Route | Status |
|---------|-------|--------|
| Dashboard | `/student/dashboard` | ✅ |
| Courses | `/student/courses` | ✅ |
| Enrollments | `/student/enrollments` | ✅ |
| Progress | `/student/progress` | ✅ |
| Certifications | `/student/certifications` | ✅ |
| Badges | `/student/badges` | ✅ |
| Documents | `/student/documents` | ✅ |
| Support | `/student/support` | ✅ |
| Chat | `/student/chat` | ✅ |

### 2.2 Student Data Flow

```
[Application] → [Enrollment] → [Course Access] → [Progress] → [Completion]
                                                          ↓
                                                   [Certificate]
```

### 2.3 Student Navigation

```
/student
├── /dashboard (Overview)
├── /courses (My Courses)
├── /enrollments (Active Programs)
├── /progress (Progress Tracking)
├── /certifications (Credentials)
├── /badges (Achievements)
├── /documents (My Documents)
├── /support (Help Center)
└── /chat (AI Assistant)
```

---

## 3. APPRENTICE JOURNEY

### 3.1 Apprentice Portal

**Route:** `/apprentice/*` (or `/student/*` with apprenticeship role)

| Section | Route | Status |
|---------|-------|--------|
| Dashboard | `/apprentice/dashboard` | ✅ |
| Programs | `/apprentice/programs` | ✅ |
| Hours | `/apprentice/hours` | ✅ |
| OJT | `/apprentice/ojt` | ✅ |
| Competencies | `/apprentice/competencies` | ✅ |
| Reports | `/apprentice/reports` | ✅ |

### 3.2 Apprentice Data Flow

```
[Application] → [Enrollment] → [Apprenticeship Program]
                                      ↓
                              [Host Shop Assignment]
                                      ↓
                            [OJT Hours Tracking]
                                      ↓
                         [Competency Sign-offs]
                                      ↓
                           [Completion Certificate]
```

### 3.3 RAPIDS Integration

Apprenticeship data syncs with RAPIDS system for workforce board reporting.

---

## 4. EMPLOYER JOURNEY

### 4.1 Employer Portal

**Route:** `/employer/*`

| Section | Route | Status |
|---------|-------|--------|
| Dashboard | `/employer/dashboard` | ✅ |
| Apprentices | `/employer/apprentices` | ✅ |
| Job Postings | `/employer/jobs` | ✅ |
| Compliance | `/employer/compliance` | ✅ |
| OJT | `/employer/ojt` | ✅ |
| Reports | `/employer/reports` | ✅ |

### 4.2 Employer Data Flow

```
[Registration] → [Partner Setup] → [MOU Signing]
                                         ↓
                               [Apprentice Placement]
                                         ↓
                              [OJT Hour Verification]
                                         ↓
                             [Wage Progression Tracking]
                                         ↓
                             [Incentive Claims (WOTC)]
```

### 4.3 Employer Features

| Feature | Status | Integration |
|---------|--------|-------------|
| Apprentice Tracking | ✅ | Apprenticeships |
| OJT Management | ✅ | Hour logging |
| Compliance Reports | ✅ | WIOA |
| Job Postings | ✅ | Opportunities |
| MOU Signing | ✅ | Documents |

---

## 5. PARTNER JOURNEY

### 5.1 Partner Portal

**Route:** `/partner/*`

| Section | Route | Status |
|---------|-------|--------|
| Dashboard | `/partner/dashboard` | ✅ |
| Programs | `/partner/programs` | ✅ |
| Placements | `/partner/placements` | ✅ |
| Reports | `/partner/reports` | ✅ |
| Admin | `/partner/admin/*` | ✅ |

### 5.2 Partner Features

| Feature | Status | Integration |
|---------|--------|-------------|
| Program Management | ✅ | LMS |
| Placement Tracking | ✅ | Employers |
| Reporting | ✅ | WIOA |
| MOU Management | ✅ | Documents |

---

## 6. INSTRUCTOR JOURNEY

### 6.1 Instructor Portal

**Route:** `/instructor/*`

| Section | Route | Status |
|---------|-------|--------|
| Dashboard | `/instructor/dashboard` | ✅ |
| Courses | `/instructor/courses` | ✅ |
| Students | `/instructor/students` | ✅ |
| Grading | `/instructor/grading` | ✅ |
| Schedule | `/instructor/schedule` | ✅ |

### 6.2 Instructor Features

| Feature | Status | Integration |
|---------|--------|-------------|
| Course Management | ✅ | LMS |
| Student Progress | ✅ | Enrollments |
| Sign-offs | ✅ | Competencies |
| Grading | ✅ | Assignments |

---

## 7. HOST SHOP JOURNEY

### 7.1 Host Shop Portal

**Route:** `/host-shop/*`

| Section | Route | Status |
|---------|-------|--------|
| Dashboard | `/host-shop/dashboard` | ✅ |
| Apprentices | `/host-shop/apprentices` | ✅ |
| Hours | `/host-shop/hours` | ✅ |
| Evaluations | `/host-shop/evaluations` | ✅ |
| Compliance | `/host-shop/compliance` | ✅ |

### 7.2 Host Shop Features

| Feature | Status | Integration |
|---------|--------|-------------|
| Apprentice Oversight | ✅ | Apprenticeships |
| Hour Approval | ✅ | OJT |
| Competency Sign-off | ✅ | Training |
| Evaluations | ✅ | Progress |

---

## 8. ADMIN JOURNEY

### 8.1 Admin Dashboard

**Route:** `/admin/*`

| Section | Route | Status |
|---------|-------|--------|
| Dashboard | `/admin/dashboard` | ✅ |
| Applications | `/admin/applications` | ✅ |
| Enrollments | `/admin/enrollments` | ✅ |
| Programs | `/admin/programs` | ✅ |
| Reports | `/admin/reports` | ✅ |
| Compliance | `/admin/compliance` | ✅ |
| Dev Studio | `/admin/studio` | ⚠️ Auth issue |
| Settings | `/admin/settings` | ✅ |

### 8.2 Admin Features

| Feature | Status | Integration |
|---------|--------|-------------|
| User Management | ✅ | Auth |
| Program Management | ✅ | LMS |
| Enrollment Oversight | ✅ | Programs |
| Compliance Monitoring | ✅ | WIOA |
| Reporting | ✅ | All systems |
| AI Studio | ✅ | Dev Studio |

---

## 9. DATA FLOW AUDIT

### 9.1 Application → Enrollment → Payment → Access → Course → Credential

```
[Application]
    ↓
[/apply/intake] - Collects student info
    ↓
[program_applications] - Stored in DB
    ↓
[/api/enrollment/create] - Creates enrollment
    ↓
[program_enrollments] - Enrollment record
    ↓
[Payment Processing] - Stripe checkout
    ↓
[Access Grant] - LMS access enabled
    ↓
[LMS Courses] - Course content available
    ↓
[Progress Tracking] - Lesson completion
    ↓
[Completion] - All modules finished
    ↓
[Certificate Generation] - Credential issued
    ↓
[Certificate Verification] - QR validation
```

### 9.2 Verification Checklist

| Step | Table | Status |
|------|-------|--------|
| Application | `program_applications` | ✅ |
| Enrollment | `program_enrollments` | ✅ |
| Payment | `purchases` | ✅ |
| Access | `user_entitlements` | ✅ |
| Course | `curriculum_lessons` | ✅ |
| Progress | `lesson_progress` | ✅ |
| Certificate | `certificates` | ✅ |

---

## 10. NAVIGATION AUDIT

### 10.1 Main Navigation Structure

```
/
├── /store (Store)
│   ├── /store/licenses (Platform Licenses)
│   ├── /store/plans (Plans & Pricing)
│   ├── /store/apps (AI Tools)
│   ├── /store/courses (Courses)
│   ├── /store/beauty-programs (Beauty)
│   ├── /store/compliance (Compliance)
│   ├── /store/trial (Trial Signup)
│   └── /store/cart (Cart)
├── /programs (Program Catalog)
│   └── /programs/[slug] (Program Detail)
├── /apply (Application)
│   └── /apply/intake (Intake Form)
├── /student/* (Student Portal)
├── /employer/* (Employer Portal)
├── /partner/* (Partner Portal)
├── /instructor/* (Instructor Portal)
├── /admin/* (Admin Dashboard)
│   └── /admin/studio (Dev Studio)
└── /login (Authentication)
```

### 10.2 Orphan Pages Identified

| Page | Status | Issue |
|------|--------|-------|
| `/beauty-checkout` | ⚠️ | Standalone, not in nav |
| `/career-training-tennessee` | ⚠️ | Not linked from main nav |
| `/financing` | ⚠️ | Standalone page |
| `/launch` | ⚠️ | Not linked |
| `/pathways/*` | ⚠️ | Partial navigation |

---

## 11. PORTAL ROUTING AUDIT

### 11.1 Portal Router

**File:** `lib/portal/router.ts`

Routes users to appropriate portal based on role:
- Student role → `/student/*`
- Admin role → `/admin/*`
- Employer role → `/employer/*`
- Instructor role → `/instructor/*`
- Partner role → `/partner/*`

### 11.2 Auth Guards

| Route | Guard | Purpose |
|-------|-------|---------|
| `/admin/*` | `apiRequireAdmin` | Admin access |
| `/instructor/*` | `apiRequireInstructor` | Instructor access |
| `/student/*` | `apiRequireStudent` | Student access |
| `/employer/*` | `apiRequireEmployer` | Employer access |

---

## 12. CROSS-ROLES INTEGRATION

### 12.1 Student → Employer Connection

```
Student completes training
    ↓
Student profile visible to employers
    ↓
Employer reviews student
    ↓
Employer posts opportunity
    ↓
Student applies
    ↓
Placement created
```

### 12.2 Staff → Student Connection

```
Student applies
    ↓
Staff reviews application
    ↓
Staff approves enrollment
    ↓
Student notified
    ↓
Student accesses course
```

---

## 13. ISSUES IDENTIFIED

| Issue | Severity | Description |
|-------|---------|-------------|
| Dev Studio auth | ⚠️ Medium | Redirects authenticated users |
| Orphan pages | ⚠️ Low | Some pages not in nav |
| Breadcrumbs | ⚠️ Low | Inconsistent across portal |
| Mobile nav | ⚠️ Low | Not fully responsive |
| Cross-portal UX | ⚠️ Medium | Handoffs need improvement |

---

## 14. VERIFICATION CHECKLIST

- [x] Student can complete full journey
- [x] Employer can track apprentices
- [x] Admin can manage enrollments
- [x] Instructor can grade students
- [x] Portal routing works
- [x] Data flows connected
- [ ] Dev Studio accessible
- [ ] Mobile experience complete

---

## AUDIT SIGNATURE

```
Auditor: OpenHands Agent
Date: June 17, 2026
```
