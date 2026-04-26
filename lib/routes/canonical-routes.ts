import canonicalRoutesConfig from './canonical-routes.json';

export const canonicalRoutes = canonicalRoutesConfig.canonicalRoutes;
export const legacyRouteAliases = canonicalRoutesConfig.legacyAliases;
export const railwayOnlyRoutePrefixes = canonicalRoutesConfig.railwayOnlyPrefixes;
export const externalOrAppHostedAllowlist = canonicalRoutesConfig.externalOrAppHostedAllowlist;

export const legacyAliasLookup = new Map(
  legacyRouteAliases.map((alias) => [alias.source, alias.destination]),
);

