/** One entry of the lab contents list. */
export interface LabNavItem {
  readonly path: string;
  readonly label: string;
}

export interface LabNavGroup {
  readonly heading: string;
  readonly items: readonly LabNavItem[];
}
