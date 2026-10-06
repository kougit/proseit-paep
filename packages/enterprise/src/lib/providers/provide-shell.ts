import { DOCUMENT, ErrorHandler, Injectable, inject, makeEnvironmentProviders, signal, type EnvironmentProviders, type Provider } from '@angular/core';
import type { RuntimeConfigStore } from '@proseit/paep-contracts';
import { applyLocale, resolveLocale, type PaepMessageCatalogue } from '@proseit/paep-i18n';
import { consoleErrorReporter, type PaepErrorReporter } from '@proseit/paep-observability';
import { browserConnectivitySource, type ConnectivitySource } from '@proseit/paep-platform';
import {
  PAEP_SHELL_ACCESS,
  PAEP_SHELL_COMMANDS,
  PAEP_SHELL_CONNECTIVITY,
  PAEP_SHELL_CONTEXT,
  PAEP_SHELL_COUNTS,
  PAEP_SHELL_ERROR_REPORTER,
  PAEP_SHELL_HOOKS,
  PAEP_SHELL_LOCALE,
  PAEP_SHELL_NAVIGATION,
  PAEP_SHELL_NOTIFICATIONS,
  PAEP_SHELL_RUNTIME_CONFIG,
  PAEP_SHELL_SESSION,
  type PaepShellAccessInfo,
  type PaepShellCommandProvider,
  type PaepShellContextProvider,
  type PaepShellHostHooks,
  type PaepShellLocaleControl,
  type PaepShellNavCounts,
  type PaepShellNavManifest,
  type PaepShellNotificationProvider,
  type PaepShellSession,
} from '../ports/ports';
import { PaepShellErrorHandler, PaepShellErrors } from '../error/shell-errors';
import { PaepShellNavModel } from '../nav/nav-model';
import { PaepRouteFocus } from '../route-focus/route-focus';
import { PaepShellLayout } from '../shell/shell-layout';
import { PaepShellText } from '../shell/shell-text';
import { PAEP_SHELL_MESSAGE_OVERRIDES } from './tokens';

/** What the app gives the shell. Only the runtime configuration and the navigation manifest are required. */
export interface PaepShellOptions {
  /** Validated runtime configuration from the platform startup seam. */
  readonly runtimeConfig: RuntimeConfigStore;
  readonly navigation: PaepShellNavManifest;
  readonly access?: PaepShellAccessInfo;
  readonly counts?: PaepShellNavCounts;
  readonly context?: PaepShellContextProvider;
  readonly commands?: PaepShellCommandProvider;
  readonly notifications?: PaepShellNotificationProvider;
  readonly session?: PaepShellSession;
  readonly hooks?: PaepShellHostHooks;
  /** Defaults to the browser online/offline source of the platform seam. */
  readonly connectivity?: ConnectivitySource;
  /** Defaults to the observability console reporter (kind and reference only). */
  readonly errorReporter?: PaepErrorReporter;
  /** Defaults to a control that applies the chosen supported locale to the document root. */
  readonly locale?: PaepShellLocaleControl;
  /** Overrides of `paep.shell.*` keys per locale tag or language. */
  readonly messages?: Readonly<Record<string, PaepMessageCatalogue>>;
}

/**
 * Default locale control: starts at `localisation.defaultLocale`, offers `supportedLocales` and, on request, applies
 * a supported locale's `lang` and `dir` to the document root through the i18n seam.
 */
@Injectable()
export class PaepShellDocumentLocale implements PaepShellLocaleControl {
  private readonly root = inject(DOCUMENT).documentElement;
  private readonly localisation = inject(PAEP_SHELL_RUNTIME_CONFIG).config.localisation;
  readonly supported = signal<readonly string[]>(this.localisation.supportedLocales);
  readonly active = signal<string>(this.localisation.defaultLocale);

  constructor() {
    this.apply(this.localisation.defaultLocale);
  }

  request(tag: string): void {
    if (this.supported().includes(tag)) this.apply(tag);
  }

  private apply(tag: string): void {
    const locale = resolveLocale(tag, this.localisation.rtlLocales ?? []);
    if (!locale) return;
    applyLocale(this.root, locale);
    this.active.set(tag);
  }
}

function browserConnectivity(): ConnectivitySource {
  const view = inject(DOCUMENT).defaultView;
  if (!view) return { current: () => 'unknown', subscribe: () => () => undefined };
  return browserConnectivitySource(view);
}

const optional = <T>(token: { toString(): string }, value: T | undefined): Provider[] => (value === undefined ? [] : [{ provide: token, useValue: value }]);

/**
 * Providers of the enterprise application shell. Every value is presentation input; none grants authority.
 * `bootstrapApplication(App, { providers: [provideRouter(routes), providePaepShell({ runtimeConfig, navigation })] })`.
 */
export function providePaepShell(options: PaepShellOptions): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: PAEP_SHELL_RUNTIME_CONFIG, useValue: options.runtimeConfig },
    { provide: PAEP_SHELL_NAVIGATION, useValue: options.navigation },
    { provide: PAEP_SHELL_MESSAGE_OVERRIDES, useValue: options.messages ?? {} },
    options.locale ? { provide: PAEP_SHELL_LOCALE, useValue: options.locale } : { provide: PAEP_SHELL_LOCALE, useClass: PaepShellDocumentLocale },
    options.connectivity ? { provide: PAEP_SHELL_CONNECTIVITY, useValue: options.connectivity } : { provide: PAEP_SHELL_CONNECTIVITY, useFactory: browserConnectivity },
    { provide: PAEP_SHELL_ERROR_REPORTER, useValue: options.errorReporter ?? consoleErrorReporter() },
    ...optional(PAEP_SHELL_ACCESS, options.access),
    ...optional(PAEP_SHELL_COUNTS, options.counts),
    ...optional(PAEP_SHELL_CONTEXT, options.context),
    ...optional(PAEP_SHELL_COMMANDS, options.commands),
    ...optional(PAEP_SHELL_NOTIFICATIONS, options.notifications),
    ...optional(PAEP_SHELL_SESSION, options.session),
    ...optional(PAEP_SHELL_HOOKS, options.hooks),
    PaepShellText,
    PaepShellLayout,
    PaepShellNavModel,
    PaepRouteFocus,
    PaepShellErrors,
    { provide: ErrorHandler, useClass: PaepShellErrorHandler },
  ]);
}
