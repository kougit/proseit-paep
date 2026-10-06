#!/usr/bin/env node
/**
 * PAEP IB2 token generator.
 *
 * Source: the PO/SA-approved HOF-IB2-001 v1.1 token values retained under
 * evidence/design-handoff/HOF-IB2-001/design-export/foundation/token-values.candidate.json, plus the 12 shell and
 * layer tokens of HOF-IB3-001 token-use-map.md §3 (SHELL_TOKENS, LAYER_TOKENS below).
 * Output:
 *   packages/foundation/src/styles/paep-tokens.css            (custom properties)
 *   packages/foundation/src/lib/tokens/token-catalogue.generated.ts (typed catalogue)
 *
 *   node tooling/design-system/generate-tokens.mjs          write both files
 *   node tooling/design-system/generate-tokens.mjs --check  fail if either file differs (drift)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SOURCE = 'evidence/design-handoff/HOF-IB2-001/design-export/foundation/token-values.candidate.json';
export const CSS_OUT = 'packages/foundation/src/styles/paep-tokens.css';
export const TS_OUT = 'packages/foundation/src/lib/tokens/token-catalogue.generated.ts';
export const TOKEN_VERSION = '1.0.0';

/** HOF-IB3-001 token-use-map.md §3: the approved --paep-shell-* sizes (12 approved tokens with LAYER_TOKENS). */
export const SHELL_TOKENS = {
  'topbar-block-size': '3.5rem',
  'sidebar-inline-size': '16rem',
  'rail-inline-size': '5.5rem',
  'sheet-inline-size': '20rem',
  'status-block-size': '2.5rem',
  'sticky-offset': 'calc(var(--paep-shell-topbar-block-size) + var(--paep-space-2))',
};
/** HOF-IB3-001 token-use-map.md §3: the approved --paep-layer-* semantic layers. */
export const LAYER_TOKENS = {
  sticky: '30',
  flyout: '40',
  popup: '45',
  'overlay-scrim': '60',
  overlay: '61',
  'skip-link': '80',
};

const rem = (px) => `${+(px / 16).toFixed(4)}rem`;
const px = (n) => `${n}px`;

/** Returns the ordered token list: { name, value, category, layer, compact? }. */
export function buildTokens(src) {
  const t = [];
  const add = (name, value, category, layer, extra = {}) => t.push({ name, value: String(value), category, layer, ...extra });
  for (const [k, v] of Object.entries(src.neutral)) add(`--paep-ref-color-neutral-${k}`, v, 'color', 'reference');
  for (const [k, v] of Object.entries(src.semantic)) add(`--paep-color-${k}`, v, 'color', 'semantic');
  for (const [s, o] of Object.entries(src.status)) for (const [k, v] of Object.entries(o)) add(`--paep-color-status-${s}-${k}`, v, 'status', 'semantic');
  // token-values.md §1.4: destructive hover/active fills, derived from error-strong and protected.
  add('--paep-color-destructive-hover', '#93201A', 'status', 'semantic', { protect: true });
  add('--paep-color-destructive-active', '#76170F', 'status', 'semantic', { protect: true });
  const brand = src.brandProfiles['proseit-default'];
  for (const k of src.brandOverridableKeys) add(`--paep-brand-${k}`, brand[k], 'brand', 'brand');
  add('--paep-color-selected-bg', 'var(--paep-brand-primary-subtle)', 'color', 'derived');
  add('--paep-color-selected-fg', 'var(--paep-brand-primary)', 'color', 'derived');
  add('--paep-color-selected-indicator', 'var(--paep-brand-primary)', 'color', 'derived');
  add('--paep-color-link', 'var(--paep-brand-primary)', 'color', 'derived');
  add('--paep-font-family-sans', src.typography.sans, 'typography', 'semantic');
  add('--paep-font-family-mono', src.typography.mono, 'typography', 'semantic');
  for (const r of src.typography.scale) {
    add(`--paep-font-size-${r.role}`, rem(r.sizePx), 'typography', 'semantic');
    add(`--paep-line-height-${r.role}`, rem(r.lineHeightPx), 'typography', 'semantic');
    add(`--paep-font-weight-${r.role}`, r.weight, 'typography', 'semantic');
    add(`--paep-letter-spacing-${r.role}`, r.letterSpacing, 'typography', 'semantic');
  }
  for (const [k, v] of Object.entries(src.space)) add(`--paep-space-${k}`, v === 0 ? '0rem' : rem(v), 'space', 'semantic');
  for (const [k, v] of Object.entries(src.radius)) add(`--paep-radius-${k}`, px(v), 'radius', 'semantic');
  for (const [k, v] of Object.entries(src.icon)) add(`--paep-size-icon-${k}`, px(v), 'size', 'semantic');
  add('--paep-size-target-min', '24px', 'size', 'semantic');
  add('--paep-size-target-touch', '40px', 'size', 'semantic');
  for (const e of src.elevation) add(`--paep-elevation-${e.level}`, e.shadow, 'elevation', 'semantic');
  for (const [k, v] of Object.entries(src.motion.duration)) add(`--paep-motion-duration-${k}`, `${v}ms`, 'motion', 'semantic');
  for (const [k, v] of Object.entries(src.motion.easing)) add(`--paep-motion-easing-${k}`, v, 'motion', 'semantic');
  for (const [k, v] of Object.entries(src.motion.loop)) add(`--paep-motion-loop-${k}`, `${v}ms`, 'motion', 'semantic');
  // token-values.md §10: the whole focus indicator is protected (the JSON's protected list names only its colours).
  add('--paep-focus-ring-width', px(src.focus.widthPx), 'focus', 'semantic', { protect: true });
  add('--paep-focus-ring-offset', px(src.focus.offsetPx), 'focus', 'semantic', { protect: true });
  add('--paep-layout-columns', '4', 'layout', 'semantic');
  add('--paep-layout-page-margin', '1rem', 'layout', 'semantic');
  add('--paep-layout-gutter', '1rem', 'layout', 'semantic');
  add('--paep-layout-content-max', '90rem', 'layout', 'semantic');
  add('--paep-layout-form-max', '40rem', 'layout', 'semantic');
  add('--paep-layout-reading-max', '45rem', 'layout', 'semantic');
  // HOF-IB3-001 token-use-map.md §3 (PO/SA, 2026-10-05): the six shell structural sizes and the six semantic layers,
  // each layer bound to its reviewed purpose (not a free z-index scale). The rejected content-max alias is not
  // generated: shells use --paep-layout-content-max.
  for (const [k, v] of Object.entries(SHELL_TOKENS)) add(`--paep-shell-${k}`, v, 'layout', 'semantic');
  for (const [k, v] of Object.entries(LAYER_TOKENS)) add(`--paep-layer-${k}`, v, 'layout', 'semantic');
  for (const [k, v] of Object.entries(src.density)) add(`--paep-density-${k}`, px(v.comfortable), 'density', 'semantic', { compact: px(v.compact) });
  return t;
}

const PROTECTED = (src) => src.protected.map((p) => new RegExp(`^${p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`));

export function renderCss(src) {
  const tokens = buildTokens(src);
  const L = [];
  L.push(`/* GENERATED by tooling/design-system/generate-tokens.mjs from ${SOURCE}`);
  L.push(` * (HOF-IB2-001 v${src.version}, PO/SA APPROVED_FOR_IMPLEMENTATION 2026-09-27) and HOF-IB3-001 token-use-map.md §3.`);
  L.push(' * Do not edit by hand; run the generator.');
  L.push(` * Token version ${TOKEN_VERSION}. Only --paep-brand-* may be overridden, and only through applyBrandProfile(). */`);
  L.push(':root {');
  for (const x of tokens) L.push(`  ${x.name}: ${x.value};`);
  L.push('}');
  L.push('');
  L.push('/* Density: comfortable is the default; compact is opt-in per subtree. */');
  L.push('[data-paep-density="compact"] {');
  for (const x of tokens.filter((y) => y.compact)) L.push(`  ${x.name}: ${x.compact};`);
  L.push('}');
  L.push('');
  L.push('/* Compact density keeps 40px controls and tabs on coarse pointers. */');
  L.push('@media (pointer: coarse) {');
  L.push('  [data-paep-density="compact"] {');
  L.push('    --paep-density-control-height: 40px;');
  L.push('    --paep-density-tab-height: 40px;');
  L.push('  }');
  L.push('}');
  L.push('');
  L.push('/* Grid and page margins by breakpoint (tablet 37.5em, desktop 64em). */');
  L.push('@media (min-width: 37.5em) {');
  L.push('  :root {');
  L.push('    --paep-layout-columns: 8;');
  L.push('    --paep-layout-page-margin: 1.5rem;');
  L.push('  }');
  L.push('}');
  L.push('@media (min-width: 64em) {');
  L.push('  :root {');
  L.push('    --paep-layout-columns: 12;');
  L.push('    --paep-layout-page-margin: 2rem;');
  L.push('    --paep-layout-gutter: 1.5rem;');
  L.push('  }');
  L.push('}');
  L.push('');
  L.push('/* Reduced motion: every duration is 0 and loops stop (components read --paep-motion-loop-state). */');
  L.push(':root {');
  L.push('  --paep-motion-loop-state: running;');
  L.push('}');
  L.push('@media (prefers-reduced-motion: reduce) {');
  L.push('  :root {');
  for (const x of tokens.filter((y) => y.name.startsWith('--paep-motion-duration-'))) L.push(`    ${x.name}: 0ms;`);
  L.push('    --paep-motion-loop-state: paused;');
  L.push('  }');
  L.push('}');
  L.push('');
  L.push('/* Reduced-motion simulation for a subtree (UI laboratory setting), identical to the media query. */');
  L.push('[data-paep-motion="reduce"] {');
  for (const x of tokens.filter((y) => y.name.startsWith('--paep-motion-duration-'))) L.push(`  ${x.name}: 0ms;`);
  L.push('  --paep-motion-loop-state: paused;');
  L.push('}');
  return `${L.join('\n')}\n`;
}

export function renderTs(src) {
  const tokens = buildTokens(src);
  const prot = PROTECTED(src);
  const rows = tokens.map((x) => {
    const isProtected = x.layer !== 'brand' && (x.protect === true || prot.some((re) => re.test(x.name)));
    const o = { name: x.name, value: x.value, category: x.category, layer: x.layer, protected: isProtected, overridable: x.layer === 'brand', since: TOKEN_VERSION };
    if (x.compact) o.compact = x.compact;
    return `  ${JSON.stringify(o)}`;
  });
  return [
    `// GENERATED by tooling/design-system/generate-tokens.mjs from ${SOURCE}.`,
    '// Do not edit by hand; run the generator (CI fails on drift).',
    '',
    "import type { PaepTokenDefinition } from './token-types';",
    '',
    `/** Token catalogue version (HOF-IB2-001 v${src.version}). */`,
    `export const PAEP_TOKEN_VERSION = '${TOKEN_VERSION}';`,
    '',
    '/** Every PAEP design token with its approved default value. */',
    'export const PAEP_TOKENS: readonly PaepTokenDefinition[] = [',
    rows.join(',\n'),
    '];',
    ''
  ].join('\n');
}

function main() {
  const check = process.argv.includes('--check');
  const src = JSON.parse(fs.readFileSync(path.join(root, SOURCE), 'utf8'));
  let drift = 0;
  for (const [file, text] of [[CSS_OUT, renderCss(src)], [TS_OUT, renderTs(src)]]) {
    const abs = path.join(root, file);
    const cur = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
    if (check) {
      if (cur !== text) { drift++; console.log(`DRIFT ${file}`); } else console.log(`OK ${file}`);
    } else {
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, text, 'utf8');
      console.log(`wrote ${file}`);
    }
  }
  if (check && drift) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
