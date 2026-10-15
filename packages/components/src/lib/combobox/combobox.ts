import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, linkedSignal, model, output } from '@angular/core';
import { PaepIcon, PaepIconName } from '@proseit/paep-foundation';
import { PaepInput } from '../input/input';

/** One option. All text is consumer-provided (already localised) and rendered as plain text. */
export interface PaepComboboxOption {
  /** Stable identity within the combobox. */
  readonly id: string;
  readonly label: string;
  /** Optional secondary line, e.g. where a destination is or why a result is limited. */
  readonly description?: string;
  /** Optional decorative leading icon. */
  readonly icon?: PaepIconName;
}

/** A labelled group of options (role=group named by its visible label). */
export interface PaepComboboxGroup {
  readonly id: string;
  readonly label: string;
  readonly options: readonly PaepComboboxOption[];
}

/**
 * Text input with a popup listbox of grouped options (WAI-ARIA combobox, list autocomplete; HOF-IB3-001 P-03):
 * `<paep-combobox label="Search" listboxLabel="Results" [groups]="groups" [(query)]="q" (optionSelect)="go($event)" />`.
 * Focus stays in the input; the active option is conveyed with aria-activedescendant and aria-selected, and is the
 * first option whenever the options change unless the active one is still present. ↓ / ↑ move it, Home / End jump to
 * the first / last option, Enter (or a click) selects it. The host filters: typing only updates `query`. The listbox
 * is shown, and aria-expanded is true, while there is at least one option; the host renders empty, loading and error
 * states around it. No positioning: the listbox follows the input in the flow.
 */
@Component({
  selector: 'paep-combobox',
  exportAs: 'paepCombobox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepIcon, PaepInput],
  host: { class: 'paep-combobox' },
  template: `
    <input
      paepInput
      class="paep-combobox__input"
      type="text"
      role="combobox"
      aria-autocomplete="list"
      autocomplete="off"
      spellcheck="false"
      [attr.aria-label]="label()"
      [attr.aria-expanded]="expanded() ? 'true' : 'false'"
      [attr.aria-controls]="expanded() ? listboxId : null"
      [attr.aria-activedescendant]="activeDomId()"
      [attr.placeholder]="placeholder() || null"
      [value]="query()"
      (input)="onInput($event)"
      (keydown)="onKeydown($event)"
    />
    @if (expanded()) {
      <div class="paep-combobox__listbox" role="listbox" [id]="listboxId" [attr.aria-label]="listboxLabel()">
        @for (g of visibleGroups(); track g.group.id) {
          <div class="paep-combobox__group" role="group" [attr.aria-labelledby]="g.labelId">
            <div class="paep-combobox__group-label" role="presentation" [id]="g.labelId">{{ g.group.label }}</div>
            @for (o of g.options; track o.option.id) {
              <div
                class="paep-combobox__option"
                role="option"
                [id]="o.domId"
                [attr.aria-selected]="o.option.id === activeId() ? 'true' : 'false'"
                (mousedown)="$event.preventDefault()"
                (click)="select(o.option)"
              >
                @if (o.option.icon; as icon) {
                  <svg [paepIcon]="icon"></svg>
                }
                <span class="paep-combobox__option-text">
                  {{ o.option.label }}
                  @if (o.option.description) {
                    <span class="paep-combobox__option-description">{{ o.option.description }}</span>
                  }
                </span>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--paep-space-2);
      min-block-size: 0;
    }
    .paep-combobox__listbox {
      flex: 1 1 auto;
      min-block-size: 0;
      overflow-y: auto;
    }
    .paep-combobox__group-label {
      padding: var(--paep-space-2) var(--paep-space-2) var(--paep-space-1);
      color: var(--paep-color-text-secondary);
      font-size: var(--paep-font-size-caption);
      line-height: var(--paep-line-height-caption);
      font-weight: var(--paep-font-weight-label);
    }
    .paep-combobox__option {
      display: flex;
      align-items: flex-start;
      gap: var(--paep-space-2);
      min-block-size: var(--paep-size-target-touch);
      padding: var(--paep-space-2);
      border-radius: var(--paep-radius-sm);
      color: var(--paep-color-text-primary);
      overflow-wrap: anywhere;
      cursor: pointer;
    }
    .paep-combobox__option:hover {
      background: var(--paep-color-hover-neutral);
    }
    .paep-combobox__option[aria-selected='true'] {
      background: var(--paep-color-selected-bg);
      color: var(--paep-color-selected-fg);
      outline: var(--paep-focus-ring-width) solid var(--paep-color-focus-ring);
      outline-offset: calc(-1 * var(--paep-focus-ring-width));
    }
    .paep-combobox__option svg {
      margin-block: calc((var(--paep-line-height-body) - var(--paep-size-icon-md)) / 2);
    }
    .paep-combobox__option-text {
      flex: 1;
      min-inline-size: 0;
    }
    .paep-combobox__option-description {
      display: block;
      color: var(--paep-color-text-secondary);
      font-size: var(--paep-font-size-body-sm);
      line-height: var(--paep-line-height-body-sm);
    }
    @media (forced-colors: active) {
      .paep-combobox__option[aria-selected='true'] {
        outline-color: Highlight;
      }
    }
  `,
})
export class PaepCombobox {
  private static nextId = 0;
  private readonly host: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly baseId = `paep-combobox-${PaepCombobox.nextId++}`;
  protected readonly listboxId = `${this.baseId}-listbox`;

  /** Accessible name of the input (aria-label), e.g. "Search records, pages and commands". */
  readonly label = input.required<string>();
  /** Accessible name of the listbox, e.g. "Results". */
  readonly listboxLabel = input.required<string>();
  /** Option groups in display order; empty groups are not rendered. */
  readonly groups = input<readonly PaepComboboxGroup[]>([]);
  readonly placeholder = input<string>('');
  /** Text in the input; two-way bindable. The host filters the groups from it. */
  readonly query = model<string>('');
  /** Emits the option chosen with Enter or a click. */
  readonly optionSelect = output<PaepComboboxOption>();

  protected readonly visibleGroups = computed(() => {
    let index = 0;
    return this.groups()
      .filter((group) => group.options.length > 0)
      .map((group, g) => ({
        group,
        labelId: `${this.baseId}-group-${g}`,
        options: group.options.map((option) => ({ option, domId: `${this.baseId}-option-${index++}` })),
      }));
  });
  private readonly flat = computed(() => this.visibleGroups().flatMap((g) => g.options));
  protected readonly expanded = computed(() => this.flat().length > 0);
  /** Id of the active option: kept while it is still offered, otherwise the first option. */
  protected readonly activeId = linkedSignal<readonly { option: PaepComboboxOption }[], string | null>({
    source: this.flat,
    computation: (options, previous) =>
      previous?.value && options.some((o) => o.option.id === previous.value) ? previous.value : (options[0]?.option.id ?? null),
  });
  protected readonly activeDomId = computed(() => this.flat().find((o) => o.option.id === this.activeId())?.domId ?? null);

  protected onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const options = this.flat();
    if (!options.length || event.altKey || event.ctrlKey || event.metaKey) return;
    const current = options.findIndex((o) => o.option.id === this.activeId());
    let next: number;
    switch (event.key) {
      case 'ArrowDown':
        next = Math.min(options.length - 1, current + 1);
        break;
      case 'ArrowUp':
        next = current < 0 ? options.length - 1 : Math.max(0, current - 1);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = options.length - 1;
        break;
      case 'Enter':
        if (current >= 0) {
          event.preventDefault();
          this.select(options[current].option);
        }
        return;
      default:
        return;
    }
    event.preventDefault();
    this.activeId.set(options[next].option.id);
    this.host.querySelector(`#${options[next].domId}`)?.scrollIntoView({ block: 'nearest' });
  }

  protected select(option: PaepComboboxOption): void {
    this.activeId.set(option.id);
    this.optionSelect.emit(option);
  }
}
