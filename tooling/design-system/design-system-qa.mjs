#!/usr/bin/env node
/**
 * PAEP IB2 design-system static quality gate (npm run qa:design-system).
 *
 * Checks the approved handoff evidence, token drift, the 25-component census and public API, token-only and
 * logical-property styling, import boundaries, clean-room terms, UI-lab coverage, content keys and test hygiene.
 * Every check reads files through `fsx`, so the negative suite can run the same checks over a mutated overlay.
 *
 *   node tooling/design-system/design-system-qa.mjs [--json <file>]
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCE, renderCss, renderTs, CSS_OUT, TS_OUT } from './generate-tokens.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The IR-01 §6.4 tranche: id, family, public selector(s) and exported classes (HOF-IB2-001 component-map). */
export const COMPONENTS = [
  ['button', 'Actions', ['PaepButton']],
  ['icon-button', 'Actions', ['PaepIconButton']],
  ['action-group', 'Actions', ['PaepActionGroup']],
  ['field', 'Forms', ['PaepField']],
  ['input', 'Forms', ['PaepInput']],
  ['select', 'Forms', ['PaepSelect']],
  ['textarea', 'Forms', []],
  ['checkbox', 'Forms', ['PaepCheckbox']],
  ['radio', 'Forms', ['PaepRadioGroup', 'PaepRadio']],
  ['table', 'Data', ['PaepTable']],
  ['list', 'Data', ['PaepList']],
  ['pagination', 'Data', ['PaepPagination']],
  ['empty-state', 'Data', ['PaepEmptyState']],
  ['alert', 'Feedback', ['PaepAlert']],
  ['status-badge', 'Feedback', ['PaepStatusBadge']],
  ['progress', 'Feedback', ['PaepProgress']],
  ['skeleton', 'Feedback', ['PaepSkeleton']],
  ['dialog', 'Overlay', ['PaepDialog']],
  ['drawer', 'Overlay', ['PaepDrawer']],
  ['popover', 'Overlay', ['PaepPopover']],
  ['tabs', 'Navigation', ['PaepTabs', 'PaepTab']],
  ['breadcrumb', 'Navigation', ['PaepBreadcrumb']],
  ['card', 'Structure', ['PaepCard']],
  ['panel', 'Structure', ['PaepPanel']],
  ['divider', 'Structure', ['PaepDivider']],
];

export const HANDOFF = {
  manifest: 'evidence/design-handoff/HOF-IB2-001/handoff.manifest.yaml',
  manifestSha256: '24e7049dd675e2025ae75c099637fd3f0a9eb9f24ff2958d1ce88607d040ac53',
  contentKeys: 'evidence/design-handoff/HOF-IB2-001/design-export/content-keys.md',
  componentSpecs: 'evidence/design-handoff/HOF-IB2-001/design-export/component-specs.md',
  tokenValues: 'evidence/design-handoff/HOF-IB2-001/design-export/foundation/token-values.md',
  // Every retained handoff file (design export and requirements source) is pinned by sha256 in this list.
  root: 'evidence/design-handoff/HOF-IB2-001',
  fileHashes: 'evidence/design-handoff/HOF-IB2-001/HANDOFF-FILES.sha256',
  fileHashesSha256: '0e340d5af4f77ac167d3626bf422249c13951bcf83b9bf91c5f384fbb00e7a38',
  hashedDirs: ['design-export', 'requirements'],
};

/**
 * Foundation-internal reference tokens a component may read, exactly where the approved handoff's component specs
 * name them ("Token usage"); any other --paep-ref-* use in a component fails S04.
 */
export const REF_TOKEN_ALLOWLIST = [
  ['packages/components/src/lib/progress/progress.css', '--paep-ref-color-neutral-200'],
  ['packages/components/src/lib/skeleton/skeleton.ts', '--paep-ref-color-neutral-100'],
];

/** The only deep path an app may import: the foundation stylesheet (CSS @import in apps/ui-lab/src/styles.css). */
export const FOUNDATION_STYLESHEET = '@proseit/paep-foundation/src/styles/paep-foundation.css';

/** Terms that must never appear in PAEP UI source (clean-room, PAEP v1.1; IB2 authorisation). */
export const FORBIDDEN_TERMS = [/\bultima\b/i, /primeng/i, /primeicons/i, /primeflex/i, /\bp-(button|table|dialog|inputtext|dropdown)\b/i, /\bfiori\b/i, /\bui5\b/i, /\bsapui/i, /\bmat-(button|form-field|table|dialog)\b/i, /@angular\/material/i, /@angular\/cdk/i];

const COMPONENTS_DIR = 'packages/components/src/lib';
const FOUNDATION_DIR = 'packages/foundation/src';

/** Real file system rooted at the repository; `overlay` maps path -> content (null = deleted). */
export function makeFs(root = ROOT, overlay = new Map()) {
  const walk = (dir) => {
    const out = new Set();
    const abs = path.join(root, dir);
    if (fs.existsSync(abs)) {
      for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
        const rel = `${dir}/${e.name}`;
        if (e.isDirectory()) for (const f of walk(rel)) out.add(f);
        else out.add(rel);
      }
    }
    for (const [f, v] of overlay) if (f.startsWith(`${dir}/`)) (v === null ? out.delete(f) : out.add(f));
    return [...out].sort();
  };
  return {
    exists: (f) => (overlay.has(f) ? overlay.get(f) !== null : fs.existsSync(path.join(root, f))),
    read: (f) => {
      if (overlay.has(f)) {
        if (overlay.get(f) === null) throw new Error(`${f} deleted`);
        return overlay.get(f);
      }
      return fs.readFileSync(path.join(root, f), 'utf8');
    },
    /** Raw bytes (binary-safe); an overlay string is taken as UTF-8. */
    readBytes: (f) => {
      if (overlay.has(f)) {
        if (overlay.get(f) === null) throw new Error(`${f} deleted`);
        return Buffer.from(overlay.get(f), 'utf8');
      }
      return fs.readFileSync(path.join(root, f));
    },
    list: walk,
  };
}

/** Removes comments from CSS/TS text (keeps strings roughly intact; good enough for token checks). */
const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1');

/**
 * Extracts every way a component can style itself, so the token and logical-property checks apply to all of them:
 * .css files; every `styles:` value inside .ts files (one string or an array of strings, in any quote style);
 * `[style.prop]` bindings in host metadata and in templates (inline or .html), rendered as `prop: value` lines
 * with every string literal of the bound expression; and string literals assigned through `.style.x =` or
 * `.style.setProperty(...)` in code. Channels that cannot be checked this way are reported in `banned`: a static
 * `style` attribute or host key, `[style]`/`[ngStyle]` object bindings and `@HostBinding('style…')`.
 * Returns { blocks: string[], banned: string[] }.
 */
function styleSources(fsx, file) {
  const raw = fsx.read(file);
  if (file.endsWith('.css')) return { blocks: [stripComments(raw)], banned: [] };
  const t = file.endsWith('.html') ? raw.replace(/<!--[\s\S]*?-->/g, '') : stripComments(raw);
  const blocks = [];
  const banned = [];
  const readString = (i) => {
    const q = t[i];
    if (!['`', "'", '"'].includes(q)) return null;
    let j = i + 1;
    while (j < t.length && t[j] !== q) j += t[j] === '\\' ? 2 : 1;
    return j < t.length ? { value: t.slice(i + 1, j), end: j + 1 } : null;
  };
  if (file.endsWith('.ts')) {
    for (const m of t.matchAll(/\bstyles:\s*/g)) {
      let i = m.index + m[0].length;
      const array = t[i] === '[';
      if (array) i++;
      for (;;) {
        while (/[\s,]/.test(t[i] ?? '')) i++;
        const s = readString(i);
        if (!s) break;
        blocks.push(s.value);
        i = s.end;
        if (!array) break;
      }
    }
  }
  const lines = [];
  const literals = (expr) => [...expr.matchAll(/'([^']*)'|"([^"]*)"|`([^`]*)`/g)].map((x) => x[1] ?? x[2] ?? x[3]);
  const bound = (prop, unit, expr) => {
    const lits = literals(expr);
    if (/^\s*-?\d*\.?\d+\s*$/.test(expr)) lines.push(`${prop}: ${expr.trim()}${unit};`);
    for (const v of lits) lines.push(`${prop}: ${v};`);
    if (!lits.length && !/^\s*-?\d*\.?\d+\s*$/.test(expr)) lines.push(`${prop}: var(--paep-bound);`);
  };
  // Host metadata: '[style.prop]': 'expr' or "[style.prop]": "expr" (either quote style for key and value).
  for (const m of t.matchAll(/(['"])\[style\.([\w-]+)(?:\.(\w+|%))?\]\1\s*:\s*/g)) {
    const s = readString(m.index + m[0].length);
    if (s) bound(m[2], m[3] ?? '', s.value);
  }
  // Template bindings (inline templates and .html): [style.prop]="expr" / [style.prop.unit]='expr'.
  for (const m of t.matchAll(/\s\[style\.([\w-]+)(?:\.(\w+|%))?\]=(["'])/g)) {
    const end = t.indexOf(m[3], m.index + m[0].length);
    if (end > 0) bound(m[1], m[2] ?? '', t.slice(m.index + m[0].length, end));
  }
  // Code: el.style.x = 'literal' / `template`, and el.style.setProperty('--x', 'literal').
  for (const m of t.matchAll(/\.style\.([A-Za-z]+)\s*=\s*([^;\n]+)/g)) for (const v of literals(m[2])) lines.push(`${m[1].replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${v};`);
  for (const m of t.matchAll(/\.style\.setProperty\(([^)]*)\)/g)) { const [k, ...v] = literals(m[1]); lines.push(`${k ?? 'property'}: ${v.join(' ')};`); }
  if (lines.length) blocks.push(lines.join('\n'));
  // Unchecked channels.
  if (/\sstyle=["']/.test(t)) banned.push('static style attribute in a template');
  if (/\[(style|ngStyle)\]\s*=/.test(t)) banned.push('[style]/[ngStyle] object binding in a template');
  if (/(['"])\[style\]\1\s*:/.test(t)) banned.push("host '[style]' object binding");
  if (/\bhost\s*:\s*\{[^}]*(^|[\s,{])(['"]?)style\2\s*:/ms.test(t)) banned.push("static host 'style' key");
  if (/@HostBinding\(\s*['"`](style|attr\.style)\b/.test(t)) banned.push("@HostBinding('style…')");
  return { blocks: blocks.map(stripComments), banned };
}

const PHYSICAL = /(^|[\s;{])((left|right|margin-left|margin-right|padding-left|padding-right|border-left[\w-]*|border-right[\w-]*|border-top-left-radius|border-top-right-radius|border-bottom-left-radius|border-bottom-right-radius)\s*:|(float|text-align|clear)\s*:\s*(left|right)\b)/;
const COLOUR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color-mix)\s*\(|\b(white|black|red|green|blue|gray|grey|yellow|orange|purple|navy|gold|silver)\b(?![-\w])/;
// Lengths: px other than 1/2/3 px hairlines; bare rem/em except in @media/@container conditions and max/inline size limits.
const PX = /(?<![-\w.])(\d*\.?\d+)px\b/g;

export function runChecks(fsx) {
  const results = [];
  const add = (id, name, problems, ok) => results.push({ id, name, pass: problems.length === 0, details: problems.length ? problems.join('; ') : ok });

  // S01: approved handoff retained, exact manifest, approved status.
  {
    const p = [];
    if (!fsx.exists(HANDOFF.manifest)) p.push(`${HANDOFF.manifest} missing`);
    else {
      const t = fsx.read(HANDOFF.manifest);
      const sha = crypto.createHash('sha256').update(t).digest('hex');
      if (sha !== HANDOFF.manifestSha256) p.push(`manifest sha256 ${sha} != approved ${HANDOFF.manifestSha256}`);
      if (!/^status: APPROVED_FOR_IMPLEMENTATION$/m.test(t)) p.push('manifest status is not APPROVED_FOR_IMPLEMENTATION');
      if (!/^version: '1\.1'$/m.test(t)) p.push('manifest version is not 1.1');
    }
    let pinned = 0;
    if (!fsx.exists(HANDOFF.fileHashes)) p.push(`${HANDOFF.fileHashes} missing`);
    else {
      const listSha = crypto.createHash('sha256').update(fsx.readBytes(HANDOFF.fileHashes)).digest('hex');
      if (listSha !== HANDOFF.fileHashesSha256) p.push(`${HANDOFF.fileHashes} sha256 ${listSha} != pinned ${HANDOFF.fileHashesSha256}`);
      const listed = new Map(fsx.read(HANDOFF.fileHashes).split('\n').filter(Boolean).map((l) => { const m = /^([0-9a-f]{64}) {2}(.+)$/.exec(l); return m ? [m[2], m[1]] : [l, null]; }));
      const present = HANDOFF.hashedDirs.flatMap((d) => fsx.list(`${HANDOFF.root}/${d}`)).map((f) => f.slice(HANDOFF.root.length + 1));
      for (const f of present) {
        if (!listed.has(f)) { p.push(`handoff file ${f} is not in the pinned list`); continue; }
        const sha = crypto.createHash('sha256').update(fsx.readBytes(`${HANDOFF.root}/${f}`)).digest('hex');
        if (sha !== listed.get(f)) p.push(`handoff file ${f} sha256 ${sha} != pinned ${listed.get(f)}`);
        else pinned++;
      }
      for (const f of listed.keys()) if (!present.includes(f)) p.push(`pinned handoff file ${f} missing`);
    }
    add('S01', 'HOF-IB2-001 v1.1 APPROVED_FOR_IMPLEMENTATION is retained with the approved manifest hash, and every retained handoff file matches its pinned sha256', p, `manifest sha256 ${HANDOFF.manifestSha256.slice(0, 12)}…, APPROVED_FOR_IMPLEMENTATION; ${pinned} handoff files pinned`);
  }

  // S02: generated token files match the approved values (no drift, no hand edits).
  {
    const p = [];
    let contrastPairs = 0;
    try {
      const src = JSON.parse(fsx.read(SOURCE));
      if (!fsx.exists(CSS_OUT) || fsx.read(CSS_OUT) !== renderCss(src)) p.push(`${CSS_OUT} differs from the generator output`);
      if (!fsx.exists(TS_OUT) || fsx.read(TS_OUT) !== renderTs(src)) p.push(`${TS_OUT} differs from the generator output`);
      // The hand-written breakpoint table must equal the approved breakpoints (name, px lower bound, em = px / 16).
      const bpFile = `${FOUNDATION_DIR}/lib/layout/breakpoints.ts`;
      const impl = [...(fsx.exists(bpFile) ? fsx.read(bpFile) : '').matchAll(/\{ name: '(\w+)', minEm: ([\d.]+), minPx: (\d+), columns: \d+ \}/g)].map((m) => `${m[1]}:${m[3]}:${m[2]}`);
      const approved = (src.breakpoints || []).map((b) => `${b.name}:${b.minPx}:${b.minPx / 16}`);
      if (JSON.stringify(impl) !== JSON.stringify(approved)) p.push(`PAEP_BREAKPOINTS ${impl.join(', ')} != approved ${approved.join(', ')}`);
      // Contrast evidence (token-values.md §1.7): recompute every row from its colours. Each colour must be a value of the
      // generated catalogue; every required pair (PASS) must meet its target and every PROHIBITED pair must fail it.
      const tv = fsx.exists(HANDOFF.tokenValues) ? fsx.read(HANDOFF.tokenValues) : '';
      const section = tv.slice(tv.indexOf('### 1.7'), tv.indexOf('## 2.'));
      const values = new Set([...fsx.read(TS_OUT).matchAll(/"value":\s*"(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1].toUpperCase()));
      const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
      const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
      let required = 0;
      for (const m of section.matchAll(/^\| ([^|]+) \| `(#[0-9A-Fa-f]{6})` \| `(#[0-9A-Fa-f]{6})` \| [\d.]+:1 \| (?:≥ ([\d.]+):1|n\/a) \| ([^|]+) \|$/gm)) {
        const [, pair, fg, bg, need, result] = m;
        const r = ratio(fg.toUpperCase(), bg.toUpperCase());
        if (/^PASS/.test(result.trim())) {
          required++;
          for (const hex of [fg, bg]) if (!values.has(hex.toUpperCase())) p.push(`contrast pair "${pair}": ${hex} is not a token value`);
          if (r + 1e-9 < Number(need)) p.push(`contrast pair "${pair}": ${r.toFixed(2)}:1 < ${need}:1`);
        } else if (/^PROHIBITED/.test(result.trim()) && r >= Number(need)) p.push(`prohibited pair "${pair}" unexpectedly passes`);
      }
      if (required !== 54) p.push(`${required} required contrast pairs parsed from token-values.md §1.7, expected 54`);
      contrastPairs = required;
    } catch (e) { p.push(String(e.message || e)); }
    add('S02', 'Token stylesheet and catalogue equal the generator output from the approved token values; PAEP_BREAKPOINTS equals the approved breakpoints; every required contrast pair of the handoff is recomputed from token values and meets its WCAG target', p, `no drift; ${contrastPairs} contrast pairs meet their targets`);
  }

  // S03: component census and public API.
  const index = fsx.exists('packages/components/src/index.ts') ? fsx.read('packages/components/src/index.ts') : '';
  {
    const p = [];
    const dirs = [...new Set(fsx.list(COMPONENTS_DIR).map((f) => f.slice(COMPONENTS_DIR.length + 1).split('/')[0]))].filter((d) => d !== 'messages');
    const expected = COMPONENTS.map(([id]) => id);
    for (const id of expected) {
      if (!dirs.includes(id)) { p.push(`${id}: folder missing`); continue; }
      if (!fsx.exists(`${COMPONENTS_DIR}/${id}/${id}.spec.ts`)) p.push(`${id}: ${id}.spec.ts missing`);
    }
    for (const d of dirs) if (!expected.includes(d)) p.push(`unexpected component folder ${d} (outside the 25-component tranche)`);
    const exported = [...index.matchAll(/export\s*\{([^}]*)\}\s*from\s*'([^']+)'/g)].flatMap((m) => m[1].split(',').map((s) => s.trim()).filter(Boolean).map((n) => ({ n: n.replace(/^type\s+/, ''), from: m[2] })));
    for (const [id, , classes] of COMPONENTS) for (const c of classes) if (!exported.some((e) => e.n === c)) p.push(`${c} (${id}) not exported from packages/components/src/index.ts`);
    for (const e of exported) if (!e.from.startsWith('./lib/')) p.push(`index re-exports from ${e.from}`);
    add('S03', 'Exactly the 25 IR-01 §6.4 components, each with behaviour tests, exported through the public entry point only', p, `${expected.length} components; ${exported.length} public exports`);
  }

  // S04: token-only, logical-property styling in components (and the foundation base stylesheet).
  {
    const p = [];
    const files = fsx.list(COMPONENTS_DIR).filter((f) => /\.(css|ts|html)$/.test(f) && !f.endsWith('.spec.ts'));
    let blocks = 0;
    for (const f of files) {
      const src = styleSources(fsx, f);
      for (const b of src.banned) p.push(`${f}: ${b} (style through a styles block or a checked [style.prop] binding)`);
      for (const css of src.blocks) {
        blocks++;
        css.split('\n').forEach((line, i) => {
          const l = line.trim();
          if (!l) return;
          if (COLOUR_LITERAL.test(l)) p.push(`${f}: colour literal "${l}"`);
          for (const m of l.matchAll(/--paep-ref-[\w-]+/g)) if (!REF_TOKEN_ALLOWLIST.some(([af, tok]) => af === f && tok === m[0])) p.push(`${f}: foundation-internal reference token ${m[0]} (components use semantic tokens)`);
          if (PHYSICAL.test(` ${l}`)) p.push(`${f}: physical property "${l}"`);
          for (const m of l.matchAll(PX)) if (!['1', '2', '3'].includes(m[1]) && !/^0?\.?0+$/.test(m[1])) p.push(`${f}: raw length ${m[0]} in "${l}"`);
          if (/\d(rem|em)\b/.test(l) && !/^@(media|container)|max-inline-size|min-inline-size|inline-size|max-block-size|min-block-size|block-size/.test(l)) p.push(`${f}: raw rem/em length in "${l}"`);
          if (/box-shadow\s*:/.test(l) && !/var\(--paep-(elevation|focus|color)|none|inherit/.test(l)) p.push(`${f}: shadow without an elevation or focus token "${l}"`);
          if (/(transition|animation)(-duration)?\s*:/.test(l) && /\d+m?s\b/.test(l) && !/var\(--paep-motion/.test(l) && !/\b0m?s\b/.test(l)) p.push(`${f}: motion duration without a motion token "${l}"`);
          void i;
        });
      }
    }
    for (const f of fsx.list(`${FOUNDATION_DIR}/styles`).filter((x) => x.endsWith('paep-foundation.css'))) {
      for (const line of stripComments(fsx.read(f)).split('\n')) if (PHYSICAL.test(` ${line.trim()}`)) p.push(`${f}: physical property "${line.trim()}"`);
    }
    add('S04', 'Component styles use only semantic --paep-* tokens (no colour, raw length, shadow or duration literals; reference tokens only where the handoff names them) and logical properties only', p, `${blocks} style blocks in ${files.length} files clean`);
  }

  // S05: import boundaries.
  {
    const p = [];
    // CSS @import: the only package path allowed is the foundation stylesheet.
    for (const f of [...fsx.list('packages/components/src'), ...fsx.list('packages/foundation/src'), ...fsx.list('apps/ui-lab/src')].filter((x) => x.endsWith('.css'))) {
      for (const m of stripComments(fsx.read(f)).matchAll(/@import\s+(?:url\(\s*)?(['"])([^'"]+)\1/g)) {
        if (m[2].startsWith('.')) continue;
        if (m[2] !== FOUNDATION_STYLESHEET || !f.startsWith('apps/')) p.push(`${f}: CSS @import ${m[2]} (only apps may import ${FOUNDATION_STYLESHEET})`);
      }
    }
    const tsFiles = [...fsx.list('packages/components/src'), ...fsx.list('packages/foundation/src'), ...fsx.list('apps/ui-lab/src')].filter((f) => f.endsWith('.ts'));
    for (const f of tsFiles) {
      const spec = f.endsWith('.spec.ts');
      for (const m of stripComments(fsx.read(f)).matchAll(/\bimport\s*\(\s*(?!(['"`])[^'"`$]+\1\s*\))/g)) void m, p.push(`${f}: dynamic import with a computed specifier (use a literal so the boundary can be checked)`);
      for (const m of stripComments(fsx.read(f)).matchAll(/(?:import|export)\s[^'"`]*?from\s*(['"])([^'"]+)\1|import\s*\(\s*(['"`])([^'"`$]+)\3\s*\)|import\s*(['"])([^'"]+)\5/g)) {
        const spec_ = m[2] || m[4] || m[6];
        const inComponents = f.startsWith('packages/components/');
        const inFoundation = f.startsWith('packages/foundation/');
        if (/^@proseit\/[^/]+\/./.test(spec_)) p.push(`${f}: deep import ${spec_}`);
        if (/^(axe-core|playwright|@vitest\/browser-playwright)$/.test(spec_)) p.push(`${f}: imports test tooling ${spec_}`);
        if (/^vitest/.test(spec_) && !spec) p.push(`${f}: imports ${spec_} outside a spec`);
        if (/frappe|erpnext/i.test(spec_) || /^@proseit\/(paep-domain-|frappe-sdk|paep-enterprise|paep-analytics|paep-offline)/.test(spec_)) p.push(`${f}: imports ${spec_} (later milestone)`);
        if (inFoundation && !(spec_.startsWith('.') || spec_ === '@angular/core' || spec_ === '@angular/core/testing' || spec_ === '@proseit/paep-foundation' || (spec && /^vitest/.test(spec_)))) p.push(`${f}: foundation may import only @angular/core and itself, not ${spec_}`);
        if (inComponents && !(spec_.startsWith('.') || /^@angular\/(core|common|forms|router|platform-browser)(\/testing)?$/.test(spec_) || spec_ === '@proseit/paep-foundation' || (spec && /^vitest/.test(spec_)))) p.push(`${f}: components may import only Angular and @proseit/paep-foundation, not ${spec_}`);
        if (inComponents && spec_.startsWith('.') && path.posix.normalize(path.posix.join(path.posix.dirname(f), spec_)).split('/').slice(0, 2).join('/') !== 'packages/components') p.push(`${f}: relative import leaves the package (${spec_})`);
        if (f.startsWith('apps/') && spec_.startsWith('.') && path.posix.normalize(path.posix.join(path.posix.dirname(f), spec_)).startsWith('packages/')) p.push(`${f}: relative import into packages (${spec_})`);
      }
    }
    add('S05', 'Import boundaries: foundation imports only @angular/core; components only Angular and the foundation entry point; no deep, Frappe, domain or later-milestone imports; test tooling only in specs; CSS @import of a package only for the foundation stylesheet in apps', p, `${tsFiles.length} TypeScript files`);
  }

  // S06: clean-room terms in UI source.
  {
    const p = [];
    const files = [...fsx.list('packages/components'), ...fsx.list('packages/foundation'), ...fsx.list('apps/ui-lab')].filter((f) => /\.(ts|css|html|json|svg|md)$/.test(f));
    for (const f of files) {
      const t = fsx.read(f);
      for (const re of FORBIDDEN_TERMS) if (re.test(t)) p.push(`${f}: forbidden term ${re}`);
    }
    if (fsx.exists('apps/ui-lab/public/favicon.ico')) p.push('apps/ui-lab/public/favicon.ico (Angular logo) still present');
    add('S06', 'Clean-room: no Ultima, PrimeNG, SAP Fiori/UI5, Angular Material/CDK or commercial-theme terms in UI source; Angular favicon replaced', p, `${files.length} files scanned`);
  }

  // S07: UI-lab coverage: every component has a registered specimen with complete documentation.
  {
    const p = [];
    const reg = fsx.exists('apps/ui-lab/src/app/specimens/registry.ts') ? fsx.read('apps/ui-lab/src/app/specimens/registry.ts') : '';
    // The handoff's component specs list the states per component, in the same order as COMPONENTS. Every state not
    // marked "Not applicable" must be documented (by name, at the start of an entry) in the specimen's meta.states.
    const specs = fsx.exists(HANDOFF.componentSpecs) ? fsx.read(HANDOFF.componentSpecs).split(/^### /m).slice(1) : [];
    if (specs.length !== COMPONENTS.length) p.push(`component-specs.md has ${specs.length} component sections, expected ${COMPONENTS.length}`);
    let requiredStates = 0;
    for (const [id, family] of COMPONENTS) {
      const f = `apps/ui-lab/src/app/specimens/${id}.specimen.ts`;
      if (!fsx.exists(f)) { p.push(`${id}: specimen file missing`); continue; }
      const t = fsx.read(f);
      if (!new RegExp(`from '\\./${id}\\.specimen'`).test(reg)) p.push(`${id}: not registered in specimens/registry.ts`);
      if (!new RegExp(`id:\\s*'${id}'`).test(t)) p.push(`${id}: meta id missing`);
      if (!new RegExp(`family:\\s*'${family}'`).test(t)) p.push(`${id}: family is not ${family}`);
      for (const field of ['purpose', 'variants', 'states', 'keyboard', 'accessibility', 'responsive', 'rtl', 'contentKeys', 'unitTests']) if (!new RegExp(`\\b${field}:`).test(t)) p.push(`${id}: meta.${field} missing`);
      if (!/<lab-specimen-page\b/.test(t) || !/<lab-example\b/.test(t)) p.push(`${id}: no specimen page or live example`);
      if (!/from '@proseit\/paep-components'/.test(t)) p.push(`${id}: specimen does not use the public entry point`);
      const row = specs[COMPONENTS.findIndex((c) => c[0] === id)]?.match(/^\| States \| (.*) \|$/m)?.[1] ?? '';
      const required = [...row.matchAll(/\*\*([^*]+)\*\*:\s*([^<]*)/g)].filter((m) => !/^Not applicable/.test(m[2].trim())).map((m) => m[1].trim().toLowerCase());
      if (!required.length) p.push(`${id}: no states found in component-specs.md`);
      const open = t.search(/\bstates:\s*\[/);
      const entries = [];
      if (open >= 0) for (const m of t.slice(open).matchAll(/'((?:[^'\\]|\\.)*)'|\]/g)) { if (m[0] === ']') break; entries.push(m[1].toLowerCase()); }
      for (const s of required) if (!entries.some((e) => e.startsWith(s))) p.push(`${id}: required state "${s}" not documented in the specimen`);
      requiredStates += required.length;
    }
    add('S07', 'UI laboratory: every one of the 25 components has a registered specimen page with purpose, variants, states, keyboard, accessibility, responsive, RTL, content keys and its unit-test reference; every applicable handoff state documented', p, `${COMPONENTS.length} specimens registered; ${requiredStates} required states documented`);
  }

  // S08: content keys: the message catalogue is exactly the handoff's key list.
  {
    const p = [];
    const md = fsx.exists(HANDOFF.contentKeys) ? fsx.read(HANDOFF.contentKeys) : '';
    const keys = [...md.matchAll(/^\| (paep\.[\w.]+) \|/gm)].map((m) => m[1]);
    const msg = fsx.exists(`${COMPONENTS_DIR}/messages/messages.ts`) ? fsx.read(`${COMPONENTS_DIR}/messages/messages.ts`) : '';
    const impl = [...msg.matchAll(/^\s+'(paep\.[\w.]+)':/gm)].map((m) => m[1]);
    for (const k of keys) if (!impl.includes(k)) p.push(`${k} missing from messages.ts`);
    for (const k of impl) if (!keys.includes(k)) p.push(`${k} not in content-keys.md`);
    if (!keys.length) p.push('no content keys found in the handoff');
    add('S08', 'Message catalogue holds exactly the approved content keys', p, `${keys.length} keys`);
  }

  // S09: test hygiene: no focused or skipped tests; every component spec has at least three tests.
  {
    const p = [];
    const specs = [...fsx.list('packages/components/src'), ...fsx.list('packages/foundation/src')].filter((f) => f.endsWith('.spec.ts'));
    let tests = 0;
    for (const f of specs) {
      const t = stripComments(fsx.read(f));
      if (/\b(it|test|describe)\.(only|skip|todo|fails)\b|\b(fit|fdescribe|xit|xdescribe)\s*\(/.test(t)) p.push(`${f}: focused or skipped test`);
      const n = (t.match(/(?<![.\w])(it|test)\s*\(/g) || []).length;
      tests += n;
      if (n < 3 && f.startsWith(COMPONENTS_DIR)) p.push(`${f}: only ${n} tests`);
    }
    add('S09', 'Test hygiene: no focused, skipped, todo or expected-to-fail tests; every component spec has at least three behaviour tests', p, `${specs.length} spec files, ${tests} tests`);
  }

  // S10: interactive semantics: a (click) handler in a component template sits on a natively interactive element
  // or one with an interactive role (no clickable div/span a keyboard or screen-reader user cannot reach).
  {
    const p = [];
    const INTERACTIVE = /^(button|a|input|select|textarea|summary|option)$/;
    const ROLE = /\brole="(button|link|menuitem|menuitemcheckbox|menuitemradio|tab|option|checkbox|radio|switch)"/;
    let handlers = 0;
    for (const f of fsx.list(COMPONENTS_DIR).filter((x) => (x.endsWith('.ts') && !x.endsWith('.spec.ts')) || x.endsWith('.html'))) {
      const src = fsx.read(f);
      const templates = f.endsWith('.html') ? [src] : [...src.matchAll(/template:\s*`([\s\S]*?)`/g)].map((m) => m[1]);
      for (const tpl of templates) {
        for (const m of tpl.matchAll(/<([a-zA-Z][\w-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g)) {
          if (!/\(click\)=/.test(m[2])) continue;
          handlers++;
          if (!INTERACTIVE.test(m[1].toLowerCase()) && !ROLE.test(m[2])) p.push(`${f}: (click) on <${m[1]}> without native interactive semantics or an interactive role`);
        }
      }
    }
    add('S10', 'Interactive semantics: every (click) handler in a component template is on a native interactive element or one with an interactive role', p, `${handlers} click handlers, all on interactive elements`);
  }

  return results;
}

function main() {
  const jsonAt = process.argv.indexOf('--json');
  const results = runChecks(makeFs());
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.id} ${r.name} — ${r.details}`);
  const ok = results.every((r) => r.pass);
  console.log(`\nPAEP design-system QA: ${ok ? 'PASS' : 'FAIL'} (${results.filter((r) => r.pass).length}/${results.length})`);
  if (jsonAt > 0) fs.writeFileSync(process.argv[jsonAt + 1], `${JSON.stringify({ result: ok ? 'PASS' : 'FAIL', results }, null, 2)}\n`);
  process.exit(ok ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
