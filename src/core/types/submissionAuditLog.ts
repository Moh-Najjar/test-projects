/** Actions the audit API is known to return. Other values are still displayed. */
export const AUDIT_ACTION_TYPES = ['Created', 'Updated', 'Submitted', 'Approved', 'Rejected', 'Deleted'] as const;

export type KnownAuditAction = (typeof AUDIT_ACTION_TYPES)[number];

/** One row from GET /admin/submission-audit-logs. */
export interface SubmissionAuditLog {
  auditId: number;
  submissionId: number;
  /** Present when the API includes it; otherwise the UI infers the form from field keys. */
  formId?: number | null;
  actionType: string;
  fieldKey: string | null;
  oldValue: string | null;
  newValue: string | null;
  actionByUserId: number;
  actionAt: string;
  comment: string | null;
  ipAddress: string | null;
}

/** Page payload inside the API envelope `data` field. */
export interface SubmissionAuditLogPage {
  items: SubmissionAuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Query string for GET /admin/submission-audit-logs.
 * Omitted filters are not sent, so the API applies no constraint for them.
 */
export interface SubmissionAuditLogQuery {
  submissionId?: number;
  formId?: number;
  actionByUserId?: number;
  actionType?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}
