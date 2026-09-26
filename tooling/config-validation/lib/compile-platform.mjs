// PAEP IB1: compile packages/platform/src (+ the type-only packages/contracts/src it imports) with the TypeScript API into a
// fresh directory under os.tmpdir(). lib is ES2022 only and types is empty, so a successful compile proves the platform
// runtime-configuration boundary has no DOM or Node dependency. Any diagnostic fails the compile. Nothing is written in the repo.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const require = createRequire(path.join(REPO_ROOT, 'package.json'));

function listTs(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isSymbolicLink()) throw new Error(`symlink in source tree: ${p}`);
    if (e.isDirectory()) out.push(...listTs(p));
    else if (e.isFile() && e.name.endsWith('.ts')) out.push(p);
  }
  return out;
}

/**
 * Compile the platform. sourceRoot is a directory containing packages/platform/src and packages/contracts/src (the repo by
 * default; the mutation harness passes a scratch copy). Returns { outDir, platformDir, entry, typescriptVersion }.
 * platformDir holds the compiled platform src tree (index.js, lib/...).
 */
export function compilePlatform({ sourceRoot = REPO_ROOT, outDir } = {}) {
  const ts = require('typescript');
  const pkgRoot = path.join(sourceRoot, 'packages');
  const platformSrc = path.join(pkgRoot, 'platform', 'src');
  const contractsSrc = path.join(pkgRoot, 'contracts', 'src');
  const created = outDir === undefined;
  const out = outDir ?? fs.mkdtempSync(path.join(os.tmpdir(), 'paep-ib1-platform-'));
  const options = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ['lib.es2022.d.ts'],
    types: [],
    strict: true,
    noImplicitAny: true,
    exactOptionalPropertyTypes: true,
    noUncheckedIndexedAccess: true,
    noImplicitReturns: true,
    isolatedModules: true,
    verbatimModuleSyntax: true,
    forceConsistentCasingInFileNames: true,
    skipLibCheck: false,
    noEmitOnError: true,
    declaration: false,
    sourceMap: false,
    rootDir: pkgRoot,
    outDir: out,
    paths: { '@proseit/paep-contracts': [path.join(contractsSrc, 'index.ts')] }
  };
  const rootNames = [...listTs(platformSrc), ...listTs(contractsSrc)];
  const program = ts.createProgram({ rootNames, options });
  const emit = program.emit();
  const pre = ts.getPreEmitDiagnostics(program);
  const diags = pre.length ? [...pre] : [...emit.diagnostics];
  if (diags.length || emit.emitSkipped) {
    const host = { getCanonicalFileName: (f) => f, getCurrentDirectory: () => sourceRoot, getNewLine: () => '\n' };
    const text = diags.length ? ts.formatDiagnostics(diags, host) : 'emit skipped';
    const err = new Error(`platform compile failed (${diags.length} diagnostic(s))\n${text}`);
    err.diagnostics = diags.length;
    if (created) fs.rmSync(out, { recursive: true, force: true });
    throw err;
  }
  fs.writeFileSync(path.join(out, 'package.json'), '{"type":"module"}\n');
  const platformDir = path.join(out, 'platform', 'src');
  const entry = path.join(platformDir, 'index.js');
  if (!fs.existsSync(entry)) throw new Error(`platform entry not emitted: ${entry}`);
  // Type-only imports must be erased: the compiled platform may not import the contracts package at runtime.
  for (const f of listJs(platformDir)) {
    if (/from\s+['"]@proseit\/paep-contracts['"]/.test(fs.readFileSync(f, 'utf8'))) throw new Error(`runtime import of @proseit/paep-contracts left in ${f}`);
  }
  return { outDir: out, platformDir, entry, typescriptVersion: ts.version };
}

function listJs(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listJs(p));
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

let cached;
/**
 * Directory of the compiled platform used by the tests: $PAEP_IB1_PLATFORM_DIR when set (the QA and mutation runners compile
 * once and pass it), otherwise a fresh compile of the repository sources (direct `node --test` use).
 */
export function resolvePlatformDir() {
  if (process.env.PAEP_IB1_PLATFORM_DIR) return process.env.PAEP_IB1_PLATFORM_DIR;
  if (!cached) {
    const compiled = compilePlatform();
    process.once('exit', () => fs.rmSync(compiled.outDir, { recursive: true, force: true }));
    cached = compiled.platformDir;
  }
  return cached;
}
