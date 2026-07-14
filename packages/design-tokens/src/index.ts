/**
 * EPG Platform design tokens — the single source of truth for every color,
 * spacing, radius, shadow, and typography value used across the product.
 *
 * Rule: no component may hardcode a raw hex color, px size, or border-radius.
 * Everything must resolve back to a token defined here. See /UI-standards.md
 * for the enforcement policy and the `ui-audit` skill/script that checks it.
 */

export const color = {
  primary: {
    50: '#eef4ff',
    100: '#d9e6ff',
    200: '#b3ccff',
    300: '#80a8ff',
    400: '#4d7dff',
    500: '#1a56ff', // brand primary
    600: '#1443cc',
    700: '#0f3299',
    800: '#0a2166',
    900: '#051133',
  },
  neutral: {
    0: '#ffffff',
    50: '#f7f8fa',
    100: '#eef0f3',
    200: '#dde1e6',
    300: '#c2c8d1',
    400: '#9aa3b0',
    500: '#707a8a',
    600: '#4f5866',
    700: '#363d47',
    800: '#22262c',
    900: '#101216',
  },
  success: { 500: '#1a9d5c', 100: '#dcf5e8' },
  warning: { 500: '#c98a05', 100: '#fbedcd' },
  error: { 500: '#d5372f', 100: '#f9dcda' },
  info: { 500: '#1a56ff', 100: '#d9e6ff' },
} as const;

export const semanticColor = {
  bgBase: color.neutral[0],
  bgSurface: color.neutral[50],
  bgSunken: color.neutral[100],
  borderDefault: color.neutral[200],
  borderStrong: color.neutral[300],
  textPrimary: color.neutral[900],
  textSecondary: color.neutral[600],
  textDisabled: color.neutral[400],
  textOnPrimary: color.neutral[0],
  brand: color.primary[500],
  brandHover: color.primary[600],
  brandActive: color.primary[700],
  success: color.success[500],
  successBg: color.success[100],
  warning: color.warning[500],
  warningBg: color.warning[100],
  danger: color.error[500],
  dangerBg: color.error[100],
} as const;

// 4px base unit — every margin/padding/gap in the product must be one of these.
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

export const radius = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '9999px',
} as const;

export const shadow = {
  sm: '0 1px 2px rgba(16, 18, 22, 0.06)',
  md: '0 2px 8px rgba(16, 18, 22, 0.10)',
  lg: '0 8px 24px rgba(16, 18, 22, 0.14)',
} as const;

export const typography = {
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontFamilyMono: "'JetBrains Mono', 'SF Mono', Consolas, monospace",
  size: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    '2xl': '30px',
    '3xl': '38px',
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    base: 1.5,
    relaxed: 1.75,
  },
} as const;

export const breakpoint = {
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  xxl: '1600px',
} as const;

export const zIndex = {
  dropdown: 1000,
  sticky: 1100,
  overlay: 1200,
  modal: 1300,
  toast: 1400,
  tooltip: 1500,
} as const;

// Fixed max-widths for centered content containers (auth cards, narrow
// forms, dialogs). Not for page layout — use breakpoint for that.
export const containerWidth = {
  xs: '320px',
  sm: '400px',
  md: '480px',
  lg: '640px',
} as const;

export const tokens = {
  color,
  semanticColor,
  spacing,
  radius,
  shadow,
  typography,
  breakpoint,
  zIndex,
  containerWidth,
} as const;

export type Tokens = typeof tokens;
