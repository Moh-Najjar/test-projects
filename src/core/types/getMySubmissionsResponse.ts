// Shape of a single submission item returned by GET /submissions
export interface SubmissionItem {
  submissionId: number;
  referenceNumber: string;
  formId: number;
  formNameEn: string;
  formNameAr: string;
  directorateId: number;
  directorateNameEn: string;
  directorateNameAr: string;
  reportingDate: string;
  /** Pascal-case status string from the API, e.g. "Draft", "Submitted", "Approved" */
  status: string;
  enteredAt: string;
  submittedAt: string | null;
  approvedAt: string | null;
  totalKPIs: number;
}

// Status breakdown counters returned alongside the paginated list
export interface SubmissionCounters {
  rejected: number;
  approved: number;
  submitted: number;
  total: number;
}

// Paginated wrapper returned by GET /submissions
export interface GetMySubmissionsResponse {
  items: SubmissionItem[];
  totalCount: number;
  totalKPIs: number;
  counters: SubmissionCounters;
  page: number;
  pageSize: number;
}
