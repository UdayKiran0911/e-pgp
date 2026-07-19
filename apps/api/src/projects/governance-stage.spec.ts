import {
  isValidGovernanceTransition,
  nextGovernanceStage,
} from './governance-stage';
import { GovernanceStage } from '../../generated/prisma/client';

describe('nextGovernanceStage', () => {
  it.each([
    [GovernanceStage.INITIATION, GovernanceStage.PLANNING],
    [GovernanceStage.PLANNING, GovernanceStage.EXECUTION],
    [GovernanceStage.EXECUTION, GovernanceStage.MONITORING],
    [GovernanceStage.MONITORING, GovernanceStage.CLOSURE],
  ])('returns %s -> %s', (from, to) => {
    expect(nextGovernanceStage(from)).toBe(to);
  });

  it('returns null after the terminal stage', () => {
    expect(nextGovernanceStage(GovernanceStage.CLOSURE)).toBeNull();
  });
});

describe('isValidGovernanceTransition', () => {
  it('allows a no-op transition (same stage)', () => {
    expect(
      isValidGovernanceTransition(
        GovernanceStage.PLANNING,
        GovernanceStage.PLANNING,
      ),
    ).toBe(true);
  });

  it('allows advancing exactly one stage', () => {
    expect(
      isValidGovernanceTransition(
        GovernanceStage.INITIATION,
        GovernanceStage.PLANNING,
      ),
    ).toBe(true);
  });

  it('rejects skipping a stage', () => {
    expect(
      isValidGovernanceTransition(
        GovernanceStage.INITIATION,
        GovernanceStage.EXECUTION,
      ),
    ).toBe(false);
  });

  it('rejects moving backward', () => {
    expect(
      isValidGovernanceTransition(
        GovernanceStage.PLANNING,
        GovernanceStage.INITIATION,
      ),
    ).toBe(false);
  });

  it('never allows a transition out of CLOSURE', () => {
    for (const to of Object.values(GovernanceStage)) {
      if (to === GovernanceStage.CLOSURE) continue;
      expect(isValidGovernanceTransition(GovernanceStage.CLOSURE, to)).toBe(
        false,
      );
    }
  });
});
