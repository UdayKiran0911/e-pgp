import type { CSSProperties } from 'react';
import { glass, gradient, radius, shadow } from '@epg/design-tokens';

/**
 * Shared "Glass Gradient" surface styles, composed entirely from
 * @epg/design-tokens — never hardcode rgba()/blur()/px here or in a
 * consuming component. See UI-standards.md.
 */
export const glassPanelStyle: CSSProperties = {
  background: glass.surface,
  backdropFilter: glass.blurMd,
  WebkitBackdropFilter: glass.blurMd,
  border: glass.border,
  borderRadius: radius.md,
  boxShadow: shadow.glow,
};

export const glassPanelStrongStyle: CSSProperties = {
  ...glassPanelStyle,
  background: glass.surfaceStrong,
  border: glass.borderStrong,
};

export const glassHeaderStyle: CSSProperties = {
  background: glass.surfaceStrong,
  backdropFilter: glass.blurLg,
  WebkitBackdropFilter: glass.blurLg,
  borderBottom: glass.border,
  boxShadow: shadow.md,
};

export const glassSiderStyle: CSSProperties = {
  background: glass.surfaceStrong,
  backdropFilter: glass.blurLg,
  WebkitBackdropFilter: glass.blurLg,
  borderRight: glass.border,
};

export const pageBackgroundStyle: CSSProperties = {
  background: gradient.pageMesh,
  minHeight: '100vh',
};

export const gradientTextStyle: CSSProperties = {
  background: gradient.accent,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};
