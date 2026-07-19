import { isValidDeploymentTransition } from './deployment-status';
import { DeploymentStatus } from '../../generated/prisma/client';

describe('isValidDeploymentTransition', () => {
  it('allows a no-op transition (same status)', () => {
    expect(
      isValidDeploymentTransition(
        DeploymentStatus.REQUESTED,
        DeploymentStatus.REQUESTED,
      ),
    ).toBe(true);
  });

  it.each([
    [DeploymentStatus.REQUESTED, DeploymentStatus.APPROVED],
    [DeploymentStatus.REQUESTED, DeploymentStatus.BLOCKED],
    [DeploymentStatus.BLOCKED, DeploymentStatus.REQUESTED],
  ])('allows %s -> %s', (from, to) => {
    expect(isValidDeploymentTransition(from, to)).toBe(true);
  });

  it.each([
    [DeploymentStatus.BLOCKED, DeploymentStatus.APPROVED],
    [DeploymentStatus.APPROVED, DeploymentStatus.REQUESTED],
    [DeploymentStatus.APPROVED, DeploymentStatus.BLOCKED],
  ])('rejects %s -> %s', (from, to) => {
    expect(isValidDeploymentTransition(from, to)).toBe(false);
  });

  it('never allows a transition out of APPROVED', () => {
    for (const to of Object.values(DeploymentStatus)) {
      if (to === DeploymentStatus.APPROVED) continue;
      expect(
        isValidDeploymentTransition(DeploymentStatus.APPROVED, to),
      ).toBe(false);
    }
  });
});
