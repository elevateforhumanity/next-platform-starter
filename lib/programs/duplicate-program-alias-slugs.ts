/**
 * Public program slugs that are aliases or retired duplicates of canonical programs.
 *
 * These may still exist in live `programs` rows, hero banner data, legacy intake
 * links, or old marketing URLs. Keep them out of public catalog/listing surfaces
 * so learners see one card per actual program.
 */
export const DUPLICATE_PROGRAM_ALIAS_SLUGS = [
  // Healthcare
  'cna-cert',
  'cna-certification',
  'certified-nursing-assistant',
  'cna-training',
  'medical-assistant-program',
  'nha-medical-assistant',
  'nha-pharmacy-technician',
  'nha-phlebotomy',
  'phlebotomy-technician',
  'phlebotomy-technician-program',
  'health-safety',
  'emergency-health-safety-tech',

  // Skilled trades
  'hvac',
  'hvac-tech',
  'hvac-technician-program',
  'hvac-technician-wrg',
  'hvac-2024',
  'forklift-operator',
  'cdl',
  'cdl-transportation',
  'building-maintenance',
  'building-maintenance-tech',

  // Beauty and personal services
  'barber',
  'barber-program',
  'cosmetology',
  'nail-technician',
  'nail-tech',

  // Business, technology, and human services
  'tax-prep',
  'it-support',
  'it-support-specialist',
  'cybersecurity',
  'bookkeeping-fundamentals',
  'entrepreneurship-small-business',
  'peer-recovery-specialist-jri',
  'peer-recovery',
  'peer-recovery-coach',
  'peer-support',
  'recovery-coach',
] as const;

export const DUPLICATE_PROGRAM_ALIAS_SLUG_SET = new Set<string>(
  DUPLICATE_PROGRAM_ALIAS_SLUGS,
);
