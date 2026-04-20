export const programPricing: Record<string, number> = {};
export function getProgramPrice(slug: string) { return programPricing[slug] ?? 0; }
