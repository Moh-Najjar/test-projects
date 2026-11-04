// Nested data-type descriptor (e.g. INTEGER, DECIMAL, STRING)
export interface DataType {
  dataTypeId: number;
  typeKey: string;
  typeName: string;
}

// Nested control-type descriptor (e.g. NUMBER, DROPDOWN, TABLE, RAW_TABLE)
export interface ControlType {
  controlTypeId: number;
  controlKey: string;
  controlName: string;
}

// Lookup type reference attached to DROPDOWN / multi-select fields
export interface LookupType {
  lookupTypeId: number;
  code: string;
  nameEn: string;
  nameAr: string;
}

// Column definition used by TABLE / RAW_TABLE control fields
export interface TableColumn {
  columnKey: string;
  labelEn: string;
  labelAr: string;
  dataType: DataType;
  controlType: ControlType;
  lookupType: LookupType | null;
  /** Present only when the backend supplies it; treated as false when absent */
  isRequired?: boolean;
}

// A single row inside a dynamic TABLE control field value
export interface TableValueRow {
  rowIndex: number;
  columns: Record<string, string | number>;
}

/**
 * A single row inside a fixed RAW_TABLE control field value.
 * Rows are identified by a stable rowKey rather than a positional index.
 */
export interface RawTableValueRow {
  rowKey: string;
  rowLabelEn: string;
  rowLabelAr: string;
  columns: Record<string, string | number>;
}

// Shape of each entry inside the fieldValues array
export interface FieldValue {
  fieldId: number;
  formId: number;
  fieldKey: string;
  labelEn: string;
  labelAr: string;
  dataType: DataType;
  controlType: ControlType;
  isRequired: boolean;
  displayOrder: number;
  isReadOnly: boolean;
  isVisible: boolean;
  lookupType: LookupType | null;
  placeholderEn: string | null;
  placeholderAr: string | null;
  helpTextEn: string | null;
  helpTextAr: string | null;
  regexPattern: string | null;
  validationMessageEn: string | null;
  validationMessageAr: string | null;
  columns: TableColumn[] | null;
  /**
   * TABLE-only: when true, duplicate dropdown rows are allowed.
   * Absent or false keeps the default uniqueness check.
   */
  allowDuplicateRows?: boolean;
  /**
   * Scalar answer for this field.
   * Text, dates, and dropdown codes arrive as strings. NUMBER, PERCENTAGE,
   * and calculated KPIs often arrive as JSON numbers, and checkboxes as booleans.
   */
  value: string | number | boolean | null;
  multiSelectValues: string[] | null;
  tableValues: TableValueRow[] | null;
  rawTableValues: RawTableValueRow[] | null;
}

// Full response returned by GET /submissions/:submissionId
export interface GetSubmissionDetailsResponse {
  submissionId: number;
  referenceNumber: string;
  formId: number;
  formNameEn: string;
  formNameAr: string;
  directorateId: number;
  directorateNameEn: string;
  directorateNameAr: string;
  reportingDate: string;
  submissionStatus: string;
  periodYear: number;
  periodMonth: number;
  kpiId: number | null;
  notes: string | null;
  createdAt: string;
  enteredByUserId: number;
  enteredByUserName: string;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedByUserId: number | null;
  approvedByUserName: string | null;
  rejectionReason: string | null;
  fieldValues: FieldValue[];
}
