import type { CompatibilityReport, RuntimeConfig, RuntimeConfigBuildContext, RuntimeConfigIssue } from '@proseit/paep-contracts';
import { PAEP_COMPATIBILITY_VERSION } from './constants.js';
import { compareMajorMinor } from './semantic.js';

/*
 * Compatibility checks (PAEP-IR-01 §5.6 IB1-WP5; PAEP-IB-01 §9.2(iv),(vi)): the configuration must be for this product, name a backend
 * API contract this build implements, and declare a PAEP range that contains this build's PAEP compatibility line.
 */
export function checkCompatibility(c: RuntimeConfig, context: RuntimeConfigBuildContext): { readonly issues: RuntimeConfigIssue[]; readonly report: CompatibilityReport } {
  const issues: RuntimeConfigIssue[] = [];
  const comp = c.backend.compatibility;
  if (c.product.id !== context.expectedProductId) issues.push({ stage: 'compatibility', code: 'CFG_COMPAT_PRODUCT', path: '/product/id' });
  if (!context.supportedApiContracts.includes(comp.apiContract)) issues.push({ stage: 'compatibility', code: 'CFG_COMPAT_API_CONTRACT', path: '/backend/compatibility/apiContract' });
  if (compareMajorMinor(PAEP_COMPATIBILITY_VERSION, comp.minimumPaep) < 0) issues.push({ stage: 'compatibility', code: 'CFG_COMPAT_PAEP', path: '/backend/compatibility/minimumPaep' });
  if (comp.maximumPaep && compareMajorMinor(PAEP_COMPATIBILITY_VERSION, comp.maximumPaep) > 0) issues.push({ stage: 'compatibility', code: 'CFG_COMPAT_PAEP', path: '/backend/compatibility/maximumPaep' });
  return {
    issues,
    report: {
      status: 'compatible',
      schemaVersion: c.schemaVersion,
      apiContract: comp.apiContract,
      paepVersion: PAEP_COMPATIBILITY_VERSION,
      minimumPaep: comp.minimumPaep,
      maximumPaep: comp.maximumPaep ?? null
    }
  };
}
