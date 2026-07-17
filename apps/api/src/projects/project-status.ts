import { ProjectStatus } from '../../generated/prisma/client';

// Governed lifecycle: ARCHIVED is terminal, every other status can always
// step to ARCHIVED as an escape hatch. See roadmap/phase5.md Module 5.
const ALLOWED_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: [ProjectStatus.ACTIVE, ProjectStatus.ARCHIVED],
  ACTIVE: [
    ProjectStatus.ON_HOLD,
    ProjectStatus.COMPLETED,
    ProjectStatus.ARCHIVED,
  ],
  ON_HOLD: [ProjectStatus.ACTIVE, ProjectStatus.ARCHIVED],
  COMPLETED: [ProjectStatus.ARCHIVED],
  ARCHIVED: [],
};

export function isValidTransition(
  from: ProjectStatus,
  to: ProjectStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}
