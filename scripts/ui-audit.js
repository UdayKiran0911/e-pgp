#!/usr/bin/env node
/**
 * Scans changed frontend files (working tree + staged, vs. HEAD) for
 * UI-standards.md violations: raw hex/rgb colors and raw px sizes outside
 * packages/design-tokens. This is a fast pre-commit companion to the
 * ESLint rule in packages/eslint-config/no-raw-design-values.mjs — same
 * intent, but runs over the diff instead of requiring a full lint pass.
 *
 * Usage: pnpm ui-audit [--all]
 *   --all   scan every tracked frontend file instead of just the diff
 */
const { execSync } = require('node:child_process');
const fs = require('node:fs');

const HEX_COLOR = /#([0-9a-fA-F]{3}){1,2}([0-9a-fA-F]{2})?\b/g;
const FUNC_COLOR = /\b(rgb|rgba|hsl|hsla)\(/g;
const RAW_PX = /:\s*['"]?\d+(\.\d+)?px['"]?/g;

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css']);
const EXEMPT_PATH_PARTS = ['design-tokens', 'node_modules', '.next', 'dist', '.config.'];

function isExempt(filePath) {
  return EXEMPT_PATH_PARTS.some((part) => filePath.includes(part));
}

function getFilesToScan() {
  const scanAll = process.argv.includes('--all');
  const cmd = scanAll
    ? 'git ls-files -- "apps/web/src" "apps/web/e2e"'
    : 'git diff --name-only --diff-filter=ACMR HEAD -- "apps/web/src" "apps/web/e2e"';

  let output;
  try {
    output = execSync(cmd, { encoding: 'utf8' });
  } catch {
    return [];
  }

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((file) => EXTENSIONS.has(file.slice(file.lastIndexOf('.'))))
    .filter((file) => !isExempt(file))
    .filter((file) => fs.existsSync(file));
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const violations = [];

  content.split('\n').forEach((line, idx) => {
    const lineNo = idx + 1;
    if (HEX_COLOR.test(line)) violations.push({ lineNo, line, kind: 'raw hex color' });
    if (FUNC_COLOR.test(line)) violations.push({ lineNo, line, kind: 'raw rgb()/hsl() color' });
    if (RAW_PX.test(line)) violations.push({ lineNo, line, kind: 'raw px value' });
    // reset regex lastIndex (global flag + .test() in a loop is stateful)
    HEX_COLOR.lastIndex = 0;
    FUNC_COLOR.lastIndex = 0;
    RAW_PX.lastIndex = 0;
  });

  return violations;
}

function main() {
  const files = getFilesToScan();
  let violationCount = 0;

  for (const file of files) {
    const violations = scanFile(file);
    for (const v of violations) {
      violationCount += 1;
      console.error(`${file}:${v.lineNo}  ${v.kind}\n    ${v.line.trim()}`);
    }
  }

  if (violationCount > 0) {
    console.error(
      `\nui-audit: ${violationCount} UI-standards.md violation(s) found. Use a token from @epg/design-tokens instead.`
    );
    process.exit(1);
  }

  console.log(`ui-audit: clean (${files.length} file(s) scanned).`);
}

main();
