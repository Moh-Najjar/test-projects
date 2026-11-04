/** A single row in a dynamic TABLE-type KPI field (user-addable rows, indexed by position) */
export interface TableValueRow {
  rowIndex: number;
  /** Maps column keys to numeric lookup/number values or string values (e.g. dates, text) */
  columns: Record<string, string | number>;
}

/**
 * A single row in a RAW_TABLE-type KPI field (fixed rows pre-defined by the API,
 * identified by their stable rowKey instead of a positional index).
 */
export interface RawTableValueRow {
  rowKey: string;
  /** Maps column keys to numeric or string values */
  columns: Record<string, string | number>;
}

/** The value payload for a single KPI field */
export interface FieldValue {
  /** The unique key identifying this KPI field */
  fieldKey: string;
  /** Used for simple numeric or text KPI fields; null when not applicable */
  simpleValue: string | null;
  /** Used for multi-select KPI fields; null when not applicable */
  multiSelectValues: string[] | null;
  /** Used for dynamic TABLE-type KPI fields; null when not applicable */
  tableValues: TableValueRow[] | null;
  /** Used for fixed RAW_TABLE-type KPI fields; null when not applicable */
  rawTableValues: RawTableValueRow[] | null;
}

/** Request body for submitting a form with KPI field values */
export interface SubmitFormRequest {
  /** The ID of the form being submitted */
  formId: number;
  /** The ID of the directorate submitting the form */
  directorateId: number;
  /** The reporting date in ISO format (YYYY-MM-DD) */
  reportingDate: string;
  /** The year of the reporting period */
  periodYear: number;
  /** The month of the reporting period (1–12) */
  periodMonth: number;
  /** Optional KPI ID to scope the submission; null for full-form submissions */
  kpiId: number | null;
  /** Free-text notes accompanying the submission */
  notes: string;
  /** Map of KPI field keys to their submitted values */
  fieldValues: Record<string, FieldValue>;
}

/** Parameters for PUT /submissions/{submissionId}; the body matches the create payload */
export interface UpdateSubmissionRequest {
  submissionId: number;
  data: SubmitFormRequest;
}
