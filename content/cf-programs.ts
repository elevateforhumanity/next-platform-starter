export type MarketingProgram = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  sections: Array<{ heading: string; body: string }>;
};

export const programs: MarketingProgram[] = [
  {
    slug: 'barber-apprenticeship',
    title: 'Barber Apprenticeship',
    summary: 'DOL Registered Apprenticeship in barbering.',
    description: 'Complete 2,000 hours of training (1,500 OJT + 500 RTI) to earn your Indiana Barber License.',
    ctaLabel: 'Apply Now',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
    sections: [
      { heading: 'What you will learn', body: 'Haircutting, sanitation, client service, state-aligned skill development, and practical readiness.' },
      { heading: 'Who this is for', body: 'Learners seeking a structured pathway into barbering with clear progression and support.' },
    ],
  },
  {
    slug: 'hvac-technician',
    title: 'HVAC Technician',
    summary: 'Install, service, and repair heating and cooling systems.',
    description: 'EPA 608 Universal certification proctored on-site. 12 weeks. WIOA and Workforce Ready Grant funding available for eligible Indiana residents.',
    ctaLabel: 'Apply Now',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
    sections: [
      { heading: 'What you will learn', body: 'Refrigeration fundamentals, electrical systems, EPA 608 certification prep, and hands-on equipment service.' },
      { heading: 'Funding available', body: 'WIOA and Indiana Workforce Ready Grant funding available for eligible residents.' },
    ],
  },
  {
    slug: 'cna',
    title: 'Certified Nursing Assistant (CNA)',
    summary: 'Indiana state CNA certification in 6 weeks.',
    description: 'Clinical rotations at licensed healthcare facilities. State exam proctored on-site. WIOA and Workforce Ready Grant funding available for eligible Indiana residents.',
    ctaLabel: 'Apply Now',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
    sections: [
      { heading: 'What you will learn', body: 'Patient care, vital signs, infection control, and clinical skills required for Indiana CNA licensure.' },
      { heading: 'Funding available', body: 'WIOA and Indiana Workforce Ready Grant funding available for eligible residents.' },
    ],
  },
  {
    slug: 'medical-assistant',
    title: 'Medical Assistant',
    summary: 'Prepare for the CCMA certification exam.',
    description: 'Clinical and administrative medical assisting skills in 12 weeks.',
    ctaLabel: 'Apply Now',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
    sections: [
      { heading: 'What you will learn', body: 'Clinical procedures, EHR systems, medical billing basics, and patient communication.' },
      { heading: 'Credential earned', body: 'NHA Certified Clinical Medical Assistant (CCMA).' },
    ],
  },
  {
    slug: 'phlebotomy',
    title: 'Phlebotomy Technician',
    summary: 'Complete 120 hours of classroom and clinical training in 4 weeks.',
    description: 'Prepare for the NHA Certified Phlebotomy Technician (CPT) exam and enter healthcare within a month.',
    ctaLabel: 'Apply Now',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
    sections: [
      { heading: 'What you will learn', body: 'Venipuncture, specimen handling, infection control, and clinical lab procedures.' },
      { heading: 'Credential earned', body: 'NHA Certified Phlebotomy Technician (CPT).' },
    ],
  },
  {
    slug: 'home-health-aide',
    title: 'Home Health Aide Certification',
    summary: 'Become a certified Home Health Aide in 4 weeks.',
    description: 'Earn CCHW and HHA certifications for in-home care careers.',
    ctaLabel: 'Apply Now',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
    sections: [
      { heading: 'What you will learn', body: 'Personal care, medication assistance, patient safety, and documentation for in-home care settings.' },
      { heading: 'Credentials earned', body: 'CCHW and HHA certifications.' },
    ],
  },
  {
    slug: 'cosmetology-apprenticeship',
    title: 'Cosmetology Apprenticeship',
    summary: 'Earn your Indiana cosmetology license through a registered apprenticeship.',
    description: '2,000 hours of supervised training in a licensed salon.',
    ctaLabel: 'Apply Now',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
    sections: [
      { heading: 'What you will learn', body: 'Hair cutting, coloring, chemical services, skin care, and salon business operations.' },
      { heading: 'Credential earned', body: 'Indiana Cosmetology License.' },
    ],
  },
  {
    slug: 'esthetician',
    title: 'Professional Esthetician & Client Services',
    summary: '5-week accelerated non-licensure certificate.',
    description: 'Skin analysis, facial treatments, hair removal, and business startup — WIOA funded.',
    ctaLabel: 'Apply Now',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
    sections: [
      { heading: 'What you will learn', body: 'Skin science, facial treatments, hair removal, client services, and business fundamentals.' },
      { heading: 'Funding available', body: 'WIOA funding available for eligible participants.' },
    ],
  },
  {
    slug: 'nail-technician-apprenticeship',
    title: 'Nail Technician Apprenticeship',
    summary: 'Earn your Indiana nail technician license through a registered apprenticeship.',
    description: '600 hours of supervised training.',
    ctaLabel: 'Apply Now',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
    sections: [
      { heading: 'What you will learn', body: 'Nail care, gel and acrylic application, sanitation, and client services.' },
      { heading: 'Credential earned', body: 'Indiana Nail Technician License.' },
    ],
  },
  {
    slug: 'welding',
    title: 'Welding Technology',
    summary: 'Learn MIG, TIG, and stick welding.',
    description: 'Prepare for AWS certifications and enter the skilled trades workforce in 10 weeks.',
    ctaLabel: 'Apply Now',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
    sections: [
      { heading: 'What you will learn', body: 'MIG, TIG, and stick welding techniques, blueprint reading, and workplace safety.' },
      { heading: 'Credential earned', body: 'AWS welding certifications.' },
    ],
  },
  {
    slug: 'electrical',
    title: 'Electrical Technician',
    summary: 'Learn residential and commercial wiring, electrical theory, and NEC code.',
    description: 'Graduate with OSHA 30 and NCCER credentials in 12 weeks.',
    ctaLabel: 'Apply Now',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
    sections: [
      { heading: 'What you will learn', body: 'Electrical theory, NEC code, residential and commercial wiring, and safety practices.' },
      { heading: 'Credentials earned', body: 'OSHA 30 and NCCER credentials.' },
    ],
  },
  {
    slug: 'plumbing',
    title: 'Plumbing Technician',
    summary: 'Install and repair residential and commercial plumbing systems.',
    description: 'Earn OSHA 10 and NCCER credentials in 10 weeks.',
    ctaLabel: 'Apply Now',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
    sections: [
      { heading: 'What you will learn', body: 'Pipe fitting, fixture installation, drainage systems, and plumbing code.' },
      { heading: 'Credentials earned', body: 'OSHA 10 and NCCER credentials.' },
    ],
  },
  {
    slug: 'cdl-training',
    title: 'CDL Class A Training',
    summary: 'Get your Commercial Driver\'s License.',
    description: 'Hands-on CDL Class A training with job placement support.',
    ctaLabel: 'Apply Now',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
    sections: [
      { heading: 'What you will learn', body: 'Pre-trip inspection, backing maneuvers, road driving, and DOT regulations.' },
      { heading: 'Credential earned', body: 'CDL Class A License.' },
    ],
  },
  {
    slug: 'cybersecurity-analyst',
    title: 'Cybersecurity Analyst',
    summary: 'Protect networks and data from cyber threats.',
    description: 'Prepare for CompTIA Security+ in 12 weeks.',
    ctaLabel: 'Apply Now',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
    sections: [
      { heading: 'What you will learn', body: 'Network security, threat analysis, incident response, and security operations.' },
      { heading: 'Credential earned', body: 'CompTIA Security+.' },
    ],
  },
  {
    slug: 'it-help-desk',
    title: 'IT Help Desk Technician',
    summary: 'Troubleshoot hardware, software, and networks.',
    description: 'Prepare for CompTIA A+ in 8 weeks and launch your IT career.',
    ctaLabel: 'Apply Now',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
    sections: [
      { heading: 'What you will learn', body: 'Hardware troubleshooting, OS support, networking basics, and customer service.' },
      { heading: 'Credential earned', body: 'CompTIA A+.' },
    ],
  },
  {
    slug: 'software-development',
    title: 'Software Development Foundations',
    summary: 'Learn Python, databases, and software engineering fundamentals.',
    description: 'Prepare for IT Specialist certifications in 12 weeks.',
    ctaLabel: 'Apply Now',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
    sections: [
      { heading: 'What you will learn', body: 'Python programming, databases, version control, and software development practices.' },
      { heading: 'Credential earned', body: 'IT Specialist certifications.' },
    ],
  },
  {
    slug: 'web-development',
    title: 'Web Development',
    summary: 'Learn HTML, CSS, JavaScript, and WordPress.',
    description: 'Prepare for Meta Front-End Developer and WordPress certifications in 12 weeks.',
    ctaLabel: 'Apply Now',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
    sections: [
      { heading: 'What you will learn', body: 'HTML, CSS, JavaScript, responsive design, and WordPress development.' },
      { heading: 'Credentials earned', body: 'Meta Front-End Developer and WordPress certifications.' },
    ],
  },
  {
    slug: 'tax-preparation',
    title: 'Tax Preparation',
    summary: 'Earn your IRS PTIN and learn individual and small business tax preparation.',
    description: '8-week program with real tax software training.',
    ctaLabel: 'Apply Now',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
    sections: [
      { heading: 'What you will learn', body: 'Individual and small business returns, IRS regulations, and professional tax software.' },
      { heading: 'Credential earned', body: 'IRS PTIN registration.' },
    ],
  },
  {
    slug: 'bookkeeping',
    title: 'Bookkeeping & QuickBooks',
    summary: 'Master small business accounting.',
    description: 'Prepare for the QuickBooks Certified User exam in 5 weeks.',
    ctaLabel: 'Apply Now',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
    sections: [
      { heading: 'What you will learn', body: 'Accounts payable/receivable, payroll basics, financial reporting, and QuickBooks.' },
      { heading: 'Credential earned', body: 'QuickBooks Certified User.' },
    ],
  },
  {
    slug: 'project-management',
    title: 'Project Management',
    summary: 'Prepare for Certiport Project Management certification.',
    description: 'Agile, Scrum, and traditional PM methodologies in 6 weeks.',
    ctaLabel: 'Apply Now',
    ctaHref: 'https://learn.elevateforhumanity.org/apply',
    sections: [
      { heading: 'What you will learn', body: 'Project planning, Agile/Scrum, risk management, and stakeholder communication.' },
      { heading: 'Credential earned', body: 'Certiport Project Management certification.' },
    ],
  },
];
