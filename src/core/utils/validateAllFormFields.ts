import { UseFormReturn } from "react-hook-form";
import { ControlKeys } from "../enums/control-keys.enum";
import { FormField, GridCell } from "../types/FormField";
import { FIELDS_PER_PAGE } from "./groupAttributesByPage";
import { isRawTableCellRequired, isTableColumnRequired } from "./tableRequired";
import {
  getDropdownColumnKeys,
  getDuplicateDropdownRowIndexes,
} from "./tableDropdownUniqueness";

/** Options bag accepted by the translation function */
type TranslationOptions = Record<string, unknown>;

/** A single validation failure with enough context for UI and RHF setError */
export interface ValidationIssue {
  /** Full RHF path, e.g. "KPI_001" or "KPI_0050.0.FOOD_TYPE" */
  rhfPath: string;
  /** Localized display label for the failing field */
  fieldLabel: string;
  /** Localized error message */
  message: string;
  /** 0-based data page index (section) the field belongs to */
  sectionIndex: number;
}

/** Descriptor for a single validatable RHF path */
interface ValidatableEntry {
  rhfPath: string;
  fieldLabel: string;
  isRequired: boolean;
  regexPattern: string | null;
  validationMessageEn: string | null;
  validationMessageAr: string | null;
  isReadOnly: boolean;
  sectionIndex: number;
}

/**
 * Resolves a dot-separated RHF path against the nested form values object.
 */
const getValueAtPath = (
  formValues: Record<string, unknown>,
  path: string
): unknown => {
  const parts = path.split(".");
  let current: unknown = formValues;

  for (const part of parts) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object"
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
};

/** Returns true when the field is locked by a KPI next-submission date */
const hasKpiNextSubmissionDate = (field: FormField): boolean => {
  const en = field.kpiNextSubmissionDateEn ?? "";
  const ar = field.kpiNextSubmissionDateAr ?? "";
  return en !== "" || ar !== "";
};

/** Returns true when a scalar value is considered empty for required checks */
const isEmptyValue = (value: unknown): boolean => {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === "string") {
    return value.trim() === "";
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return false;
};

/** Builds the localized required error message */
const requiredMessage = (
  fieldLabel: string,
  t: (key: string, options?: TranslationOptions) => string
): string => t("validation.required", { field: fieldLabel });

/** Builds the localized pattern error message */
const patternMessage = (
  fieldLabel: string,
  validationMessageEn: string | null,
  validationMessageAr: string | null,
  loc: (en: string, ar: string) => string,
  t: (key: string, options?: TranslationOptions) => string
): string => {
  const custom = loc(validationMessageEn ?? "", validationMessageAr ?? "");
  return custom || t("validation.pattern", { field: fieldLabel });
};

/**
 * Validates a single entry against required and regex rules.
 * Returns a localized error message or null when valid.
 */
const validateEntry = (
  entry: ValidatableEntry,
  formValues: Record<string, unknown>,
  loc: (en: string, ar: string) => string,
  t: (key: string, options?: TranslationOptions) => string
): string | null => {
  if (entry.isReadOnly) {
    return null;
  }

  const value = getValueAtPath(formValues, entry.rhfPath);

  if (entry.isRequired && isEmptyValue(value)) {
    return requiredMessage(entry.fieldLabel, t);
  }

  if (
    entry.regexPattern !== null &&
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    const regex = new RegExp(entry.regexPattern);
    if (!regex.test(value)) {
      return patternMessage(
        entry.fieldLabel,
        entry.validationMessageEn,
        entry.validationMessageAr,
        loc,
        t
      );
    }
  }

  return null;
};

/** Collects TABLE cell paths from the current row array */
const collectTableEntries = (
  field: FormField,
  formValues: Record<string, unknown>,
  sectionIndex: number,
  loc: (en: string, ar: string) => string
): ValidatableEntry[] => {
  const entries: ValidatableEntry[] = [];
  const rawRows = formValues[field.fieldKey];
  const columns = field.columns ?? [];

  if (!Array.isArray(rawRows)) {
    if (field.isRequired && !field.isReadOnly && !hasKpiNextSubmissionDate(field)) {
      entries.push({
        rhfPath: field.fieldKey,
        fieldLabel: loc(field.labelEn, field.labelAr),
        isRequired: true,
        regexPattern: null,
        validationMessageEn: null,
        validationMessageAr: null,
        isReadOnly: field.isReadOnly || hasKpiNextSubmissionDate(field),
        sectionIndex,
      });
    }
    return entries;
  }

  const isTableReadOnly = field.isReadOnly || hasKpiNextSubmissionDate(field);

  rawRows.forEach((row, rowIndex) => {
    if (typeof row !== "object" || row === null || Array.isArray(row)) {
      return;
    }

    columns.forEach((col) => {
      const rhfPath = `${field.fieldKey}.${rowIndex}.${col.columnKey}`;
      /** Required comes from the column's own isRequired flag */
      const isRequired = isTableColumnRequired(col);

      entries.push({
        rhfPath,
        fieldLabel: loc(col.labelEn, col.labelAr),
        isRequired,
        regexPattern: null,
        validationMessageEn: null,
        validationMessageAr: null,
        isReadOnly: isTableReadOnly,
        sectionIndex,
      });
    });
  });

  return entries;
};

/**
 * Submit/review half of TABLE dropdown uniqueness.
 * See tableDropdownUniqueness.ts — DropDown extraValidate covers the live case.
 */
const collectTableDuplicateIssues = (
  field: FormField,
  formValues: Record<string, unknown>,
  sectionIndex: number,
  loc: (en: string, ar: string) => string,
  t: (key: string, options?: TranslationOptions) => string
): ValidationIssue[] => {
  if (!field.isVisible || field.isReadOnly || hasKpiNextSubmissionDate(field)) {
    return [];
  }

  // Backend flag: skip uniqueness when this TABLE is allowed to repeat rows.
  if (field.allowDuplicateRows === true) {
    return [];
  }

  const dropdownKeys = getDropdownColumnKeys(field.columns ?? []);
  if (dropdownKeys.length === 0) {
    return [];
  }

  const duplicateIndexes = getDuplicateDropdownRowIndexes(
    formValues[field.fieldKey],
    dropdownKeys
  );
  const issues: ValidationIssue[] = [];

  duplicateIndexes.forEach((rowIndex) => {
    dropdownKeys.forEach((columnKey) => {
      const col = (field.columns ?? []).find((c) => c.columnKey === columnKey);
      const fieldLabel =
        col !== undefined ? loc(col.labelEn, col.labelAr) : columnKey;
      issues.push({
        rhfPath: `${field.fieldKey}.${rowIndex}.${columnKey}`,
        fieldLabel,
        message: t("validation.duplicateRow", { field: fieldLabel }),
        sectionIndex,
      });
    });
  });

  return issues;
};

/** Collects RAW_TABLE cell paths from the grid definition */
const collectRawTableEntries = (
  field: FormField,
  sectionIndex: number,
  loc: (en: string, ar: string) => string
): ValidatableEntry[] => {
  const entries: ValidatableEntry[] = [];
  const grid = field.grid;

  if (grid === null) {
    return entries;
  }

  const isTableReadOnly = field.isReadOnly || hasKpiNextSubmissionDate(field);

  grid.cells.forEach((cell: GridCell) => {
    if (!cell.isVisible) {
      return;
    }

    const rhfPath = `${field.fieldKey}.${cell.rowKey}.${cell.columnKey}`;
    /** Required comes from the row's isRequired flag (falls back to the cell flag) */
    const isRequired = isRawTableCellRequired(cell, field);

    entries.push({
      rhfPath,
      fieldLabel: loc(cell.columnLabelEn, cell.columnLabelAr),
      isRequired,
      regexPattern: null,
      validationMessageEn: cell.validationMessageEn,
      validationMessageAr: cell.validationMessageAr,
      isReadOnly: isTableReadOnly || cell.isReadOnly,
      sectionIndex,
    });
  });

  return entries;
};

/** Collects CALCULATED_FIELD input and result paths */
const collectCalculatedFieldEntries = (
  field: FormField,
  sectionIndex: number,
  loc: (en: string, ar: string) => string
): ValidatableEntry[] => {
  const entries: ValidatableEntry[] = [];
  const calculation = field.calculation;

  if (calculation === null) {
    return entries;
  }

  const isParentReadOnly = field.isReadOnly || hasKpiNextSubmissionDate(field);

  calculation.inputs.forEach((input) => {
    entries.push({
      rhfPath: `${field.fieldKey}.${input.columnKey}`,
      fieldLabel: loc(input.labelEn, input.labelAr),
      isRequired: input.isRequired,
      regexPattern: null,
      validationMessageEn: null,
      validationMessageAr: null,
      isReadOnly: isParentReadOnly,
      sectionIndex,
    });
  });

  const resultLabel = loc(
    calculation.result.labelEn,
    calculation.result.labelAr
  );

  entries.push({
    rhfPath: `${field.fieldKey}.${calculation.resultColumnKey}`,
    fieldLabel: resultLabel,
    isRequired: field.isRequired,
    regexPattern: null,
    validationMessageEn: null,
    validationMessageAr: null,
    isReadOnly: isParentReadOnly,
    sectionIndex,
  });

  return entries;
};

/**
 * Collects every validatable RHF path for a single top-level FormField.
 */
const collectFieldEntries = (
  field: FormField,
  formValues: Record<string, unknown>,
  sectionIndex: number,
  loc: (en: string, ar: string) => string
): ValidatableEntry[] => {
  if (!field.isVisible) {
    return [];
  }

  const controlKey = field.controlType.controlKey;
  const isReadOnly = field.isReadOnly || hasKpiNextSubmissionDate(field);

  switch (controlKey) {
    case ControlKeys.Label:
      return [];

    case ControlKeys.Table:
      return collectTableEntries(field, formValues, sectionIndex, loc);

    case ControlKeys.RawTable:
      return collectRawTableEntries(field, sectionIndex, loc);

    case ControlKeys.CalculatedField:
      return collectCalculatedFieldEntries(field, sectionIndex, loc);

    case ControlKeys.Multiselect:
      return [
        {
          rhfPath: field.fieldKey,
          fieldLabel: loc(field.labelEn, field.labelAr),
          isRequired: field.isRequired,
          regexPattern: field.regexPattern,
          validationMessageEn: field.validationMessageEn,
          validationMessageAr: field.validationMessageAr,
          isReadOnly,
          sectionIndex,
        },
      ];

    default:
      return [
        {
          rhfPath: field.fieldKey,
          fieldLabel: loc(field.labelEn, field.labelAr),
          isRequired: field.isRequired,
          regexPattern: field.regexPattern,
          validationMessageEn: field.validationMessageEn,
          validationMessageAr: field.validationMessageAr,
          isReadOnly,
          sectionIndex,
        },
      ];
  }
};

/**
 * Validates every visible field across the entire form.
 * Returns a flat list of issues grouped by sectionIndex for UI rendering.
 */
export const validateAllFormFields = (
  formFields: FormField[],
  formValues: Record<string, unknown>,
  loc: (en: string, ar: string) => string,
  t: (key: string, options?: TranslationOptions) => string
): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  formFields.forEach((field, index) => {
    const sectionIndex = Math.floor(index / FIELDS_PER_PAGE);
    const entries = collectFieldEntries(field, formValues, sectionIndex, loc);

    entries.forEach((entry) => {
      const message = validateEntry(entry, formValues, loc, t);
      if (message !== null) {
        issues.push({
          rhfPath: entry.rhfPath,
          fieldLabel: entry.fieldLabel,
          message,
          sectionIndex: entry.sectionIndex,
        });
      }
    });

    if (field.controlType.controlKey === ControlKeys.Table) {
      issues.push(
        ...collectTableDuplicateIssues(field, formValues, sectionIndex, loc, t)
      );
    }
  });

  return issues;
};

/**
 * Collects all RHF field paths for a single stepper page.
 * Used to scope per-step trigger() validation on data pages.
 */
export const collectPageFieldKeys = (
  pageFields: FormField[],
  formValues: Record<string, unknown>,
  loc: (en: string, ar: string) => string
): string[] => {
  const keys: string[] = [];

  pageFields.forEach((field) => {
    const entries = collectFieldEntries(field, formValues, 0, loc);
    entries.forEach((entry) => {
      keys.push(entry.rhfPath);
    });
  });

  return keys;
};

/** Applies validation issues to React Hook Form via setError */
export const applyValidationIssues = (
  formMethods: UseFormReturn<Record<string, unknown>>,
  issues: ValidationIssue[]
): void => {
  issues.forEach((issue) => {
    formMethods.setError(issue.rhfPath as never, {
      type: "manual",
      message: issue.message,
    });
  });
};

/** Clears previously applied validation issues from React Hook Form */
export const clearValidationIssues = (
  formMethods: UseFormReturn<Record<string, unknown>>,
  issues: ValidationIssue[]
): void => {
  issues.forEach((issue) => {
    formMethods.clearErrors(issue.rhfPath as never);
  });
};
