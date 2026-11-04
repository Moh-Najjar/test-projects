import type { LookupType } from "../types/FormField";
import type { DropdownListValueItem } from "../types/getDropdownListValuesResponse";

/** Lookup type code returned by the form-fields API for country lists. */
const COUNTRIES_LOOKUP_CODE = "COUNTRIES";

/** ISO-style codes that identify Jordan in the lookup-values batch response. */
const JORDAN_CODES = new Set(["JO", "JOR"]);

/** English display name for Jordan (compared case-insensitively). */
const JORDAN_NAME_EN = "jordan";

/** Arabic display name for Jordan. */
const JORDAN_NAME_AR = "الأردن";

/**
 * True only when this dropdown is bound to the COUNTRIES lookup type.
 * Other lookup types (gender, nationality, etc.) must not receive a Jordan default.
 */
export const isCountriesLookupType = (
  lookupType: LookupType | null | undefined
): boolean => lookupType?.code === COUNTRIES_LOOKUP_CODE;

/**
 * Finds Jordan in a COUNTRIES option list by code or bilingual name.
 * Returns the option's lookupValueId as a string so it matches MenuItem values.
 */
export const findJordanLookupValueId = (
  options: DropdownListValueItem[]
): string | undefined => {
  const jordan = options.find((option) => {
    const code = option.code.trim().toUpperCase();
    const nameEn = option.nameEn.trim().toLowerCase();
    return (
      JORDAN_CODES.has(code) ||
      nameEn === JORDAN_NAME_EN ||
      option.nameAr.trim() === JORDAN_NAME_AR
    );
  });

  if (jordan === undefined) {
    return undefined;
  }

  return String(jordan.lookupValueId);
};
