import type { Frequency, FrequencyPeriodQuery, FrequencyPeriodWindow } from '../types/admin/adminLookups';
import type { KpiSubmissionPeriod } from '../types/admin/adminForms';

/** Frequency codes that return too many windows unless a month is supplied. */
const CODES_REQUIRING_MONTH = new Set(['DAILY', 'WEEKLY']);

const MONTH_LABELS_EN: readonly string[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** True when the periods preview/read APIs should send `month` as well as `year`. */
export const frequencyRequiresMonth = (frequency: Frequency | undefined): boolean => {
  if (frequency === undefined) {
    return false;
  }
  return CODES_REQUIRING_MONTH.has(frequency.code.toUpperCase());
};

/** True when the UI should show a custom period-start date picker. */
export const frequencySupportsCustomPeriodStart = (frequency: Frequency | undefined): boolean => {
  if (frequency === undefined) {
    return false;
  }
  return frequency.supportsCustomPeriodStart;
};

/** Normalizes an API date to YYYY-MM-DD for `<input type="date">`. */
export const toDateInputValue = (value: string | null | undefined): string => {
  if (value === undefined || value === null) {
    return '';
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return '';
  }
  return trimmed.slice(0, 10);
};

const readString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
};

const readNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
};

const readNullableDate = (value: unknown): string | null => {
  const text = toDateInputValue(readString(value));
  return text.length > 0 ? text : null;
};

/**
 * Maps an unknown period-window payload onto FrequencyPeriodWindow.
 * Accepts the current API names (periodStartDate / periodEndDate) plus older aliases.
 */
export const normalizePeriodWindow = (raw: unknown): FrequencyPeriodWindow | null => {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const periodStartDate =
    toDateInputValue(readString(record.periodStartDate)) ||
    toDateInputValue(readString(record.periodStart)) ||
    toDateInputValue(readString(record.startDate));
  const periodEndDate =
    toDateInputValue(readString(record.periodEndDate)) ||
    toDateInputValue(readString(record.periodEnd)) ||
    toDateInputValue(readString(record.endDate));
  const year = readNumber(record.year);
  const month = readNumber(record.month);
  const periodKey =
    readString(record.periodKey) ||
    readString(record.code) ||
    (periodStartDate.length > 0 ? periodStartDate : '');

  if (periodKey.length === 0 && periodStartDate.length === 0 && year === null) {
    return null;
  }

  return {
    periodStartDate,
    periodEndDate,
    labelEn: readString(record.labelEn) || readString(record.nameEn),
    labelAr: readString(record.labelAr) || readString(record.nameAr),
    periodKey,
    year: year ?? 0,
    month,
  };
};

const unwrapPeriodArray = (value: unknown): FrequencyPeriodWindow[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => normalizePeriodWindow(item))
    .filter((item): item is FrequencyPeriodWindow => item !== null);
};

/** Unwraps a bare array or an envelope with `periods` / `expectedPeriods`. */
export const unwrapPeriodWindows = (payload: unknown): FrequencyPeriodWindow[] => {
  if (Array.isArray(payload)) {
    return unwrapPeriodArray(payload);
  }

  if (typeof payload !== 'object' || payload === null) {
    return [];
  }

  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.expectedPeriods)) {
    return unwrapPeriodArray(record.expectedPeriods);
  }
  if (Array.isArray(record.periods)) {
    return unwrapPeriodArray(record.periods);
  }

  return [];
};

/**
 * Maps an unknown KpiSubmissionPeriods row onto KpiSubmissionPeriod.
 * Falls back to period-window aliases so the submitted list still renders.
 */
export const normalizeSubmittedPeriod = (raw: unknown): KpiSubmissionPeriod | null => {
  const window = normalizePeriodWindow(raw);
  if (window === null || typeof raw !== 'object' || raw === null) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const kpiSubmissionPeriodId =
    readNumber(record.kpiSubmissionPeriodId) ?? readNumber(record.submissionPeriodId) ?? readNumber(record.id) ?? 0;
  const kpiId = readNumber(record.kpiId) ?? 0;
  const frequencyId = readNumber(record.frequencyId) ?? 0;
  const statusValue = record.status;
  const status = typeof statusValue === 'string' ? statusValue : null;

  return {
    kpiSubmissionPeriodId,
    kpiId,
    frequencyId,
    periodKey: window.periodKey,
    labelEn: window.labelEn,
    labelAr: window.labelAr,
    year: window.year,
    month: window.month,
    periodStartDate: window.periodStartDate,
    periodEndDate: window.periodEndDate,
    status,
    createdAt: readString(record.createdAt),
  };
};

export const unwrapSubmittedPeriods = (payload: unknown): KpiSubmissionPeriod[] => {
  if (!Array.isArray(payload)) {
    return [];
  }
  return payload
    .map((item) => normalizeSubmittedPeriod(item))
    .filter((item): item is KpiSubmissionPeriod => item !== null);
};

/** Human-readable EN label for a calendar window. */
export const formatPeriodWindowLabel = (period: FrequencyPeriodWindow): string => {
  if (period.labelEn.trim().length > 0) {
    return period.labelEn;
  }
  if (period.month !== null && period.month >= 1 && period.month <= 12 && period.year > 0) {
    const monthName = MONTH_LABELS_EN[period.month - 1];
    if (monthName !== undefined) {
      return `${monthName} ${String(period.year)}`;
    }
  }
  if (period.periodStartDate.length > 0 && period.periodEndDate.length > 0) {
    return `${period.periodStartDate} – ${period.periodEndDate}`;
  }
  if (period.periodKey.length > 0) {
    return period.periodKey;
  }
  return 'Untitled period';
};

export const formatPeriodRange = (period: FrequencyPeriodWindow): string => {
  if (period.periodStartDate.length > 0 && period.periodEndDate.length > 0) {
    return `${period.periodStartDate} → ${period.periodEndDate}`;
  }
  return '';
};

/** Builds `year` / optional `month` / optional `periodStartDate` query string. */
export const buildFrequencyPeriodQuery = (params: FrequencyPeriodQuery): string => {
  const query = new URLSearchParams({ year: String(params.year) });
  if (params.month !== undefined) {
    query.append('month', String(params.month));
  }
  if (params.periodStartDate !== undefined && params.periodStartDate.length > 0) {
    query.append('periodStartDate', params.periodStartDate);
  }
  return query.toString();
};

export const readNullableIsoDate = readNullableDate;
export const readNullableNumber = readNumber;
