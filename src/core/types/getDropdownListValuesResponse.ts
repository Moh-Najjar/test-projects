/**
 * One row in a dropdown list for a given lookup type.
 */
export interface DropdownListValueItem {
  /** Stable id for this lookup value. */
  lookupValueId: number;
  /** Short machine-oriented code (e.g. region code). */
  code: string;
  /** English display label. */
  nameEn: string;
  /** Arabic display label. */
  nameAr: string;
  /** Parent lookup value id when hierarchical; otherwise null. */
  parentId: number | null;
}

/**
 * Response body: keys are lookup type ids as strings (JSON object keys),
 * values are the ordered list of options for that type.
 * Example: `{ "6": [ { lookupValueId: 218, ... }, ... ] }`.
 */
export type GetDropdownListValuesResponse = Record<
  string,
  DropdownListValueItem[]
>;
