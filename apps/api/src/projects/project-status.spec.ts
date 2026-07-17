import { isValidTransition } from './project-status';
import { ProjectStatus } from '../../generated/prisma/client';

describe('isValidTransition', () => {
  it('allows a no-op transition (same status)', () => {
    expect(isValidTransition(ProjectStatus.ACTIVE, ProjectStatus.ACTIVE)).toBe(
      true,
    );
  });

  it.each([
    [ProjectStatus.DRAFT, ProjectStatus.ACTIVE],
    [ProjectStatus.DRAFT, ProjectStatus.ARCHIVED],
    [ProjectStatus.ACTIVE, ProjectStatus.ON_HOLD],
    [ProjectStatus.ACTIVE, ProjectStatus.COMPLETED],
    [ProjectStatus.ACTIVE, ProjectStatus.ARCHIVED],
    [ProjectStatus.ON_HOLD, ProjectStatus.ACTIVE],
    [ProjectStatus.ON_HOLD, ProjectStatus.ARCHIVED],
    [ProjectStatus.COMPLETED, ProjectStatus.ARCHIVED],
  ])('allows %s -> %s', (from, to) => {
    expect(isValidTransition(from, to)).toBe(true);
  });

  it.each([
    [ProjectStatus.DRAFT, ProjectStatus.COMPLETED],
    [ProjectStatus.DRAFT, ProjectStatus.ON_HOLD],
    [ProjectStatus.ON_HOLD, ProjectStatus.COMPLETED],
    [ProjectStatus.COMPLETED, ProjectStatus.ACTIVE],
    [ProjectStatus.COMPLETED, ProjectStatus.DRAFT],
    [ProjectStatus.ARCHIVED, ProjectStatus.ACTIVE],
    [ProjectStatus.ARCHIVED, ProjectStatus.DRAFT],
  ])('rejects %s -> %s', (from, to) => {
    expect(isValidTransition(from, to)).toBe(false);
  });

  it('never allows a transition out of ARCHIVED', () => {
    for (const to of Object.values(ProjectStatus)) {
      if (to === ProjectStatus.ARCHIVED) continue;
      expect(isValidTransition(ProjectStatus.ARCHIVED, to)).toBe(false);
    }
  });
});
