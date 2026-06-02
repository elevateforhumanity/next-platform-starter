const PROGRAM_INTEREST_ALIASES: Record<string, string> = {
  barbering: 'barber-apprenticeship',
  barber: 'barber-apprenticeship',
  'barber apprenticeship': 'barber-apprenticeship',
  'barber apprentice': 'barber-apprenticeship',
  cdl: 'cdl-training',
  'cdl training': 'cdl-training',
  'cdl class a': 'cdl-training',
};

export function normalizeProgramInterest(programInterest: string | undefined): string | undefined {
  const trimmed = programInterest?.trim();
  if (!trimmed) return undefined;

  const normalized = trimmed.toLowerCase();
  return PROGRAM_INTEREST_ALIASES[normalized] ?? trimmed;
}
