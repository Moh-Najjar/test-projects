import type { SubmissionAuditLogQuery } from '../../../core/types/submissionAuditLog';

/** Controlled filter form. Empty strings mean "do not send this filter". */
export interface AuditFilterDraft {
  submissionId: string;
  formId: string;
  actionByUserId: string;
  actionType: string;
  from: string;
  to: string;
}

export const EMPTY_AUDIT_FILTERS: AuditFilterDraft = {
  submissionId: '',
  formId: '',
  actionByUserId: '',
  actionType: '',
  from: '',
  to: '',
};

export type FilterIssue = 'number' | 'range';

export interface AuditFilterFieldIssues {
  submissionId: FilterIssue | null;
  formId: FilterIssue | null;
  actionByUserId: FilterIssue | null;
  range: FilterIssue | null;
}

export const EMPTY_FILTER_ISSUES: AuditFilterFieldIssues = {
  submissionId: null,
  formId: null,
  actionByUserId: null,
  range: null,
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Whole numbers greater than zero. Blank input is "not set", not an error. */
export const parsePositiveInt = (value: string): number | null => {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const numberIssue = (value: string): FilterIssue | null => {
  if (value.trim().length === 0) return null;
  return parsePositiveInt(value) === null ? 'number' : null;
};

/**
 * Turns a `yyyy-mm-dd` input into an ISO instant.
 * `endOfDay` uses the last millisecond of that local calendar day.
 */
const dateInputToIso = (value: string, endOfDay: boolean): string | null => {
  if (!DATE_PATTERN.test(value)) return null;

  const parts = value.split('-');
  const yearText = parts[0];
  const monthText = parts[1];
  const dayText = parts[2];
  if (yearText === undefined || monthText === undefined || dayText === undefined) return null;

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);

  // Reject overflow dates such as 2026-02-31, which Date would roll forward.
  if (Number.isNaN(date.getTime())) return null;
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;

  return date.toISOString();
};

export const filtersAreValid = (issues: AuditFilterFieldIssues): boolean =>
  issues.submissionId === null &&
  issues.formId === null &&
  issues.actionByUserId === null &&
  issues.range === null;

export const validateFilters = (draft: AuditFilterDraft): AuditFilterFieldIssues => {
  const from = draft.from.trim();
  const to = draft.to.trim();
  const fromInvalid = from.length > 0 && dateInputToIso(from, false) === null;
  const toInvalid = to.length > 0 && dateInputToIso(to, true) === null;
  const outOfOrder = from.length > 0 && to.length > 0 && from > to;

  return {
    submissionId: numberIssue(draft.submissionId),
    formId: numberIssue(draft.formId),
    actionByUserId: numberIssue(draft.actionByUserId),
    range: fromInvalid || toInvalid || outOfOrder ? 'range' : null,
  };
};

export const normalizeFilters = (draft: AuditFilterDraft): AuditFilterDraft => ({
  submissionId: draft.submissionId.trim(),
  formId: draft.formId.trim(),
  actionByUserId: draft.actionByUserId.trim(),
  actionType: draft.actionType.trim(),
  from: draft.from.trim(),
  to: draft.to.trim(),
});

/** Builds the request query. Call only after `validateFilters` reports no issues. */
export const toAuditQuery = (
  draft: AuditFilterDraft,
  page: number,
  pageSize: number,
): SubmissionAuditLogQuery => {
  const query: SubmissionAuditLogQuery = { page, pageSize };

  const submissionId = parsePositiveInt(draft.submissionId);
  if (submissionId !== null) query.submissionId = submissionId;

  const formId = parsePositiveInt(draft.formId);
  if (formId !== null) query.formId = formId;

  const actionByUserId = parsePositiveInt(draft.actionByUserId);
  if (actionByUserId !== null) query.actionByUserId = actionByUserId;

  if (draft.actionType.trim().length > 0) query.actionType = draft.actionType.trim();

  const from = dateInputToIso(draft.from.trim(), false);
  if (from !== null) query.from = from;

  const to = dateInputToIso(draft.to.trim(), true);
  if (to !== null) query.to = to;

  return query;
};
