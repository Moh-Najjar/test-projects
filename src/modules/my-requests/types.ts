/** Status of a KPI data submission request */
export type RequestStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RETURNED';

/** Update frequency / period type for a KPI form */
export type RequestPeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';

/** A single KPI data submission request */
export interface RequestItem {
  id: string;
  requestNumber: string;
  formId: number;
  formNameEn: string;
  formNameAr: string;
  directorateEn: string;
  directorateAr: string;
  /** ISO 8601 date string of when the request was first submitted */
  submittedAt: string;
  /** ISO 8601 date string of the most recent update */
  updatedAt: string;
  /** Human-readable period label, e.g. "2024", "Q1 2025", "Jan 2025" */
  period: string;
  periodType: RequestPeriodType;
  status: RequestStatus;
  submittedBy: string;
  /** Number of KPI fields included in this form submission */
  kpiCount: number;
  notes?: string;
  reviewerNotes?: string;
}

/** Active filter state for the requests table */
export interface RequestFiltersState {
  search: string;
  status: RequestStatus | 'ALL';
  periodType: RequestPeriodType | 'ALL';
}

/** Generic option shape used in select/dropdown components */
export interface SelectOption<T extends string> {
  value: T;
  labelEn: string;
  labelAr: string;
}

/** Payload when a user submits the "Add New Request" form */
export interface NewRequestPayload {
  formId: number;
  period: string;
  periodType: RequestPeriodType;
  notes: string;
}
