import { Routes } from '@angular/router';
import { LabNavGroup } from './lab/lab-nav';
import { LabFamily } from './lab/specimen-meta';
import { LabFoundationPage, LabFoundationTopic } from './pages/foundation';
import { LabHomePage } from './pages/home';
import { LabTokensPage } from './pages/tokens';
import { LAB_SPECIMENS } from './specimens/registry';

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

const FAMILIES: readonly LabFamily[] = ['Actions', 'Forms', 'Data', 'Feedback', 'Overlay', 'Navigation', 'Structure'];

export const routes: Routes = [
  { path: '', component: LabHomePage, title: 'PAEP UI laboratory' },
  { path: 'tokens', component: LabTokensPage, title: 'Token catalogue · PAEP UI laboratory' },
  ...FOUNDATIONS.map(([topic, label]) => ({
    path: `foundations/${topic}`,
    component: LabFoundationPage,
    data: { topic },
    title: `${label} · PAEP UI laboratory`,
  })),
  ...LAB_SPECIMENS.map((s) => ({ path: `components/${s.meta.id}`, component: s.component, title: `${s.meta.name} · PAEP UI laboratory` })),
  { path: '**', redirectTo: '' },
];

/** Contents list shown in the lab frame and on the home page. */
export const LAB_NAV: readonly LabNavGroup[] = [
  { heading: 'Overview', items: [{ path: '/', label: 'Laboratory home' }, { path: '/tokens', label: 'Token catalogue' }] },
  { heading: 'Foundations', items: FOUNDATIONS.map(([topic, label]) => ({ path: `/foundations/${topic}`, label })) },
  ...FAMILIES.map((family) => ({
    heading: `Components: ${family}`,
    items: LAB_SPECIMENS.filter((s) => s.meta.family === family).map((s) => ({ path: `/components/${s.meta.id}`, label: s.meta.name })),
  })).filter((g) => g.items.length > 0),
];
