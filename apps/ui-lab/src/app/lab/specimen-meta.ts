import { Type } from '@angular/core';

/** IR-01 §6.4 component families. */
export type LabFamily = 'Actions' | 'Forms' | 'Data' | 'Feedback' | 'Overlay' | 'Navigation' | 'Structure';

/**
 * Documentation for one component specimen page (IR-01 §6.6, Code Block 8): purpose, variants, states,
 * accessibility, responsive behaviour, RTL/localisation and links to retained evidence.
 */
export interface LabSpecimenMeta {
  /** Route segment and stable id, e.g. "button". */
  readonly id: string;
  /** Display name, e.g. "Button". */
  readonly name: string;
  readonly family: LabFamily;
  /** Public selector(s), e.g. "button[paepButton], a[paepButton]". */
  readonly selector: string;
  /** Exported class names from @proseit/paep-components. */
  readonly exports: readonly string[];
  readonly purpose: string;
  readonly variants: readonly string[];
  /** Every state the specimen page demonstrates (IR-01 §6.5 state completeness). */
  readonly states: readonly string[];
  /** Keyboard interaction, one line per key or chord. */
  readonly keyboard: readonly string[];
  /** Accessibility notes: name, role, focus, announcements, non-colour cues. */
  readonly accessibility: readonly string[];
  readonly responsive: string;
  readonly rtl: string;
  /** Content keys the component uses (content-keys.md). */
  readonly contentKeys: readonly string[];
  /** Repository path of the component behaviour tests. */
  readonly unitTests: string;
}

/** Registry entry: metadata plus the standalone specimen component rendered on the page. */
export interface LabSpecimen {
  readonly meta: LabSpecimenMeta;
  readonly component: Type<unknown>;
}
