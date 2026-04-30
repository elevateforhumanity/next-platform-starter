import type { ProgramSchema } from '@/lib/programs/program-schema';

/**
 * Qualified Medication Aide (QMA) — Program Detail
 * Indiana-specific credential issued by the Indiana State Department of Health (ISDH).
 * Required for CNAs who administer medications in long-term care facilities.
 * Hours: 80 hours classroom + 20 hours clinical = 100 hours total.
 */
export const QMA: ProgramSchema = {
  slug: 'qma',
  title: 'Qualified Medication Aide (QMA)',
  subtitle:
    'Earn the Indiana QMA credential and administer medications in long-term care facilities. 100-hour program for CNAs. FSSA IMPACT and WIOA funding available.',
  sector: 'healthcare',
  category: 'Healthcare',
  programType: 'workforce',

  heroImage: '/images/pages/medical-assistant-lab.jpg',
  heroImageAlt: 'QMA student practicing medication administration in a clinical setting',

  deliveryMode: 'hybrid',
  durationWeeks: 5,
  hoursPerWeekMin: 18,
  hoursPerWeekMax: 22,
  hoursBreakdown: {
    onlineInstruction: 40,
    handsOnLab: 40,
    examPrep: 10,
    careerPlacement: 10,
  },
  schedule: 'Mon–Fri, 9:00 AM–1:00 PM',
  eveningSchedule: 'Evening cohorts available for working CNAs.',
  cohortSize: '10–14 participants per cohort',
  fundingStatement: '$0 with FSSA IMPACT or WIOA funding for eligible Indiana residents.',
  selfPayCost: '$1,200 (payment plans available)',
  fundingOptions: ['wioa', 'wrg', 'impact', 'self_pay'],
  badge: 'Funding Available',
  badgeColor: 'green',

  metaTitle: 'Qualified Medication Aide (QMA) Training | Elevate for Humanity',
  metaDescription:
    'Indiana QMA certification in 5 weeks. Administer medications in long-term care. FSSA IMPACT and WIOA funding available for eligible Indiana residents.',

  credentials: [
    {
      name: 'Qualified Medication Aide (QMA)',
      issuer: 'Indiana State Department of Health (ISDH)',
      description:
        'State credential authorizing CNAs to administer oral, topical, and inhaled medications in Indiana long-term care facilities under nurse supervision.',
      validity: 'Renewed with CNA renewal (2 years)',
    },
    {
      name: 'CPR/BLS Certification',
      issuer: 'American Heart Association',
      description: 'Basic Life Support certification required for all healthcare workers.',
      validity: '2 years',
    },
  ],

  outcomes: [
    { statement: 'Correctly identify the 6 rights of medication administration on a competency assessment', assessedAt: 'Week 1' },
    { statement: 'Demonstrate safe oral, topical, and inhaled medication administration in a simulated clinical setting', assessedAt: 'Week 3' },
    { statement: 'Accurately document medication administration using MAR (Medication Administration Record) protocols', assessedAt: 'Week 2' },
    { statement: 'Identify and report adverse drug reactions and medication errors per Indiana ISDH standards', assessedAt: 'Week 4' },
    { statement: 'Pass the Indiana QMA state competency exam with a score of 80% or higher', assessedAt: 'Week 5' },
    { statement: 'Apply infection control and hand hygiene protocols during all medication administration procedures', assessedAt: 'Week 2' },
  ],

  careerPathway: [
    {
      title: 'CNA (prerequisite)',
      timeframe: 'Current',
      requirements: 'Active Indiana CNA certification required for QMA enrollment',
      salaryRange: '$16–$20/hr',
    },
    {
      title: 'Qualified Medication Aide (QMA)',
      timeframe: 'After 5 weeks',
      requirements: 'Pass Indiana ISDH QMA competency exam',
      salaryRange: '$18–$23/hr',
    },
    {
      title: 'Lead Medication Aide / Charge Aide',
      timeframe: '1–2 years',
      requirements: 'Experience + facility promotion',
      salaryRange: '$20–$26/hr',
    },
    {
      title: 'Licensed Practical Nurse (LPN)',
      timeframe: '12–18 months additional',
      requirements: 'LPN program + NCLEX-PN',
      salaryRange: '$24–$32/hr',
    },
  ],

  curriculum: [
    {
      title: 'Pharmacology Foundations',
      topics: [
        'Drug classifications and mechanisms of action',
        'Medication names: generic vs. brand',
        'Routes of administration: oral, topical, inhaled, sublingual',
        'Dosage calculations and unit conversions',
        'Indiana QMA scope of practice and legal boundaries',
      ],
    },
    {
      title: 'Safe Medication Administration',
      topics: [
        'The 6 rights of medication administration',
        'Medication Administration Record (MAR) documentation',
        'Controlled substance handling and storage',
        'Infection control during medication administration',
        'Aseptic technique for topical and inhaled medications',
      ],
    },
    {
      title: 'Adverse Reactions & Error Prevention',
      topics: [
        'Identifying common adverse drug reactions',
        'Medication error reporting procedures',
        'High-alert medications in long-term care',
        'Drug interactions and contraindications',
        'Resident rights during medication administration',
      ],
    },
    {
      title: 'Clinical Practicum & State Exam Prep',
      topics: [
        'Supervised medication administration in clinical setting',
        'MAR documentation competency assessment',
        'Indiana ISDH QMA exam format and practice questions',
        'Competency skills check-off with supervising RN',
        'State exam registration and scheduling',
      ],
    },
  ],

  weeklySchedule: [
    {
      week: 'Week 1',
      title: 'Pharmacology & Scope of Practice',
      competencyMilestone: 'Identify drug classifications and Indiana QMA legal scope',
    },
    {
      week: 'Week 2',
      title: 'MAR Documentation & Infection Control',
      competencyMilestone: 'Complete MAR documentation accurately on 3 simulated scenarios',
    },
    {
      week: 'Week 3',
      title: 'Medication Administration Lab',
      competencyMilestone: 'Demonstrate oral, topical, and inhaled administration with zero errors',
    },
    {
      week: 'Week 4',
      title: 'Adverse Reactions & Error Reporting',
      competencyMilestone: 'Correctly identify and report 5 adverse reaction scenarios',
    },
    {
      week: 'Week 5',
      title: 'Clinical Practicum & State Exam',
      competencyMilestone: 'Pass Indiana ISDH QMA competency exam (80% required)',
    },
  ],

  laborMarket: {
    medianSalary: 42000,
    salaryRange: '$18–$26/hr',
    growthRate: '5% (2022–2032)',
    source: 'Bureau of Labor Statistics / Indiana DWD',
    sourceYear: 2023,
    region: 'Indiana',
  },

  complianceAlignment: [
    {
      standard: 'Indiana ISDH QMA Certification',
      description: 'Program meets Indiana State Department of Health requirements for QMA certification (410 IAC 16.2-3.1).',
    },
    {
      standard: 'WIOA Title I Adult / Dislocated Worker',
      description: 'Eligible training program on Indiana ETPL. WIOA funding may cover 100% of tuition for eligible residents.',
    },
    {
      standard: 'FSSA IMPACT (SNAP/TANF)',
      description: 'Approved for Indiana SNAP Employment & Training funding for eligible SNAP/TANF recipients.',
    },
    {
      standard: 'CNA Prerequisite Requirement',
      description: 'Applicants must hold an active Indiana CNA certification per ISDH QMA program requirements.',
    },
  ],

  faqs: [
    {
      question: 'Do I need to be a CNA to enroll?',
      answer:
        'Yes. Indiana law requires active CNA certification as a prerequisite for QMA training. If you are not yet a CNA, enroll in our CNA program first.',
    },
    {
      question: 'What medications can a QMA administer?',
      answer:
        'Indiana QMAs may administer oral, topical, inhaled, and sublingual medications in long-term care facilities under the supervision of a licensed nurse. QMAs cannot administer injections or IV medications.',
    },
    {
      question: 'How do I get funded?',
      answer:
        'Indiana residents may qualify for FSSA IMPACT (SNAP/TANF recipients) or WIOA workforce funding. Contact an advisor — we help you apply for every funding source you qualify for.',
    },
    {
      question: 'What is the pass rate for the state exam?',
      answer:
        'Our students pass the Indiana ISDH QMA competency exam at a rate above 90%. Exam prep is built into the final week of the program.',
    },
    {
      question: 'How much more can I earn as a QMA vs. CNA?',
      answer:
        'QMAs typically earn $2–$4/hr more than CNAs in Indiana long-term care facilities. Many facilities also offer shift differentials for QMAs.',
    },
  ],

  breadcrumbs: [
    { label: 'Home', href: '/' },
    { label: 'Programs', href: '/programs' },
    { label: 'Healthcare', href: '/programs/healthcare' },
    { label: 'Qualified Medication Aide (QMA)', href: '/programs/qma' },
  ],

  cta: {
    applyHref: '/programs/qma/apply',
    advisorHref: '/contact?program=qma',
  },

  enrollmentTracks: {
    funded: {
      label: 'FSSA IMPACT or WIOA Funded',
      requirement: 'Indiana residents — SNAP/TANF recipients or WIOA-eligible',
      description:
        'FSSA IMPACT covers 100% of tuition for eligible SNAP/TANF recipients. WIOA workforce funding is also available for qualifying Indiana residents. We help you apply.',
      available: true,
      applyHref: '/programs/qma/apply?track=funded',
    },
    selfPay: {
      label: 'Self-Pay',
      cost: '$1,200',
      description: 'Pay out of pocket with flexible payment plans. Start the next available cohort.',
      available: true,
      applyHref: '/programs/qma/apply?track=self-pay',
    },
  },

  careers: [
    { title: 'Qualified Medication Aide', salary: '$18–$23/hr' },
    { title: 'Lead Medication Aide', salary: '$20–$26/hr' },
    { title: 'Restorative Aide', salary: '$18–$22/hr' },
    { title: 'Home Health Aide (with QMA)', salary: '$17–$22/hr' },
  ],

  employerPartners: [],

  admissionRequirements: [
    'Active Indiana CNA certification (required by Indiana ISDH)',
    'High school diploma or GED',
    'Indiana resident',
    'Background check clearance',
  ],
  equipmentIncluded: 'Textbooks, medication administration supplies, and exam prep materials included.',
  modality: 'Hybrid — classroom instruction and hands-on clinical lab',
  facilityInfo: 'Training held at Elevate for Humanity Indianapolis campus. Clinical practicum at partner long-term care facility.',
  pricingIncludes: [
    'All course materials and textbooks',
    'Medication administration lab supplies',
    'Indiana ISDH QMA exam registration fee',
    'CPR/BLS certification',
    'Career placement support',
  ],
  paymentTerms: 'Payment plans available. FSSA IMPACT and WIOA funding accepted. Contact an advisor to apply for funding.',
};
