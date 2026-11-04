import { FieldValue, RawTableValueRow, TableValueRow } from "../types/submitFormRequest";
import { FormField } from "../types/FormField";

/** ISO date strings from `<input type="date">` (YYYY-MM-DD) */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Maps a raw table cell string to the API column value.
 * Numeric and dropdown values are sent as numbers; dates and other text stay as strings.
 */
function mapTableColumnValue(colVal: string): string | number {
  if (colVal === "") {
    return colVal;
  }
  if (ISO_DATE_PATTERN.test(colVal)) {
    return colVal;
  }
  const parsed = Number(colVal);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }
  return colVal;
}

/**
 * Returns true when the array contains plain objects (table rows) rather than
 * primitive strings/numbers (multi-select values).
 */
function isTableRowArray(arr: unknown[]): arr is Record<string, string>[] {
  if (arr.length === 0) return false;
  const first = arr[0];
  return (
    typeof first === "object" &&
    first !== null &&
    !Array.isArray(first)
  );
}

/**
 * Returns true when the value is a plain object whose own values are also plain
 * objects — i.e. a RAW_TABLE field stored as { rowKey: { colKey: value } }.
 * This shape is distinct from both scalar fields and array-based TABLE fields.
 */
function isRawTableObject(
  val: unknown
): val is Record<string, Record<string, string>> {
  if (typeof val !== "object" || val === null || Array.isArray(val)) {
    return false;
  }
  return Object.values(val as Record<string, unknown>).every(
    (v) => typeof v === "object" && v !== null && !Array.isArray(v)
  );
}

/**
 * Returns true when the value is a plain object whose every own value is a
 * primitive (string or number) — i.e. a CALCULATED_FIELD stored as
 * { [inputColumnKey]: "42", ..., [resultColumnKey]: "3.50" }.
 * This is intentionally checked after isRawTableObject so there is no overlap.
 */
function isCalculatedFieldObject(
  val: unknown
): val is Record<string, string | number> {
  if (typeof val !== "object" || val === null || Array.isArray(val)) {
    return false;
  }
  const values = Object.values(val as Record<string, unknown>);
  return (
    values.length > 0 &&
    values.every((v) => typeof v === "string" || typeof v === "number")
  );
}

/**
 * Converts a single raw React Hook Form field value to the typed `FieldValue`
 * discriminated structure expected by the API.
 *
 * Rules:
 *  - Primitive (string / number / boolean)           → `simpleValue`
 *  - Array of primitives                             → `multiSelectValues`
 *  - Array of objects                                → `tableValues`   (dynamic TABLE)
 *  - Plain object whose values are also plain objects → `rawTableValues` (fixed RAW_TABLE)
 *  - CALCULATED_FIELD flat object + resultColumnKey  → `simpleValue`   (result only)
 */
export function buildFieldValue(
  fieldKey: string,
  rawValue: unknown,
  /** The column key of the computed result inside a CALCULATED_FIELD nested object */
  resultColumnKey?: string,
): FieldValue {
  if (Array.isArray(rawValue)) {
    if (isTableRowArray(rawValue)) {
      // Dynamic TABLE field: each array object becomes a TableValueRow with a positional index.
      const tableValues: TableValueRow[] = rawValue.map((row, rowIndex) => ({
        rowIndex,
        columns: Object.entries(row).reduce<Record<string, string | number>>(
          (cols, [colKey, colVal]) => {
            cols[colKey] = mapTableColumnValue(String(colVal));
            return cols;
          },
          {}
        ),
      }));

      return { fieldKey, simpleValue: null, multiSelectValues: null, tableValues, rawTableValues: null };
    }

    // Multi-select field: keep values as strings.
    return {
      fieldKey,
      simpleValue: null,
      multiSelectValues: rawValue.map(String),
      tableValues: null,
      rawTableValues: null,
    };
  }

  // Fixed RAW_TABLE field: nested object { rowKey: { colKey: value } }.
  if (isRawTableObject(rawValue)) {
    const rawTableValues: RawTableValueRow[] = Object.entries(rawValue).map(
      ([rowKey, colVals]) => ({
        rowKey,
        columns: Object.entries(colVals).reduce<Record<string, string | number>>(
          (cols, [colKey, colVal]) => {
            cols[colKey] = mapTableColumnValue(String(colVal));
            return cols;
          },
          {}
        ),
      })
    );
    return { fieldKey, simpleValue: null, multiSelectValues: null, tableValues: null, rawTableValues };
  }

  /**
   * CALCULATED_FIELD: flat object whose values are all primitives, e.g.
   *   { NUMBER_OF_OVERNIGHT_VISITORS: "100", CAPACITY: "50", RESULT: "2.00" }
   * Only the computed result column is sent — as simpleValue — because that is
   * the value the API cares about for a calculated KPI field.
   */
  if (isCalculatedFieldObject(rawValue) && resultColumnKey !== undefined) {
    const resultVal = rawValue[resultColumnKey];
    return {
      fieldKey,
      simpleValue: resultVal !== undefined && resultVal !== null ? String(resultVal) : null,
      multiSelectValues: null,
      tableValues: null,
      rawTableValues: null,
    };
  }

  // Simple scalar field.
  return {
    fieldKey,
    simpleValue: rawValue !== null && rawValue !== undefined ? String(rawValue) : null,
    multiSelectValues: null,
    tableValues: null,
    rawTableValues: null,
  };
}

/**
 * Maps the raw `Record<string, unknown>` that React Hook Form provides on
 * submit into the `Record<string, FieldValue>` shape the API expects.
 *
 * Pass `formFields` so the mapper can identify CALCULATED_FIELD entries and
 * extract their result column key for the `simpleValue` mapping.
 */
export function mapFormDataToFieldValues(
  formData: Record<string, unknown>,
  formFields: FormField[] = [],
): Record<string, FieldValue> {
  /** Quick O(1) lookup: fieldKey → FormField */
  const fieldDefMap = new Map(formFields.map((f) => [f.fieldKey, f]));

  return Object.entries(formData).reduce<Record<string, FieldValue>>(
    (acc, [fieldKey, rawValue]) => {
      const resultColumnKey = fieldDefMap.get(fieldKey)?.calculation?.resultColumnKey;
      acc[fieldKey] = buildFieldValue(fieldKey, rawValue, resultColumnKey);
      return acc;
    },
    {}
  );
}
