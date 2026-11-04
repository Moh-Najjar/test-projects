import type { Frequency, FrequencyPeriodWindow } from './adminLookups';

// ─── Nested helper shapes ─────────────────────────────────────────────────────

/**
 * Directorate embedded inside AdminForm.
 * Matches the exact shape returned by the API — defined locally to avoid
 * a circular import with adminDirectorates.ts.
 */
export interface FormDirectorate {
  directorateId: number;
  directorateKey: string;
  nameEn: string;
  nameAr: string;
  isActive: boolean;
  createdAt: string;
}

/**
 * Nested frequency returned on forms and fields.
 * Same shape as GET /admin/lookups/frequencies.
 */
export type FrequencySummary = Frequency;

/** Frequency object nested inside AdminForm. */
export type AdminFormFrequency = FrequencySummary;

// ─── Calculation ───────────────────────────────────────────────────────────────

/** A single input variable inside a CALCULATED field's formula. */
export interface CalculationInput {
  inputId: number;
  calculationId: number;
  inputToken: string;
  columnKey: string;
  labelEn: string;
  labelAr: string;
  placeholderEn: string | null;
  placeholderAr: string | null;
  displayOrder: number;
  isRequired: boolean;
  isReadOnly: boolean;
  isVisible: boolean;
  validationMessageEn: string | null;
  validationMessageAr: string | null;
  isActive: boolean;
  createdAt: string;
  dataTypeId: number;
  controlTypeId: number;
}

/**
 * The calculation definition attached to a CALCULATED field.
 * This is a SINGLE OBJECT (or null) on the field — NOT an array.
 * The API property name on AdminFormField is `formFieldCalculations`.
 */
export interface FieldCalculation {
  calculationId: number;
  fieldId: number;
  formulaExpression: string;
  resultColumnKey: string;
  resultLabelEn: string;
  resultLabelAr: string;
  resultPrecision: number;
  buttonLabelEn: string;
  buttonLabelAr: string;
  helpTextEn: string | null;
  helpTextAr: string | null;
  displayFormulaEn: string | null;
  displayFormulaAr: string | null;
  isActive: boolean;
  createdAt: string;
  resultDataTypeId: number;
  resultControlTypeId: number;
  formFieldCalculationInputs: CalculationInput[];
}

// ─── Field sub-entities ───────────────────────────────────────────────────────

/** A selectable option on a DROPDOWN / RADIO / MULTI_SELECT field. */
export interface FieldOption {
  optionId: number;
  fieldId: number;
  optionKey: string;
  optionLabelEn: string;
  optionLabelAr: string;
  optionValue: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

/** A show/hide/require dependency rule linked to a field. */
export interface FieldDependency {
  dependencyId: number;
  fieldId: number;
  dependsOnFieldId: number;
  conditionOperator: 'EQ' | 'NEQ' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'CONTAINS' | 'IS_EMPTY' | 'IS_NOT_EMPTY';
  conditionValue: string;
  action: 'SHOW' | 'HIDE' | 'REQUIRE' | 'DISABLE';
  createdAt: string;
}

/** A column definition on a TABLE / GRID field. */
export interface FieldColumn {
  columnId: number;
  fieldId: number;
  columnKey: string;
  labelEn: string;
  labelAr: string;
  displayOrder: number;
  dataTypeId: number;
  controlTypeId: number;
  lookupTypeId: number | null;
  /** Whether cells in this column are required. Null when the API has no value (treated as false). */
  isRequired: boolean | null;
}

/** A row definition on a TABLE / GRID field. */
export interface FieldRow {
  rowId: number;
  fieldId: number;
  rowKey: string;
  labelEn: string;
  labelAr: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  placeholderEn: string | null;
  placeholderAr: string | null;
  isRequired: boolean;
  isReadOnly: boolean;
  isVisible: boolean;
  defaultValue: string | null;
  helpTextEn: string | null;
  helpTextAr: string | null;
  validationMessageEn: string | null;
  validationMessageAr: string | null;
}

// ─── Form Field ───────────────────────────────────────────────────────────────

/** A single field belonging to a form (from GET /admin/forms/:formId). */
export interface AdminFormField {
  fieldId: number;
  formId: number;
  fieldKey: string;
  labelEn: string;
  labelAr: string;
  isRequired: boolean;
  minValue: number | null;
  maxValue: number | null;
  minLength: number | null;
  maxLength: number | null;
  regexPattern: string | null;
  placeholderEn: string | null;
  placeholderAr: string | null;
  defaultValue: string | null;
  displayOrder: number;
  helpTextEn: string | null;
  helpTextAr: string | null;
  isReadOnly: boolean;
  isVisible: boolean;
  validationMessageEn: string | null;
  validationMessageAr: string | null;
  createdAt: string;
  dataTypeId: number;
  controlTypeId: number;
  lookupTypeId: number | null;
  kpiId: number | null;
  /**
   * Field-level frequency. Null when the field has no KPI, or the KPI has no frequency.
   */
  frequencyId: number | null;
  /**
   * Nested frequency summary. Null when `frequencyId` is null.
   */
  frequency: FrequencySummary | null;
  /**
   * Custom period start stored on the KPI (KpiDefinitions.ReferenceDate).
   * Only month + day repeat every year. Null when unset (defaults to 1 January).
   */
  periodStartDate: string | null;
  isActive: boolean;
  /** Empty array when no options are defined. */
  fieldOptions: FieldOption[];
  /** Empty array when field has no dependencies. */
  fieldDependencies: FieldDependency[];
  /** Empty array when field has no table columns. */
  formFieldColumns: FieldColumn[];
  /** Empty array when field has no table rows. */
  formFieldRows: FieldRow[];
  /** Single calculation object — present only for CALCULATED fields; null otherwise. */
  formFieldCalculations: FieldCalculation | null;
}

// ─── Form ─────────────────────────────────────────────────────────────────────

/**
 * A form record from the admin API.
 * - List endpoint (GET /admin/forms/all): includes `directorate` and `frequency`
 *   but does NOT include `formFields`.
 * - Detail endpoint (GET /admin/forms/:formId): includes all nested objects plus `formFields`.
 */
export interface AdminForm {
  formId: number;
  formKey: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  isActive: boolean;
  version: number;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string | null;
  directorateId: number | null;
  frequencyId: number | null;
  createdByUserId: number | null;
  updatedByUserId: number | null;
  /** Nested directorate — present in list and detail endpoints. */
  directorate?: FormDirectorate;
  /** Nested frequency — present in list and detail endpoints. */
  frequency?: AdminFormFrequency;
  /** Only present in the detail endpoint (GET /admin/forms/:formId). */
  formFields?: AdminFormField[];
}

// ─── Request bodies ───────────────────────────────────────────────────────────

/** Body for POST /admin/forms. */
export interface CreateFormRequest {
  formKey: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  directorateId: number;
  frequencyId: number;
  /** ISO date string, e.g. "2026-01-01", or null when not set. */
  effectiveFrom?: string | null;
  /** ISO date string, e.g. "2026-12-31", or null when not set. */
  effectiveTo?: string | null;
  isActive: boolean;
}

/** Body for PATCH /admin/forms/:formId. */
export interface UpdateFormRequest {
  nameEn?: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  directorateId?: number;
  frequencyId?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  isActive?: boolean;
}

/** Body for POST /admin/forms/:formId/fields. */
export interface AddFieldRequest {
  fieldKey: string;
  labelEn: string;
  labelAr: string;
  dataTypeId: number;
  controlTypeId: number;
  displayOrder: number;
  isRequired: boolean;
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  regexPattern?: string;
  placeholderEn?: string;
  placeholderAr?: string;
  defaultValue?: string;
  helpTextEn?: string;
  helpTextAr?: string;
  validationMessageEn?: string;
  validationMessageAr?: string;
  isReadOnly: boolean;
  isVisible: boolean;
  lookupTypeId?: number;
  kpiId?: number;
  /**
   * Optional field-level frequency. Omit to inherit the form frequency (default).
   */
  frequencyId?: number;
  /** Optional custom period start (YYYY-MM-DD). Only month + day are stored. */
  periodStartDate?: string | null;
}

/** Body for PATCH /admin/forms/:formId/fields/:fieldId. */
export interface UpdateFieldRequest {
  labelEn?: string;
  labelAr?: string;
  displayOrder?: number;
  isRequired?: boolean;
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  regexPattern?: string;
  placeholderEn?: string;
  placeholderAr?: string;
  defaultValue?: string;
  helpTextEn?: string;
  helpTextAr?: string;
  validationMessageEn?: string;
  validationMessageAr?: string;
  isReadOnly?: boolean;
  isVisible?: boolean;
  isActive?: boolean;
  lookupTypeId?: number;
  /**
   * Optional field-level frequency. Omit to leave the current value unchanged.
   */
  frequencyId?: number;
  /** Optional custom period start (YYYY-MM-DD). Send null to reset to 1 January. */
  periodStartDate?: string | null;
}

/** Body for PUT /admin/forms/:formId/fields/:fieldId/frequency. */
export interface AssignFieldFrequencyRequest {
  frequencyId: number;
  /** Custom period start (YYYY-MM-DD). Send null to reset to 1 January. */
  periodStartDate?: string | null;
}

/**
 * A persisted row from KpiSubmissionPeriods.
 * Empty on the field-frequency endpoint until someone actually submits that window.
 */
export interface KpiSubmissionPeriod {
  kpiSubmissionPeriodId: number;
  kpiId: number;
  frequencyId: number;
  periodKey: string;
  labelEn: string;
  labelAr: string;
  year: number;
  month: number | null;
  periodStartDate: string;
  periodEndDate: string;
  status: string | null;
  createdAt: string;
}

/**
 * GET /admin/forms/:formId/fields/:fieldId/frequency?year=
 * Combines the KPI's assigned frequency with computed and submitted period windows.
 */
export interface FieldFrequencyResponse {
  frequencyId: number | null;
  periodStartDate: string | null;
  frequency: FrequencySummary | null;
  expectedPeriods: FrequencyPeriodWindow[];
  submittedPeriods: KpiSubmissionPeriod[];
}

/** Body for POST /admin/forms/:formId/fields/:fieldId/options. */
export interface AddOptionRequest {
  optionKey: string;
  optionLabelEn: string;
  optionLabelAr: string;
  optionValue: string;
  displayOrder: number;
  isActive: boolean;
}

/** Body for POST /admin/forms/:formId/fields/:fieldId/dependencies. */
export interface AddDependencyRequest {
  dependsOnFieldId: number;
  conditionOperator: 'EQ' | 'NEQ' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'CONTAINS' | 'IS_EMPTY' | 'IS_NOT_EMPTY';
  conditionValue: string;
  action: 'SHOW' | 'HIDE' | 'REQUIRE' | 'DISABLE';
}

/** Body for POST /admin/forms/:formId/fields/:fieldId/columns. */
export interface AddColumnRequest {
  columnKey: string;
  labelEn: string;
  labelAr: string;
  displayOrder: number;
  dataTypeId: number;
  controlTypeId: number;
  lookupTypeId?: number;
  /** Whether cells in this column are required. Omit to use the API default. */
  isRequired?: boolean;
}

/**
 * Body for PATCH /admin/forms/:formId/fields/:fieldId/columns/:columnId.
 * Partial update: send at least one property (an empty body returns 400).
 * Labels are trimmed, non-empty, max 200 chars. Null values are rejected.
 */
export interface UpdateColumnRequest {
  labelEn?: string;
  labelAr?: string;
  isRequired?: boolean;
}

/**
 * Body for PATCH /admin/forms/:formId/fields/:fieldId/rows/:rowId.
 * Partial update: send at least one property (an empty body returns 400).
 * Labels are trimmed, non-empty, max 300 chars. Null values are rejected.
 */
export interface UpdateRowRequest {
  labelEn?: string;
  labelAr?: string;
  isRequired?: boolean;
}

/** Body for POST /admin/forms/:formId/fields/:fieldId/rows. */
export interface AddRowRequest {
  rowKey: string;
  labelEn: string;
  labelAr: string;
  displayOrder: number;
  placeholderEn?: string;
  placeholderAr?: string;
  isRequired: boolean;
  isReadOnly: boolean;
  isVisible: boolean;
  defaultValue?: string;
  helpTextEn?: string;
  helpTextAr?: string;
}

/** A single input variable inside a SetCalculation request body. */
export interface CalculationInputRequest {
  inputToken: string;
  columnKey: string;
  labelEn: string;
  labelAr: string;
  placeholderEn?: string;
  placeholderAr?: string;
  dataTypeId: number;
  controlTypeId: number;
  displayOrder: number;
  isRequired: boolean;
  isReadOnly?: boolean;
  isVisible: boolean;
}

/** Body for POST /admin/forms/:formId/fields/:fieldId/calculation. */
export interface SetCalculationRequest {
  formulaExpression: string;
  resultColumnKey: string;
  resultLabelEn: string;
  resultLabelAr: string;
  resultPrecision: number;
  resultDataTypeId: number;
  resultControlTypeId: number;
  buttonLabelEn: string;
  buttonLabelAr: string;
  helpTextEn?: string;
  helpTextAr?: string;
  displayFormulaEn?: string;
  displayFormulaAr?: string;
  /** Request body uses `inputs`; response returns `formFieldCalculationInputs`. */
  inputs: CalculationInputRequest[];
}

/** Body for POST /admin/forms/:formId/fields/:fieldId/calculation/inputs. */
export interface AddCalculationInputRequest {
  inputToken: string;
  columnKey: string;
  labelEn: string;
  labelAr: string;
  placeholderEn?: string;
  placeholderAr?: string;
  dataTypeId: number;
  controlTypeId: number;
  displayOrder: number;
  isRequired: boolean;
  isReadOnly?: boolean;
  isVisible: boolean;
}
