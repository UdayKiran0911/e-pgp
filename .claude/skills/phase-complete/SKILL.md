---
name: phase-complete
description: Move a fully-checked-off roadmap/phaseN.md into roadmap_completed/, log it in roadmap_completed.md and changelog.md, and update roadmap.md's status table. Use when every checkbox in a phase file is [x], or the user says a phase is done / asks to close out a phase.
---

# Phase Complete

Formalizes moving a finished phase from the active roadmap to the
completed log, so `roadmap.md` always reflects what's actually done versus
in flight.

## Preconditions — verify, don't assume

1. Open `roadmap/phaseN.md` and confirm **every** checkbox (Modules, Tasks,
   Subtasks, Activities, and the Deliverables Checklist at the bottom) is
   `[x]`. If anything is still `[ ]`, stop and tell the user what's
   outstanding — do not move a partially-done phase. If the user insists on
   moving it anyway, ask them to explicitly confirm that's intended before
   proceeding.

## Steps

1. **Move the file**: `roadmap/phaseN.md` → `roadmap_completed/phaseN.md`
   (use `git mv` so history follows the file).

2. **Update `roadmap_completed.md`**: add a row to the table —
   `| N | <Title> | <today's date, YYYY-MM-DD> | roadmap_completed/phaseN.md | <changelog entry link/description> |`
   — newest entries at the top of the table. Remove the "_No phases
   completed yet._" placeholder line if it's still present.

3. **Update `roadmap.md`**: change that phase's row in the Phases table to
   link to `roadmap_completed/phaseN.md` instead of `roadmap/phaseN.md`,
   and set Status to "Completed". Update the "Current focus" section if it
   references this phase.

4. **Update `changelog.md`**: add an entry at the top —
   `YYYY-MM-DD | <short-hash-once-committed> | Phase N (<Title>) completed.`
   — you won't have the final hash until the commit exists, so either
   commit first and then fill in the hash, or leave a `TBD` placeholder and
   fix it in the same commit's follow-up if the user is scripting this
   across multiple steps.

5. **Bump `versions.md`** if this phase's completion corresponds to a
   shippable milestone for one of the apps (use judgment — not every phase
   maps to a version bump; Phase 5/6 module completions usually do, Phase 0
   discovery work usually doesn't). If in doubt, ask the user rather than
   silently bumping or silently skipping.

6. **Report back**: tell the user which phase moved, and what (if
   anything) is next per `roadmap.md`'s remaining "Not Started"/"In
   Progress" phases.

## What NOT to do

- Don't delete the phase file — it must exist in exactly one of
  `roadmap/` or `roadmap_completed/` at all times, never neither.
- Don't mark a phase "Completed" in `roadmap.md` without actually moving
  the file — the two must stay in sync.
- Don't invent a changelog description — base it on the phase's title and
  Deliverables Checklist, not generic boilerplate.
