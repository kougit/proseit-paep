import { Routes } from '@angular/router';
import { PaepNotFound } from '@proseit/paep-enterprise';

/**
 * Reference application routes (IB3 WORK_PACKAGE.md §4): the workspace hosting example, the four locked-state
 * examples, the error-boundary example and the not-found page. No login, analytics or offline route exists, and no
 * route guard grants access: the locked pages only explain.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'workspace' },
  { path: 'workspace', title: 'Workspace', loadComponent: () => import('./pages/workspace').then((m) => m.WorkspacePage) },
  {
    path: 'locked/:reason',
    title: 'Locked example',
    loadComponent: () => import('./pages/locked-example').then((m) => m.LockedExamplePage),
  },
  { path: 'error-demo', title: 'Error boundary example', loadComponent: () => import('./pages/error-example').then((m) => m.ErrorExamplePage) },
  { path: '**', title: 'Page not found', component: PaepNotFound },
];
