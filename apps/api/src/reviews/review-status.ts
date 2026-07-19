import { ReviewStatus } from '../../generated/prisma/client';

// Approval workflow shared by Architecture/Security/Performance reviews
// (Phase 6 Modules 2, 5, 6): a submitted review must be decided; a
// governance role can send it back for changes, which allows resubmission.
// APPROVED is terminal. See roadmap/phase6.md.
const ALLOWED_TRANSITIONS: Record<ReviewStatus, ReviewStatus[]> = {
  SUBMITTED: [ReviewStatus.APPROVED, ReviewStatus.CHANGES_REQUESTED],
  CHANGES_REQUESTED: [ReviewStatus.SUBMITTED],
  APPROVED: [],
};

export function isValidReviewTransition(
  from: ReviewStatus,
  to: ReviewStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}
