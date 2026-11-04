import { ColumnDef } from "../types/FormField";
import { GetDropdownListValuesResponse } from "../types/getDropdownListValuesResponse";
import { findJordanLookupValueId, isCountriesLookupType } from "./countryLookup";

/**
 * TABLE uniqueness: within one grid, the combination of DROPDOWN values
 * in a row must be unique (one DDL → that value; two DDLs → the pair).
 *
 * Callers skip these helpers when FormField.allowDuplicateRows is true.
 * Safe on purpose: no React hooks, no watch(), no trigger().
 */

const isRowRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isEmpty = (value: unknown): boolean =>
  value === undefined || value === null || String(value).trim() === "";

/** columnKeys of DROPDOWN columns in this table */
export const getDropdownColumnKeys = (columns: ColumnDef[]): string[] =>
  columns
    .filter((col) => col.controlType.controlKey === "DROPDOWN")
    .map((col) => col.columnKey);

/** Uniqueness key, or null when any dropdown in the row is still empty */
const comboKey = (
  row: Record<string, unknown>,
  dropdownKeys: string[]
): string | null => {
  const parts: string[] = [];
  for (const key of dropdownKeys) {
    const value = row[key];
    if (isEmpty(value)) {
      return null;
    }
    parts.push(String(value));
  }
  return parts.join("|");
};

/**
 * True when this row repeats an earlier row's dropdown combination.
 * `pending` is the value RHF is currently validating on this cell.
 */
export const isDuplicateDropdownRow = (
  rows: unknown,
  rowIndex: number,
  dropdownKeys: string[],
  pending?: { columnKey: string; value: unknown }
): boolean => {
  if (!Array.isArray(rows) || dropdownKeys.length === 0) {
    return false;
  }

  const currentSource = isRowRecord(rows[rowIndex]) ? rows[rowIndex] : {};
  const currentRow: Record<string, unknown> = {
    ...currentSource,
    ...(pending !== undefined ? { [pending.columnKey]: pending.value } : {}),
  };

  const currentKey = comboKey(currentRow, dropdownKeys);
  if (currentKey === null) {
    return false;
  }

  return rows.some((row, index) => {
    if (index >= rowIndex || !isRowRecord(row)) {
      return false;
    }
    return comboKey(row, dropdownKeys) === currentKey;
  });
};

/**
 * Later row indexes that copy an earlier dropdown combination.
 * One pass over the rows. The previous version re-scanned every earlier row
 * for each row, which stalled Next on a table of a few thousand rows.
 */
export const getDuplicateDropdownRowIndexes = (
  rows: unknown,
  dropdownKeys: string[]
): number[] => {
  if (!Array.isArray(rows) || dropdownKeys.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const indexes: number[] = [];

  rows.forEach((row, rowIndex) => {
    if (!isRowRecord(row)) {
      return;
    }

    const key = comboKey(row, dropdownKeys);
    if (key === null) {
      return;
    }

    if (seen.has(key)) {
      indexes.push(rowIndex);
      return;
    }

    seen.add(key);
  });

  return indexes;
};

/**
 * Dropdown values for a new row that do not copy an existing combination.
 * COUNTRIES lists still prefer Jordan when that combo is free.
 * Returns {} when there are no dropdowns or no unused combo left.
 */
export const pickUnusedDropdownValues = (
  columns: ColumnDef[],
  optionsMap: GetDropdownListValuesResponse,
  existingRows: unknown
): Record<string, string> => {
  const dropdownCols = columns.filter(
    (col) => col.controlType.controlKey === "DROPDOWN" && col.lookupType !== null
  );
  const dropdownKeys = dropdownCols.map((col) => col.columnKey);

  if (dropdownKeys.length === 0) {
    return {};
  }

  const used = new Set<string>();
  if (Array.isArray(existingRows)) {
    existingRows.forEach((row) => {
      if (!isRowRecord(row)) {
        return;
      }
      const key = comboKey(row, dropdownKeys);
      if (key !== null) {
        used.add(key);
      }
    });
  }

  const optionIdLists = dropdownCols.map((col) => {
    const lookupType = col.lookupType;
    if (lookupType === null) {
      return [];
    }
    const options = optionsMap[String(lookupType.lookupTypeId)] ?? [];
    const ids = options.map((item) => String(item.lookupValueId));
    if (!isCountriesLookupType(lookupType)) {
      return ids;
    }
    const jordanId = findJordanLookupValueId(options);
    if (jordanId === undefined) {
      return ids;
    }
    return [jordanId, ...ids.filter((id) => id !== jordanId)];
  });

  const walk = (columnIndex: number, prefix: string[]): string[] | null => {
    if (columnIndex >= optionIdLists.length) {
      return used.has(prefix.join("|")) ? null : prefix;
    }
    const ids = optionIdLists[columnIndex];
    if (ids === undefined || ids.length === 0) {
      return null;
    }
    for (const id of ids) {
      const found = walk(columnIndex + 1, [...prefix, id]);
      if (found !== null) {
        return found;
      }
    }
    return null;
  };

  const unused = walk(0, []);
  if (unused === null) {
    return {};
  }

  const result: Record<string, string> = {};
  dropdownCols.forEach((col, index) => {
    const id = unused[index];
    if (id !== undefined) {
      result[col.columnKey] = id;
    }
  });
  return result;
};
