#!/usr/bin/env node
// Phase 4 Module 2 (Entity Relationship Model): generates a Mermaid ER
// diagram from apps/api/prisma/schema.prisma via regex parsing — no build
// step, no external ERD tool, same "parse the schema source directly"
// approach as scripts/ui-audit.js and scripts/contrast-audit.js use for
// design-tokens. Re-run whenever the schema changes; it is not watched or
// enforced in CI, just a `pnpm generate:er-diagram` convenience script.
const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = path.join(
  __dirname,
  '..',
  'apps',
  'api',
  'prisma',
  'schema.prisma',
);
const OUTPUT_PATH = path.join(__dirname, '..', 'docs', 'ER_DIAGRAM.md');

function toSnakeUpper(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

function parseModels(source) {
  const modelRegex = /model\s+(\w+)\s*\{([^}]*)\}/gs;
  const models = [];
  let match;
  while ((match = modelRegex.exec(source)) !== null) {
    const [, name, body] = match;
    models.push({ name, body });
  }
  return models;
}

function parseFields(body) {
  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('//') && !l.startsWith('@@'));

  const fields = [];
  const relations = [];

  for (const line of lines) {
    // Relation scalar field, e.g. `organizationId String`
    // Relation object field, e.g. `organization   Organization @relation(fields: [organizationId], references: [id])`
    const fieldMatch = line.match(/^(\w+)\s+([\w.]+)(\??)(\[\])?/);
    if (!fieldMatch) continue;
    const [, fieldName, rawType] = fieldMatch;

    const relationMatch = line.match(
      /@relation\(fields:\s*\[(\w+)\],\s*references:\s*\[(\w+)\]/,
    );
    if (relationMatch) {
      relations.push({ targetModel: rawType, fkField: relationMatch[1] });
      continue; // the object-shaped relation field itself isn't a column
    }

    // Skip reverse relation arrays (e.g. `risks Risk[]`) — not a column on
    // this table, just the other side of a FK declared elsewhere.
    if (line.endsWith('[]')) continue;

    // Skip known scalar Prisma types only? No — include every remaining
    // scalar field (String, Int, Boolean, DateTime, Json, enums, ...).
    fields.push({ name: fieldName, type: rawType });
  }

  return { fields, relations };
}

function buildDiagram(models) {
  const parsed = models.map((m) => ({
    name: m.name,
    entity: toSnakeUpper(m.name),
    ...parseFields(m.body),
  }));

  const lines = ['erDiagram'];

  for (const model of parsed) {
    for (const relation of model.relations) {
      const target = parsed.find((m) => m.name === relation.targetModel);
      if (!target) continue; // e.g. relation to an enum-typed field, skip
      lines.push(
        `    ${target.entity} ||--o{ ${model.entity} : "has"`,
      );
    }
  }

  for (const model of parsed) {
    lines.push(`    ${model.entity} {`);
    for (const field of model.fields) {
      const marker =
        field.name === 'id'
          ? ' PK'
          : field.name.endsWith('Id')
            ? ' FK'
            : '';
      lines.push(`        ${field.type} ${field.name}${marker}`);
    }
    lines.push('    }');
  }

  return lines.join('\n');
}

function main() {
  const source = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const models = parseModels(source);
  const diagram = buildDiagram(models);

  const markdown = `# EPG Platform — Entity Relationship Diagram

Auto-generated from \`apps/api/prisma/schema.prisma\` by
\`scripts/generate-er-diagram.js\` (\`pnpm generate:er-diagram\`). Re-run after
any schema change — this file is not regenerated automatically or checked
in CI, so it can drift; treat it as a snapshot, not a live view.

\`\`\`mermaid
${diagram}
\`\`\`
`;

  fs.writeFileSync(OUTPUT_PATH, markdown);
  console.log(`Wrote ER diagram for ${models.length} models to ${OUTPUT_PATH}`);
}

main();
