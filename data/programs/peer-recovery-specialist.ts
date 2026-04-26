import type { ProgramSchema } from '@/lib/programs/program-schema';

export const PEER_RECOVERY: ProgramSchema = {
  slug: 'peer-recovery-specialist',
  title: 'Peer Recovery Specialist',
  subtitle:
    'Help others overcome addiction and mental health challenges. Earn your Indiana Certified Peer Recovery Specialist (CPRS) credential in 8 weeks.',
  category: 'Healthcare & Human Services',
  heroImage: '/hero-images/healthcare-hero.jpg',
  heroImageAlt: 'Peer recovery specialist in a counseling session',
  durationWeeks: 8,
  selfPayCost: '$5,000',
  metaTitle: 'Peer Recovery Specialist (CPRS) | Indiana Certification | Elevate for Humanity',
  metaDescription:
    'Earn your Indiana Certified Peer Recovery Specialist (CPRS) credential in 8 weeks. WIOA funding available. Help others overcome addiction and mental health challenges.',

  fundingStatement: 'WIOA and FSSA IMPACT funding available for eligible Indiana residents.',
  fundingOptions: [
    {
      name: 'WIOA',
      description:
        'For eligible unemployed or underemployed Indiana residents. Covers full tuition, books, and exam fees.',
      tag: 'Federal',
    },
    {
      name: 'FSSA IMPACT',
      description: 'For current SNAP or TANF recipients. Covers full tuition at no cost.',
      tag: 'Indiana State',
    },
  ],

  credentials: [
    {
      name: 'Indiana Certified Peer Recovery Specialist (CPRS)',
      issuer: 'Indiana Family and Social Services Administration (FSSA)',
      description:
        'State-recognized credential required to work as a peer recovery specialist in Indiana. Recognized by DMHA and Medicaid-certified providers.',
      isPortable: true,
    },
  ],

  outcomes: [
    {
      title: 'Peer Recovery Specialist',
      timeframe: '0–3 months',
      requirements: 'Indiana CPRS credential',
      salaryRange: '$32,000–$42,000',
      statement:
        'Work at community mental health centers, recovery houses, or hospital systems supporting individuals in recovery.',
    },
    {
      title: 'Recovery Coach',
      timeframe: '1–2 years',
      requirements: 'CPRS + field experience',
      salaryRange: '$38,000–$50,000',
      statement:
        'Provide one-on-one coaching, crisis support, and care coordination for individuals with substance use disorders.',
    },
    {
      title: 'Recovery Program Coordinator',
      timeframe: '3–5 years',
      requirements: 'CPRS + supervisory experience',
      salaryRange: '$48,000–$62,000',
      statement:
        'Manage peer support programs, supervise peer specialists, and coordinate with clinical teams.',
    },
  ],

  weeklySchedule: [
    {
      week: 'Week 1–2',
      title: 'Introduction to Peer Recovery',
      competencyMilestone:
        'Articulate the peer support model, CPRS role boundaries, and ethics framework.',
    },
    {
      week: 'Week 3',
      title: 'Recovery Coaching Fundamentals',
      competencyMilestone:
        'Demonstrate motivational interviewing techniques and active listening in role-play scenarios.',
    },
    {
      week: 'Week 4',
      title: 'Trauma-Informed Care',
      competencyMilestone:
        'Identify ACE indicators and apply trauma-sensitive communication in case studies.',
    },
    {
      week: 'Week 5',
      title: 'Crisis Intervention & Safety Planning',
      competencyMilestone:
        'Complete a safety plan template and demonstrate de-escalation in a simulated crisis.',
    },
    {
      week: 'Week 6–7',
      title: 'Systems Navigation & Documentation',
      competencyMilestone:
        'Navigate Indiana FSSA systems, complete a referral packet, and document a mock client interaction.',
    },
    {
      week: 'Week 8',
      title: 'CPRS Exam Prep & Practicum',
      competencyMilestone:
        'Pass practice exam (80%+) and complete supervised practicum hours required for CPRS application.',
    },
  ],

  modules: [
    {
      title: 'Introduction to Peer Recovery',
      description: 'History of peer support, roles and responsibilities, ethics and boundaries.',
      lessonCount: 4,
    },
    {
      title: 'Recovery Coaching Fundamentals',
      description:
        'Motivational interviewing, active listening, goal setting, and person-centered planning.',
      lessonCount: 5,
    },
    {
      title: 'Trauma-Informed Care',
      description:
        'Understanding trauma, adverse childhood experiences (ACEs), and trauma-sensitive communication.',
      lessonCount: 4,
    },
    {
      title: 'Crisis Intervention & Safety Planning',
      description:
        'Recognizing crisis, de-escalation techniques, safety planning, and mandatory reporting.',
      lessonCount: 4,
    },
    {
      title: 'CPRS Exam Preparation & Practicum',
      description:
        'Exam review, supervised practicum hours, and certification application process.',
      lessonCount: 3,
    },
  ],

  faqs: [
    {
      question: 'Do I need prior experience in healthcare or counseling?',
      answer:
        'No. Many successful peer recovery specialists have lived experience with recovery. The CPRS credential is designed for people who have personal experience with substance use or mental health challenges and want to help others.',
    },
    {
      question: 'Is WIOA funding available for this program?',
      answer:
        'Yes. This program is on the Indiana ETPL and qualifies for WIOA Individual Training Accounts (ITAs). Check your eligibility at /check-eligibility.',
    },
    {
      question: 'What can I do with a CPRS credential?',
      answer:
        'Work at community mental health centers, recovery community organizations, hospital systems, jails and prisons, and Medicaid-certified behavioral health providers across Indiana.',
    },
    {
      question: 'How long does it take to get the CPRS credential after completing the program?',
      answer:
        'After completing the program and practicum hours, you apply directly to Indiana FSSA DMHA. Processing typically takes 2–4 weeks.',
    },
  ],
  cta: {
    applyHref: '/programs/peer-recovery-specialist/apply',
    requestInfoHref: '/contact?program=peer-recovery-specialist',
    advisorHref: '/contact',
    courseHref: '/programs/peer-recovery-specialist',
  },
};
