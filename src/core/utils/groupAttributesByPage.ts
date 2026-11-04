import { FormField } from "../types/FormField";

/** Number of fields displayed per stepper page */
export const FIELDS_PER_PAGE = 10;

/**
 * Splits a flat array of FormFields into pages of FIELDS_PER_PAGE each.
 * Returns a 1-indexed Record where key = page number, value = array of fields.
 */
export const groupAttributesByPage = (
  fields: FormField[]
): Record<number, FormField[]> => {
  return [...fields]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .reduce((acc, field, index) => {
    const page = Math.floor(index / FIELDS_PER_PAGE) + 1;
    if (!acc[page]) {
      acc[page] = [];
    }
    acc[page].push(field);
    return acc;
  }, {} as Record<number, FormField[]>);
};
