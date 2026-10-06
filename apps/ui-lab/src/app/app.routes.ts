import { Routes } from '@angular/router';
import { LabNavGroup } from './lab/lab-nav';
import { LabFamily } from './lab/specimen-meta';
import type { LabFoundationTopic } from './pages/foundation';
import { LabHomePage } from './pages/home';
import { LabTokensPage } from './pages/tokens';
import { LAB_SHOWCASE_PARTS } from './showcase/showcase-pages';
import { LAB_SPECIMEN_INDEX } from './specimens/specimen-index';

const FOUNDATIONS: readonly [LabFoundationTopic, string][] = [
  ['colour', 'Colour'],
  ['typography', 'Typography'],
  ['spacing', 'Spacing, size, radius'],
  ['surfaces', 'Surfaces, elevation'],
  ['motion', 'Motion'],
  ['density', 'Density'],
  ['focus', 'Focus, states'],
  ['icons', 'Icons'],
];

/** Proof pages, loaded on demand (pages/proofs.ts). */
const PROOFS: readonly [string, string, keyof typeof import('./pages/proofs')][] = [
  ['responsive', 'Responsive / 320', 'LabProofReflow'],
  ['long-content', 'Long content', 'LabProofLongContent'],
  ['rtl', 'RTL', 'LabProofRtl'],
  ['brand', 'Brand override', 'LabProofBrand'],
  ['table-strategies', 'Table strategies', 'LabProofTableStrategies'],
];

const FAMILIES: readonly LabFamily[] = ['Actions', 'Forms', 'Data', 'Feedback', 'Overlay', 'Navigation', 'Structure'];

export const routes: Routes = [
  { path: '', component: LabHomePage, title: 'PAEP UI laboratory' },
  { path: 'tokens', component: LabTokensPage, title: 'Token catalogue · PAEP UI laboratory' },
  ...FOUNDATIONS.map(([topic, label]) => ({
    path: `foundations/${topic}`,
    loadComponent: () => import('./pages/foundation').then((m) => m.LabFoundationPage),
    data: { topic },
    title: `${label} · PAEP UI laboratory`,
  })),
  ...PROOFS.map(([path, label, name]) => ({
    path: `proofs/${path}`,
    loadComponent: () => import('./pages/proofs').then((m) => m[name]),
    title: `${label} · PAEP UI laboratory`,
  })),
  { path: 'components', loadChildren: () => import('./specimens/registry').then((m) => m.LAB_SPECIMEN_ROUTES) },
  { path: 'enterprise-shell', loadChildren: () => import('./showcase/showcase-pages').then((m) => m.LAB_SHOWCASE_ROUTES) },
  { path: '**', redirectTo: '' },
];

/** Contents list shown in the lab frame and on the home page. */
export const LAB_NAV: readonly LabNavGroup[] = [
  { heading: 'Overview', items: [{ path: '/', label: 'Laboratory home' }, { path: '/tokens', label: 'Token catalogue' }] },
  { heading: 'Foundations', items: FOUNDATIONS.map(([topic, label]) => ({ path: `/foundations/${topic}`, label })) },
  ...FAMILIES.map((family) => ({
    heading: `Components: ${family}`,
    items: LAB_SPECIMEN_INDEX.filter((s) => s.family === family).map((s) => ({ path: `/components/${s.id}`, label: s.name })),
  })).filter((g) => g.items.length > 0),
  { heading: 'Enterprise shell', items: LAB_SHOWCASE_PARTS.map((p) => ({ path: `/enterprise-shell/${p.id}`, label: p.name })) },
  { heading: 'Proofs', items: PROOFS.map(([path, label]) => ({ path: `/proofs/${path}`, label })) },
];
