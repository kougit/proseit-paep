#!/usr/bin/env node
/**
 * PAEP architecture-boundary checker (IB0-WP04).
 *
 * Builds the workspace project graph from the architecture model
 * (architecture-model.json), the npm workspaces, angular.json, the alias
 * registry (tsconfig.base.json), every import in apps/** and packages/**, and
 * workspace-package dependencies in package.json files. It fails when:
 *   MODEL                   the model is malformed or its layers/matrix differ from PAEP-IB-01 §6.1 / Appendix B
 *   CLASSIFICATION          a project is unclassified, unknown, missing, duplicated or mis-tagged
 *   ALIAS                   the alias registry or tsconfig inheritance is inconsistent
 *   ENTRY_POINT             a package has no public entry point
 *   DIRECTION               an edge is not allowed by the matrix (upward, lateral or "No")
 *   CYCLE                   packages depend on each other circularly
 *   DEEP_IMPORT             an import names a path below a package (@proseit/<pkg>/<path>)
 *   UNKNOWN_PACKAGE         an import names an @proseit/* module that is not a workspace package
 *   ENTRY_BYPASS            a relative/rooted import reaches into another project
 *   OUTSIDE_PROJECT         a relative/rooted import reaches workspace files outside any project
 *   CONTRACTS_NEUTRAL       contracts imports an external module or uses non-ES2022 globals
 *   ANALYTICS_VENDOR_EXPORT analytics re-exports an external module
 *   COPIED_CODE             an app file duplicates a package source file
 *
 * Uses Node.js built-ins and the pinned `typescript` only. Development/CI
 * tooling; never part of a production bundle.
 *
 * Usage: node tooling/architecture-boundaries/check-boundaries.mjs [--graph <file>] [--json]
 * Exit code 0 = no violation, 1 = violations, 2 = checker error.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const MODEL_PATH = 'tooling/architecture-boundaries/architecture-model.json';
const SOURCE_EXT = /\.(ts|tsx|mts|cts|js|mjs|cjs)$/;
const SKIP_DIRS = new Set(['node_modules', 'dist', '.angular', '.git']);
const ALLOWED_CELLS = new Set(['Yes', 'Optional']);
const MANIFEST_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

export function checkBoundaries(root = process.cwd()) {
  const violations = [];
  const flag = (rule, message, where = '') => violations.push({ rule, message, where });
  const abs = (p) => path.join(root, p);
  const rel = (p) => path.relative(root, p).split(path.sep).join('/');
  const exists = (p) => fs.existsSync(abs(p));
  const readJson = (p) => JSON.parse(fs.readFileSync(abs(p), 'utf8'));
  const walk = (dir, out = []) => {
    if (!exists(dir)) return out;
    for (const e of fs.readdirSync(abs(dir), { withFileTypes: true })) {
      if (SKIP_DIRS.has(e.name)) continue;
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(p, out); else out.push(p);
    }
    return out;
  };

  // ---- Model ------------------------------------------------------------------
  let model;
  try { model = readJson(MODEL_PATH); } catch (e) { return fatal(`cannot read ${MODEL_PATH}: ${e.message}`); }
  const categories = model.categories || {};
  const columns = model.matrix?.matrixColumns || [];
  const rows = model.matrix?.rows || {};
  const catIds = Object.keys(categories);
  if (JSON.stringify([...columns].sort()) !== JSON.stringify([...catIds].sort())) flag('MODEL', `matrix columns ${columns.join(', ')} differ from categories ${catIds.join(', ')}`);
  for (const [id, c] of Object.entries(categories)) {
    if (!(c.layer in (model.layers || {}))) flag('MODEL', `category ${id} has unknown layer ${c.layer}`);
    if (!Array.isArray(rows[id]) || rows[id].length !== columns.length) flag('MODEL', `matrix row ${id} missing or not ${columns.length} cells`);
  }
  for (const r of Object.keys(rows)) if (!(r in categories)) flag('MODEL', `matrix row ${r} is not a category`);
  const cell = (from, to) => rows[from]?.[columns.indexOf(to)];

  // Compare layers and matrix with the controlled text, cell by cell.
  const labelToId = Object.fromEntries(Object.entries(categories).map(([id, c]) => [c.matrixLabel, id]));
  let matrixCellsCompared = 0;
  try {
    const text = fs.readFileSync(abs(model.source.document), 'utf8');
    const tableRows = (section) => {
      const start = text.indexOf(section);
      if (start < 0) throw new Error(`section "${section}" not found`);
      const out = [];
      for (const line of text.slice(start).split(/\r?\n/).slice(1)) {
        if (/^#{1,6} /.test(line)) break;
        if (line.startsWith('|') && !/^\|\s*---/.test(line)) out.push(line.split('|').slice(1, -1).map((s) => s.trim()));
      }
      return out;
    };
    // §6.1: | L0 - Base | @proseit/paep-contracts; @proseit/paep-foundation | ... |
    const layerRows = tableRows('### 6.1 Layer definitions').filter((r) => /^L\d - /.test(r[0]));
    const layerOfText = {};
    for (const r of layerRows) {
      const layer = r[0].split(' - ')[0];
      for (const pkg of r[1].split(';').map((s) => s.trim().replace(/^@proseit\//, '').replace(/^paep-/, ''))) layerOfText[labelToId[pkg] ?? `?${pkg}`] = layer;
    }
    for (const id of new Set([...Object.keys(layerOfText), ...catIds])) {
      if (layerOfText[id] !== categories[id]?.layer) flag('MODEL', `layer of ${id}: controlled §6.1 ${layerOfText[id] ?? 'absent'}, model ${categories[id]?.layer ?? 'absent'}`);
    }
    // Appendix B: header | From \ To | contracts | ... | then one row per category.
    const b = tableRows('## Appendix B. Package Dependency Matrix');
    const header = b[0].slice(1).map((l) => labelToId[l] ?? `?${l}`);
    const textRows = b.slice(1);
    if (JSON.stringify(header) !== JSON.stringify(columns)) flag('MODEL', `Appendix B columns ${header.join(', ')} differ from model ${columns.join(', ')}`);
    if (textRows.length !== columns.length) flag('MODEL', `Appendix B has ${textRows.length} rows, model ${columns.length}`);
    for (const r of textRows) {
      const from = labelToId[r[0]];
      if (!from) { flag('MODEL', `Appendix B row ${r[0]} has no model category`); continue; }
      r.slice(1).forEach((v, i) => {
        matrixCellsCompared += 1;
        if (cell(from, header[i]) !== v) flag('MODEL', `matrix ${from} -> ${header[i]}: controlled "${v}", model "${cell(from, header[i])}"`);
      });
    }
  } catch (e) {
    flag('MODEL', `cannot compare with the controlled text: ${e.message}`);
  }

  // ---- Classification ------------------------------------------------------------
  const projects = Array.isArray(model.projects) ? model.projects : [];
  const byName = new Map();
  const byRoot = new Map();
  for (const p of projects) {
    if (byName.has(p.name)) flag('CLASSIFICATION', `duplicate project name ${p.name}`);
    if (byRoot.has(p.root)) flag('CLASSIFICATION', `duplicate project root ${p.root}`);
    byName.set(p.name, p);
    byRoot.set(p.root, p);
    const c = categories[p.category];
    if (!c) { flag('CLASSIFICATION', `${p.name}: unknown category "${p.category}"`); continue; }
    const tags = [`layer:${c.layer}`, `type:${p.category}`];
    if (JSON.stringify(p.tags) !== JSON.stringify(tags)) flag('CLASSIFICATION', `${p.name}: tags ${JSON.stringify(p.tags)}, expected ${JSON.stringify(tags)}`);
    if (!exists(p.root)) flag('CLASSIFICATION', `${p.name}: root ${p.root} does not exist`);
    const isApp = p.category === 'app';
    if (p.projectType !== (isApp ? 'application' : 'library')) flag('CLASSIFICATION', `${p.name}: projectType ${p.projectType}`);
    if (isApp !== p.root.startsWith('apps/')) flag('CLASSIFICATION', `${p.name}: category ${p.category} does not match root ${p.root}`);
  }
  // Every package directory, npm workspace and angular.json project must be a model project.
  const rootPkg = readJson('package.json');
  const workspaceDirs = new Set();
  for (const pattern of rootPkg.workspaces || []) {
    if (!pattern.endsWith('/*')) { flag('CLASSIFICATION', `unsupported workspace pattern ${pattern}`); continue; }
    const base = pattern.slice(0, -2);
    for (const e of exists(base) ? fs.readdirSync(abs(base), { withFileTypes: true }) : []) if (e.isDirectory()) workspaceDirs.add(`${base}/${e.name}`);
  }
  if (exists('packages')) for (const e of fs.readdirSync(abs('packages'), { withFileTypes: true })) if (e.isDirectory()) workspaceDirs.add(`packages/${e.name}`);
  const packageNames = new Map();
  for (const dir of [...workspaceDirs].sort()) {
    const p = byRoot.get(dir);
    if (!p) { flag('CLASSIFICATION', `${dir} is not classified in the model`); continue; }
    if (!exists(`${dir}/package.json`)) { flag('CLASSIFICATION', `${dir} has no package.json`); continue; }
    const pkg = readJson(`${dir}/package.json`);
    if (pkg.name !== p.name) flag('CLASSIFICATION', `${dir}: package.json name ${pkg.name}, model ${p.name}`);
    packageNames.set(pkg.name, p);
  }
  let angular = { projects: {} };
  try { angular = readJson('angular.json'); } catch (e) { flag('CLASSIFICATION', `angular.json: ${e.message}`); }
  const appDirs = new Set(exists('apps') ? fs.readdirSync(abs('apps'), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => `apps/${e.name}`) : []);
  for (const [name, def] of Object.entries(angular.projects || {})) {
    const p = byName.get(name);
    if (!p) flag('CLASSIFICATION', `angular.json project ${name} is not classified in the model`);
    else if (p.root !== def.root) flag('CLASSIFICATION', `angular.json project ${name}: root ${def.root}, model ${p.root}`);
    appDirs.add(def.root);
  }
  for (const d of appDirs) if (!byRoot.has(d)) flag('CLASSIFICATION', `${d} is not classified in the model`);
  for (const p of projects) {
    if (p.category === 'app' && !(p.name in (angular.projects || {}))) flag('CLASSIFICATION', `${p.name}: application not in angular.json`);
    if (p.category !== 'app' && !workspaceDirs.has(p.root)) flag('CLASSIFICATION', `${p.name}: library not an npm workspace`);
  }
  const libraries = projects.filter((p) => p.category !== 'app' && categories[p.category]);

  // ---- Public entry points -------------------------------------------------------
  for (const p of libraries) if (!exists(`${p.root}/${model.publicEntryPoint}`)) flag('ENTRY_POINT', `${p.name}: ${p.root}/${model.publicEntryPoint} missing`);

  // ---- Alias registry and tsconfig inheritance ------------------------------------
  const rawTs = (f) => {
    const r = ts.parseConfigFileTextToJson(f, fs.readFileSync(abs(f), 'utf8'));
    if (r.error) throw new Error(ts.flattenDiagnosticMessageText(r.error.messageText, ' '));
    return r.config;
  };
  const registry = model.aliasRegistry;
  let aliases = {};
  let aliasResolutions = 0;
  if (!exists(registry)) flag('ALIAS', `${registry} missing`);
  else {
    try {
      const base = rawTs(registry);
      aliases = base.compilerOptions?.paths || {};
      const extra = [...Object.keys(base).filter((k) => k !== 'compilerOptions'), ...Object.keys(base.compilerOptions || {}).filter((k) => k !== 'paths')];
      if (extra.length) flag('ALIAS', `${registry} holds more than compilerOptions.paths: ${extra.join(', ')}`);
    } catch (e) { flag('ALIAS', `${registry}: ${e.message}`); }
  }
  for (const p of libraries) {
    const want = [`./${p.root}/${model.publicEntryPoint}`];
    if (!aliases[p.name]) flag('ALIAS', `${p.name}: no alias in ${registry}`);
    else if (JSON.stringify(aliases[p.name]) !== JSON.stringify(want)) flag('ALIAS', `${p.name}: alias maps to ${JSON.stringify(aliases[p.name])}, expected ${JSON.stringify(want)}`);
  }
  const libNames = new Set(libraries.map((p) => p.name));
  for (const [k, v] of Object.entries(aliases)) {
    if (k.includes('*') || (Array.isArray(v) && v.some((t) => t.includes('*')))) flag('ALIAS', `wildcard alias ${k}`);
    if (!libNames.has(k)) flag('ALIAS', `alias ${k} is not a classified package`);
  }
  const tsconfigFiles = walk('.').map((f) => f.replace(/^\.\//, '')).filter((f) => /(^|\/)tsconfig[^/]*\.json$/.test(f));
  for (const f of tsconfigFiles) {
    if (f === registry) continue;
    try {
      const raw = rawTs(f);
      if (raw.compilerOptions?.paths) flag('ALIAS', `${f} defines paths; ${registry} is the only alias registry`);
      if (raw.compilerOptions?.baseUrl !== undefined) flag('ALIAS', `${f} sets baseUrl`);
    } catch (e) { flag('ALIAS', `${f}: ${e.message}`); }
  }
  try {
    if (rawTs('tsconfig.json').extends !== `./${registry}`) flag('ALIAS', `tsconfig.json does not extend ./${registry}`);
  } catch (e) { flag('ALIAS', `tsconfig.json: ${e.message}`); }
  for (const [name, def] of Object.entries(angular.projects || {})) {
    const cfgPath = def.architect?.build?.options?.tsConfig;
    if (!cfgPath || !exists(cfgPath)) { flag('ALIAS', `${name}: build tsConfig ${cfgPath} missing`); continue; }
    const chain = [];
    let cur = abs(cfgPath);
    for (let i = 0; i < 10 && cur; i += 1) {
      chain.push(rel(cur));
      const ext = ts.parseConfigFileTextToJson(cur, fs.readFileSync(cur, 'utf8')).config?.extends;
      cur = typeof ext === 'string' ? path.resolve(path.dirname(cur), ext) : null;
      if (cur && !fs.existsSync(cur)) { flag('ALIAS', `${name}: extends target ${rel(cur)} missing`); cur = null; }
    }
    if (!chain.includes(registry)) flag('ALIAS', `${name}: ${cfgPath} does not inherit ${registry} (chain ${chain.join(' -> ')})`);
    const parsed = ts.getParsedCommandLineOfConfigFile(abs(cfgPath), {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} });
    if (!parsed) { flag('ALIAS', `${name}: ${cfgPath} does not parse`); continue; }
    const probe = abs(`${def.sourceRoot || def.root}/main.ts`);
    for (const p of libraries) {
      const r = ts.resolveModuleName(p.name, probe, parsed.options, ts.sys).resolvedModule;
      const want = abs(`${p.root}/${model.publicEntryPoint}`);
      if (!r || path.resolve(r.resolvedFileName) !== path.resolve(want)) flag('ALIAS', `${name}: ${p.name} resolves to ${r ? rel(r.resolvedFileName) : 'nothing'}`);
      else aliasResolutions += 1;
    }
  }

  // ---- Imports and edges -------------------------------------------------------
  const ownerOf = (absPath) => {
    const r = rel(absPath);
    let best = null;
    for (const p of projects) if ((r === p.root || r.startsWith(`${p.root}/`)) && (!best || p.root.length > best.root.length)) best = p;
    return best;
  };
  const edges = new Map();
  const addEdge = (from, to, kind, where) => {
    if (from.name === to.name) return;
    const key = `${from.name}\u0000${to.name}`;
    if (!edges.has(key)) edges.set(key, { source: from.name, target: to.name, kinds: new Set(), files: new Set() });
    edges.get(key).kinds.add(kind);
    edges.get(key).files.add(where);
  };
  const sourceFiles = [];
  const externalByProject = new Map();
  for (const p of projects) for (const f of walk(p.root)) if (SOURCE_EXT.test(f) && !f.endsWith('.d.ts')) sourceFiles.push({ project: p, file: f });

  const specifiersOf = (file) => {
    const sf = ts.createSourceFile(file, fs.readFileSync(abs(file), 'utf8'), ts.ScriptTarget.Latest, true);
    const out = [];
    const lit = (n) => (n && ts.isStringLiteralLike(n) ? n.text : null);
    const visit = (n) => {
      if (ts.isImportDeclaration(n)) out.push({ spec: lit(n.moduleSpecifier), kind: 'static', reexport: false });
      else if (ts.isExportDeclaration(n) && n.moduleSpecifier) out.push({ spec: lit(n.moduleSpecifier), kind: 'static', reexport: true });
      else if (ts.isImportEqualsDeclaration(n) && ts.isExternalModuleReference(n.moduleReference)) out.push({ spec: lit(n.moduleReference.expression), kind: 'static', reexport: false });
      else if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword) out.push({ spec: lit(n.arguments[0]), kind: 'dynamic', reexport: false });
      else if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'require' && n.arguments.length === 1) out.push({ spec: lit(n.arguments[0]), kind: 'static', reexport: false });
      else if (ts.isImportTypeNode(n) && ts.isLiteralTypeNode(n.argument)) out.push({ spec: lit(n.argument.literal), kind: 'static', reexport: false });
      ts.forEachChild(n, visit);
    };
    visit(sf);
    return out.filter((s) => s.spec !== null);
  };

  let importsScanned = 0;
  for (const { project, file } of sourceFiles) {
    for (const { spec, kind, reexport } of specifiersOf(file)) {
      importsScanned += 1;
      const where = file;
      const isRelative = spec.startsWith('./') || spec.startsWith('../') || spec === '.' || spec === '..' || path.isAbsolute(spec);
      const isRooted = /^(apps|packages|tooling|config|docs|evidence)\//.test(spec);
      if (isRelative || isRooted) {
        const target = isRooted ? abs(spec) : path.resolve(path.dirname(abs(file)), spec);
        const owner = ownerOf(target);
        if (owner === project) continue;
        if (!owner) { flag('OUTSIDE_PROJECT', `${project.name} imports "${spec}", outside every project`, where); continue; }
        flag('ENTRY_BYPASS', `${project.name} imports "${spec}" inside ${owner.name}; use its public entry point`, where);
        addEdge(project, owner, kind, where);
        continue;
      }
      if (spec.startsWith('@proseit/')) {
        const pkgName = spec.split('/').slice(0, 2).join('/');
        const target = packageNames.get(pkgName) || byName.get(pkgName);
        if (!target) { flag('UNKNOWN_PACKAGE', `${project.name} imports "${spec}", which is not a workspace package`, where); continue; }
        if (spec !== pkgName) flag('DEEP_IMPORT', `${project.name} imports "${spec}" below the ${pkgName} entry point`, where);
        addEdge(project, target, kind, where);
        continue;
      }
      if (!externalByProject.has(project.name)) externalByProject.set(project.name, []);
      externalByProject.get(project.name).push({ spec, where, reexport });
    }
  }
  // Workspace packages named in package.json dependency fields are edges too.
  const manifestOf = (p) => (p.category === 'app' ? null : `${p.root}/package.json`);
  for (const p of projects) {
    const m = manifestOf(p);
    if (!m || !exists(m)) continue;
    const pkg = readJson(m);
    for (const field of MANIFEST_FIELDS) {
      for (const dep of Object.keys(pkg[field] || {})) {
        const target = packageNames.get(dep);
        if (target) addEdge(p, target, 'implicit', `${m} ${field}`);
        else if (dep.startsWith('@proseit/')) flag('UNKNOWN_PACKAGE', `${p.name} declares ${dep} (${field}), which is not a workspace package`, m);
        else {
          if (!externalByProject.has(p.name)) externalByProject.set(p.name, []);
          externalByProject.get(p.name).push({ spec: dep, where: `${m} ${field}`, reexport: false });
        }
      }
    }
  }

  // ---- Direction ------------------------------------------------------------------
  const edgeList = [...edges.values()].map((e) => {
    const from = byName.get(e.source);
    const to = byName.get(e.target);
    const verdict = cell(from.category, to.category) ?? 'unknown';
    const sameCategory = from.category === to.category;
    const allowed = !sameCategory && ALLOWED_CELLS.has(verdict);
    return { source: e.source, target: e.target, sourceCategory: from.category, targetCategory: to.category, matrix: sameCategory ? '- (same category)' : verdict, allowed, needsJustification: allowed && verdict === 'Optional', kinds: [...e.kinds].sort(), files: [...e.files].sort() };
  }).sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target));
  for (const e of edgeList) if (!e.allowed) flag('DIRECTION', `${e.source} (${e.sourceCategory}) -> ${e.target} (${e.targetCategory}) is not allowed (Appendix B: ${e.matrix})`, e.files.join(', '));

  // ---- Cycles (Tarjan strongly connected components) -------------------------------
  const adj = new Map(projects.map((p) => [p.name, []]));
  for (const e of edgeList) adj.get(e.source)?.push(e.target);
  let index = 0;
  const idx = new Map();
  const low = new Map();
  const stack = [];
  const onStack = new Set();
  const cycles = [];
  const strong = (v) => {
    idx.set(v, index); low.set(v, index); index += 1; stack.push(v); onStack.add(v);
    for (const w of adj.get(v) || []) {
      if (!idx.has(w)) { strong(w); low.set(v, Math.min(low.get(v), low.get(w))); } else if (onStack.has(w)) low.set(v, Math.min(low.get(v), idx.get(w)));
    }
    if (low.get(v) === idx.get(v)) {
      const scc = [];
      let w;
      do { w = stack.pop(); onStack.delete(w); scc.push(w); } while (w !== v);
      if (scc.length > 1) cycles.push(scc.sort());
    }
  };
  for (const v of adj.keys()) if (!idx.has(v)) strong(v);
  for (const c of cycles) flag('CYCLE', `circular package dependency: ${c.join(' <-> ')}`);

  // ---- contracts neutrality ---------------------------------------------------------
  const allowedExternal = model.externalImports || {};
  for (const p of projects) {
    const allow = allowedExternal[p.category];
    if (!Array.isArray(allow)) continue;
    for (const x of externalByProject.get(p.name) || []) {
      const name = x.spec.startsWith('@') ? x.spec.split('/').slice(0, 2).join('/') : x.spec.split('/')[0];
      if (!allow.includes(name)) flag('CONTRACTS_NEUTRAL', `${p.name} (${p.category}) depends on external module "${x.spec}", which is not approved`, x.where);
    }
  }
  let contractsDiagnostics = 0;
  for (const p of projects.filter((q) => q.category === 'contracts')) {
    const files = walk(p.root).filter((f) => /\.(ts|mts|cts)$/.test(f)).map(abs);
    if (!files.length) continue;
    const program = ts.createProgram(files, { strict: true, noEmit: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.Preserve, moduleResolution: ts.ModuleResolutionKind.Bundler, lib: ['lib.es2022.d.ts'], types: [], skipLibCheck: true, isolatedModules: true });
    for (const d of ts.getPreEmitDiagnostics(program)) {
      contractsDiagnostics += 1;
      const loc = d.file ? `${rel(d.file.fileName)}:${d.file.getLineAndCharacterOfPosition(d.start ?? 0).line + 1}` : '';
      flag('CONTRACTS_NEUTRAL', `${p.name} does not compile with ES2022 only and no ambient types: TS${d.code} ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`, loc);
    }
  }

  // ---- analytics: no external re-export --------------------------------------------
  const noReexport = new Set(model.noExternalReexport?.categories || []);
  for (const p of projects.filter((q) => noReexport.has(q.category))) {
    for (const x of externalByProject.get(p.name) || []) if (x.reexport) flag('ANALYTICS_VENDOR_EXPORT', `${p.name} re-exports external module "${x.spec}"`, x.where);
  }

  // ---- apps do not copy package code -------------------------------------------------
  const min = model.copiedCode?.minNonWhitespaceChars ?? 200;
  const norm = (f) => fs.readFileSync(abs(f), 'utf8').replace(/\s+/g, '');
  const packageBodies = new Map();
  for (const p of libraries) for (const f of walk(p.root)) if (/\.(ts|html|css|scss)$/.test(f)) { const b = norm(f); if (b.length >= min) packageBodies.set(b, f); }
  for (const p of projects.filter((q) => q.category === 'app')) {
    for (const f of walk(p.root)) {
      if (!/\.(ts|html|css|scss)$/.test(f)) continue;
      const b = norm(f);
      if (b.length >= min && packageBodies.has(b)) flag('COPIED_CODE', `${f} duplicates ${packageBodies.get(b)}`, f);
    }
  }

  // ---- Graph (Nx ProjectGraph shape) and dependency constraints ---------------------
  const nxType = (kinds) => (kinds.includes('static') ? 'static' : kinds.includes('dynamic') ? 'dynamic' : 'implicit');
  const graph = {
    $comment: 'PAEP project graph (IB0-WP04). nodes/dependencies follow the Nx ProjectGraph JSON shape; generated without Nx.',
    nodes: Object.fromEntries(projects.map((p) => [p.name, { name: p.name, type: p.category === 'app' ? 'app' : 'lib', data: { root: p.root, projectType: p.projectType, category: p.category, layer: categories[p.category]?.layer ?? null, tags: p.tags } }])),
    dependencies: Object.fromEntries(projects.map((p) => [p.name, edgeList.filter((e) => e.source === p.name).map((e) => ({ source: e.source, target: e.target, type: nxType(e.kinds) }))])),
    edges: edgeList,
    depConstraints: catIds.map((id) => ({ sourceTag: `type:${id}`, onlyDependOnLibsWithTags: columns.filter((to) => to !== id && ALLOWED_CELLS.has(cell(id, to))).map((to) => `type:${to}`) }))
  };
  const counts = {};
  for (const v of violations) counts[v.rule] = (counts[v.rule] || 0) + 1;
  return {
    ok: violations.length === 0,
    summary: { projects: projects.length, libraries: libraries.length, applications: projects.length - libraries.length, sourceFiles: sourceFiles.length, importsScanned, edges: edgeList.length, optionalEdges: edgeList.filter((e) => e.needsJustification).length, cycles: cycles.length, aliases: Object.keys(aliases).length, aliasResolutions, matrixCellsCompared, contractsDiagnostics, violations: violations.length, violationsByRule: counts },
    violations,
    graph
  };

  function fatal(message) {
    return { ok: false, summary: { violations: 1, violationsByRule: { MODEL: 1 } }, violations: [{ rule: 'MODEL', message, where: '' }], graph: null };
  }
}

// ---- CLI ---------------------------------------------------------------------------
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const graphOut = args.includes('--graph') ? args[args.indexOf('--graph') + 1] : null;
  let result;
  try {
    result = checkBoundaries(process.cwd());
  } catch (e) {
    console.error(`architecture check error: ${e.stack || e}`);
    process.exit(2);
  }
  if (graphOut && result.graph) {
    fs.mkdirSync(path.dirname(path.resolve(graphOut)), { recursive: true });
    fs.writeFileSync(graphOut, JSON.stringify(result.graph, null, 2) + '\n', 'utf8');
  }
  if (args.includes('--json')) console.log(JSON.stringify({ ok: result.ok, summary: result.summary, violations: result.violations }, null, 2));
  else {
    for (const v of result.violations) console.log(`VIOLATION ${v.rule} ${v.message}${v.where ? ` [${v.where}]` : ''}`);
    const s = result.summary;
    console.log(`PAEP architecture check: ${result.ok ? 'PASS' : 'FAIL'} — ${s.projects} projects, ${s.edges} edges (${s.optionalEdges} optional), ${s.cycles} cycles, ${s.importsScanned} imports in ${s.sourceFiles} files, ${s.violations} violations`);
  }
  process.exit(result.ok ? 0 : 1);
}

export default checkBoundaries;
