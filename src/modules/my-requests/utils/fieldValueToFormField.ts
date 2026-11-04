import { ControlKeys } from '../../../core/enums/control-keys.enum';
import type { ColumnDef, FormField, GridCell, GridDef } from '../../../core/types/FormField';
import type { FieldValue, TableColumn } from '../../../core/types/getSubmissionDetailsResponse';

/** Maps a submission-detail column definition to a FormField ColumnDef */
const mapTableColumn = (col: TableColumn): ColumnDef => ({
  columnKey: col.columnKey,
  labelEn: col.labelEn,
  labelAr: col.labelAr,
  dataType: {
    dataTypeId: col.dataType.dataTypeId,
    typeKey: col.dataType.typeKey,
    typeName: col.dataType.typeName,
  },
  controlType: {
    controlTypeId: col.controlType.controlTypeId,
    controlKey: col.controlType.controlKey,
    controlName: col.controlType.controlName,
  },
  lookupType:
    col.lookupType !== null
      ? {
          lookupTypeId: col.lookupType.lookupTypeId,
          code: col.lookupType.code,
          nameEn: col.lookupType.nameEn,
          nameAr: col.lookupType.nameAr,
        }
      : null,
  /** Submission details may omit the flag; default to not required (view-only data) */
  isRequired: col.isRequired ?? false,
});

/** Returns true when the RAW_TABLE uses a dedicated LABEL column for row text */
const hasLabelColumn = (columns: TableColumn[]): boolean =>
  columns.some((col) => col.controlType.controlKey === ControlKeys.Label);

/**
 * Resolves bilingual display text for a LABEL grid cell.
 * Prefers rowLabelEn/rowLabelAr; falls back to the saved column value.
 */
const resolveLabelCellText = (
  rowLabelEn: string,
  rowLabelAr: string,
  columnValue: string | number | undefined,
): { placeholderEn: string; placeholderAr: string } => {
  const fallback = columnValue !== undefined ? String(columnValue) : '';

  return {
    placeholderEn: rowLabelEn.trim() !== '' ? rowLabelEn : fallback,
    placeholderAr: rowLabelAr.trim() !== '' ? rowLabelAr : fallback,
  };
};

/**
 * Builds a synthetic grid for RAW_TABLE fields from submission detail data.
 *
 * The form-fields API normally supplies grid.cells; the submission detail API
 * only returns columns + rawTableValues. RawTable requires grid to render rows,
 * so we reconstruct one cell per (rowKey, columnKey) intersection here.
 */
const buildRawTableGrid = (fv: FieldValue): GridDef | null => {
  if (fv.columns === null || fv.rawTableValues === null || fv.rawTableValues.length === 0) {
    return null;
  }

  const columnDefs = fv.columns;
  const cells: GridCell[] = [];

  fv.rawTableValues.forEach((rawRow, rowIdx) => {
    const rowNumber = rowIdx + 1;

    columnDefs.forEach((col, colIdx) => {
      const colNumber = colIdx + 1;
      const rawCellValue = rawRow.columns[col.columnKey];
      const isLabelCell = col.controlType.controlKey === ControlKeys.Label;
      const labelText = isLabelCell
        ? resolveLabelCellText(rawRow.rowLabelEn, rawRow.rowLabelAr, rawCellValue)
        : null;

      cells.push({
        row: rowNumber,
        column: colNumber,
        rowKey: rawRow.rowKey,
        columnKey: col.columnKey,
        rowLabelEn: rawRow.rowLabelEn,
        rowLabelAr: rawRow.rowLabelAr,
        columnLabelEn: col.labelEn,
        columnLabelAr: col.labelAr,
        dataType: {
          dataTypeId: col.dataType.dataTypeId,
          typeKey: col.dataType.typeKey,
          typeName: col.dataType.typeName,
        },
        controlType: {
          controlTypeId: col.controlType.controlTypeId,
          controlKey: col.controlType.controlKey,
          controlName: col.controlType.controlName,
        },
        lookupType:
          col.lookupType !== null
            ? {
                lookupTypeId: col.lookupType.lookupTypeId,
                code: col.lookupType.code,
                nameEn: col.lookupType.nameEn,
                nameAr: col.lookupType.nameAr,
              }
            : null,
        isRequired: fv.isRequired,
        isReadOnly: fv.isReadOnly,
        isVisible: fv.isVisible,
        placeholderEn: isLabelCell
          ? (labelText?.placeholderEn ?? '')
          : (fv.placeholderEn ?? ''),
        placeholderAr: isLabelCell
          ? (labelText?.placeholderAr ?? '')
          : (fv.placeholderAr ?? ''),
        defaultValue: isLabelCell ? (labelText?.placeholderEn ?? null) : null,
        /**
         * Do not copy the parent RAW_TABLE help text onto cells. That text
         * belongs on the field, not repeated under every description/value.
         */
        helpTextEn: null,
        helpTextAr: null,
        validationMessageEn: fv.validationMessageEn,
        validationMessageAr: fv.validationMessageAr,
      });
    });
  });

  return {
    rows: fv.rawTableValues.length,
    columns: columnDefs.length,
    cells,
  };
};

/**
 * Resolves the optional row-label column header for RAW_TABLE fields that do
 * not include a dedicated LABEL column (e.g. DESCRIPTION).
 */
const resolveRawTableRowLabelHeaders = (
  columns: TableColumn[],
): { rowLabelEn: string | null; rowLabelAr: string | null } => {
  if (hasLabelColumn(columns)) {
    return { rowLabelEn: null, rowLabelAr: null };
  }

  return { rowLabelEn: 'Description', rowLabelAr: 'الوصف' };
};

/**
 * Maps a FieldValue (submission detail) to a FormField (control schema).
 *
 * FieldValue and FormField share identical nested shapes for dataType, controlType,
 * lookupType, and columns — only their TypeScript interface names differ.
 *
 * isReadOnly is preserved from the API so every control renders in disabled/read-only mode.
 */
export const fieldValueToFormField = (fv: FieldValue): FormField => {
  const mappedColumns = fv.columns !== null ? fv.columns.map(mapTableColumn) : null;
  const isRawTable = fv.controlType.controlKey === ControlKeys.RawTable;
  const rawTableGrid = isRawTable ? buildRawTableGrid(fv) : null;
  const rowLabelHeaders =
    isRawTable && fv.columns !== null
      ? resolveRawTableRowLabelHeaders(fv.columns)
      : { rowLabelEn: null, rowLabelAr: null };

  return {
    fieldId: fv.fieldId,
    formId: fv.formId,
    fieldKey: fv.fieldKey,
    labelEn: fv.labelEn,
    labelAr: fv.labelAr,
    dataType: {
      dataTypeId: fv.dataType.dataTypeId,
      typeKey: fv.dataType.typeKey,
      typeName: fv.dataType.typeName,
    },
    controlType: {
      controlTypeId: fv.controlType.controlTypeId,
      controlKey: fv.controlType.controlKey,
      controlName: fv.controlType.controlName,
    },
    isRequired: fv.isRequired,
    displayOrder: fv.displayOrder,
    isReadOnly: fv.isReadOnly,
    isVisible: fv.isVisible,
    lookupType:
      fv.lookupType !== null
        ? {
            lookupTypeId: fv.lookupType.lookupTypeId,
            code: fv.lookupType.code,
            nameEn: fv.lookupType.nameEn,
            nameAr: fv.lookupType.nameAr,
          }
        : null,
    placeholderEn: fv.placeholderEn ?? '',
    placeholderAr: fv.placeholderAr ?? '',
    helpTextEn: fv.helpTextEn ?? '',
    helpTextAr: fv.helpTextAr ?? '',
    columns: mappedColumns,
    rows: null,
    grid: rawTableGrid,
    rowLabelEn: rowLabelHeaders.rowLabelEn,
    rowLabelAr: rowLabelHeaders.rowLabelAr,
    regexPattern: fv.regexPattern,
    validationMessageEn: fv.validationMessageEn,
    validationMessageAr: fv.validationMessageAr,
    kpiNextSubmissionDateEn: null,
    kpiNextSubmissionDateAr: null,
    allowDuplicateRows: fv.allowDuplicateRows === true,
    /**
     * The submission-detail API does not return formula/inputs. CalculatedField
     * falls back to a read-only scalar display when this is null.
     */
    calculation: null,
  };
};
