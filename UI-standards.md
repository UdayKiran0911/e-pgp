# EPG Platform — UI Standards

**Rule zero: no isolated colors, sizes, or shapes.** Every visual value in
the product — color, spacing, radius, shadow, font size, breakpoint — comes
from exactly one place: [packages/design-tokens](packages/design-tokens).
A component that hardcodes `#1a56ff`, `16px`, or `border-radius: 6px`
instead of importing a token is a bug, not a style choice, even if it
happens to render correctly today. Isolated values are how a product ends
up with fourteen near-identical blues and eleven card corner radii after a
year of feature work — this file exists to stop that before it starts.

## Source of truth

```
packages/design-tokens/src/index.ts        color, spacing, radius, shadow, typography, breakpoint, zIndex
packages/design-tokens/src/antd-theme.ts   maps tokens -> Ant Design ConfigProvider theme
```

Every app wraps its tree in `<ConfigProvider theme={antdTheme}>` (see
`apps/web/src/app/layout.tsx`). Component-level style overrides must
reference token values (`spacing[4]`, `semanticColor.textSecondary`, etc.),
never literals.

## Enforcement

1. **ESLint** — `packages/eslint-config/no-raw-design-values.mjs` is wired
   into every app's `eslint.config.mjs`. It errors on:
   - Raw hex colors (`#fff`, `#1a56ff`) anywhere in `.ts`/`.tsx`/`.js`/`.jsx`.
   - Raw `rgb()`/`rgba()`/`hsl()`/`hsla()` color strings.
   - Raw `px` values assigned to `color`, `background`, `borderRadius`,
     `fontSize`, `padding`, `margin`, `gap`, `width`, `height` style
     properties.
2. **`ui-audit` skill / `pnpm ui-audit`** — run before committing any
   frontend change. Scans changed files for the same violations plus a few
   heuristics ESLint's AST rules can't easily express (inline `<style>`
   blocks, CSS files outside the reset).
3. **Code review** — a PR introducing a new color or spacing value that
   isn't in the token file should add the token first, then use it. If a
   design need doesn't fit an existing token, extend
   `packages/design-tokens`, don't work around it locally.

## What's exempt

- `packages/design-tokens` itself (that's where the literals live).
- Config files (`*.config.{js,ts,mjs}`) — build tooling, not UI.
- Third-party component internals we don't own.

## Component conventions

- **Colors**: use `semanticColor.*` (role-based: `textPrimary`, `bgSurface`,
  `borderDefault`, `danger`, ...) over `color.*` (raw scale) wherever a
  semantic role exists. Reach for `color.*` only when building a new
  semantic mapping in the tokens package itself.
- **Spacing**: all margin/padding/gap values must be one of `spacing[0..24]`
  (4px base unit). No arbitrary `13px` or `18px` gaps.
- **Radius**: `radius.sm|md|lg|full` only. Cards use `lg`, inputs/buttons
  use `md`, pills/avatars use `full`.
- **Typography**: use `typography.size.*` and `typography.weight.*`. Don't
  set `font-size`/`font-weight` to a raw number.
- **Shape consistency**: a given component type (card, button, input,
  modal) uses the same radius and shadow token everywhere it appears. If a
  dashboard card and a modal both need "elevated," they use the same
  `shadow.md`/`shadow.lg` token — not two different rgba blends that happen
  to look similar.
- **Breakpoints**: use `breakpoint.sm|md|lg|xl|xxl` for any responsive
  logic; don't hand-roll a media query with a raw pixel value.

## Accessibility baseline

- Target WCAG 2.1 AA contrast for all `semanticColor` text/background
  pairings (tracked in [roadmap/phase3.md](roadmap/phase3.md), Module 8).
- Every interactive element must be reachable and operable by keyboard.
- Every non-decorative image/icon needs an accessible name.

## Changing the design system

Design tokens are a shared contract across every app in the monorepo.
Changing an existing token value (not adding a new one) is a breaking
change — bump `packages/design-tokens` per [versions.md](versions.md) and
call it out in [changelog.md](changelog.md).
