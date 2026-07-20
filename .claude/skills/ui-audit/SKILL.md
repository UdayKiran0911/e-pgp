---
name: ui-audit
description: Scan changed frontend files in apps/web for UI-standards.md violations - raw hex/rgb colors, arbitrary px sizes, and shape inconsistencies that bypass @epg/design-tokens - and fix them by importing the correct token. Use before committing any apps/web change, or when the user asks to check/fix UI consistency.
---

# UI Audit

Enforces [UI-standards.md](../../../UI-standards.md): rule zero is no
isolated colors, sizes, or shapes outside `packages/design-tokens`. This
skill is the manual/pre-commit companion to the ESLint rule in
`packages/eslint-config/no-raw-design-values.mjs` — same intent, run it
proactively rather than waiting for CI to catch it.

## Steps

1. **Run the scanner**: `pnpm ui-audit` from the repo root (scans the
   working-tree diff vs. HEAD under `apps/web/src` and `apps/web/e2e`). Use
   `pnpm ui-audit --all` to scan every tracked frontend file instead of
   just the diff — do this occasionally, not on every run, since it's
   noisier.

2. **For each violation reported**, open the file and fix it in place:
   - A raw hex/rgb/hsl color → replace with the matching `semanticColor.*`
     (preferred) or `color.*` value from `@epg/design-tokens`. If no
     existing token matches the intended color, don't invent a local
     workaround — add the token to
     `packages/design-tokens/src/index.ts` first (this is a real design
     system change, flag it to the user rather than doing it silently if
     the new color isn't an obvious variant of an existing one).
   - A raw px value on `padding`/`margin`/`gap`/`width`/`height` → replace
     with the nearest `spacing[n]` token. Don't round to a token that
     visually changes the layout without checking — if nothing fits,
     that's a signal the spacing scale itself may need a new step; raise
     it rather than forcing a mismatched value.
   - A raw `border-radius` → `radius.sm|md|lg|full` per the component
     convention in UI-standards.md (cards → `lg`, inputs/buttons → `md`,
     pills/avatars → `full`).
   - A raw `font-size`/`font-weight` → `typography.size.*` /
     `typography.weight.*`.

3. **Re-run** `pnpm ui-audit` (and `pnpm lint` from `apps/web`, which
   covers the same ground via ESLint plus catches anything the script's
   simpler regex approach misses) until clean.

4. **Check shape consistency beyond what the scanner can catch**: scan the
   changed screen for a component type (card, modal, button) that now
   looks different from its counterpart elsewhere in the app — same
   component type should use the same radius/shadow token everywhere. This
   requires judgment, not just grep.

5. **If the change touched `packages/design-tokens/src/index.ts` itself**
   (a new or edited color token), also run `pnpm contrast-audit` — checks
   the real text-on-background token pairs against WCAG 2.1 AA (4.5:1
   normal text, 3:1 large text/UI). A new failure means the token needs a
   darker/lighter shade before it ships, not a suppression — see
   `scripts/contrast-audit.js` for the exact pairs checked and
   `packages/design-tokens/src/index.ts`'s `warning` token for a worked
   example of a real fix (darkened after this check caught it).

## What NOT to do

- Don't suppress a violation with an eslint-disable comment to make the
  scan pass — fix the underlying value.
- Don't add a brand-new token that's a one-off near-duplicate of an
  existing one (e.g. `#1a57ff` next to the existing `color.primary[500]
  #1a56ff`) — reuse the existing token or confirm with the user that a
  genuinely new value is needed.
