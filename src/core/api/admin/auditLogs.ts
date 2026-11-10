import { adminHttp } from './adminHttp';
import type { SubmissionAuditLogPage, SubmissionAuditLogQuery } from '../../types/submissionAuditLog';

const BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL ?? '';

/**
 * GET /admin/submission-audit-logs — paginated submission history.
 * `adminHttp` sends the admin JWT and unwraps the response envelope.
 */
export const getSubmissionAuditLogs = async (
  params: SubmissionAuditLogQuery,
): Promise<SubmissionAuditLogPage> => {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });

  if (params.submissionId !== undefined) query.set('submissionId', String(params.submissionId));
  if (params.formId !== undefined) query.set('formId', String(params.formId));
  if (params.actionByUserId !== undefined) query.set('actionByUserId', String(params.actionByUserId));
  if (params.actionType !== undefined && params.actionType.length > 0) query.set('actionType', params.actionType);
  if (params.from !== undefined && params.from.length > 0) query.set('from', params.from);
  if (params.to !== undefined && params.to.length > 0) query.set('to', params.to);

  return adminHttp.get<SubmissionAuditLogPage>(`${BASE_URL}/admin/submission-audit-logs?${query.toString()}`);
};
