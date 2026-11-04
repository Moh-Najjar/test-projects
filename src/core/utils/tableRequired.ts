import { ControlKeys } from "../enums/control-keys.enum";
import { ColumnDef, FormField, GridCell } from "../types/FormField";

/**
 * Resolves whether a RAW_TABLE cell is required.
 *
 * Source of truth is the `isRequired` flag of the matching entry in
 * `parentField.rows[]` (matched by rowKey). When the API does not supply a
 * row definition for that rowKey (e.g. the synthetic grid built from the
 * submission-details response), the cell's own `isRequired` flag is used.
 *
 * LABEL cells are static text and are never required.
 * The parent field's `isRequired` is intentionally ignored.
 */
export const isRawTableCellRequired = (
  cell: GridCell,
  parentField: FormField
): boolean => {
  // LABEL cells only display text, so they can never be "missing"
  if (cell.controlType.controlKey === ControlKeys.Label) {
    return false;
  }

  // Look up the row definition that owns this cell
  const matchingRow = (parentField.rows ?? []).find(
    (row) => row.rowKey === cell.rowKey
  );

  // Row flag wins; otherwise fall back to the cell flag
  return matchingRow !== undefined ? matchingRow.isRequired : cell.isRequired;
};

/**
 * Resolves whether a TABLE column is required, based solely on the column's
 * own `isRequired` flag. The parent field's `isRequired` is intentionally ignored.
 * Missing flags (older API payloads) are treated as not required.
 */
export const isTableColumnRequired = (col: ColumnDef): boolean =>
  col.isRequired === true;
