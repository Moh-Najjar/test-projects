/** Represents the dataType object nested inside a FormField or ColumnDef */
export interface DataType {
  dataTypeId: number;
  typeKey: string;
  typeName: string;
}

/** Represents the controlType object nested inside a FormField or ColumnDef */
export interface ControlTypeDef {
  controlTypeId: number;
  /** One of: "NUMBER" | "DATEPICKER" | "DROPDOWN" | "MULTISELECT" | "TABLE" */
  controlKey: string;
  controlName: string;
}

/** Represents the lookupType object (nullable) */
export interface LookupType {
  lookupTypeId: number;
  code: string;
  nameEn: string;
  nameAr: string;
}

/** Represents a single column definition inside a TABLE or RAW_TABLE control */
export interface ColumnDef {
  columnKey: string;
  labelEn: string;
  labelAr: string;
  dataType: DataType;
  controlType: ControlTypeDef;
  lookupType: LookupType | null;
  /** Whether cells in this column must be filled in (TABLE / RAW_TABLE) */
  isRequired: boolean;
}

/**
 * Represents a fixed row definition inside a RAW_TABLE control.
 * Unlike TABLE (which lets users add rows), RAW_TABLE rows are pre-defined by the API.
 */
export interface RowDef {
  rowId: number;
  rowKey: string;
  labelEn: string;
  labelAr: string;
  displayOrder: number;
  placeholderEn: string;
  placeholderAr: string;
  isRequired: boolean;
  isReadOnly: boolean;
  isVisible: boolean;
  defaultValue: string | null;
  helpTextEn: string | null;
  helpTextAr: string | null;
  validationMessageEn: string | null;
  validationMessageAr: string | null;
}

/**
 * Represents a single cell in a RAW_TABLE grid.
 * Carries all control-level properties (dataType, controlType, lookupType,
 * validation) independently per cell, allowing mixed control types within
 * the same table (e.g. DROPDOWN in column 1, NUMBER in column 2).
 */
export interface GridCell {
  /** 1-based row index within the grid */
  row: number;
  /** 1-based column index within the grid */
  column: number;
  rowKey: string;
  columnKey: string;
  rowLabelEn: string;
  rowLabelAr: string;
  columnLabelEn: string;
  columnLabelAr: string;
  dataType: DataType;
  controlType: ControlTypeDef;
  lookupType: LookupType | null;
  isRequired: boolean;
  isReadOnly: boolean;
  isVisible: boolean;
  placeholderEn: string;
  placeholderAr: string;
  defaultValue: string | null;
  helpTextEn: string | null;
  helpTextAr: string | null;
  validationMessageEn: string | null;
  validationMessageAr: string | null;
}

/**
 * Top-level grid descriptor for a RAW_TABLE field.
 * The cells array is a flat list of every (row, column) intersection,
 * ordered by row then column.
 */
export interface GridDef {
  /** Total number of rows in the grid */
  rows: number;
  /** Total number of columns in the grid */
  columns: number;
  /** Flat list of all cells; each entry represents one (row, column) intersection */
  cells: GridCell[];
}

/** Describes one input slot inside a CALCULATED_FIELD */
export interface CalculationInput {
  /** Token used in formulaExpression, e.g. "VALUE1" or "VALUE2" */
  inputToken: string;
  /** Column key used as the RHF sub-field path, e.g. "NUMBER_OF_OVERNIGHT_VISITORS" */
  columnKey: string;
  labelEn: string;
  labelAr: string;
  placeholderEn: string;
  placeholderAr: string;
  dataType: DataType;
  controlType: ControlTypeDef;
  /** Controls rendering order among inputs */
  displayOrder: number;
  isRequired: boolean;
}

/** Describes the read-only result slot inside a CALCULATED_FIELD */
export interface CalculationResult {
  /** Column key used as the RHF sub-field path, e.g. "RESULT" */
  columnKey: string;
  labelEn: string;
  labelAr: string;
  placeholderEn: string;
  placeholderAr: string;
  dataType: DataType;
  controlType: ControlTypeDef;
  isReadOnly: boolean;
}

/**
 * Full calculation descriptor for a CALCULATED_FIELD control.
 * formulaExpression is a simple two-operand expression whose operands are
 * the inputToken values defined in the inputs array, e.g. "VALUE2 / VALUE1".
 */
export interface CalculationDef {
  /** Two-token arithmetic expression, e.g. "VALUE2 / VALUE1" or "VALUE1 / VALUE2" */
  formulaExpression: string;
  /** columnKey of the result input; must match result.columnKey */
  resultColumnKey: string;
  resultLabelEn: string;
  resultLabelAr: string;
  /** Number of decimal places to round the result to */
  resultPrecision: number;
  buttonLabelEn: string;
  buttonLabelAr: string;
  /** Human-readable formula shown to the user, e.g. "Result = Bed Nights ÷ Visitors" */
  displayFormulaEn: string;
  displayFormulaAr: string;
  inputs: CalculationInput[];
  result: CalculationResult;
}

/** Represents a single form field from formData-v1.json */
export interface FormField {
  fieldId: number;
  formId: number;
  fieldKey: string;
  labelEn: string;
  labelAr: string;
  dataType: DataType;
  controlType: ControlTypeDef;
  isRequired: boolean;
  displayOrder: number;
  isReadOnly: boolean;
  isVisible: boolean;
  lookupType: LookupType | null;
  placeholderEn: string;
  placeholderAr: string;
  helpTextEn: string;
  helpTextAr: string;
  /** Column definitions for TABLE and RAW_TABLE controls; null for all other types */
  columns: ColumnDef[] | null;
  /** Fixed row definitions for RAW_TABLE controls; null for all other types */
  rows: RowDef[] | null;
  /**
   * Cell-level grid descriptor for RAW_TABLE controls.
   * When present, RawTable uses this as the primary rendering source,
   * allowing per-cell control types (e.g. DROPDOWN + NUMBER in the same row).
   * Falls back to rows[] + columns[] when null.
   */
  grid: GridDef | null;
  /**
   * Optional header label for the row-label column in RAW_TABLE.
   * When null/empty the row-label column is hidden entirely.
   * Example: "Record Type" for an airport statistics table.
   */
  rowLabelEn: string | null;
  rowLabelAr: string | null;
  regexPattern: string | null;
  validationMessageAr: string | null;
  validationMessageEn: string | null;
  kpiNextSubmissionDateEn: string | null;
  kpiNextSubmissionDateAr: string | null;
  /**
   * TABLE-only: when true, rows may share the same DROPDOWN combination.
   * When absent or false, duplicate dropdown rows are blocked (default).
   */
  allowDuplicateRows?: boolean;
  /**
   * Present only when controlType.controlKey is "CALCULATED_FIELD".
   * Carries the formula, input definitions, and result descriptor.
   */
  calculation: CalculationDef | null;
}
