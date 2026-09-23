#!/usr/bin/env node
/**
 * PAEP IB0-WP01 verifier.
 * Uses only Node.js built-ins so it can run without adding project dependencies.
 * It validates repository topology, starter-app registration/build scripts,
 * package-manager declaration, obvious out-of-scope dependencies, and common
 * secret signatures. It does not replace the separate clean `npm ci` evidence.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const evidenceDir = path.join(root, 'evidence', 'IB0-WP01', 'reports');
fs.mkdirSync(evidenceDir, { recursive: true });

const results = [];
const add = (id, name, pass, details = '') => results.push({ id, name, pass: Boolean(pass), details });
const exists = (p) => fs.existsSync(path.join(root, p));
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

const requiredDirs = [
  'apps/reference-app', 'apps/ui-lab',
  'packages/contracts', 'packages/foundation', 'packages/components', 'packages/platform',
  'packages/enterprise', 'packages/analytics', 'packages/offline', 'packages/i18n',
  'packages/observability', 'packages/frappe-sdk',
  'packages/domain-manufacturing', 'packages/domain-quality', 'packages/domain-maintenance',
  'packages/domain-construction', 'packages/domain-commerce', 'packages/domain-fiscal',
  'packages/domain-ai', 'packages/domain-iot',
  'tooling/architecture-boundaries', 'tooling/config-validation', 'tooling/test-utils',
  'tooling/visual-regression', 'tooling/a11y', 'tooling/build-release',
  'config', 'docs/architecture', 'docs/adr', 'docs/provenance', 'docs/licences', 'docs/migration',
  'evidence/tests', 'evidence/accessibility', 'evidence/performance', 'evidence/security',
  'evidence/sbom', 'evidence/releases', 'evidence/portability', 'evidence/usability',
  'evidence/analytics', 'evidence/IB0-WP01'
];

add('V01', 'package.json exists', exists('package.json'));
add('V02', 'package-lock.json exists', exists('package-lock.json'));
add('V03', 'Angular/Nx workspace metadata exists', exists('angular.json') || exists('nx.json'));

let pkg = {};
if (exists('package.json')) {
  try {
    pkg = readJson('package.json');
    add('V04', 'package.json parses', true);
  } catch (e) {
    add('V04', 'package.json parses', false, String(e));
  }
} else {
  add('V04', 'package.json parses', false, 'package.json missing');
}

const packageManager = pkg.packageManager || '';
add('V05', 'npm is declared package manager', /^npm@/i.test(packageManager), packageManager || 'packageManager field missing');

const missingDirs = requiredDirs.filter((d) => !exists(d));
add('V06', 'Required PAEP repository topology exists', missingDirs.length === 0,
  missingDirs.length ? `Missing: ${missingDirs.join(', ')}` : `${requiredDirs.length} required directories present`);

const scripts = pkg.scripts || {};
add('V07', 'build:reference-app script exists', typeof scripts['build:reference-app'] === 'string', scripts['build:reference-app'] || 'missing');
add('V08', 'build:ui-lab script exists', typeof scripts['build:ui-lab'] === 'string', scripts['build:ui-lab'] || 'missing');
add('V09', 'qa:ib0-wp01 script exists', typeof scripts['qa:ib0-wp01'] === 'string', scripts['qa:ib0-wp01'] || 'missing');

function appRegistered(name) {
  if (exists('angular.json')) {
    try {
      const a = readJson('angular.json');
      if (a.projects && Object.prototype.hasOwnProperty.call(a.projects, name)) return true;
      for (const [projectName, val] of Object.entries(a.projects || {})) {
        const r = typeof val === 'string' ? val : val?.root;
        if (projectName === name || r === `apps/${name}`) return true;
      }
    } catch { /* handled elsewhere */ }
  }
  if (exists(`apps/${name}/project.json`)) return true;
  return false;
}
add('V10', 'reference-app is registered as workspace project', appRegistered('reference-app'));
add('V11', 'ui-lab is registered as workspace project', appRegistered('ui-lab'));

const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
const depNames = Object.keys(allDeps).sort();
const forbiddenExactOrPrefixes = [
  'frappe', '@frappe/', 'echarts', 'chart.js', 'highcharts', 'powerbi-client',
  'primeng', 'primeicons', '@syncfusion/', '@progress/', 'devextreme', 'ag-grid-enterprise'
];
const outOfScopeDeps = depNames.filter((d) => forbiddenExactOrPrefixes.some((x) => x.endsWith('/') ? d.startsWith(x) : d === x));
add('V12', 'No obvious out-of-scope Frappe/reporting/commercial UI dependencies', outOfScopeDeps.length === 0,
  outOfScopeDeps.length ? `Found: ${outOfScopeDeps.join(', ')}` : 'none');

const textExt = new Set(['.json', '.ts', '.js', '.mjs', '.cjs', '.html', '.css', '.scss', '.yml', '.yaml', '.env', '.txt']);
const scanRoots = ['apps', 'packages', 'config'];
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /AKIA[0-9A-Z]{16}/,
  /(?:api[_-]?key|client[_-]?secret|access[_-]?token|password)\s*[:=]\s*["'][^"'\n]{8,}["']/i
];
const secretFindings = [];
function walk(dir) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return;
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(rel);
    else if (textExt.has(path.extname(ent.name).toLowerCase()) || ent.name.startsWith('.env')) {
      let text;
      try { text = fs.readFileSync(path.join(root, rel), 'utf8'); } catch { continue; }
      for (const re of secretPatterns) {
        if (re.test(text)) { secretFindings.push(rel); break; }
      }
    }
  }
}
for (const d of scanRoots) walk(d);
add('V13', 'No obvious committed secrets in apps/packages/config', secretFindings.length === 0,
  secretFindings.length ? `Potential findings: ${[...new Set(secretFindings)].join(', ')}` : 'none');

function runScript(id, scriptName, label) {
  if (typeof scripts[scriptName] !== 'string') {
    add(id, label, false, `${scriptName} missing`);
    return;
  }
  const r = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', scriptName], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'pipe',
    env: process.env
  });
  const tail = `${r.stdout || ''}\n${r.stderr || ''}`.trim().split(/\r?\n/).slice(-20).join('\n');
  add(id, label, r.status === 0, `exit=${r.status}\n${tail}`);
}
runScript('V14', 'build:reference-app', 'reference-app build passes');
runScript('V15', 'build:ui-lab', 'ui-lab build passes');

const passed = results.every((r) => r.pass);
const report = {
  workPackage: 'IB0-WP01',
  generatedAt: new Date().toISOString(),
  cwd: root,
  result: passed ? 'PASS' : 'FAIL',
  checks: results
};
const reportPath = path.join(evidenceDir, 'ib0-wp01-verification.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

for (const r of results) {
  process.stdout.write(`${r.pass ? 'PASS' : 'FAIL'} ${r.id} ${r.name}${r.details ? ` — ${r.details.split('\n')[0]}` : ''}\n`);
}
process.stdout.write(`\nIB0-WP01 verifier result: ${report.result}\nEvidence: ${path.relative(root, reportPath)}\n`);
process.exit(passed ? 0 : 1);
