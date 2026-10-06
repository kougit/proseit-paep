// Public entry point of @proseit/paep-enterprise: the IB3 enterprise application shell (HOF-IB3-001 v1.0, component
// map E-01..E-14) and its provider ports. Consumers import this package only through this entry point. Nothing here
// grants authority: the server decides access, context and session, and no permission-granting guard is exported.

// Providers and ports
export { providePaepShell } from './lib/providers/provide-shell';
export type { PaepShellOptions } from './lib/providers/provide-shell';
export {
  PAEP_SHELL_ACCESS,
  PAEP_SHELL_COMMANDS,
  PAEP_SHELL_CONNECTIVITY,
  PAEP_SHELL_CONTEXT,
  PAEP_SHELL_COUNTS,
  PAEP_SHELL_ERROR_REPORTER,
  PAEP_SHELL_HOOKS,
  PAEP_SHELL_LOCALE,
  PAEP_SHELL_LOCK_REASONS,
  PAEP_SHELL_NAVIGATION,
  PAEP_SHELL_NOTIFICATIONS,
  PAEP_SHELL_RUNTIME_CONFIG,
  PAEP_SHELL_SESSION,
} from './lib/ports/ports';
export type {
  PaepShellAccessInfo,
  PaepShellAvailability,
  PaepShellCommandGroup,
  PaepShellCommandProvider,
  PaepShellCommandResult,
  PaepShellCommandResults,
  PaepShellContext,
  PaepShellContextProvider,
  PaepShellCount,
  PaepShellHostHooks,
  PaepShellLocaleControl,
  PaepShellLockReason,
  PaepShellNavCounts,
  PaepShellNavGroup,
  PaepShellNavItem,
  PaepShellNavManifest,
  PaepShellNotification,
  PaepShellNotificationProvider,
  PaepShellNotificationState,
  PaepShellNotificationText,
  PaepShellSession,
  PaepShellSwitchOutcome,
} from './lib/ports/ports';

// Messages
export { PAEP_SHELL_DEFAULT_MESSAGES } from './lib/messages/shell-messages';
export type { PaepShellMessageKey } from './lib/messages/shell-messages';

// Shell parts
export { PaepShell } from './lib/shell/shell';
export { PaepShellTopbar } from './lib/topbar/topbar';
export { PaepShellNav } from './lib/nav/nav';
export { PaepShellNavSheet } from './lib/nav/nav-sheet';
export { PaepCommandPalette } from './lib/palette/command-palette';
export { PaepPageFrame } from './lib/page-frame/page-frame';
export type { PaepPageState } from './lib/page-frame/page-frame';
export { PaepStatusStrip } from './lib/status/status-strip';
export { PaepContextSwitcher } from './lib/context/context-switcher';
export { PaepLockedState } from './lib/locked/locked-state';
export { PaepErrorBoundary } from './lib/error/error-boundary';
export { PaepNotFound } from './lib/error/not-found';
export { PaepShellPreferences } from './lib/preferences/preferences';
export { PaepRouteFocus } from './lib/route-focus/route-focus';
