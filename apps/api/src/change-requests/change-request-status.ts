import { ChangeRequestStatus } from '../../generated/prisma/client';

// Approval workflow: a submitted request must be decided (approved or
// rejected) before it can move any further. Approved requests can then be
// marked implemented. REJECTED and IMPLEMENTED are terminal — once decided,
// a change request's history is fixed. See roadmap/phase6.md Module 7.
const ALLOWED_TRANSITIONS: Record<ChangeRequestStatus, ChangeRequestStatus[]> =
  {
    SUBMITTED: [ChangeRequestStatus.APPROVED, ChangeRequestStatus.REJECTED],
    APPROVED: [ChangeRequestStatus.IMPLEMENTED],
    REJECTED: [],
    IMPLEMENTED: [],
  };

export function isValidChangeRequestTransition(
  from: ChangeRequestStatus,
  to: ChangeRequestStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}
