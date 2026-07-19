import { GovernanceStage } from '../../generated/prisma/client';

// Strictly sequential: a project can only advance to the next stage in
// order, never skip ahead or move backward. CLOSURE is terminal. See
// roadmap/phase5.md Module 6.
const STAGE_ORDER: GovernanceStage[] = [
  GovernanceStage.INITIATION,
  GovernanceStage.PLANNING,
  GovernanceStage.EXECUTION,
  GovernanceStage.MONITORING,
  GovernanceStage.CLOSURE,
];

export function nextGovernanceStage(
  from: GovernanceStage,
): GovernanceStage | null {
  const index = STAGE_ORDER.indexOf(from);
  return STAGE_ORDER[index + 1] ?? null;
}

export function isValidGovernanceTransition(
  from: GovernanceStage,
  to: GovernanceStage,
): boolean {
  if (from === to) return true;
  return nextGovernanceStage(from) === to;
}
