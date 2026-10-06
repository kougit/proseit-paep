import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  PAEP_SHELL_ACCESS,
  PAEP_SHELL_COUNTS,
  PAEP_SHELL_NAVIGATION,
  type PaepShellAvailability,
  type PaepShellCount,
  type PaepShellLockReason,
  type PaepShellNavGroup,
  type PaepShellNavItem,
} from '../ports/ports';

/** A navigation item as the shell presents it. Not-permitted items never reach this model (Q-10 A). */
export interface PaepShellNavEntry {
  readonly id: string;
  readonly label: string;
  readonly route: string;
  readonly locked: PaepShellLockReason | null;
  readonly count: PaepShellCount | undefined;
  readonly current: boolean;
  readonly children: readonly PaepShellNavEntry[];
}

export interface PaepShellNavSection {
  readonly id: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly icon: PaepShellNavGroup['icon'];
  readonly items: readonly PaepShellNavEntry[];
  /** The current page is inside this group. */
  readonly current: boolean;
}

const AVAILABLE: PaepShellAvailability = { state: 'available' };

/** Path part of a URL, without query or fragment. */
export function routePath(url: string): string {
  return url.split(/[?#]/)[0] || '/';
}

/**
 * @internal The presented navigation: manifest order, host availability (hidden when not permitted, marked when
 * locked), counts and the current item from the router URL. Presentation only; the router and the server decide.
 */
@Injectable()
export class PaepShellNavModel {
  private readonly manifest = inject(PAEP_SHELL_NAVIGATION);
  private readonly access = inject(PAEP_SHELL_ACCESS, { optional: true });
  private readonly counts = inject(PAEP_SHELL_COUNTS, { optional: true });
  private readonly router = inject(Router);
  /** Current route path. */
  readonly path = signal(routePath(this.router.url));
  /** Access information has arrived (always true without an access provider). */
  readonly loaded = computed(() => this.access?.loaded() ?? true);
  readonly home = this.manifest.home;

  readonly sections = computed<readonly PaepShellNavSection[]>(() => {
    const path = this.path();
    const currentRoute = this.bestMatch(path);
    const toEntry = (item: PaepShellNavItem): PaepShellNavEntry | null => {
      const a = this.availability(item.id);
      if (a.state === 'not-permitted') return null;
      const children = (item.children ?? []).map(toEntry).filter((x): x is PaepShellNavEntry => x !== null);
      return {
        id: item.id,
        label: item.label,
        route: item.route,
        locked: a.state === 'locked' ? a.reason : null,
        count: this.counts?.count(item.id),
        current: item.route === currentRoute,
        children,
      };
    };
    const hasCurrent = (entries: readonly PaepShellNavEntry[]): boolean => entries.some((e) => e.current || hasCurrent(e.children));
    return this.manifest.groups
      .map((g) => {
        const items = g.items.map(toEntry).filter((x): x is PaepShellNavEntry => x !== null);
        return { id: g.id, label: g.label, shortLabel: g.shortLabel ?? g.label, icon: g.icon, items, current: hasCurrent(items) };
      })
      .filter((s) => s.items.length > 0);
  });

  /** Every presented entry in order, flattened (used by the palette "Go to" group). */
  readonly entries = computed(() => {
    const out: { entry: PaepShellNavEntry; group: string }[] = [];
    const walk = (list: readonly PaepShellNavEntry[], group: string) => {
      for (const e of list) {
        out.push({ entry: e, group });
        walk(e.children, group);
      }
    };
    for (const s of this.sections()) walk(s.items, s.label);
    return out;
  });

  constructor() {
    const sub = this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) this.path.set(routePath(e.urlAfterRedirects));
    });
    inject(DestroyRef).onDestroy(() => sub.unsubscribe());
  }

  /** Availability of an id as the host reports it (available without an access provider). */
  availability(id: string): PaepShellAvailability {
    if (!this.access) return AVAILABLE;
    return this.access.loaded() ? this.access.availability(id) : AVAILABLE;
  }

  /** The manifest entry whose route equals the path, else the longest route that is a path prefix. */
  private bestMatch(path: string): string | null {
    let best: string | null = null;
    const visit = (items: readonly PaepShellNavItem[]) => {
      for (const i of items) {
        if (path === i.route || (i.route !== '/' && path.startsWith(`${i.route}/`))) {
          if (!best || i.route.length > best.length) best = i.route;
        }
        visit(i.children ?? []);
      }
    };
    for (const g of this.manifest.groups) visit(g.items);
    return best;
  }
}
