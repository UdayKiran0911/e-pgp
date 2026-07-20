#!/usr/bin/env node
/**
 * Accessibility (Phase 3 Module 8): checks the design-tokens color pairs
 * actually used for text-on-background combinations against WCAG 2.1 AA
 * contrast thresholds (4.5:1 normal text, 3:1 large text / UI components).
 *
 * Reads packages/design-tokens/src/index.ts directly via regex (no build
 * step required) rather than importing the compiled package — same
 * approach as scripts/ui-audit.js.
 *
 * Usage: pnpm --filter @epg/design-tokens contrast-audit
 */
const fs = require('node:fs');
const path = require('node:path');

const TOKENS_PATH = path.join(
  __dirname,
  '..',
  'packages',
  'design-tokens',
  'src',
  'index.ts',
);

const AA_NORMAL_TEXT = 4.5;
const AA_LARGE_TEXT = 3.0;

// semanticColor entries are references like `color.neutral[900]`, not raw
// hex — resolve those through the `color` scale table extracted below.
function extractColorScale(source) {
  const scale = {};
  const blockMatch = source.match(/export const color = \{([\s\S]*?)\n\} as const;/);
  if (!blockMatch) return scale;
  const block = blockMatch[1];
  const shadeRegex = /(\w+):\s*\{([^}]*)\}/g;
  let shadeMatch;
  while ((shadeMatch = shadeRegex.exec(block))) {
    const [, family, body] = shadeMatch;
    scale[family] = {};
    const entryRegex = /(\d+):\s*'(#[0-9a-fA-F]{6})'/g;
    let entryMatch;
    while ((entryMatch = entryRegex.exec(body))) {
      scale[family][entryMatch[1]] = entryMatch[2];
    }
  }
  return scale;
}

function resolveSemanticColor(source, scale) {
  const blockMatch = source.match(/export const semanticColor = \{([\s\S]*?)\n\} as const;/);
  if (!blockMatch) return {};
  const resolved = {};
  const lineRegex = /(\w+):\s*color\.(\w+)\[(\d+)\]/g;
  let m;
  while ((m = lineRegex.exec(blockMatch[1]))) {
    const [, key, family, shade] = m;
    resolved[key] = scale[family]?.[shade] ?? null;
  }
  return resolved;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function relativeLuminance({ r, g, b }) {
  const [R, G, B] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(hexA, hexB) {
  const lA = relativeLuminance(hexToRgb(hexA));
  const lB = relativeLuminance(hexToRgb(hexB));
  const [lighter, darker] = lA > lB ? [lA, lB] : [lB, lA];
  return (lighter + 0.05) / (darker + 0.05);
}

// Real text-on-background pairs used across the product — see
// UI-standards.md. Add a pair here whenever a new semantic color
// combination is introduced.
const PAIRS_NORMAL_TEXT = [
  ['textPrimary', 'bgBase'],
  ['textPrimary', 'bgSurface'],
  ['textSecondary', 'bgBase'],
  ['textSecondary', 'bgSurface'],
  ['brand', 'bgBase'],
];

const PAIRS_LARGE_TEXT_OR_UI = [
  ['textOnPrimary', 'brand'],
  ['success', 'successBg'],
  ['warning', 'warningBg'],
  ['danger', 'dangerBg'],
];

function main() {
  const source = fs.readFileSync(TOKENS_PATH, 'utf8');
  const scale = extractColorScale(source);
  const semantic = resolveSemanticColor(source, scale);

  let failures = 0;
  const results = [];

  const checkAll = (pairs, threshold, label) => {
    for (const [fgKey, bgKey] of pairs) {
      const fg = semantic[fgKey];
      const bg = semantic[bgKey];
      if (!fg || !bg) {
        console.warn(`contrast-audit: could not resolve ${fgKey}/${bgKey}, skipping.`);
        continue;
      }
      const ratio = contrastRatio(fg, bg);
      const pass = ratio >= threshold;
      if (!pass) failures += 1;
      results.push({ fgKey, bgKey, fg, bg, ratio, pass, label });
    }
  };

  checkAll(PAIRS_NORMAL_TEXT, AA_NORMAL_TEXT, 'normal text (AA 4.5:1)');
  checkAll(PAIRS_LARGE_TEXT_OR_UI, AA_LARGE_TEXT, 'large text/UI (AA 3:1)');

  for (const r of results) {
    const status = r.pass ? 'PASS' : 'FAIL';
    console.log(
      `[${status}] ${r.fgKey} (${r.fg}) on ${r.bgKey} (${r.bg}) — ${r.ratio.toFixed(2)}:1, needs ${r.label}`,
    );
  }

  if (failures > 0) {
    console.error(`\ncontrast-audit: ${failures} pair(s) fail WCAG 2.1 AA.`);
    process.exit(1);
  }
  console.log(`\ncontrast-audit: all ${results.length} checked pairs pass WCAG 2.1 AA.`);
}

main();
