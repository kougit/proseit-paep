#!/usr/bin/env node
// PAEP IB1 contracts QA (PAEP-IR-01 §5.6 IB1-WP1/WP2/WP6; PAEP-IB-01 §7, Appendix D).
//
//   node tooling/test-utils/contracts-qa.mjs [--update] [--verbose]     (npm run qa:contracts)
//
// Sections (every check must pass; exit 1 otherwise):
//   S1  independent compile of @proseit/paep-contracts (its tsconfig, and ES2022-only / types [] variants)
//   S2  public API report compared with the reviewed snapshot tooling/test-utils/contract-api-report.json (--update rewrites it)
//   S3  type-only surface: no runtime export, no value symbol, only type-level declarations
//   S4  neutrality: relative `import type` only, no reference directives, forbidden vocabulary, no `any`, readonly everywhere,
//       record maps only at an allowlist, method signatures only in *Gateway interfaces
//   S5  DOM/vendor negative compile fixtures, checker self-tests (injected defects must be caught), architecture check on the real tree
//   S6  positive type fixtures (IB-01 §9.3 example, Appendix D shapes) -> 0 diagnostics
//   S7  negative type fixtures with expected diagnostic codes; DEEP_IMPORT / CONTRACTS_NEUTRAL on scratch copies of the workspace
//   S8  JSON round trip of every positive fixture value
//   S9  node:test suites for the test doubles (tooling/test-utils/src compiled to os.tmpdir())
//   S10 no file under packages/ or apps/ imports tooling/
// Writes only to os.tmpdir() and, if set, $PAEP_EVIDENCE_DIR/contracts-tests.json.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const R = (...p) => path.join(root, ...p);
const rel = (p) => path.relative(root, p).split(path.sep).join('/');
const CONTRACTS_SRC = R('packages/contracts/src');
const CONTRACTS_INDEX = R('packages/contracts/src/index.ts');
const API_REPORT = R('tooling/test-utils/contract-api-report.json');
const UPDATE = process.argv.includes('--update');
const VERBOSE = process.argv.includes('--verbose');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'paep-contracts-qa-'));
process.on('exit', () => fs.rmSync(work, { recursive: true, force: true }));

// Expected node:test counts per suite (S9). Changing a suite requires changing its count here.
const EXPECTED_TESTS = { 'reporting-gateway.test.mjs': 12, 'runtime-config-store.test.mjs': 9 };
const DOM_CODES = new Set([2304, 2552, 2580, 2582, 2583, 2584]);

const sections = [];
let current;
const section = (id, title) => { current = { id, title, checks: 0, passed: 0, failures: [] }; sections.push(current); console.log(`\n== ${id} ${title}`); };
const check = (name, pass, detail = '') => {
  current.checks += 1;
  if (pass) { current.passed += 1; if (VERBOSE) console.log(`  ok   ${name}${detail ? ` - ${detail}` : ''}`); } else { current.failures.push({ name, detail }); console.log(`  FAIL ${name}${detail ? ` - ${detail}` : ''}`); }
  return pass;
};
const fmt = (d) => {
  const where = d.file ? `${rel(d.file.fileName)}:${d.file.getLineAndCharacterOfPosition(d.start ?? 0).line + 1} ` : '';
  return `${where}TS${d.code} ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
};
const walkFiles = (dir, test, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.angular', '.git'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, test, out); else if (test(p)) out.push(p);
  }
  return out.sort();
};
const contractFiles = walkFiles(CONTRACTS_SRC, (f) => f.endsWith('.ts'));

// ---- compiler plumbing ---------------------------------------------------------------------------------------------
const parsedContracts = ts.getParsedCommandLineOfConfigFile(R('packages/contracts/tsconfig.json'), {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} });
const contractsOptions = parsedContracts.options;
/** Consumer view: the contracts options plus the public alias (only the entry point, as tsconfig.base.json maps it). */
const consumerOptions = { ...contractsOptions, paths: { '@proseit/paep-contracts': [CONTRACTS_INDEX] } };

/** Program over real files with in-memory overlays (virtual files never touch the disk). */
function program(rootNames, options, virtual = {}) {
  const v = new Map(Object.entries(virtual).map(([k, t]) => [path.resolve(k), t]));
  const host = ts.createCompilerHost(options, true);
  const { fileExists, readFile, getSourceFile } = host;
  host.fileExists = (f) => v.has(path.resolve(f)) || fileExists.call(host, f);
  host.readFile = (f) => (v.has(path.resolve(f)) ? v.get(path.resolve(f)) : readFile.call(host, f));
  host.getSourceFile = (f, lang, onError, create) => (v.has(path.resolve(f)) ? ts.createSourceFile(f, v.get(path.resolve(f)), lang, true) : getSourceFile.call(host, f, lang, onError, create));
  return ts.createProgram({ rootNames: [...rootNames, ...v.keys()].filter((x, i, a) => a.indexOf(x) === i), options, host });
}
const diagnosticsOf = (p) => ts.getPreEmitDiagnostics(p);

// ---- S1 independent compile --------------------------------------------------------------------------------------
section('S1', 'independent compile');
check('tsconfig parsed without errors', parsedContracts.errors.length === 0, parsedContracts.errors.map(fmt).join('; '));
check('tsconfig covers every source file', isDeepStrictEqual(parsedContracts.fileNames.map((f) => path.resolve(f)).sort(), contractFiles), `${parsedContracts.fileNames.length} vs ${contractFiles.length}`);
const variants = {
  'packages/contracts/tsconfig.json': contractsOptions,
  'ES2022 lib, types [], exactOptionalPropertyTypes, noUncheckedIndexedAccess': { ...contractsOptions, lib: ['lib.es2022.d.ts'], types: [], exactOptionalPropertyTypes: true, noUncheckedIndexedAccess: true, strict: true, skipLibCheck: false },
  'consumer resolution NodeNext (explicit .js specifiers)': { ...contractsOptions, lib: ['lib.es2022.d.ts'], types: [], module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext }
};
for (const [name, options] of Object.entries(variants)) {
  const d = diagnosticsOf(program(contractFiles, options));
  check(`0 diagnostics: ${name}`, d.length === 0, d.slice(0, 5).map(fmt).join('; '));
}
const s1Program = program(contractFiles, contractsOptions);
check('program contains no DOM lib', !s1Program.getSourceFiles().some((f) => /lib\.dom/.test(f.fileName)));
check('program pulls in no node_modules file other than TypeScript libs', s1Program.getSourceFiles().every((f) => !f.fileName.includes('node_modules') || /node_modules\/typescript\/lib\/lib\./.test(f.fileName)));

// ---- S2 public API report -----------------------------------------------------------------------------------------
section('S2', 'public API report');
const checker = s1Program.getTypeChecker();
const indexSf = s1Program.getSourceFile(CONTRACTS_INDEX);
const moduleSymbol = checker.getSymbolAtLocation(indexSf);
const exported = checker.getExportsOfModule(moduleSymbol).map((s) => ({ s, target: s.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(s) : s }));
const printer = ts.createPrinter({ removeComments: true, newLine: ts.NewLineKind.LineFeed });
const normalise = (decl) => printer.printNode(ts.EmitHint.Unspecified, decl, decl.getSourceFile()).replace(/\s+/g, ' ').replace(/\s*([{}();,:<>|=[\]])\s*/g, '$1').trim();
const apiReport = {
  $comment: 'Reviewed public API of @proseit/paep-contracts (packages/contracts/src/index.ts). Regenerate with `node tooling/test-utils/contracts-qa.mjs --update` only after review; any difference fails qa:contracts.',
  entryPoint: 'packages/contracts/src/index.ts',
  exports: exported.map(({ s, target }) => ({
    name: s.getName(),
    kind: (target.declarations ?? []).map((d) => ts.SyntaxKind[d.kind]).join('+'),
    declaration: (target.declarations ?? []).map(normalise).join(' ')
  })).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
};
check('entry point exports at least one symbol', apiReport.exports.length > 0);
if (UPDATE) { fs.writeFileSync(API_REPORT, JSON.stringify(apiReport, null, 2) + '\n', 'utf8'); console.log(`  updated ${rel(API_REPORT)} (${apiReport.exports.length} exports)`); }
let committed = null;
try { committed = JSON.parse(fs.readFileSync(API_REPORT, 'utf8')); } catch (e) { check('committed API report readable', false, e.message); }
if (committed) {
  const byName = (list) => new Map((list ?? []).map((e) => [e.name, e]));
  const a = byName(committed.exports);
  const b = byName(apiReport.exports);
  const added = [...b.keys()].filter((k) => !a.has(k));
  const removed = [...a.keys()].filter((k) => !b.has(k));
  const changed = [...b.keys()].filter((k) => a.has(k) && !isDeepStrictEqual(a.get(k), b.get(k)));
  check('no export added', added.length === 0, added.join(', '));
  check('no export removed', removed.length === 0, removed.join(', '));
  check('no export changed', changed.length === 0, changed.map((k) => `${k}: ${b.get(k).declaration}`).join(' | '));
  check('report identical to snapshot', isDeepStrictEqual(committed, apiReport));
}

// ---- S3 type-only surface -----------------------------------------------------------------------------------------
section('S3', 'type-only surface');
const stripJs = (js) => js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/\s+/g, '');
for (const f of contractFiles) {
  const out = ts.transpileModule(fs.readFileSync(f, 'utf8'), { fileName: f, compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022, verbatimModuleSyntax: true } }).outputText;
  check(`emits no runtime code: ${rel(f)}`, ['', 'export{};'].includes(stripJs(out)), stripJs(out).slice(0, 120));
}
const valueExports = exported.filter(({ target }) => target.flags & ts.SymbolFlags.Value).map(({ s }) => s.getName());
check('no exported symbol has a value meaning', valueExports.length === 0, valueExports.join(', '));
const ALLOWED_STATEMENTS = new Set([ts.SyntaxKind.ImportDeclaration, ts.SyntaxKind.ExportDeclaration, ts.SyntaxKind.InterfaceDeclaration, ts.SyntaxKind.TypeAliasDeclaration]);
function surfaceViolations(sf) {
  const v = [];
  for (const st of sf.statements) if (!ALLOWED_STATEMENTS.has(st.kind)) v.push(`${ts.SyntaxKind[st.kind]} at line ${sf.getLineAndCharacterOfPosition(st.getStart()).line + 1}`);
  const deep = (n) => {
    if ([ts.SyntaxKind.ClassDeclaration, ts.SyntaxKind.ClassExpression, ts.SyntaxKind.EnumDeclaration, ts.SyntaxKind.FunctionDeclaration, ts.SyntaxKind.VariableStatement, ts.SyntaxKind.ModuleDeclaration, ts.SyntaxKind.ExportAssignment, ts.SyntaxKind.ImportEqualsDeclaration].includes(n.kind)) v.push(ts.SyntaxKind[n.kind]);
    ts.forEachChild(n, deep);
  };
  deep(sf);
  for (const st of sf.statements) {
    if (ts.isExportDeclaration(st) && !st.isTypeOnly) v.push('value re-export (export without `type`)');
    if (ts.isInterfaceDeclaration(st) || ts.isTypeAliasDeclaration(st)) if (!st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) v.push(`non-exported declaration ${st.name.text}`);
  }
  return [...new Set(v)];
}
for (const f of contractFiles) {
  const v = surfaceViolations(ts.createSourceFile(f, fs.readFileSync(f, 'utf8'), ts.ScriptTarget.ES2022, true));
  check(`only type-level declarations: ${rel(f)}`, v.length === 0, v.join('; '));
}

// ---- S4 neutrality ------------------------------------------------------------------------------------------------
section('S4', 'neutrality');
const FORBIDDEN = ['frappe', 'doctype', 'angular', 'rxjs', 'observable', 'echarts', 'powerbi', 'power-bi', 'chart.js', 'highcharts', 'sql', 'select ', 'jdbc', 'window', 'document', 'htmlelement'];
/** Controlled exceptions to the vocabulary rule. Each names the declaration, the literal and the controlled source that requires it. */
const VOCABULARY_ALLOWLIST = [
  { owner: 'IdentityMode', text: 'frappe-session', source: 'PAEP-IB-01 §9.1/§9.3 identity.mode value "frappe-session" (runtime-config schema 1.0); an opaque mode identifier, not a Frappe type' }
];
const RECORD_ALLOWLIST = ['PaepError.fieldErrors', 'FeaturesConfig.uiHints', 'ReportQuery.parameters', 'ReportRow', 'ReportResult.totals', 'DrillRequest.sourceContext'];
const hasMod = (n, k) => !!n.modifiers?.some((m) => m.kind === k);
const ownerPath = (n) => {
  let prop; let decl;
  for (let p = n.parent; p; p = p.parent) {
    if (!prop && (ts.isPropertySignature(p) || ts.isMethodSignature(p))) prop = p.name.getText();
    if (ts.isInterfaceDeclaration(p) || ts.isTypeAliasDeclaration(p)) { decl = p.name.text; break; }
  }
  return prop ? `${decl}.${prop}` : `${decl}`;
};
/** Returns {violations, recordSites} for one contracts source file (real or injected). */
function neutrality(sf) {
  const v = [];
  const recordSites = [];
  const at = (n) => `${path.basename(sf.fileName)}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}`;
  if (sf.referencedFiles.length || sf.typeReferenceDirectives.length || sf.libReferenceDirectives.length) v.push('triple-slash reference directive');
  const checkSpecifier = (node, spec) => {
    if (!/^\.\.?\//.test(spec)) { v.push(`non-relative module "${spec}" at ${at(node)}`); return; }
    if (!spec.endsWith('.js')) v.push(`specifier without .js "${spec}" at ${at(node)}`);
    const target = path.resolve(path.dirname(sf.fileName), spec.replace(/\.js$/, '.ts'));
    if (!target.startsWith(CONTRACTS_SRC + path.sep) || !fs.existsSync(target)) v.push(`specifier outside the package or unresolved "${spec}" at ${at(node)}`);
  };
  const visit = (n) => {
    if (ts.isImportDeclaration(n)) {
      if (!n.importClause?.isTypeOnly) v.push(`import without \`import type\` at ${at(n)}`);
      checkSpecifier(n, n.moduleSpecifier.text);
    } else if (ts.isExportDeclaration(n) && n.moduleSpecifier) {
      if (!n.isTypeOnly) v.push(`re-export without \`export type\` at ${at(n)}`);
      checkSpecifier(n, n.moduleSpecifier.text);
    } else if (ts.isImportTypeNode(n) || ts.isImportEqualsDeclaration(n) || (ts.isCallExpression(n) && (n.expression.kind === ts.SyntaxKind.ImportKeyword || n.expression.getText() === 'require'))) {
      v.push(`dynamic/import-type/require at ${at(n)}`);
    }
    if (ts.isIdentifier(n) || ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) {
      const text = n.text.toLowerCase();
      for (const w of FORBIDDEN) {
        if (!text.includes(w)) continue;
        const owner = ownerPath(n);
        if (!VOCABULARY_ALLOWLIST.some((a) => a.owner === owner && a.text === n.text)) v.push(`forbidden vocabulary "${w}" in ${ts.isIdentifier(n) ? 'identifier' : 'string literal'} "${n.text}" (${owner}) at ${at(n)}`);
      }
    }
    if (n.kind === ts.SyntaxKind.AnyKeyword) v.push(`any at ${at(n)}`);
    if (ts.isPropertySignature(n) && !hasMod(n, ts.SyntaxKind.ReadonlyKeyword)) v.push(`mutable property ${ownerPath(n)} at ${at(n)}`);
    if ((ts.isArrayTypeNode(n) || ts.isTupleTypeNode(n)) && !(ts.isTypeOperatorNode(n.parent) && n.parent.operator === ts.SyntaxKind.ReadonlyKeyword)) v.push(`mutable array/tuple type in ${ownerPath(n)} at ${at(n)}`);
    if (ts.isTypeReferenceNode(n)) {
      const name = n.typeName.getText();
      if (['Array', 'Map', 'Set', 'WeakMap', 'WeakSet'].includes(name)) v.push(`mutable collection ${name} in ${ownerPath(n)} at ${at(n)}`);
      if (name === 'Record') {
        const site = ownerPath(n);
        recordSites.push(site);
        const wrapped = ts.isTypeReferenceNode(n.parent) && n.parent.typeName.getText() === 'Readonly';
        if (!RECORD_ALLOWLIST.includes(site)) v.push(`record map outside the allowlist: ${site} at ${at(n)}`);
        if (!wrapped) v.push(`record map not wrapped in Readonly<>: ${site} at ${at(n)}`);
        if (n.typeArguments?.[0]?.kind !== ts.SyntaxKind.StringKeyword) v.push(`record map key is not string: ${site} at ${at(n)}`);
      }
    }
    if (ts.isIndexSignatureDeclaration(n) || ts.isMappedTypeNode(n)) {
      const site = ownerPath(n);
      recordSites.push(site);
      if (!RECORD_ALLOWLIST.includes(site)) v.push(`index signature / mapped type outside the allowlist: ${site} at ${at(n)}`);
      if (ts.isIndexSignatureDeclaration(n) && !hasMod(n, ts.SyntaxKind.ReadonlyKeyword)) v.push(`mutable index signature: ${site} at ${at(n)}`);
    }
    if (ts.isMethodSignature(n) || ts.isCallSignatureDeclaration(n) || ts.isConstructSignatureDeclaration(n) || ts.isFunctionTypeNode(n) || ts.isConstructorTypeNode(n)) {
      const iface = ts.isInterfaceDeclaration(n.parent) ? n.parent.name.text : null;
      if (!(ts.isMethodSignature(n) && iface && /Gateway$/.test(iface))) v.push(`${ts.SyntaxKind[n.kind]} outside a *Gateway interface (${ownerPath(n)}) at ${at(n)}`);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return { violations: [...new Set(v)], recordSites };
}
const parse = (f, text) => ts.createSourceFile(f, text, ts.ScriptTarget.ES2022, true);
const allRecordSites = [];
let anyCount = 0;
let propertyCount = 0;
for (const f of contractFiles) {
  const sf = parse(f, fs.readFileSync(f, 'utf8'));
  const { violations, recordSites } = neutrality(sf);
  allRecordSites.push(...recordSites);
  const count = (n, k) => (n.kind === k ? 1 : 0) + n.getChildren().reduce((s, c) => s + count(c, k), 0);
  anyCount += count(sf, ts.SyntaxKind.AnyKeyword);
  propertyCount += count(sf, ts.SyntaxKind.PropertySignature);
  check(`neutral: ${rel(f)}`, violations.length === 0, violations.join('; '));
}
check('zero `any` keyword nodes', anyCount === 0, String(anyCount));
check('every record-map allowlist entry is used (no stale exception)', RECORD_ALLOWLIST.every((s) => allRecordSites.includes(s)), RECORD_ALLOWLIST.filter((s) => !allRecordSites.includes(s)).join(', '));
check('record maps appear exactly at the allowlist', isDeepStrictEqual([...new Set(allRecordSites)].sort(), [...RECORD_ALLOWLIST].sort()), [...new Set(allRecordSites)].join(', '));
console.log(`  ${contractFiles.length} files, ${propertyCount} property signatures, ${allRecordSites.length} record-map sites, vocabulary exceptions: ${VOCABULARY_ALLOWLIST.map((a) => `${a.owner}="${a.text}"`).join(', ')}`);

// ---- S5 DOM/vendor negative compile fixtures, checker self-tests, architecture check -------------------------------
section('S5', 'DOM/vendor negatives and architecture check');
const FIXTURE = R('packages/contracts/src/__contracts_qa_fixture__.ts'); // virtual only; never written
const DOM_FIXTURES = {
  AbortSignal: 'export interface Probe { readonly signal: AbortSignal }',
  URL: 'export interface Probe { readonly url: URL }',
  Blob: 'export interface Probe { readonly body: Blob }',
  File: 'export interface Probe { readonly file: File }',
  Response: 'export interface Probe { readonly response: Response }',
  document: 'export type Probe = typeof document;',
  window: 'export type Probe = typeof window;',
  HTMLElement: 'export interface Probe { readonly host: HTMLElement }'
};
for (const [name, text] of Object.entries(DOM_FIXTURES)) {
  const d = diagnosticsOf(program(contractFiles, contractsOptions, { [FIXTURE]: `import type { MoneyValue } from './index.js';\nexport type Uses = MoneyValue;\n${text}\n` }));
  const codes = d.map((x) => x.code);
  check(`browser global ${name} is not available to contracts`, codes.length > 0 && codes.every((c) => DOM_CODES.has(c)), d.map(fmt).join('; ') || 'compiled without error');
}
const indexText = fs.readFileSync(CONTRACTS_INDEX, 'utf8');
const INJECTIONS = {
  'import type from @angular/core': `import type { Component } from '@angular/core';\nexport type Injected = Component;\n${indexText}`,
  'import from rxjs': `import type { Observable } from 'rxjs';\nexport type Injected = Observable<string>;\n${indexText}`,
  '/// <reference lib="dom" />': `/// <reference lib="dom" />\n${indexText}`,
  'deep relative import outside the package': `import type { X } from '../../platform/src/index.js';\nexport type Injected = X;\n${indexText}`,
  'value import': `import { type EntityId } from './lib/core/ids.js';\nexport type Injected = EntityId;\n${indexText}`,
  'mutable property': `${indexText}\nexport interface Injected { value: string }\n`,
  'mutable array': `${indexText}\nexport type Injected = string[];\n`,
  'Array<T> reference': `${indexText}\nexport type Injected = Array<string>;\n`,
  'any': `${indexText}\nexport type Injected = any;\n`,
  'record map outside allowlist': `${indexText}\nexport interface Injected { readonly bag: Readonly<Record<string, string>> }\n`,
  'mutable index signature': `${indexText}\nexport interface Injected { [key: string]: string }\n`,
  'method outside a Gateway': `${indexText}\nexport interface InjectedService { load(): Promise<string> }\n`,
  'function-typed property': `${indexText}\nexport interface Injected { readonly cb: () => void }\n`,
  'vendor string literal': `${indexText}\nexport type Injected = 'echarts-option';\n`,
  'SQL string literal': `${indexText}\nexport type Injected = 'select * from t';\n`,
  'DocType identifier': `${indexText}\nexport interface InjectedDocType { readonly name: string }\n`
};
for (const [name, text] of Object.entries(INJECTIONS)) {
  const { violations } = neutrality(parse(CONTRACTS_INDEX, text));
  check(`S4 checker catches injected ${name}`, violations.length > 0);
}
const angularDiag = diagnosticsOf(program(contractFiles, contractsOptions, { [CONTRACTS_INDEX]: INJECTIONS['import type from @angular/core'] }));
console.log(`  note: injected @angular/core import under types [] -> ${angularDiag.length} compile diagnostic(s); caught by S4 regardless`);
const SURFACE_INJECTIONS = {
  'const export': `${indexText}\nexport const injected = 1;\n`,
  'class': `${indexText}\nexport class Injected {}\n`,
  'enum': `${indexText}\nexport enum Injected { A }\n`,
  'function': `${indexText}\nexport function injected(): void {}\n`,
  'namespace': `${indexText}\nexport namespace Injected { export type A = string; }\n`,
  'value re-export': `${indexText}\nexport * from './lib/core/ids.js';\n`
};
for (const [name, text] of Object.entries(SURFACE_INJECTIONS)) {
  check(`S3 checker catches injected ${name}`, surfaceViolations(parse(CONTRACTS_INDEX, text)).length > 0);
}
const archRun = spawnSync(process.execPath, [R('tooling/architecture-boundaries/check-boundaries.mjs')], { cwd: root, encoding: 'utf8' });
const archTail = (archRun.stdout || '').trim().split('\n').pop() ?? '';
check('architecture check on the real tree exits 0', archRun.status === 0, `exit ${archRun.status}: ${archTail} ${archRun.stderr}`);
check('architecture check reports 0 violations', /PASS .* 0 violations$/.test(archTail) && !/^VIOLATION /m.test(archRun.stdout), archTail);

// ---- S6 positive type fixtures --------------------------------------------------------------------------------------
section('S6', 'positive type fixtures');
const controlled = fs.readFileSync(R('.paep-control/text/PAEP_IB_01_v1.0_text.md'), 'utf8');
let ib01Example = null;
{
  const start = controlled.indexOf('### 9.3 Example runtime configuration');
  const line = start >= 0 ? controlled.slice(start).split(/\r?\n/).find((l) => l.startsWith('| {')) : undefined;
  try { ib01Example = JSON.parse(line.slice(1, line.lastIndexOf('|')).replace(/<br>/g, '\n')); } catch (e) { /* reported below */ }
}
check('IB-01 §9.3 example extracted from the controlled text', ib01Example !== null);
check('config/runtime-config.example.json equals the IB-01 §9.3 example', isDeepStrictEqual(JSON.parse(fs.readFileSync(R('config/runtime-config.example.json'), 'utf8')), ib01Example));
const positiveText = fs.readFileSync(R('tooling/test-utils/fixtures/positive.ts.txt'), 'utf8')
  .replace("import type {\n", "import type {\n  RuntimeConfig,\n")
  + `\nexport const ib01RuntimeConfigExample = ${JSON.stringify(ib01Example, null, 2)} satisfies RuntimeConfig;\n`;
const POSITIVE = R('tooling/test-utils/fixtures/__positive__.ts'); // virtual only
const posDiag = diagnosticsOf(program([], consumerOptions, { [POSITIVE]: positiveText }));
check('positive fixtures compile with 0 diagnostics', posDiag.length === 0, posDiag.slice(0, 8).map(fmt).join('; '));
const posSf = parse(POSITIVE, positiveText);
const satisfiesCount = (() => { let c = 0; const w = (n) => { if (ts.isSatisfiesExpression(n)) c += 1; ts.forEachChild(n, w); }; w(posSf); return c; })();
const positiveImports = posSf.statements.filter(ts.isImportDeclaration).map((s) => [s.moduleSpecifier.text, s.importClause?.isTypeOnly]);
check('fixtures import only the public entry, type-only', positiveImports.length === 1 && positiveImports[0][0] === '@proseit/paep-contracts' && positiveImports[0][1] === true);
const REQUIRED_POSITIVE = ['ib01RuntimeConfigExample', 'reportResult', 'exportJob', 'paepError', 'offlineCommand', 'sessionAuthenticated', 'workflowTransition', 'moneyValue'];
const posJs = ts.transpileModule(positiveText, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022, verbatimModuleSyntax: true } }).outputText;
const posModulePath = path.join(work, 'positive-fixtures.mjs');
fs.writeFileSync(posModulePath, posJs, 'utf8');
const positive = await import(pathToFileURL(posModulePath).href);
check('every required fixture is present', REQUIRED_POSITIVE.every((k) => k in positive), REQUIRED_POSITIVE.filter((k) => !(k in positive)).join(', '));
check('every exported fixture uses `satisfies`', satisfiesCount === Object.keys(positive).length, `${satisfiesCount} satisfies / ${Object.keys(positive).length} exports`);
console.log(`  ${Object.keys(positive).length} fixture values (${Object.keys(positive).join(', ')})`);

// ---- S7 negative type fixtures ------------------------------------------------------------------------------------
section('S7', 'negative type fixtures');
const NEGATIVE = [
  ['PaepError without retryable', 'PaepError', `const e: PaepError = { code: 'X', category: 'validation', messageKey: 'k' };`, [2741]],
  ['MoneyValue.amount as number', 'MoneyValue', `const m: MoneyValue = { amount: 12.5, currency: 'EUR' };`, [2322]],
  ['mutation of a readonly config property', 'RuntimeConfig', `declare const c: RuntimeConfig;\nc.product.id = 'other';`, [2540]],
  ['push to a readonly array', 'RuntimeConfig', `declare const c: RuntimeConfig;\nc.localisation.supportedLocales.push('fr');`, [2339]],
  ["deployment.profile 'saas'", 'DeploymentConfig', `const d: DeploymentConfig = { environment: 'test', profile: 'saas', basePath: '/' };`, [2322]],
  ["schemaVersion '2.0'", 'RuntimeConfig', `declare const c: RuntimeConfig;\nconst d: RuntimeConfig = { ...c, schemaVersion: '2.0' };`, [2322]],
  ['uiHints value string', 'FeaturesConfig', `const f: FeaturesConfig = { capabilityDiscovery: 'server', uiHints: { beta: 'yes' } };`, [2322]],
  ['ReportFilter.value as an object', 'ReportFilter', `const f: ReportFilter = { field: 'a', operator: 'eq', value: { nested: 1 } };`, [2322, 2353]],
  ['unknown IdentityConfig key (no secret field exists)', 'IdentityConfig', `const i: IdentityConfig = { mode: 'oidc', clientSecret: 'x' };`, [2353]],
  ['explicit undefined on an optional property (exactOptionalPropertyTypes)', 'ProductConfig', `const p: ProductConfig = { id: 'a', name: 'b', release: 'c', brandProfile: undefined };`, [2375]],
  ["ExportJob status 'done'", 'ExportJob', `const j: ExportJob = { id: 'a', status: 'done' };`, [2322]],
  ['authenticated SessionOutcome without identity', 'SessionOutcome', `const s: SessionOutcome = { status: 'authenticated' };`, [2322, 2741]],
  ['write through a readonly record map', 'PaepError', `declare const e: PaepError;\nif (e.fieldErrors) e.fieldErrors['a'] = [];`, [2542]],
  ['ReportRow value as an arbitrary object (only scalars or MoneyValue)', 'ReportRow', `const r: ReportRow = { a: { nested: 1 } };`, [2353]],
  ['ReportRow money cell without a currency', 'ReportRow', `const r: ReportRow = { a: { amount: '1.00' } };`, [2322, 2741]],
  ['record-map read is possibly undefined (noUncheckedIndexedAccess)', 'ReportRow', `declare const r: ReportRow;\nconst s: string | number | boolean | null = r['a'];`, [2322]]
];
const NEG = R('tooling/test-utils/fixtures/__negative__.ts'); // virtual only
for (const [name, type, body, expected] of NEGATIVE) {
  const d = diagnosticsOf(program([], consumerOptions, { [NEG]: `import type { ${type} } from '@proseit/paep-contracts';\n${body}\nexport {};\n` }));
  const codes = [...new Set(d.map((x) => x.code))];
  const inFixture = d.every((x) => x.file && path.resolve(x.file.fileName) === NEG);
  check(`rejected: ${name} (expects TS${expected.join('/TS')})`, d.length > 0 && inFixture && codes.every((c) => expected.includes(c)), d.map(fmt).join('; ') || 'compiled without error');
}

function scratchWorkspace(label) {
  const dir = fs.mkdtempSync(path.join(work, `${label}-`));
  const skip = (src) => !/(^|[\\/])(node_modules|dist|\.angular)([\\/]|$)/.test(path.relative(root, src));
  for (const p of ['apps', 'packages', 'tooling/architecture-boundaries']) fs.cpSync(R(p), path.join(dir, p), { recursive: true, filter: skip, verbatimSymlinks: true });
  for (const f of fs.readdirSync(root).filter((f) => /^tsconfig.*\.json$/.test(f) || f === 'package.json' || f === 'angular.json')) fs.copyFileSync(R(f), path.join(dir, f));
  const model = JSON.parse(fs.readFileSync(R('tooling/architecture-boundaries/architecture-model.json'), 'utf8'));
  fs.mkdirSync(path.dirname(path.join(dir, model.source.document)), { recursive: true });
  fs.copyFileSync(R(model.source.document), path.join(dir, model.source.document));
  fs.symlinkSync(R('node_modules'), path.join(dir, 'node_modules'), 'dir');
  return dir;
}
const runArch = (dir) => spawnSync(process.execPath, [path.join(dir, 'tooling/architecture-boundaries/check-boundaries.mjs')], { cwd: dir, encoding: 'utf8' });
{
  const control = scratchWorkspace('control');
  const r = runArch(control);
  check('scratch-copy control: unmodified copy passes the architecture check', r.status === 0, (r.stdout + r.stderr).trim().split('\n').slice(-3).join(' | '));
}
const ARCH_NEGATIVE = [
  ['deep import into @proseit/paep-contracts is rejected', 'packages/platform/src/index.ts', (t) => `import type { EntityId } from '@proseit/paep-contracts/src/lib/core/ids';\nexport type InjectedEntityId = EntityId;\n${t}`, 'DEEP_IMPORT'],
  ["import '@angular/core' in contracts is rejected", 'packages/contracts/src/index.ts', (t) => `import '@angular/core';\n${t}`, 'CONTRACTS_NEUTRAL']
];
for (const [name, file, mutate, rule] of ARCH_NEGATIVE) {
  const dir = scratchWorkspace(rule.toLowerCase());
  const target = path.join(dir, file);
  fs.writeFileSync(target, mutate(fs.readFileSync(target, 'utf8')), 'utf8');
  const r = runArch(dir);
  check(`${name} (${rule})`, r.status === 1 && new RegExp(`^VIOLATION ${rule} `, 'm').test(r.stdout), `exit ${r.status}; ${(r.stdout.match(/^VIOLATION \S+/gm) || []).join(', ')}`);
}

// ---- S8 JSON round trip ------------------------------------------------------------------------------------------
section('S8', 'JSON round trip');
for (const [name, value] of Object.entries(positive)) check(`JSON round trip: ${name}`, isDeepStrictEqual(JSON.parse(JSON.stringify(value)), value));

// ---- S9 test doubles -----------------------------------------------------------------------------------------------
section('S9', 'test doubles (node:test)');
const dist = path.join(work, 'dist');
const emitOptions = { ...consumerOptions, noEmit: false, outDir: dist, rootDir: root, declaration: false, sourceMap: false, module: ts.ModuleKind.ES2022, noEmitOnError: true, lib: ['lib.es2022.d.ts'], types: [] };
const utilsSrc = walkFiles(R('tooling/test-utils/src'), (f) => f.endsWith('.ts'));
const emitProgram = program([...utilsSrc, R('packages/platform/src/index.ts')], emitOptions);
const emitDiag = diagnosticsOf(emitProgram);
check('tooling/test-utils/src and packages/platform/src compile with 0 diagnostics (contracts options, ES2022, types [])', emitDiag.length === 0, emitDiag.slice(0, 8).map(fmt).join('; '));
const emitted = emitProgram.emit();
check('emit succeeded', !emitted.emitSkipped, emitted.diagnostics.map(fmt).join('; '));
fs.writeFileSync(path.join(dist, 'package.json'), '{"type":"module"}\n', 'utf8');
const utilsDist = path.join(dist, 'tooling/test-utils/src');
const utilsJs = walkFiles(utilsDist, (f) => f.endsWith('.js'));
check('compiled test doubles carry no runtime reference to contracts or packages', utilsJs.length === utilsSrc.length && utilsJs.every((f) => !/^\s*(import|export)\b[^;]*['"](@proseit\/|[^'"]*packages\/)/m.test(fs.readFileSync(f, 'utf8'))), `${utilsJs.length} files`);
check('test-double sources import contracts only from the public entry, type-only', utilsSrc.every((f) => parse(f, fs.readFileSync(f, 'utf8')).statements.filter(ts.isImportDeclaration).every((s) => /^\.\/[\w-]+\.js$/.test(s.moduleSpecifier.text) || (s.moduleSpecifier.text === '@proseit/paep-contracts' && s.importClause?.isTypeOnly))));
check('test doubles contain no Frappe fake', utilsSrc.every((f) => !/frappe/i.test(fs.readFileSync(f, 'utf8'))));
const testFiles = walkFiles(R('tooling/test-utils/test'), (f) => f.endsWith('.test.mjs'));
check('test suites match the expected set', isDeepStrictEqual(testFiles.map((f) => path.basename(f)), Object.keys(EXPECTED_TESTS).sort()), testFiles.map((f) => path.basename(f)).join(', '));
let testsRun = 0;
for (const f of testFiles) {
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', f], {
    cwd: work, encoding: 'utf8',
    env: { ...process.env, PAEP_TEST_UTILS_DIST: utilsDist, PAEP_PLATFORM_DIST: path.join(dist, 'packages/platform/src') }
  });
  const n = (k) => Number((r.stdout.match(new RegExp(`^# ${k} (\\d+)$`, 'm')) || [])[1] ?? NaN);
  const c = { tests: n('tests'), pass: n('pass'), fail: n('fail'), skipped: n('skipped'), todo: n('todo'), cancelled: n('cancelled') };
  testsRun += c.pass;
  const expected = EXPECTED_TESTS[path.basename(f)];
  const ok = r.status === 0 && c.tests === expected && c.pass === expected && c.fail === 0 && c.skipped === 0 && c.todo === 0 && c.cancelled === 0;
  check(`${path.basename(f)}: ${c.pass}/${expected} passed, 0 failed/skipped/todo`, ok, `${JSON.stringify(c)} exit ${r.status}\n${r.stdout.split('\n').filter((l) => /^not ok|^\s+(error|message|expected|actual):/.test(l)).slice(0, 12).join('\n')}${r.stderr}`);
}
console.log(`  ${testsRun} node:test tests passed`);

// ---- S10 no packages/apps import of tooling ------------------------------------------------------------------------
section('S10', 'packages/ and apps/ never import tooling/');
const productFiles = [...walkFiles(R('packages'), (f) => /\.(ts|tsx|mts|cts|js|mjs|cjs)$/.test(f)), ...walkFiles(R('apps'), (f) => /\.(ts|tsx|mts|cts|js|mjs|cjs)$/.test(f))];
const toolingRefs = [];
for (const f of productFiles) {
  const text = fs.readFileSync(f, 'utf8');
  const sf = parse(f, text);
  const w = (n) => {
    let spec;
    if ((ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier) spec = n.moduleSpecifier.text;
    else if (ts.isCallExpression(n) && (n.expression.kind === ts.SyntaxKind.ImportKeyword || n.expression.getText() === 'require') && n.arguments[0] && ts.isStringLiteralLike(n.arguments[0])) spec = n.arguments[0].text;
    else if (ts.isImportTypeNode(n) && ts.isLiteralTypeNode(n.argument)) spec = n.argument.literal.text;
    if (spec && /(^|\/)tooling(\/|$)|test-utils/.test(spec)) toolingRefs.push(`${rel(f)} -> ${spec}`);
    ts.forEachChild(n, w);
  };
  w(sf);
  if (/^\s*(import|export)\b[^;]*['"][^'"]*\btooling\//m.test(text) && !toolingRefs.some((x) => x.startsWith(rel(f)))) toolingRefs.push(`${rel(f)} (text match)`);
}
check(`${productFiles.length} source files scanned, none imports tooling/`, toolingRefs.length === 0, toolingRefs.join(', '));

// ---- summary -----------------------------------------------------------------------------------------------------
const total = sections.reduce((s, x) => s + x.checks, 0);
const failedChecks = sections.reduce((s, x) => s + x.failures.length, 0);
console.log('\nPAEP contracts QA summary');
for (const s of sections) console.log(`  ${s.failures.length ? 'FAIL' : 'PASS'} ${s.id.padEnd(3)} ${s.title}: ${s.passed}/${s.checks}`);
console.log(`PAEP contracts QA: ${failedChecks ? 'FAIL' : 'PASS'} - ${total - failedChecks}/${total} checks, ${sections.length} sections, ${testsRun} node:test tests, ${apiReport.exports.length} public exports`);
if (process.env.PAEP_EVIDENCE_DIR) {
  fs.mkdirSync(process.env.PAEP_EVIDENCE_DIR, { recursive: true });
  const out = path.join(process.env.PAEP_EVIDENCE_DIR, 'contracts-tests.json');
  fs.writeFileSync(out, JSON.stringify({
    tool: 'tooling/test-utils/contracts-qa.mjs', node: process.version, typescript: ts.version, ok: failedChecks === 0,
    totals: { checks: total, failed: failedChecks, nodeTests: testsRun, publicExports: apiReport.exports.length },
    sections: sections.map(({ id, title, checks, passed, failures }) => ({ id, title, checks, passed, failures }))
  }, null, 2) + '\n', 'utf8');
  console.log(`evidence: ${out}`);
}
process.exit(failedChecks ? 1 : 0);
