/** Token category, as catalogued in HOF-IB2-001 token-values. */
export type PaepTokenCategory =
  | 'color'
  | 'status'
  | 'brand'
  | 'typography'
  | 'space'
  | 'radius'
  | 'size'
  | 'elevation'
  | 'motion'
  | 'focus'
  | 'layout'
  | 'density';

/** reference = raw ramp; semantic = role token; derived = computed from brand; brand = the only overridable layer. */
export type PaepTokenLayer = 'reference' | 'semantic' | 'derived' | 'brand';

/** One design token and its approved default value. */
export interface PaepTokenDefinition {
  readonly name: string;
  readonly value: string;
  readonly category: PaepTokenCategory;
  readonly layer: PaepTokenLayer;
  /** Protected tokens are never overridable by a brand profile. */
  readonly protected: boolean;
  /** Only the seven --paep-brand-* tokens are overridable. */
  readonly overridable: boolean;
  /** Token catalogue version in which the token was introduced. */
  readonly since: string;
  /** Value under data-paep-density="compact", for density tokens. */
  readonly compact?: string;
  /** Replacement token when deprecated (none in 1.0.0). */
  readonly deprecated?: string;
}
