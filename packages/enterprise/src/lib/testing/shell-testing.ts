/*
 * Spec-only helpers for the enterprise shell tests. Not exported from the package entry point and never imported by
 * production code (packages may not import tooling/, so the doubles live beside the specs).
 */
import { signal, type EnvironmentProviders, type Provider } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import type { IdentityContext, RuntimeConfig, RuntimeConfigStore } from '@proseit/paep-contracts';
import type { PaepErrorReport } from '@proseit/paep-observability';
import type { ConnectivitySource, ConnectivityState } from '@proseit/paep-platform';
import type {
  PaepShellContext,
  PaepShellCount,
  PaepShellNavManifest,
  PaepShellNotification,
  PaepShellNotificationProvider,
  PaepShellNotificationState,
  PaepShellSession,
} from '../ports/ports';
import { providePaepShell, type PaepShellOptions } from '../providers/provide-shell';
import { PaepShellLayout } from '../shell/shell-layout';

/** A minimal validated-looking runtime configuration store (test double; the shell only reads it). */
export function testRuntimeConfig(overrides: { environment?: RuntimeConfig['deployment']['environment']; locales?: readonly string[]; rtl?: readonly string[]; productName?: string } = {}): RuntimeConfigStore {
  const config = {
    schemaVersion: '1.0',
    product: { id: 'test-app', name: overrides.productName ?? 'Test Product', release: '0.0.0' },
    deployment: { environment: overrides.environment ?? 'staging', profile: 'cloud-saas', basePath: '/' },
    localisation: { defaultLocale: 'en', supportedLocales: overrides.locales ?? ['en'], rtlLocales: overrides.rtl ?? ['ar'] },
  } as unknown as RuntimeConfig;
  return { config, compatibility: {} as RuntimeConfigStore['compatibility'], configId: 'test-config' };
}

export const TEST_NAVIGATION: PaepShellNavManifest = {
  home: '/home',
  groups: [
    {
      id: 'overview',
      label: 'Overview',
      icon: 'home',
      items: [
        { id: 'home', label: 'Home', route: '/home' },
        { id: 'activity', label: 'Activity', route: '/activity' },
      ],
    },
    {
      id: 'operations',
      label: 'Operations',
      shortLabel: 'Ops',
      icon: 'tasks',
      items: [
        { id: 'work', label: 'Work items', route: '/work' },
        { id: 'archive', label: 'Archive', route: '/archive' },
        { id: 'secret', label: 'Secret area', route: '/secret' },
        { id: 'records', label: 'Records', route: '/records', children: [{ id: 'records-open', label: 'Open records', route: '/records/open' }] },
      ],
    },
  ],
};

/** A controllable connectivity source. */
export function testConnectivity(initial: ConnectivityState = 'online'): ConnectivitySource & { set(s: ConnectivityState): void } {
  let state = initial;
  const listeners = new Set<(s: ConnectivityState) => void>();
  return {
    current: () => state,
    subscribe: (l) => (listeners.add(l), () => listeners.delete(l)),
    set: (s) => {
      state = s;
      for (const l of listeners) l(s);
    },
  };
}

/** Records the reports the shell sends. */
export function testReporter(): { report(r: PaepErrorReport): void; readonly reports: PaepErrorReport[] } {
  const reports: PaepErrorReport[] = [];
  return { reports, report: (r) => reports.push(r) };
}

export const TEST_CONTEXTS: readonly PaepShellContext[] = [
  { tenant: { tenantId: 't-1', displayName: 'Northwind Holdings' }, site: 'Site 04' },
  { tenant: { tenantId: 't-2', displayName: 'Contoso Group' } },
];

export function testSession(overrides: Partial<{ agent: string | null; minutes: number | null }> = {}): PaepShellSession & {
  readonly calls: string[];
  readonly agent: ReturnType<typeof signal<string | null>>;
  readonly minutes: ReturnType<typeof signal<number | null>>;
  readonly signingOut: ReturnType<typeof signal<boolean>>;
  readonly identity: ReturnType<typeof signal<IdentityContext | null>>;
} {
  const calls: string[] = [];
  const agent = signal<string | null>(overrides.agent ?? null);
  const minutes = signal<number | null>(overrides.minutes ?? null);
  const identity = signal<IdentityContext | null>({ principalId: 'u-1', displayName: 'Alex Morgan', tenant: TEST_CONTEXTS[0].tenant });
  const signingOut = signal(false);
  return {
    calls,
    agent,
    minutes,
    identity,
    signingOut,
    impersonatorName: agent,
    expiringInMinutes: minutes,
    signOut: () => (calls.push('signOut'), signingOut.set(true)),
    continueSession: () => calls.push('continue'),
    endImpersonation: () => calls.push('endImpersonation'),
  };
}

/** A controllable notification provider; `calls` records markAllRead and reload requests. */
export function testNotifications(initial: { state?: PaepShellNotificationState; unread?: PaepShellCount; items?: readonly PaepShellNotification[] } = {}): PaepShellNotificationProvider & {
  readonly calls: string[];
  readonly state: ReturnType<typeof signal<PaepShellNotificationState>>;
  readonly unread: ReturnType<typeof signal<PaepShellCount>>;
  readonly items: ReturnType<typeof signal<readonly PaepShellNotification[]>>;
  readonly staleSince: ReturnType<typeof signal<string | null>>;
} {
  const calls: string[] = [];
  return {
    calls,
    state: signal<PaepShellNotificationState>(initial.state ?? 'ready'),
    unread: signal<PaepShellCount>(initial.unread ?? 0),
    items: signal<readonly PaepShellNotification[]>(initial.items ?? []),
    staleSince: signal<string | null>(null),
    markAllRead: () => calls.push('markAllRead'),
    reload: () => calls.push('reload'),
  };
}

/** A layout whose width band the test sets directly. */
export function testLayout(wide: boolean, medium = true): PaepShellLayout {
  return {
    wide: signal(wide),
    medium: signal(medium),
    navCollapsed: signal(false),
    sheetOpen: signal(false),
    paletteOpen: signal(false),
    density: signal('comfortable'),
    preferencesOpen: signal(false),
    languageMenuRequest: signal(0),
  } as unknown as PaepShellLayout;
}

/** Shell providers for a test: test runtime config, manifest, connectivity and reporter, plus a fixed layout. */
export function provideTestShell(
  options: Partial<PaepShellOptions> & { wide?: boolean; medium?: boolean } = {},
): (Provider | EnvironmentProviders)[] {
  const { wide = true, medium = true, ...rest } = options;
  return [
    providePaepShell({
      runtimeConfig: testRuntimeConfig(),
      navigation: TEST_NAVIGATION,
      connectivity: testConnectivity(),
      errorReporter: testReporter(),
      ...rest,
    }),
    { provide: PaepShellLayout, useValue: testLayout(wide, medium) },
  ];
}

/** Renders, waits for the zoneless scheduler and timers, and renders again. */
export async function settle(f: ComponentFixture<unknown>, ms = 20): Promise<void> {
  f.detectChanges();
  await f.whenStable();
  await new Promise((r) => setTimeout(r, ms));
  f.detectChanges();
  await f.whenStable();
}

/** Visible text of an element, whitespace collapsed. */
export const text = (el: Element | null | undefined): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
