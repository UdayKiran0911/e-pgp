import { DeploymentStatus } from '../../generated/prisma/client';

// Deployment Governance (Phase 6 Module 12): a request must be decided
// (approved or blocked) by a governance role. A blocked request can be
// re-requested once the underlying gap is fixed; APPROVED is terminal. See
// roadmap/phase6.md Module 12. The APPROVED decision itself is additionally
// gated in DeploymentApprovalsService — this state machine only governs
// which transitions are structurally legal.
const ALLOWED_TRANSITIONS: Record<DeploymentStatus, DeploymentStatus[]> = {
  REQUESTED: [DeploymentStatus.APPROVED, DeploymentStatus.BLOCKED],
  BLOCKED: [DeploymentStatus.REQUESTED],
  APPROVED: [],
};

export function isValidDeploymentTransition(
  from: DeploymentStatus,
  to: DeploymentStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}
