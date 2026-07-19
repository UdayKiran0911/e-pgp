import { isValidChangeRequestTransition } from './change-request-status';
import { ChangeRequestStatus } from '../../generated/prisma/client';

describe('isValidChangeRequestTransition', () => {
  it('allows a no-op transition (same status)', () => {
    expect(
      isValidChangeRequestTransition(
        ChangeRequestStatus.SUBMITTED,
        ChangeRequestStatus.SUBMITTED,
      ),
    ).toBe(true);
  });

  it.each([
    [ChangeRequestStatus.SUBMITTED, ChangeRequestStatus.APPROVED],
    [ChangeRequestStatus.SUBMITTED, ChangeRequestStatus.REJECTED],
    [ChangeRequestStatus.APPROVED, ChangeRequestStatus.IMPLEMENTED],
  ])('allows %s -> %s', (from, to) => {
    expect(isValidChangeRequestTransition(from, to)).toBe(true);
  });

  it.each([
    [ChangeRequestStatus.SUBMITTED, ChangeRequestStatus.IMPLEMENTED],
    [ChangeRequestStatus.APPROVED, ChangeRequestStatus.REJECTED],
    [ChangeRequestStatus.APPROVED, ChangeRequestStatus.SUBMITTED],
    [ChangeRequestStatus.REJECTED, ChangeRequestStatus.APPROVED],
    [ChangeRequestStatus.IMPLEMENTED, ChangeRequestStatus.APPROVED],
  ])('rejects %s -> %s', (from, to) => {
    expect(isValidChangeRequestTransition(from, to)).toBe(false);
  });

  it('never allows a transition out of REJECTED or IMPLEMENTED', () => {
    for (const from of [
      ChangeRequestStatus.REJECTED,
      ChangeRequestStatus.IMPLEMENTED,
    ]) {
      for (const to of Object.values(ChangeRequestStatus)) {
        if (to === from) continue;
        expect(isValidChangeRequestTransition(from, to)).toBe(false);
      }
    }
  });
});
