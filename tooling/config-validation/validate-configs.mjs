#!/usr/bin/env node
// PAEP IB1: CI validation of committed runtime-configuration documents through the compiled platform validator.
//   - config/runtime-config.example.json          with the reference-app build context
//   - apps/<app>/public/config/*.json              with that application's build context (apps/<app>/src/app/runtime-config.ts)
//   - tooling/config-validation/fixtures/manifest.json: structure, file correspondence, valid fixtures accepted
// Uses $PAEP_IB1_PLATFORM_DIR when set, otherwise compiles the platform into os.tmpdir(). Exit 1 on any failure.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { REPO_ROOT, resolvePlatformDir } from './lib/compile-platform.mjs';

const rel = (p) => path.relative(REPO_ROOT, p).split(path.sep).join('/');

/** Read an application's compiled-in build context from its runtime-config.ts (string literals only). */
export function readBuildContext(app) {
  const file = path.join(REPO_ROOT, 'apps', app, 'src', 'app', 'runtime-config.ts');
  if (!fs.existsSync(file)) return null;
  const src = fs.readFileSync(file, 'utf8');
  const id = /expectedProductId:\s*'([a-z0-9-]+)'/.exec(src);
  const list = (name) => {
    const m = new RegExp(`${name}:\\s*\\[([^\\]]*)\\]`).exec(src);
    if (!m) return null;
    return [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]);
  };
  const apis = list('supportedApiContracts');
  const bi = list('externalBiProviders');
  if (!id || !apis || !bi) throw new Error(`${rel(file)}: cannot read the build context`);
  return { expectedProductId: id[1], supportedApiContracts: apis, externalBiProviders: bi };
}

export async function validateConfigs(platformDir = resolvePlatformDir()) {
  const P = await import(pathToFileURL(path.join(platformDir, 'index.js')).href);
  const results = [];
  const check = (name, ok, detail = '') => results.push({ name, ok, detail });
  const validate = (file, context, env = {}) => P.validateRuntimeConfigBytes(new Uint8Array(fs.readFileSync(file)), context, env);
  const describe = (o) => (o.ok ? `ok configId ${o.store.configId}` : `${o.stage} ${o.code} ${o.issues.map((i) => i.path || '/').join(',')}`);

  const refContext = readBuildContext('reference-app');
  check('reference-app build context readable', Boolean(refContext), JSON.stringify(refContext));
  if (refContext) {
    const example = path.join(REPO_ROOT, 'config', 'runtime-config.example.json');
    const o = validate(example, refContext);
    check(`${rel(example)} valid (reference-app context)`, o.ok, describe(o));
  }

  let appConfigs = 0;
  for (const app of fs.readdirSync(path.join(REPO_ROOT, 'apps')).sort()) {
    const dir = path.join(REPO_ROOT, 'apps', app, 'public', 'config');
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
    const context = readBuildContext(app);
    for (const f of files) {
      appConfigs += 1;
      const file = path.join(dir, f);
      if (!context) { check(`${rel(file)} has a build context`, false, `apps/${app}/src/app/runtime-config.ts missing`); continue; }
      const o = validate(file, context, { documentBasePath: '/' });
      check(`${rel(file)} valid (${app} context, served at /)`, o.ok, describe(o));
    }
  }
  check('at least one application runtime configuration validated', appConfigs > 0, `${appConfigs} file(s)`);

  // Fixture manifest.
  const fixtures = path.join(REPO_ROOT, 'tooling', 'config-validation', 'fixtures');
  let manifest = null;
  try { manifest = JSON.parse(fs.readFileSync(path.join(fixtures, 'manifest.json'), 'utf8')); } catch (e) { check('fixtures/manifest.json parses', false, String(e.message)); }
  if (manifest) {
    const listed = (arr, key) => (Array.isArray(arr) ? arr.filter((e) => e[key]).map((e) => e[key]).sort() : []);
    const onDisk = (d) => fs.readdirSync(path.join(fixtures, d)).map((f) => `${d}/${f}`).sort();
    check('manifest valid[] matches fixtures/valid one-to-one', JSON.stringify(listed(manifest.valid, 'file')) === JSON.stringify(onDisk('valid')));
    check('manifest invalid[].file matches fixtures/invalid one-to-one', JSON.stringify(listed(manifest.invalid, 'file')) === JSON.stringify(onDisk('invalid')));
    const ids = (manifest.invalid ?? []).map((e) => e.id);
    check('manifest invalid ids unique', new Set(ids).size === ids.length, `${ids.length} entries`);
    const badEntries = (manifest.invalid ?? []).filter((e) => !e.expect || typeof e.expect.stage !== 'string' || !/^CFG_[A-Z0-9_]+$/.test(e.expect.code ?? '') || !Array.isArray(e.expect.issues)
      || !e.expect.issues.length || e.expect.issues[0][0] !== e.expect.stage || e.expect.issues[0][1] !== e.expect.code || Boolean(e.file) === Boolean(e.base)
      || (e.base && !listed(manifest.valid, 'file').includes(e.base)));
    check('manifest invalid entries well-formed', badEntries.length === 0, badEntries.map((e) => e.id).join(', '));
    const ctx = manifest.buildContext;
    check('manifest build context equals the reference-app build context', JSON.stringify(ctx) === JSON.stringify(refContext));
    for (const e of manifest.valid ?? []) {
      const o = validate(path.join(fixtures, e.file), ctx, e.env ?? {});
      check(`fixture ${e.file} valid`, o.ok && o.store.config.deployment.profile === e.profile, describe(o));
    }
  }
  return results;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const results = await validateConfigs();
    for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.detail ? ` - ${r.detail}` : ''}`);
    const failed = results.filter((r) => !r.ok).length;
    console.log(`validate-configs: ${results.length - failed}/${results.length} checks passed`);
    process.exit(failed ? 1 : 0);
  } catch (e) {
    console.error(`validate-configs: ERROR ${e.message}`);
    process.exit(1);
  }
}
