export const heroConfig: Record<string, { title: string; subtitle: string }> = {};
export function getHeroConfig(slug: string) { return heroConfig[slug] ?? null; }
