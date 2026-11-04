/**
 * Request payload for the get-dropdown-list-values API.
 * Lists which lookup type IDs should be resolved into option rows.
 */
export interface GetDropdownListValuesRequest {
  /** One or more lookup type identifiers (e.g. 6 for a region list). */
  lookupTypeIds: number[];
}
