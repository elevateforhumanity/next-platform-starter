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
    slug: 'hvac-technician',
    title: 'HVAC Technician',
    summary:
      '12-week HVAC program. EPA 608 Universal proctored on-site. WIOA and Workforce Ready Grant funding available.',
    description:
      'Hands-on HVAC training in Indianapolis. Earn EPA 608 Universal, OSHA 10, and CPR certifications.',
    ctaLabel: 'Apply Now',
    ctaHref: '/programs/hvac-technician/apply',
    sections: [
      {
        heading: 'What you will learn',
        body: 'HVAC fundamentals, electrical systems, refrigeration cycle, system installation, diagnostics, and EPA 608 exam prep.',
      },
      { heading: 'Credentials earned', body: 'EPA 608 Universal, OSHA 10, CPR/First Aid.' },
    ],
  },
  {
    slug: 'cna',
    title: 'CNA / Nursing Assistant',
    summary:
      'State-approved CNA training. Pass the Indiana CNA exam and start working in healthcare in 4 weeks.',
    description:
      'Indiana state-approved Certified Nursing Assistant program with clinical hours included.',
    ctaLabel: 'Apply Now',
    ctaHref: '/programs/cna/apply',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Patient care, vital signs, infection control, mobility assistance, and clinical skills.',
      },
      { heading: 'Credential earned', body: 'Indiana CNA Certification.' },
    ],
  },
  {
    slug: 'medical-assistant',
    title: 'Medical Assistant',
    summary:
      'Train as a clinical and administrative medical assistant. NHA CCMA certification included.',
    description:
      'Comprehensive medical assistant program covering clinical skills and healthcare administration.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=medical-assistant',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Vital signs, phlebotomy, EKG, medical billing, scheduling, and HIPAA compliance.',
      },
      { heading: 'Credential earned', body: 'NHA Certified Clinical Medical Assistant (CCMA).' },
    ],
  },
  {
    slug: 'phlebotomy',
    title: 'Phlebotomy',
    summary:
      'NHA CPT certification in 4 weeks. Hands-on venipuncture training with real clinical hours.',
    description:
      'Short-term phlebotomy program with NHA Certified Phlebotomy Technician exam prep.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=phlebotomy',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Venipuncture, capillary collection, specimen handling, and lab safety.',
      },
      { heading: 'Credential earned', body: 'NHA Certified Phlebotomy Technician (CPT).' },
    ],
  },
  {
    slug: 'home-health-aide',
    title: 'Home Health Aide',
    summary: 'Indiana HHA certification in 2 weeks. Care for patients in home settings.',
    description:
      'Indiana-approved Home Health Aide training program with clinical skills included.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=home-health-aide',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Personal care, medication reminders, mobility assistance, and patient safety.',
      },
      { heading: 'Credential earned', body: 'Indiana Home Health Aide Certification.' },
    ],
  },
  {
    slug: 'peer-recovery-specialist',
    title: 'Peer Recovery Specialist',
    summary: 'Indiana CPRS certification. Use your lived experience to support others in recovery.',
    description:
      'Indiana Certified Peer Recovery Specialist training for individuals with lived experience of addiction or mental health challenges.',
    ctaLabel: 'Apply Now',
    ctaHref: '/programs/peer-recovery-specialist/apply',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Peer support principles, motivational interviewing, trauma-informed care, crisis intervention, and CPRS exam prep.',
      },
      { heading: 'Credential earned', body: 'Indiana Certified Peer Recovery Specialist (CPRS).' },
    ],
  },
  {
    slug: 'pharmacy-technician',
    title: 'Pharmacy Technician',
    summary:
      'NHA ExCPT certification training. Work in retail, hospital, or specialty pharmacy settings.',
    description: 'Pharmacy technician program with NHA ExCPT exam prep and hands-on lab training.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=pharmacy-technician',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Medication dispensing, pharmacy law, drug classifications, IV preparation, and billing.',
      },
      { heading: 'Credential earned', body: 'NHA ExCPT Pharmacy Technician Certification.' },
    ],
  },
  {
    slug: 'sanitation-infection-control',
    title: 'Sanitation & Infection Control',
    summary:
      'Master food safety and infection control. ServSafe and OSHA 10 certifications in 2 weeks.',
    description:
      'Short-term credential program for healthcare, food service, and hospitality workers.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=sanitation-infection-control',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Food safety regulations, infection control protocols, PPE use, and OSHA standards.',
      },
      { heading: 'Credentials earned', body: 'ServSafe Food Manager and OSHA 10 certifications.' },
    ],
  },
  {
    slug: 'cpr-first-aid',
    title: 'CPR & First Aid',
    summary:
      'AHA-certified CPR, AED, and First Aid training. Required for healthcare, childcare, and many workplaces.',
    description: 'Short-term CPR and First Aid certification for individuals and workplace teams.',
    ctaLabel: 'Register Now',
    ctaHref: '/apply?program=cpr-first-aid',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Adult, child, and infant CPR, AED use, choking response, and basic first aid.',
      },
      {
        heading: 'Credential earned',
        body: 'American Heart Association CPR/AED/First Aid Certification.',
      },
    ],
  },
  {
    slug: 'emergency-health-safety',
    title: 'Emergency Health & Safety',
    summary:
      'OSHA 30, CPR, First Aid, and emergency response training for healthcare and industrial settings.',
    description:
      'Comprehensive emergency health and safety program for workplace safety professionals.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=emergency-health-safety',
    sections: [
      {
        heading: 'What you will learn',
        body: 'OSHA standards, emergency response, CPR/AED, first aid, and incident reporting.',
      },
      { heading: 'Credentials earned', body: 'OSHA 30 + AHA CPR/First Aid.' },
    ],
  },
  {
    slug: 'welding',
    title: 'Welding',
    summary: 'AWS-certified welding training. MIG, TIG, and stick welding. Job-ready in 12 weeks.',
    description: 'Hands-on welding program with AWS certification and OSHA 10.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=welding',
    sections: [
      {
        heading: 'What you will learn',
        body: 'MIG, TIG, and stick welding, blueprint reading, metal fabrication, and AWS certification prep.',
      },
      { heading: 'Credentials earned', body: 'AWS Certified Welder + OSHA 10.' },
    ],
  },
  {
    slug: 'electrical',
    title: 'Electrical',
    summary:
      'NCCER electrical training with OSHA 10. Pathway to apprenticeship and journeyman licensure.',
    description:
      'Electrical training program covering residential and commercial wiring, NEC code, and safety.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=electrical',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Electrical theory, wiring, conduit bending, NEC code, panel installation, and OSHA safety.',
      },
      { heading: 'Credentials earned', body: 'NCCER Electrical + OSHA 10.' },
    ],
  },
  {
    slug: 'plumbing',
    title: 'Plumbing',
    summary:
      'NCCER plumbing training with OSHA 10. Pathway to apprenticeship and journeyman licensure.',
    description:
      'Plumbing training program covering pipe fitting, drainage systems, and code compliance.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=plumbing',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Pipe fitting, drainage systems, water supply, plumbing code, and OSHA safety.',
      },
      { heading: 'Credentials earned', body: 'NCCER Plumbing + OSHA 10.' },
    ],
  },
  {
    slug: 'construction-trades-certification',
    title: 'Construction Trades Certification',
    summary:
      'NCCER Core credentials and OSHA 10 in construction fundamentals. Union pathway available.',
    description:
      'Entry-level construction trades program covering carpentry, concrete, and site safety.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=construction-trades-certification',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Construction safety, hand and power tools, blueprint reading, concrete, and carpentry basics.',
      },
      { heading: 'Credentials earned', body: 'NCCER Core Curriculum + OSHA 10.' },
    ],
  },
  {
    slug: 'diesel-mechanic',
    title: 'Diesel Mechanic',
    summary:
      'Train as a diesel technician. ASE certification prep for engines, brakes, and electrical systems.',
    description: 'Diesel mechanic training for aspiring heavy equipment and truck technicians.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=diesel-mechanic',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Diesel engine systems, fuel injection, brakes, electrical diagnostics, and preventive maintenance.',
      },
      { heading: 'Credential earned', body: 'ASE Diesel Technician Certification.' },
    ],
  },
  {
    slug: 'forklift',
    title: 'Forklift Operator Certification',
    summary:
      'OSHA-compliant forklift certification in 1 week. Hands-on training on sit-down and reach truck forklifts.',
    description: 'Short-term forklift operator certification for warehouse and logistics workers.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=forklift',
    sections: [
      {
        heading: 'What you will learn',
        body: 'OSHA safety standards, forklift operation, load handling, and dock operations.',
      },
      { heading: 'Credential earned', body: 'OSHA-Compliant Forklift Operator Certification.' },
    ],
  },
  {
    slug: 'cdl-training',
    title: 'CDL Training',
    summary:
      "Commercial Driver's License training. Class A CDL with endorsements. Job placement assistance.",
    description:
      'CDL training program for aspiring truck drivers and transportation professionals.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=cdl-training',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Pre-trip inspection, backing maneuvers, shifting, coupling/uncoupling, and DOT regulations.',
      },
      { heading: 'Credential earned', body: "Class A Commercial Driver's License (CDL)." },
    ],
  },
  {
    slug: 'cosmetology-apprenticeship',
    title: 'Cosmetology Apprenticeship',
    summary:
      'Earn your Indiana Cosmetology License while getting paid to train at a licensed salon.',
    description: 'DOL Registered Apprenticeship — 1,500 hours. Wages from day one.',
    ctaLabel: 'Apply Now',
    ctaHref: '/programs/cosmetology-apprenticeship/apply',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Hair cutting, coloring, chemical services, skin care, nail care, and salon business operations.',
      },
      { heading: 'Credential earned', body: 'Indiana Cosmetology License.' },
    ],
  },
  {
    slug: 'esthetician',
    title: 'Esthetician',
    summary:
      'Indiana Esthetician License training. Skin care, facials, waxing, and makeup artistry.',
    description: 'Indiana-approved esthetician program with state board exam prep.',
    ctaLabel: 'Apply Now',
    ctaHref: '/programs/esthetician/apply',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Skin analysis, facials, chemical peels, waxing, makeup, and Indiana state board prep.',
      },
      { heading: 'Credential earned', body: 'Indiana Esthetician License.' },
    ],
  },
  {
    slug: 'nail-technician-apprenticeship',
    title: 'Nail Technician Apprenticeship',
    summary:
      'Earn your Indiana Nail Technician License while getting paid to train at a licensed salon.',
    description: 'DOL Registered Apprenticeship — 450 hours. Wages from day one.',
    ctaLabel: 'Apply Now',
    ctaHref: '/programs/nail-technician-apprenticeship/apply',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Manicures, pedicures, nail enhancements, nail art, sanitation, and Indiana state board prep.',
      },
      { heading: 'Credential earned', body: 'Indiana Nail Technician License.' },
    ],
  },
  {
    slug: 'barber-apprenticeship',
    title: 'Barber Apprenticeship',
    summary:
      'Earn your Indiana Barber License while getting paid to train at a licensed barbershop.',
    description: 'DOL Registered Apprenticeship — 2,000 hours. Wages from day one.',
    ctaLabel: 'Apply Now',
    ctaHref: '/programs/barber-apprenticeship/apply',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Cutting, fading, shaving, beard grooming, hair design, and barbershop business operations.',
      },
      { heading: 'Credential earned', body: 'Indiana Barber License.' },
    ],
  },
  {
    slug: 'beauty-career-educator',
    title: 'Beauty & Career Educator Training',
    summary:
      'Become a licensed cosmetology or barber instructor. Teach the next generation of beauty professionals.',
    description: 'Indiana instructor licensure pathway for licensed cosmetologists and barbers.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=beauty-career-educator',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Teaching methods, curriculum design, student assessment, and Indiana cosmetology law.',
      },
      { heading: 'Credential earned', body: 'Indiana Cosmetology Instructor License.' },
    ],
  },
  {
    slug: 'culinary-apprenticeship',
    title: 'Culinary Apprenticeship',
    summary:
      'Earn while you learn in a professional kitchen. DOL Registered Apprenticeship with wages from day one.',
    description: 'Culinary arts apprenticeship for aspiring chefs and food service professionals.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=culinary-apprenticeship',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Knife skills, cooking techniques, menu planning, food safety, and kitchen management.',
      },
      { heading: 'Credential earned', body: 'ServSafe Food Manager + Culinary Arts Certificate.' },
    ],
  },
  {
    slug: 'cybersecurity-analyst',
    title: 'Cybersecurity Analyst',
    summary:
      'CompTIA Security+ certification training. Protect networks, detect threats, and respond to incidents.',
    description:
      'Cybersecurity analyst program with CompTIA Security+ exam prep and hands-on labs.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=cybersecurity-analyst',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Network security, threat detection, incident response, cryptography, and compliance.',
      },
      { heading: 'Credential earned', body: 'CompTIA Security+.' },
    ],
  },
  {
    slug: 'it-help-desk',
    title: 'IT Help Desk',
    summary: 'CompTIA A+ certification training. Launch your IT career in 12 weeks.',
    description:
      'IT help desk program with CompTIA A+ exam prep and hands-on technical support training.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=it-help-desk',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Hardware, operating systems, networking, security, and help desk procedures.',
      },
      { heading: 'Credential earned', body: 'CompTIA A+.' },
    ],
  },
  {
    slug: 'network-administration',
    title: 'Network Administration',
    summary:
      'CompTIA Network+ certification training. Configure, manage, and troubleshoot enterprise networks.',
    description:
      'Network administration program for aspiring network technicians and administrators.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=network-administration',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Network infrastructure, TCP/IP, routing and switching, wireless, and network security.',
      },
      { heading: 'Credential earned', body: 'CompTIA Network+.' },
    ],
  },
  {
    slug: 'network-support-technician',
    title: 'Network Support Technician',
    summary: 'Entry-level network support training. CompTIA A+ and Network+ certification prep.',
    description: 'Network support technician program for aspiring IT professionals.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=network-support-technician',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Hardware support, network configuration, troubleshooting, and help desk procedures.',
      },
      { heading: 'Credentials earned', body: 'CompTIA A+ + Network+.' },
    ],
  },
  {
    slug: 'software-development',
    title: 'Software Development',
    summary:
      'Full-stack web development training. JavaScript, React, Node.js, and databases. Portfolio included.',
    description: 'Software development program for aspiring full-stack developers.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=software-development',
    sections: [
      {
        heading: 'What you will learn',
        body: 'HTML, CSS, JavaScript, React, Node.js, SQL, and Git version control.',
      },
      {
        heading: 'Credential earned',
        body: 'Software Development Certificate + GitHub portfolio.',
      },
    ],
  },
  {
    slug: 'web-development',
    title: 'Web Development',
    summary:
      'Build websites and web apps. HTML, CSS, JavaScript, and WordPress. Job-ready in 12 weeks.',
    description: 'Web development program for aspiring front-end developers and web designers.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=web-development',
    sections: [
      {
        heading: 'What you will learn',
        body: 'HTML, CSS, JavaScript, responsive design, WordPress, and basic SEO.',
      },
      { heading: 'Credential earned', body: 'Web Development Certificate + portfolio.' },
    ],
  },
  {
    slug: 'technology',
    title: 'Technology Career Training',
    summary:
      'Launch a tech career with CompTIA A+ certification. IT support, networking, and cybersecurity fundamentals.',
    description:
      '12-week technology training program covering IT support, networking, and security.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=technology',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Hardware, operating systems, networking, security, and CompTIA A+ exam prep.',
      },
      { heading: 'Credential earned', body: 'CompTIA A+.' },
    ],
  },
  {
    slug: 'tax-preparation',
    title: 'Tax Preparation',
    summary: 'IRS AFSP certification training. Prepare individual and small business tax returns.',
    description: 'Tax preparation program with IRS Annual Filing Season Program (AFSP) exam prep.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=tax-preparation',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Individual tax returns, deductions, credits, small business taxes, and IRS e-filing.',
      },
      {
        heading: 'Credential earned',
        body: 'IRS Annual Filing Season Program (AFSP) Certificate.',
      },
    ],
  },
  {
    slug: 'bookkeeping',
    title: 'Bookkeeping',
    summary: 'Master double-entry bookkeeping, QuickBooks, and payroll. Earn NACPB certification.',
    description:
      'Short-term bookkeeping program for small business owners and aspiring accounting professionals.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=bookkeeping',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Accounts payable/receivable, bank reconciliation, payroll, QuickBooks, and financial reporting.',
      },
      { heading: 'Credential earned', body: 'NACPB Bookkeeping Certification.' },
    ],
  },
  {
    slug: 'business-administration',
    title: 'Business Administration',
    summary:
      'Build core business skills in management, operations, HR, and finance. Microsoft Office certification included.',
    description:
      'Comprehensive business administration program for aspiring managers and entrepreneurs.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=business-administration',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Business operations, HR fundamentals, financial management, project coordination, and Microsoft Office.',
      },
      {
        heading: 'Credential earned',
        body: 'Business Administration Certificate + Microsoft Office Specialist.',
      },
    ],
  },
  {
    slug: 'project-management',
    title: 'Project Management',
    summary:
      'CAPM and PMP exam prep. Agile, Scrum, and traditional project management methodologies.',
    description: 'Project management program for aspiring project managers and team leads.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=project-management',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Project lifecycle, scope management, scheduling, budgeting, risk management, and Agile/Scrum.',
      },
      { heading: 'Credential earned', body: 'CAPM (PMI) or PMP exam prep certificate.' },
    ],
  },
  {
    slug: 'entrepreneurship',
    title: 'Entrepreneurship',
    summary:
      'Launch your own business. Business planning, marketing, finance, and legal fundamentals.',
    description:
      'Entrepreneurship training for aspiring small business owners and self-employed professionals.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=entrepreneurship',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Business plan development, market research, financial projections, legal structure, and marketing.',
      },
      { heading: 'Credential earned', body: 'Entrepreneurship Certificate.' },
    ],
  },
  {
    slug: 'office-administration',
    title: 'Office Administration',
    summary:
      'Microsoft Office Specialist certification and professional office skills. Job-ready in 8 weeks.',
    description:
      'Office administration program for aspiring administrative assistants and office managers.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=office-administration',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Microsoft Word, Excel, Outlook, PowerPoint, office procedures, and business communication.',
      },
      { heading: 'Credential earned', body: 'Microsoft Office Specialist (MOS).' },
    ],
  },
  {
    slug: 'graphic-design',
    title: 'Graphic Design',
    summary:
      'Master Adobe Creative Suite and build a professional portfolio. Adobe Certified Professional exam included.',
    description: 'Graphic design program for aspiring designers and creative professionals.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=graphic-design',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Adobe Photoshop, Illustrator, InDesign, typography, color theory, and portfolio development.',
      },
      { heading: 'Credential earned', body: 'Adobe Certified Professional.' },
    ],
  },
  {
    slug: 'cad-drafting',
    title: 'CAD / Drafting',
    summary:
      'Learn AutoCAD and technical drafting for architecture, engineering, and manufacturing.',
    description: 'CAD and technical drafting program for aspiring designers and drafters.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=cad-drafting',
    sections: [
      {
        heading: 'What you will learn',
        body: '2D and 3D drafting, AutoCAD, blueprint reading, and industry drawing standards.',
      },
      { heading: 'Credential earned', body: 'Autodesk AutoCAD Certified User.' },
    ],
  },
  {
    slug: 'hospitality',
    title: 'Hospitality & Customer Service',
    summary:
      'Build a career in hotels, restaurants, and event services. ServSafe certification included.',
    description:
      '8-week hospitality training program covering front desk, food service, and event coordination.',
    ctaLabel: 'Apply Now',
    ctaHref: '/apply?program=hospitality',
    sections: [
      {
        heading: 'What you will learn',
        body: 'Front desk operations, guest relations, food service, ServSafe, and event coordination.',
      },
      { heading: 'Credentials earned', body: 'Hospitality Certificate + ServSafe Food Handler.' },
    ],
  },
];
