/**
 * lib/curriculum/blueprints/index.ts
 *
 * Registry of all credential blueprints.
 * Import from here — do not import individual blueprint files directly.
 *
 * All blueprints use the single CredentialBlueprint type from types.ts.
 * The generator, builder, auditor, and validator all consume that type.
 */

export type {
  CredentialBlueprint,
  BlueprintModule,
  BlueprintLessonRef,
  BlueprintCompetency,
  BlueprintLessonTypeRule,
  BlueprintAssessmentRule,
  BlueprintGenerationRules,
  BlueprintAuditResult,
  BlueprintAuditViolation,
} from './types';

export { validateBlueprint } from './validateBlueprint';

import type { CredentialBlueprint } from './types';

// ── Blueprint registry ────────────────────────────────────────────────────────
// Blueprints are loaded lazily to keep them out of the shared bundle.
// Use getAllBlueprints() or getBlueprintByCredentialSlug() — never import
// individual blueprint files at the top level.

let _registry: CredentialBlueprint[] | null = null;

export async function getAllBlueprints(): Promise<CredentialBlueprint[]> {
  if (_registry) return _registry;
  // hvac-epa-608 blueprint removed — HVAC course is now fully DB-driven
  const [
    { bookkeepingQuickbooksBlueprint },
    { barberApprenticeshipBlueprint },
    { crsIndianaBlueprint },
    { peerRecoverySpecialistBlueprint },
    { CCMA_BLUEPRINT },
    { prsIndianaBlueprint },
  ] = await Promise.all([
    import('./bookkeeping-quickbooks'),
    import('./barber-apprenticeship'),
    import('./crs-indiana'),
    import('./peer-recovery-specialist'),
    import('./ccma'),
    import('./prs-indiana'),
  ]);
  _registry = [
    bookkeepingQuickbooksBlueprint,
    barberApprenticeshipBlueprint,
    crsIndianaBlueprint,
    peerRecoverySpecialistBlueprint,
    CCMA_BLUEPRINT,
    prsIndianaBlueprint,
  ];
  return _registry;
}

export async function getBlueprintByCredentialSlug(
  credentialSlug: string,
): Promise<CredentialBlueprint | null> {
  const registry = await getAllBlueprints();
  return registry.find((bp) => bp.credentialSlug === credentialSlug) ?? null;
}

export async function getBlueprintById(id: string): Promise<CredentialBlueprint | null> {
  const registry = await getAllBlueprints();
  return registry.find((bp) => bp.id === id) ?? null;
}

export async function getBlueprintByProgramSlug(
  programSlug: string,
): Promise<CredentialBlueprint | null> {
  const registry = await getAllBlueprints();
  return registry.find((bp) => bp.programSlug === programSlug) ?? null;
}

/** @deprecated Use getBlueprintById('hvac-epa608-v1') instead */
export async function getHvacBlueprint(): Promise<CredentialBlueprint | null> {
  return getBlueprintById('hvac-epa608-v1');
}
