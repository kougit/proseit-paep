// QA round 5 probes: each case mutates the scratch repo, runs the checker with --json, then resets via git.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repo = path.resolve(process.argv[2]);
const only = process.argv[3];
const w = (f, s) => { const p = path.join(repo, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
const app = (f, s) => fs.appendFileSync(path.join(repo, f), s);
const pj = (f, fn) => { const p = path.join(repo, f); const o = JSON.parse(fs.readFileSync(p, 'utf8')); fn(o); fs.writeFileSync(p, JSON.stringify(o, null, 2) + '\n'); };
const COMP = 'packages/components/package.json';
const ENTRY = 'packages/components/src/index.ts';
const MAIN = 'apps/reference-app/src/main.ts';
const X = () => w('packages/components/src/lib/x.ts', 'export const x = 1;\n');

const cases = {
  P1_pkgjson_dir: () => { pj(COMP, (o) => { o.imports = { '#z': './src/lib/x.ts' }; }); X(); w('packages/components/src/sub/package.json/readme.txt', 'x'); w('packages/components/src/sub/use.ts', "import '#z';\n"); app(ENTRY, "import './sub/use';\n"); },
  P2_app_manifest_imports_deep: () => { w('apps/reference-app/package.json', JSON.stringify({ imports: { '#d': '@proseit/paep-components/src/index' } })); app(MAIN, "import '#d';\n"); },
  P3_app_manifest_imports_otherapp: () => { w('apps/reference-app/package.json', JSON.stringify({ imports: { '#o': './../ui-lab/src/main.ts' } })); app(MAIN, "import '#o';\n"); },
  P4_app_manifest_name_and_deps: () => { w('apps/reference-app/package.json', JSON.stringify({ name: '@proseit/paep-enterprise', dependencies: { '@proseit/paep-nonexistent': '*' } })); },
  P5_app_nested_pkgjson: () => { w('apps/reference-app/src/app/package.json', JSON.stringify({ imports: { '#o': '../../../ui-lab/src/main.ts' } })); app('apps/reference-app/src/app/app.ts', "import '#o';\n"); },
  P6_nested_named_proseit: () => { w('packages/enterprise/src/x/package.json', JSON.stringify({ name: '@proseit/paep-components' })); },
  P7_cond_nested_hash: () => { pj(COMP, (o) => { o.imports = { '#x': { node: { import: '#y' }, default: './src/lib/x.ts' }, '#y': '@proseit/paep-enterprise' }; }); X(); app(ENTRY, "import '#x';\n"); },
  P8_array_hash: () => { pj(COMP, (o) => { o.imports = { '#x': ['./src/lib/x.ts', '#y'], '#y': '@proseit/paep-enterprise' }; }); X(); app(ENTRY, "import '#x';\n"); },
  P9_hole_hash: () => { pj(COMP, (o) => { o.imports = { '#p/*': '*', '#y': '@proseit/paep-enterprise' }; }); app(ENTRY, "import '#p/#y';\n"); },
  P10_hole_bare: () => { pj(COMP, (o) => { o.imports = { '#p/*': '*' }; }); app(ENTRY, "import '#p/@proseit/paep-enterprise';\n"); },
  P11_root_imports_app: () => { pj('package.json', (o) => { o.imports = { '#o': './apps/ui-lab/src/main.ts' }; }); app(MAIN, "import '#o';\n"); },
  P12_root_imports_pkg_ignored: () => { pj('package.json', (o) => { o.imports = { '#z': '@proseit/paep-enterprise' }; }); pj(COMP, (o) => { o.imports = { '#z': './src/lib/x.ts' }; }); X(); app(ENTRY, "import '#z';\n"); },
  P13_src_node_modules_pkgjson: () => { w('packages/components/src/node_modules/foo/package.json', JSON.stringify({ name: 'foo' })); },
  P14_root_node_modules_pkgjson: () => { w('packages/components/node_modules/foo/package.json', JSON.stringify({ name: 'foo' })); },
  P15_control_lib_pattern: () => { pj(COMP, (o) => { o.imports = { '#lib/*': './src/lib/*.ts' }; }); X(); app(ENTRY, "import { x } from '#lib/x';\nexport const y = x;\n"); },
  P16_count_once: () => { pj(COMP, (o) => { o.imports = { '#c': { import: './src/lib/x.ts', require: './src/lib/x.ts', default: './src/lib/x.ts' } }; }); X(); app(ENTRY, "import '#c';\n"); },
  P17_app_pkgjson_is_dir: () => { w('apps/reference-app/package.json/x.txt', 'x'); app(MAIN, "import '#o';\n"); },
  P18_symlink_dir_escape: () => { w('tooling/qa5-evil/use.ts', "import '@proseit/paep-enterprise';\nexport {};\n"); fs.symlinkSync('../../../tooling/qa5-evil', path.join(repo, 'packages/components/src/sub')); app(ENTRY, "import './sub/use';\n"); },
  P19_symlink_pkgjson: () => { w('tooling/qa5-pj/package.json', JSON.stringify({ imports: { '#z': '@proseit/paep-enterprise' } })); fs.mkdirSync(path.join(repo, 'packages/components/src/sub'), { recursive: true }); fs.symlinkSync('../../../../tooling/qa5-pj/package.json', path.join(repo, 'packages/components/src/sub/package.json')); },
  P20_project_node_modules_source: () => { w('packages/components/node_modules/evil/use.ts', "import '@proseit/paep-enterprise';\nexport {};\n"); app(ENTRY, "import '../node_modules/evil/use';\n"); },
  P21_nested_pkgjson_in_git_dir: () => { w('packages/components/src/.git/use.ts', "import '@proseit/paep-enterprise';\nexport {};\n"); app(ENTRY, "import './.git/use';\n"); },
};

const reset = () => {
  spawnSync('git', ['checkout', '--', '.'], { cwd: repo });
  spawnSync('git', ['clean', '-fdqx', '-e', '/node_modules'], { cwd: repo });
  fs.rmSync(path.join(repo, 'packages/components/node_modules'), { recursive: true, force: true });
  fs.rmSync(path.join(repo, 'packages/components/src/.git'), { recursive: true, force: true });
};
for (const [name, fn] of Object.entries(cases)) {
  if (only && !name.startsWith(only)) continue;
  reset();
  fn();
  const r = spawnSync(process.execPath, ['tooling/architecture-boundaries/check-boundaries.mjs', '--json'], { cwd: repo, encoding: 'utf8' });
  let summary = '';
  try { const o = JSON.parse(r.stdout); summary = `ok=${o.ok} scanned=${o.summary.importsScanned} ` + o.violations.map((v) => `${v.rule}: ${v.message}`).join(' | '); } catch { summary = (r.stderr || r.stdout).split('\n')[0]; }
  console.log(`${name} rc=${r.status} ${summary}`);
}
reset();
