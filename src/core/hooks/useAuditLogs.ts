import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getSubmissionAuditLogs } from '../api/admin/auditLogs';
import type { SubmissionAuditLogQuery } from '../types/submissionAuditLog';

export const AUDIT_LOGS_QUERY_KEY = 'submission-audit-logs';

/** How many recent events the charts read, independent of the table page. */
export const AUDIT_LOG_CHART_SAMPLE_SIZE = 100;

/** Paginated audit log. Keeps the previous page on screen while the next one loads. */
export const useSubmissionAuditLogs = (params: SubmissionAuditLogQuery) =>
  useQuery({
    queryKey: [AUDIT_LOGS_QUERY_KEY, params],
    queryFn: () => getSubmissionAuditLogs(params),
    placeholderData: keepPreviousData,
    retry: 1,
  });
