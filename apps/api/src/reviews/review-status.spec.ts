import { isValidReviewTransition } from './review-status';
import { ReviewStatus } from '../../generated/prisma/client';

describe('isValidReviewTransition', () => {
  it('allows a no-op transition (same status)', () => {
    expect(
      isValidReviewTransition(ReviewStatus.SUBMITTED, ReviewStatus.SUBMITTED),
    ).toBe(true);
  });

  it.each([
    [ReviewStatus.SUBMITTED, ReviewStatus.APPROVED],
    [ReviewStatus.SUBMITTED, ReviewStatus.CHANGES_REQUESTED],
    [ReviewStatus.CHANGES_REQUESTED, ReviewStatus.SUBMITTED],
  ])('allows %s -> %s', (from, to) => {
    expect(isValidReviewTransition(from, to)).toBe(true);
  });

  it.each([
    [ReviewStatus.CHANGES_REQUESTED, ReviewStatus.APPROVED],
    [ReviewStatus.APPROVED, ReviewStatus.SUBMITTED],
    [ReviewStatus.APPROVED, ReviewStatus.CHANGES_REQUESTED],
  ])('rejects %s -> %s', (from, to) => {
    expect(isValidReviewTransition(from, to)).toBe(false);
  });

  it('never allows a transition out of APPROVED', () => {
    for (const to of Object.values(ReviewStatus)) {
      if (to === ReviewStatus.APPROVED) continue;
      expect(isValidReviewTransition(ReviewStatus.APPROVED, to)).toBe(false);
    }
  });
});
