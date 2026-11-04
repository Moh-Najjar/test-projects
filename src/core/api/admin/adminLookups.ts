import { adminHttp } from './adminHttp';
import type {
  ControlType,
  DataType,
  LookupType,
  LookupValue,
  Frequency,
  FrequencyPeriodQuery,
  FrequencyPeriodWindow,
} from '../../types/admin/adminLookups';
import { buildFrequencyPeriodQuery, unwrapPeriodWindows } from '../../utils/frequencyPeriods';

const BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL ?? '';

/** GET /admin/lookups/control-types — e.g. TEXTBOX, DROPDOWN, TABLE, CALCULATED. */
export const getControlTypesApi = async (): Promise<ControlType[]> =>
  adminHttp.get<ControlType[]>(`${BASE_URL}/admin/lookups/control-types`);

/** GET /admin/lookups/data-types — e.g. TEXT, NUMBER, DATE, BOOLEAN. */
export const getDataTypesApi = async (): Promise<DataType[]> =>
  adminHttp.get<DataType[]>(`${BASE_URL}/admin/lookups/data-types`);

/** GET /admin/lookups/lookup-types — categories of lookup lists. */
export const getLookupTypesApi = async (): Promise<LookupType[]> =>
  adminHttp.get<LookupType[]>(`${BASE_URL}/admin/lookups/lookup-types`);

/** GET /admin/lookups/lookup-types/:lookupTypeId/values — values within a lookup type. */
export const getLookupValuesApi = async (lookupTypeId: number): Promise<LookupValue[]> =>
  adminHttp.get<LookupValue[]>(`${BASE_URL}/admin/lookups/lookup-types/${lookupTypeId}/values`);

/** GET /admin/lookups/frequencies — e.g. DAILY, WEEKLY, MONTHLY. */
export const getFrequenciesApi = async (): Promise<Frequency[]> =>
  adminHttp.get<Frequency[]>(`${BASE_URL}/admin/lookups/frequencies`);

/**
 * GET /admin/lookups/frequencies/:frequencyId/periods?year=&month=
 * Preview calendar windows before assigning a frequency to a field.
 */
export const getFrequencyPeriodsApi = async (
  frequencyId: number,
  params: FrequencyPeriodQuery,
): Promise<FrequencyPeriodWindow[]> => {
  const query = buildFrequencyPeriodQuery(params);
  const payload = await adminHttp.get<unknown>(
    `${BASE_URL}/admin/lookups/frequencies/${frequencyId}/periods?${query}`,
  );
  return unwrapPeriodWindows(payload);
};
