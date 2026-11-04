import { ControlKeys } from '../../../core/enums/control-keys.enum';
import type { FieldValue } from '../../../core/types/getSubmissionDetailsResponse';

/**
 * Converts the API's saved fieldValues into react-hook-form defaultValues.
 *
 * - TABLE fields: the fieldArray reads from defaultValues[fieldKey] as an
 *   array of column-keyed objects, matching the shape TableGrid produces.
 * - MULTISELECT fields: RHF expects an array of selected option values.
 * - All other fields: use the scalar string value (or empty string).
 */
export const buildFormDefaultValues = (fields: FieldValue[]): Record<string, unknown> =>
  fields.reduce<Record<string, unknown>>((acc, fv) => {
    if (fv.controlType.controlKey === ControlKeys.Table) {
      acc[fv.fieldKey] = (fv.tableValues ?? []).map((row) => row.columns);
    } else if (fv.controlType.controlKey === ControlKeys.RawTable) {
      // RAW_TABLE RHF shape: { [rowKey]: { [columnKey]: value } }
      const rawTableRows = fv.rawTableValues ?? [];
      acc[fv.fieldKey] = rawTableRows.reduce<Record<string, Record<string, string | number>>>(
        (rowAcc, row) => {
          rowAcc[row.rowKey] = row.columns;
          return rowAcc;
        },
        {},
      );
    } else if (fv.controlType.controlKey === ControlKeys.Multiselect) {
      acc[fv.fieldKey] = fv.multiSelectValues ?? [];
    } else {
      acc[fv.fieldKey] = fv.value ?? '';
    }
    return acc;
  }, {});
