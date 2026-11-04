import { adminHttp } from './adminHttp';
import type {
  AdminForm,
  AdminFormField,
  FieldOption,
  FieldDependency,
  FieldColumn,
  FieldRow,
  FieldCalculation,
  CalculationInput,
  CreateFormRequest,
  UpdateFormRequest,
  AddFieldRequest,
  UpdateFieldRequest,
  AddOptionRequest,
  AddDependencyRequest,
  AddColumnRequest,
  UpdateColumnRequest,
  AddRowRequest,
  UpdateRowRequest,
  SetCalculationRequest,
  AddCalculationInputRequest,
  AssignFieldFrequencyRequest,
  FieldFrequencyResponse,
} from '../../types/admin/adminForms';
import type { FrequencyPeriodQuery } from '../../types/admin/adminLookups';
import {
  buildFrequencyPeriodQuery,
  unwrapPeriodWindows,
  unwrapSubmittedPeriods,
  readNullableIsoDate,
  readNullableNumber,
} from '../../utils/frequencyPeriods';

const BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL ?? '';

// ─── Forms ────────────────────────────────────────────────────────────────────

/** GET /admin/forms/all — all forms including inactive ones. */
export const getAllFormsApi = async (): Promise<AdminForm[]> =>
  adminHttp.get<AdminForm[]>(`${BASE_URL}/admin/forms/all`);

/** GET /admin/forms/:formId — single form with all fields and sub-relations. */
export const getFormByIdApi = async (formId: number): Promise<AdminForm> =>
  adminHttp.get<AdminForm>(`${BASE_URL}/admin/forms/${formId}`);

/**
 * POST /admin/forms — creates a new form.
 * Requires directorate, frequency, effective date range, and active flag.
 */
export const createFormApi = async (data: CreateFormRequest): Promise<AdminForm> =>
  adminHttp.post<CreateFormRequest, AdminForm>(`${BASE_URL}/admin/forms`, data);

/** PATCH /admin/forms/:formId — partially updates form metadata. */
export const updateFormApi = async (formId: number, data: UpdateFormRequest): Promise<AdminForm> =>
  adminHttp.patch<UpdateFormRequest, AdminForm>(`${BASE_URL}/admin/forms/${formId}`, data);

/** DELETE /admin/forms/:formId — soft-deletes the form (sets IsActive = false). */
export const deactivateFormApi = async (formId: number): Promise<void> =>
  adminHttp.delete<void>(`${BASE_URL}/admin/forms/${formId}`);

// ─── Fields ───────────────────────────────────────────────────────────────────

/** GET /admin/forms/:formId/fields — all fields for the form with sub-relations. */
export const getFormFieldsApi = async (formId: number): Promise<AdminFormField[]> =>
  adminHttp.get<AdminFormField[]>(`${BASE_URL}/admin/forms/${formId}/fields`);

/** POST /admin/forms/:formId/fields — adds a new field. */
export const addFieldApi = async (formId: number, data: AddFieldRequest): Promise<AdminFormField> =>
  adminHttp.post<AddFieldRequest, AdminFormField>(`${BASE_URL}/admin/forms/${formId}/fields`, data);

/** PATCH /admin/forms/:formId/fields/:fieldId — partially updates a field. */
export const updateFieldApi = async (
  formId: number,
  fieldId: number,
  data: UpdateFieldRequest,
): Promise<AdminFormField> =>
  adminHttp.patch<UpdateFieldRequest, AdminFormField>(
    `${BASE_URL}/admin/forms/${formId}/fields/${fieldId}`,
    data,
  );

/** DELETE /admin/forms/:formId/fields/:fieldId — removes a field (204). */
export const removeFieldApi = async (formId: number, fieldId: number): Promise<void> =>
  adminHttp.delete<void>(`${BASE_URL}/admin/forms/${formId}/fields/${fieldId}`);

/**
 * PUT /admin/forms/:formId/fields/:fieldId/frequency
 * Assigns a frequency on the field's KPI definition (KpiDefinitions.FrequencyId).
 */
export const assignFieldFrequencyApi = async (
  formId: number,
  fieldId: number,
  data: AssignFieldFrequencyRequest,
): Promise<void> => {
  await adminHttp.put<AssignFieldFrequencyRequest, unknown>(
    `${BASE_URL}/admin/forms/${formId}/fields/${fieldId}/frequency`,
    data,
  );
};

/**
 * GET /admin/forms/:formId/fields/:fieldId/frequency?year=&month=
 * Returns the assigned frequency plus expected and submitted period windows.
 */
export const getFieldFrequencyApi = async (
  formId: number,
  fieldId: number,
  params: FrequencyPeriodQuery,
): Promise<FieldFrequencyResponse> => {
  const query = buildFrequencyPeriodQuery(params);
  const payload = await adminHttp.get<unknown>(
    `${BASE_URL}/admin/forms/${formId}/fields/${fieldId}/frequency?${query}`,
  );

  if (typeof payload !== 'object' || payload === null) {
    return {
      frequencyId: null,
      periodStartDate: null,
      frequency: null,
      expectedPeriods: [],
      submittedPeriods: [],
    };
  }

  const record = payload as Record<string, unknown>;

  return {
    frequencyId: readNullableNumber(record.frequencyId),
    periodStartDate: readNullableIsoDate(record.periodStartDate),
    frequency: (record.frequency as FieldFrequencyResponse['frequency']) ?? null,
    expectedPeriods: unwrapPeriodWindows(record.expectedPeriods ?? payload),
    submittedPeriods: unwrapSubmittedPeriods(record.submittedPeriods),
  };
};

// ─── Options ──────────────────────────────────────────────────────────────────

/** POST /admin/forms/:formId/fields/:fieldId/options — adds a selectable option. */
export const addOptionApi = async (
  formId: number,
  fieldId: number,
  data: AddOptionRequest,
): Promise<FieldOption> =>
  adminHttp.post<AddOptionRequest, FieldOption>(
    `${BASE_URL}/admin/forms/${formId}/fields/${fieldId}/options`,
    data,
  );

/** DELETE /admin/forms/:formId/fields/:fieldId/options/:optionId — removes an option (204). */
export const removeOptionApi = async (
  formId: number,
  fieldId: number,
  optionId: number,
): Promise<void> =>
  adminHttp.delete<void>(
    `${BASE_URL}/admin/forms/${formId}/fields/${fieldId}/options/${optionId}`,
  );

// ─── Dependencies ─────────────────────────────────────────────────────────────

/** POST /admin/forms/:formId/fields/:fieldId/dependencies — adds a show/hide/require rule. */
export const addDependencyApi = async (
  formId: number,
  fieldId: number,
  data: AddDependencyRequest,
): Promise<FieldDependency> =>
  adminHttp.post<AddDependencyRequest, FieldDependency>(
    `${BASE_URL}/admin/forms/${formId}/fields/${fieldId}/dependencies`,
    data,
  );

/** DELETE /admin/forms/:formId/fields/:fieldId/dependencies/:dependencyId — removes a dependency (204). */
export const removeDependencyApi = async (
  formId: number,
  fieldId: number,
  dependencyId: number,
): Promise<void> =>
  adminHttp.delete<void>(
    `${BASE_URL}/admin/forms/${formId}/fields/${fieldId}/dependencies/${dependencyId}`,
  );

// ─── Columns ──────────────────────────────────────────────────────────────────

/** POST /admin/forms/:formId/fields/:fieldId/columns — adds a column to a TABLE/GRID field. */
export const addColumnApi = async (
  formId: number,
  fieldId: number,
  data: AddColumnRequest,
): Promise<FieldColumn> =>
  adminHttp.post<AddColumnRequest, FieldColumn>(
    `${BASE_URL}/admin/forms/${formId}/fields/${fieldId}/columns`,
    data,
  );

/** PATCH /admin/forms/:formId/fields/:fieldId/columns/:columnId — partially updates a column. */
export const updateColumnApi = async (
  formId: number,
  fieldId: number,
  columnId: number,
  data: UpdateColumnRequest,
): Promise<FieldColumn> =>
  adminHttp.patch<UpdateColumnRequest, FieldColumn>(
    `${BASE_URL}/admin/forms/${formId}/fields/${fieldId}/columns/${columnId}`,
    data,
  );

/** DELETE /admin/forms/:formId/fields/:fieldId/columns/:columnId — removes a column (204). */
export const removeColumnApi = async (
  formId: number,
  fieldId: number,
  columnId: number,
): Promise<void> =>
  adminHttp.delete<void>(
    `${BASE_URL}/admin/forms/${formId}/fields/${fieldId}/columns/${columnId}`,
  );

// ─── Rows ─────────────────────────────────────────────────────────────────────

/** POST /admin/forms/:formId/fields/:fieldId/rows — adds a row to a TABLE/GRID field. */
export const addRowApi = async (
  formId: number,
  fieldId: number,
  data: AddRowRequest,
): Promise<FieldRow> =>
  adminHttp.post<AddRowRequest, FieldRow>(
    `${BASE_URL}/admin/forms/${formId}/fields/${fieldId}/rows`,
    data,
  );

/** PATCH /admin/forms/:formId/fields/:fieldId/rows/:rowId — partially updates a row. */
export const updateRowApi = async (
  formId: number,
  fieldId: number,
  rowId: number,
  data: UpdateRowRequest,
): Promise<FieldRow> =>
  adminHttp.patch<UpdateRowRequest, FieldRow>(
    `${BASE_URL}/admin/forms/${formId}/fields/${fieldId}/rows/${rowId}`,
    data,
  );

/** DELETE /admin/forms/:formId/fields/:fieldId/rows/:rowId — removes a row (204). */
export const removeRowApi = async (
  formId: number,
  fieldId: number,
  rowId: number,
): Promise<void> =>
  adminHttp.delete<void>(
    `${BASE_URL}/admin/forms/${formId}/fields/${fieldId}/rows/${rowId}`,
  );

// ─── Calculations ─────────────────────────────────────────────────────────────

/** POST /admin/forms/:formId/fields/:fieldId/calculation — creates or replaces a calculation. */
export const setCalculationApi = async (
  formId: number,
  fieldId: number,
  data: SetCalculationRequest,
): Promise<FieldCalculation> =>
  adminHttp.post<SetCalculationRequest, FieldCalculation>(
    `${BASE_URL}/admin/forms/${formId}/fields/${fieldId}/calculation`,
    data,
  );

/** DELETE /admin/forms/:formId/fields/:fieldId/calculation — removes the calculation and its inputs (204). */
export const removeCalculationApi = async (formId: number, fieldId: number): Promise<void> =>
  adminHttp.delete<void>(`${BASE_URL}/admin/forms/${formId}/fields/${fieldId}/calculation`);

/** POST /admin/forms/:formId/fields/:fieldId/calculation/inputs — adds a single input variable. */
export const addCalculationInputApi = async (
  formId: number,
  fieldId: number,
  data: AddCalculationInputRequest,
): Promise<CalculationInput> =>
  adminHttp.post<AddCalculationInputRequest, CalculationInput>(
    `${BASE_URL}/admin/forms/${formId}/fields/${fieldId}/calculation/inputs`,
    data,
  );

/** DELETE /admin/forms/:formId/fields/:fieldId/calculation/inputs/:inputId — removes a single input (204). */
export const removeCalculationInputApi = async (
  formId: number,
  fieldId: number,
  inputId: number,
): Promise<void> =>
  adminHttp.delete<void>(
    `${BASE_URL}/admin/forms/${formId}/fields/${fieldId}/calculation/inputs/${inputId}`,
  );
