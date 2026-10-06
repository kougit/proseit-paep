import { InjectionToken, type Signal } from '@angular/core';
import type { IdentityContext, RuntimeConfigStore, TenantContext } from '@proseit/paep-contracts';
import type { PaepIconName } from '@proseit/paep-foundation';
import type { PaepMessageParams } from '@proseit/paep-i18n';
import type { PaepErrorReporter } from '@proseit/paep-observability';
import type { ConnectivitySource } from '@proseit/paep-platform';

/*
 * Shell provider ports (HOF-IB3-001 component-map §3, RM-02). They are enterprise presentation ports: none of them is a
 * backend contract and none grants authority. The server decides access, context and session; the shell displays
 * what the host gives it. Contracts types are consumed read-only.
 */

/** Why something is shown but not usable. Presentation category only (RM-02), not a contracts type. */
export type PaepShellLockReason = 'permission' | 'edition' | 'configuration' | 'environment';
export const PAEP_SHELL_LOCK_REASONS: readonly PaepShellLockReason[] = ['permission', 'edition', 'configuration', 'environment'];

/** Host access information for one item or action. `not-permitted` items are hidden (Q-10 A). */
export type PaepShellAvailability =
  | { readonly state: 'available' }
  | { readonly state: 'locked'; readonly reason: PaepShellLockReason }
  | { readonly state: 'not-permitted' };

/** A navigation count: a number (shown capped at "99+"), still loading, or unknown. */
export type PaepShellCount = number | 'loading' | 'unknown';

export interface PaepShellNavItem {
  /** Stable id, also the key for access information and counts. */
  readonly id: string;
  readonly label: string;
  /** Internal route path, starting with "/". */
  readonly route: string;
  /** Nested items (one further level). */
  readonly children?: readonly PaepShellNavItem[];
}

export interface PaepShellNavGroup {
  readonly id: string;
  readonly label: string;
  /** Authored short label for the collapsed rail (X-01); otherwise the full label wraps. */
  readonly shortLabel?: string;
  readonly icon?: PaepIconName;
  readonly items: readonly PaepShellNavItem[];
}

/** The app's typed, build-time navigation manifest. The shell never contains a product menu and is never the route authority. */
export interface PaepShellNavManifest {
  /** Route of the safe "Home" destination used by error and not-found pages. */
  readonly home: string;
  readonly groups: readonly PaepShellNavGroup[];
}

/** Access information from the host, re-read whenever its signals change. */
export interface PaepShellAccessInfo {
  /** False until the host has access information; locked and hidden items are then not yet decided. */
  readonly loaded: Signal<boolean>;
  availability(id: string): PaepShellAvailability;
}

/** Count source for navigation items (optional). */
export interface PaepShellNavCounts {
  count(id: string): PaepShellCount | undefined;
}

/** A context the user can work in: a tenant plus an optional site level. */
export interface PaepShellContext {
  readonly tenant: TenantContext;
  readonly site?: string;
}

/** Outcome of a context switch request. The server decides; `rejected` carries a correlation reference. */
export type PaepShellSwitchOutcome = { readonly status: 'accepted' } | { readonly status: 'rejected'; readonly reference: string };

export interface PaepShellContextProvider {
  readonly current: Signal<PaepShellContext | null>;
  /** Contexts offered to the user; the switcher is shown only with more than one (Q-11). */
  readonly available: Signal<readonly PaepShellContext[]>;
  /** Requests a switch to one of `available` (a site of the same tenant is its own context). The server decides. */
  requestSwitch(context: PaepShellContext): Promise<PaepShellSwitchOutcome>;
}

/** Result group of the command palette. */
export type PaepShellCommandGroup = 'goto' | 'actions' | 'records';

export interface PaepShellCommandResult {
  readonly id: string;
  readonly group: PaepShellCommandGroup;
  /** Untrusted plain text. */
  readonly label: string;
  /** Untrusted plain text. */
  readonly description?: string;
  /** Internal route to open; otherwise `run` is called. */
  readonly route?: string;
  readonly run?: () => void;
  readonly locked?: PaepShellLockReason;
}

export interface PaepShellCommandResults {
  readonly results: readonly PaepShellCommandResult[];
  /** Some sources failed; the available results are shown. */
  readonly partial?: boolean;
}

/** Bounded, authorised commands and record search for the palette. "Go to" comes from the manifest. */
export interface PaepShellCommandProvider {
  /** Commands the host offers ("Actions" group); filtered by the query in the shell. */
  readonly actions?: Signal<readonly PaepShellCommandResult[]>;
  /** Record search. Rejecting (or throwing) shows the provider error state with a reference. */
  search?(query: string, signal: AbortSignal): Promise<PaepShellCommandResults>;
}

/** Notification text: untrusted plain text, or a shell or host message key with parameters. */
export type PaepShellNotificationText = string | { readonly key: string; readonly params?: PaepMessageParams };

export interface PaepShellNotification {
  readonly id: string;
  readonly text: PaepShellNotificationText;
  /** Display time, already formatted by the host. */
  readonly time: string;
  readonly unread: boolean;
  readonly route?: string;
  /** Display name of another context the item belongs to. */
  readonly otherTenant?: string;
}

export type PaepShellNotificationState = 'loading' | 'ready' | 'error' | 'stale';

export interface PaepShellNotificationProvider {
  readonly state: Signal<PaepShellNotificationState>;
  readonly unread: Signal<number>;
  readonly items: Signal<readonly PaepShellNotification[]>;
  /** Formatted time of the last successful load, for the stale state. */
  readonly staleSince?: Signal<string | null>;
  markAllRead?(): void;
}

/** Session state given by the host. */
export interface PaepShellSession {
  readonly identity: Signal<IdentityContext | null>;
  /** Display name of the support agent while impersonation lasts. */
  readonly impersonatorName?: Signal<string | null>;
  /** Minutes left once the host's expiry threshold is reached; null otherwise. */
  readonly expiringInMinutes?: Signal<number | null>;
  readonly signingOut?: Signal<boolean>;
  signOut(): void;
  continueSession?(): void;
  endImpersonation?(): void;
}

/** App hooks the shell calls. Every hook is a request; the app decides what happens. */
export interface PaepShellHostHooks {
  /** Help entry; without it no help control is shown. */
  openHelp?(): void;
  /** Explanation action of a locked page; without it the default action is not shown. */
  explainLock?(reason: PaepShellLockReason): void;
}

/** Locale control: the active locale and the request to change it (i18n seam). */
export interface PaepShellLocaleControl {
  readonly active: Signal<string>;
  /** Locales offered (runtime configuration `localisation.supportedLocales`). */
  readonly supported: Signal<readonly string[]>;
  request(tag: string): void;
}

export const PAEP_SHELL_RUNTIME_CONFIG = new InjectionToken<RuntimeConfigStore>('PAEP_SHELL_RUNTIME_CONFIG');
export const PAEP_SHELL_NAVIGATION = new InjectionToken<PaepShellNavManifest>('PAEP_SHELL_NAVIGATION');
export const PAEP_SHELL_ACCESS = new InjectionToken<PaepShellAccessInfo>('PAEP_SHELL_ACCESS');
export const PAEP_SHELL_COUNTS = new InjectionToken<PaepShellNavCounts>('PAEP_SHELL_COUNTS');
export const PAEP_SHELL_CONTEXT = new InjectionToken<PaepShellContextProvider>('PAEP_SHELL_CONTEXT');
export const PAEP_SHELL_COMMANDS = new InjectionToken<PaepShellCommandProvider>('PAEP_SHELL_COMMANDS');
export const PAEP_SHELL_NOTIFICATIONS = new InjectionToken<PaepShellNotificationProvider>('PAEP_SHELL_NOTIFICATIONS');
export const PAEP_SHELL_SESSION = new InjectionToken<PaepShellSession>('PAEP_SHELL_SESSION');
export const PAEP_SHELL_HOOKS = new InjectionToken<PaepShellHostHooks>('PAEP_SHELL_HOOKS');
export const PAEP_SHELL_CONNECTIVITY = new InjectionToken<ConnectivitySource>('PAEP_SHELL_CONNECTIVITY');
export const PAEP_SHELL_ERROR_REPORTER = new InjectionToken<PaepErrorReporter>('PAEP_SHELL_ERROR_REPORTER');
export const PAEP_SHELL_LOCALE = new InjectionToken<PaepShellLocaleControl>('PAEP_SHELL_LOCALE');
