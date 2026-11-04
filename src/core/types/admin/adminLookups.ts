/** A control type entry (e.g. TEXTBOX, DROPDOWN, TABLE, CALCULATED). */
export interface ControlType {
  controlTypeId: number;
  controlKey: string;
  controlName: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

/** A data type entry (e.g. TEXT, NUMBER, DATE, BOOLEAN). */
export interface DataType {
  dataTypeId: number;
  typeKey: string;
  typeName: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

/** A lookup type category (e.g. GENDER, NATIONALITY). */
export interface LookupType {
  lookupTypeId: number;
  code: string;
  nameEn: string;
  nameAr: string;
  isActive: boolean;
}

/** A specific value within a lookup type (e.g. MALE, FEMALE). */
export interface LookupValue {
  lookupValueId: number;
  code: string;
  nameEn: string;
  nameAr: string;
  isActive: boolean;
}

/** A frequency entry (e.g. DAILY, WEEKLY, MONTHLY, ANNUALLY). */
export interface Frequency {
  frequencyId: number;
  code: string;
  nameEn: string;
  nameAr: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  /** True when this frequency uses discrete period buckets (e.g. calendar months). */
  hasDiscretePeriods: boolean;
  /**
   * True when the KPI can store a custom period start (month + day) on ReferenceDate.
   * MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUALLY, EVERY_3_YEARS, EVERY_5_YEARS.
   */
  supportsCustomPeriodStart: boolean;
}

/** Query params for GET /admin/lookups/frequencies/:frequencyId/periods. */
export interface FrequencyPeriodQuery {
  year: number;
  /** Optional. Useful for DAILY / WEEKLY so the API does not return an entire year of windows. */
  month?: number;
  /** Optional ISO date (YYYY-MM-DD). Only month + day are applied as the repeating offset. */
  periodStartDate?: string;
}

/**
 * A calendar window computed from a frequency code.
 * GET /admin/lookups/frequencies/:id/periods and field `expectedPeriods` share this shape.
 */
export interface FrequencyPeriodWindow {
  periodStartDate: string;
  periodEndDate: string;
  labelEn: string;
  labelAr: string;
  periodKey: string;
  year: number;
  month: number | null;
}
