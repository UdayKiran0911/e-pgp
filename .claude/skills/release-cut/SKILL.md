---
name: release-cut
description: Bump versions.md for the app(s) that changed, append the matching entries to changelog.md (date, short commit hash, description), and create a git tag. Use when the user asks to cut a release, bump a version, or update the changelog after a set of commits.
---

# Release Cut

Keeps [versions.md](../../../versions.md) and
[changelog.md](../../../changelog.md) accurate and in sync with real git
history — never invent a hash or backdate an entry.

## Steps

1. **Figure out what changed since the last release.** Run
   `git log --oneline <last-tag-or-commit>..HEAD -- apps/web` and the same
   for `apps/api` and `packages/design-tokens` to see which
   app(s)/package(s) actually changed. Don't bump a version for something
   that didn't change.

2. **Decide the bump size per [versions.md](../../../versions.md)'s rule**:
   - MAJOR: breaking API/schema change, or a breaking design-token change.
   - MINOR: new module/feature, backwards compatible.
   - PATCH: bug fix, no contract change.
   If it's ambiguous, ask the user rather than guessing — a MAJOR bump
   communicates something specific to consumers of the API/SDK.

3. **Update `versions.md`**: add a new row under the relevant app's table
   with the new version, today's date (`YYYY-MM-DD`), and a one-line note
   summarizing the change (pull the summary from the actual commits/PR,
   not a generic phrase).

4. **Update `changelog.md`**: for each meaningful commit since the last
   release, add a line at the top in the format
   `YYYY-MM-DD | <short-hash> | <description>`. Get the real date and hash
   with `git log --format="%ad | %h | %s" --date=short <range>` — copy
   these values exactly, never fabricate a hash or date.

5. **Tag the release** (only if the user asks for a tag/actual release,
   not just a changelog update): `git tag -a <app>-v<version> -m "<summary>"`.
   Confirm with the user before pushing tags — pushing is a shared-state
   action per this project's own risk-of-action guidance.

6. **Show the user the diff** to `versions.md` and `changelog.md` before
   considering the task done — these are project-of-record files, worth a
   quick sanity check.

## What NOT to do

- Don't fabricate commit hashes, dates, or descriptions — always pull them
  from `git log`.
- Don't bump every app's version on every release — only the ones that
  actually changed.
- Don't push tags without explicit confirmation.
