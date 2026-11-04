import { useQuery } from '@tanstack/react-query';
import {
  getControlTypesApi,
  getDataTypesApi,
  getLookupTypesApi,
  getLookupValuesApi,
  getFrequenciesApi,
  getFrequencyPeriodsApi,
} from '../../api/admin/adminLookups';
import type { FrequencyPeriodQuery } from '../../types/admin/adminLookups';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const ADMIN_CONTROL_TYPES_QUERY_KEY = 'admin-control-types';
export const ADMIN_DATA_TYPES_QUERY_KEY = 'admin-data-types';
export const ADMIN_LOOKUP_TYPES_QUERY_KEY = 'admin-lookup-types';
export const ADMIN_LOOKUP_VALUES_QUERY_KEY = 'admin-lookup-values';
export const ADMIN_FREQUENCIES_QUERY_KEY = 'admin-frequencies';
export const ADMIN_FREQUENCY_PERIODS_QUERY_KEY = 'admin-frequency-periods';

// ─── Lookup queries ───────────────────────────────────────────────────────────

/** Control types (TEXTBOX, DROPDOWN, TABLE, CALCULATED …). Cached long-term. */
export const useAdminControlTypes = () =>
  useQuery({
    queryKey: [ADMIN_CONTROL_TYPES_QUERY_KEY],
    queryFn: getControlTypesApi,
    staleTime: 1000 * 60 * 30,
  });

/** Data types (TEXT, NUMBER, DATE, BOOLEAN …). Cached long-term. */
export const useAdminDataTypes = () =>
  useQuery({
    queryKey: [ADMIN_DATA_TYPES_QUERY_KEY],
    queryFn: getDataTypesApi,
    staleTime: 1000 * 60 * 30,
  });

/** Lookup type categories. */
export const useAdminLookupTypes = () =>
  useQuery({
    queryKey: [ADMIN_LOOKUP_TYPES_QUERY_KEY],
    queryFn: getLookupTypesApi,
    staleTime: 1000 * 60 * 10,
  });

/** Values within a specific lookup type. */
export const useAdminLookupValues = (lookupTypeId: number) =>
  useQuery({
    queryKey: [ADMIN_LOOKUP_VALUES_QUERY_KEY, lookupTypeId],
    queryFn: () => getLookupValuesApi(lookupTypeId),
    enabled: lookupTypeId > 0,
    staleTime: 1000 * 60 * 10,
  });

/** Form frequencies (DAILY, WEEKLY, MONTHLY …). Cached long-term. */
export const useAdminFrequencies = () =>
  useQuery({
    queryKey: [ADMIN_FREQUENCIES_QUERY_KEY],
    queryFn: getFrequenciesApi,
    staleTime: 1000 * 60 * 30,
  });

/**
 * Preview period windows for a frequency (GET /admin/lookups/frequencies/:id/periods).
 * Pass `month` for DAILY / WEEKLY and `periodStartDate` when the frequency supports a custom start.
 */
export const useAdminFrequencyPeriods = (
  frequencyId: number,
  year: number,
  month: number | undefined,
  periodStartDate: string | undefined,
) =>
  useQuery({
    queryKey: [ADMIN_FREQUENCY_PERIODS_QUERY_KEY, frequencyId, year, month ?? null, periodStartDate ?? null],
    queryFn: () => {
      const params: FrequencyPeriodQuery = { year };
      if (month !== undefined) {
        params.month = month;
      }
      if (periodStartDate !== undefined && periodStartDate.length > 0) {
        params.periodStartDate = periodStartDate;
      }
      return getFrequencyPeriodsApi(frequencyId, params);
    },
    enabled: frequencyId > 0 && year >= 1900,
    staleTime: 1000 * 60 * 10,
  });
