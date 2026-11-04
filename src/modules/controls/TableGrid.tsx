import React, { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  alpha,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import TextFieldLabel from "./InputFieldLabel";
import { FormField, ColumnDef, LookupType } from "../../core/types/FormField";
import { ControlKeys } from "../../core/enums/control-keys.enum";
import { getControlKey, getControlType } from "../../core/utils/control.utils";
import { useLocale } from "../../core/hooks/useLocale";
import { useMultiDropdownOptions } from "../../core/hooks/useFormApi";
import { GetDropdownListValuesResponse } from "../../core/types/getDropdownListValuesResponse";
import { findJordanLookupValueId, isCountriesLookupType } from "../../core/utils/countryLookup";
import { isTableColumnRequired } from "../../core/utils/tableRequired";
import DropDown from "./DropDown";
import {
  getDropdownColumnKeys,
  isDuplicateDropdownRow,
  pickUnusedDropdownValues,
} from "../../core/utils/tableDropdownUniqueness";
import { BRAND_NAVY } from "../../core/constants/theme";

interface TableGridProps {
  formField: FormField;
  formMethods: UseFormReturn<Record<string, unknown>>;
  hideHelperText?: boolean;
}

/**
 * Builds a default row for the table:
 * - COUNTRIES dropdown columns → Jordan's lookupValueId when present.
 * - Other DROPDOWN columns → first available option's lookupValueId so the
 *   value matches what the server receives on submit even without user interaction.
 * - All other columns → empty string.
 */
const buildDefaultRow = (
  columns: ColumnDef[],
  optionsMap: GetDropdownListValuesResponse
): Record<string, string> =>
  columns.reduce<Record<string, string>>((acc, col) => {
    if (col.controlType.controlKey === "DROPDOWN" && col.lookupType !== null) {
      const options = optionsMap[String(col.lookupType.lookupTypeId)] ?? [];
      if (isCountriesLookupType(col.lookupType)) {
        acc[col.columnKey] = findJordanLookupValueId(options) ?? "";
      } else {
        acc[col.columnKey] = options.length > 0 ? String(options[0].lookupValueId) : "";
      }
    } else {
      acc[col.columnKey] = "";
    }
    return acc;
  }, {});

/** Number and percentage cells keep a light fill; placeholders stay visible. */
const isCompactValueControl = (controlKey: string): boolean =>
  controlKey === ControlKeys.Number || controlKey === ControlKeys.Percentage;

/** Zero-padded row index shown beside each row. */
const formatRowIndex = (index: number): string =>
  String(index + 1).padStart(2, "0");

/** Opaque header fill. Alpha tints show body rows through a sticky header. */
const headerBackground = (mode: string): string =>
  mode === "dark" ? "#16324A" : "#F3F8FC";

/** First-paint row height before the browser measures the real cell controls. */
const ESTIMATED_ROW_HEIGHT = 64;

/** Extra rows kept mounted above and below the viewport so scrolling stays smooth. */
const ROW_OVERSCAN = 8;

/**
 * Converts a ColumnDef into a minimal FormField so the existing control
 * components (InputField, DropDown, etc.) can render it without any changes.
 * fieldKey is set to the full nested RHF path: "parentKey.rowIndex.columnKey"
 */
const columnToFormField = (
  col: ColumnDef,
  fieldName: string,
  isReadOnly: boolean,
  isRequired: boolean
): FormField => ({
  fieldId: 0,
  formId: 0,
  fieldKey: fieldName,
  labelEn: col.labelEn,
  labelAr: col.labelAr,
  dataType: col.dataType,
  controlType: col.controlType,
  isRequired: isRequired,
  displayOrder: 0,
  isReadOnly,
  isVisible: true,
  lookupType: col.lookupType,
  /** Column label is the placeholder inside every cell, including numbers. */
  placeholderEn: col.labelEn,
  placeholderAr: col.labelAr,
  helpTextEn: "",
  helpTextAr: "",
  columns: null,
  /** TABLE cells never carry nested rows, grid, or row-label headers */
  rows: null,
  grid: null,
  rowLabelEn: null,
  rowLabelAr: null,
  /** Table cell columns do not carry per-cell regex constraints */
  regexPattern: null,
  validationMessageEn: null,
  validationMessageAr: null,
  /** Table cells do not carry a next-submission date — that belongs to the parent field */
  kpiNextSubmissionDateEn: null,
  kpiNextSubmissionDateAr: null,
  calculation: null,
});

/** Renders a dynamic table/grid using useFieldArray for fields with controlKey "TABLE" */
const TableGrid: React.FC<TableGridProps> = ({ formField, formMethods, hideHelperText = false }) => {
  const columns = formField.columns ?? [];
  const { loc, t } = useLocale();

  /** True when a next-submission date is provided for this KPI field */
  const kpiDateEn = formField.kpiNextSubmissionDateEn ?? "";
  const kpiDateAr = formField.kpiNextSubmissionDateAr ?? "";
  const kpiNextSubmissionDate = loc(kpiDateEn, kpiDateAr);
  const hasNextSubmissionDate = kpiNextSubmissionDate !== null && kpiNextSubmissionDate !== "";

  /** The table is read-only either by its own flag or when a next-submission date is set */
  const isReadOnly = formField.isReadOnly || hasNextSubmissionDate;

  const { fields, append, remove } = useFieldArray({
    control: formMethods.control,
    /** fieldKey acts as the array name in the form state (e.g. "KPI_0050") */
    name: formField.fieldKey as never,
  });

  /**
   * Duplicate DROPDOWN combinations are blocked unless the backend
   * explicitly sets allowDuplicateRows to true on this TABLE field.
   */
  const allowDuplicateRows = formField.allowDuplicateRows === true;

  /**
   * Collect the lookupTypeIds for every DROPDOWN column in this table.
   * A single batch request fetches all of them so the first option of each
   * can be pre-selected when a new row is built.
   */
  const dropdownLookupIds = columns
    .filter((col): col is ColumnDef & { lookupType: LookupType } =>
      col.controlType.controlKey === "DROPDOWN" && col.lookupType !== null
    )
    .map((col) => col.lookupType.lookupTypeId);

  /** DROPDOWN columnKeys used as the uniqueness tuple for this table */
  const dropdownColumnKeys = getDropdownColumnKeys(columns);

  const { data: dropdownOptionsMap = {} } = useMultiDropdownOptions(dropdownLookupIds);

  /**
   * Options are considered ready when:
   * - the table has no dropdown columns (nothing to wait for), OR
   * - at least one lookup type's options have arrived in the map.
   */
  const optionsReady =
    dropdownLookupIds.length === 0 ||
    Object.keys(dropdownOptionsMap).length > 0;

  /**
   * Guard ref prevents React StrictMode's double-invocation from appending
   * two rows on first mount — ensures exactly one default row is seeded.
   */
  const hasSeeded = React.useRef(false);

  /**
   * Seed one default row once the dropdown options are available so that
   * every DROPDOWN cell already shows (and submits) the first option.
   */
  useEffect(() => {
    if (!hasSeeded.current && fields.length === 0 && optionsReady) {
      hasSeeded.current = true;
      append(buildDefaultRow(columns, dropdownOptionsMap));
    }
    // Re-run only when optionsReady flips; other deps are stable references
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsReady]);

  /** The scrolling card. TanStack Virtual reads its scroll position from this element. */
  const scrollRef = useRef<HTMLDivElement>(null);
  /** Set when a row is added so the viewport jumps to that row after it exists. */
  const scrollToRowRef = useRef<number | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: fields.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: ROW_OVERSCAN,
    /**
     * The scroll element does not exist on the first render, so the virtualizer
     * would otherwise report a height of 0 and paint an empty card. 460 matches
     * the container's max height, so the visible rows exist in that first paint.
     */
    initialRect: { width: 0, height: 460 },
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const lastVirtualRow = virtualRows[virtualRows.length - 1];
  const paddingBottom =
    virtualRows.length > 0 && lastVirtualRow !== undefined
      ? rowVirtualizer.getTotalSize() - lastVirtualRow.end
      : 0;
  /** Index column + data columns + the add/remove column */
  const bodyColumnCount = columns.length + 2;

  useEffect(() => {
    const nextIndex = scrollToRowRef.current;
    if (nextIndex === null) {
      return;
    }
    scrollToRowRef.current = null;
    rowVirtualizer.scrollToIndex(nextIndex, { align: "end" });
  }, [fields.length, rowVirtualizer]);

  const handleAddRow = () => {
    // The new row is appended at the end, which is often far below the window.
    scrollToRowRef.current = fields.length;
    const nextRow = buildDefaultRow(columns, dropdownOptionsMap);

    // When duplicates are allowed, keep the default first-option values.
    if (allowDuplicateRows) {
      append(nextRow);
      return;
    }

    // Otherwise pick a dropdown combination that is not already used.
    const existingRows = formMethods.getValues(formField.fieldKey);
    const unusedDropdowns = pickUnusedDropdownValues(
      columns,
      dropdownOptionsMap,
      existingRows
    );
    append({ ...nextRow, ...unusedDropdowns });
  };

  const headerCellSx = {
    fontWeight: 700,
    fontSize: "0.8125rem",
    color: "primary.main",
    backgroundColor: (theme: Theme) => headerBackground(theme.palette.mode),
    backgroundImage: "none",
    borderBottom: `2px solid ${alpha(BRAND_NAVY, 0.16)}`,
    py: 1.25,
    /** MUI sticky cells paint their own translucent layer; force a solid fill. */
    "&.MuiTableCell-stickyHeader": {
      backgroundColor: (theme: Theme) => headerBackground(theme.palette.mode),
      backgroundImage: "none",
    },
  };

  return (
    <Box>
      <TextFieldLabel field={formField} />

      <Paper
        elevation={0}
        sx={{
          mt: 1,
          borderRadius: "14px",
          overflow: "hidden",
          border: `1px solid ${alpha(BRAND_NAVY, 0.14)}`,
          boxShadow: `0 2px 8px ${alpha(BRAND_NAVY, 0.05)}`,
        }}
      >
        <TableContainer
          ref={scrollRef}
          sx={{
            maxWidth: "100%",
            /** Long row lists scroll inside the card instead of stretching the page */
            maxHeight: 460,
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
            "& .MuiTableCell-body > .MuiBox-root": { mb: 0 },
          }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...headerCellSx, width: 56, px: 1 }} />

                {columns.map((col) => (
                  <TableCell
                    key={col.columnKey}
                    align={isCompactValueControl(col.controlType.controlKey) ? "center" : "inherit"}
                    sx={{
                      ...headerCellSx,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {loc(col.labelEn, col.labelAr)}
                    {!isReadOnly && isTableColumnRequired(col) && (
                      <Box component="span" sx={{ color: "error.main", mx: 0.5 }}>
                        *
                      </Box>
                    )}
                  </TableCell>
                ))}

                <TableCell sx={{ ...headerCellSx, width: 52, px: 0.5, textAlign: "center" }}>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={handleAddRow}
                    disabled={isReadOnly}
                    aria-label={t("stepper.addRow")}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paddingTop > 0 && (
                <TableRow>
                  <TableCell colSpan={bodyColumnCount} sx={{ p: 0, border: 0, lineHeight: 0 }}>
                    <Box sx={{ height: paddingTop }} />
                  </TableCell>
                </TableRow>
              )}
              {virtualRows.map((virtualRow) => {
                const row = fields[virtualRow.index];
                const rowIndex = virtualRow.index;
                if (row === undefined) {
                  return null;
                }

                return (
                <TableRow
                  key={row.id}
                  data-index={rowIndex}
                  ref={rowVirtualizer.measureElement}
                  hover
                  sx={{
                    bgcolor: rowIndex % 2 === 1 ? alpha(BRAND_NAVY, 0.03) : "background.paper",
                    "&:hover": { bgcolor: alpha(BRAND_NAVY, 0.055) },
                  }}
                >
                  <TableCell sx={{ width: 56, px: 1, verticalAlign: "middle" }}>
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        mx: "auto",
                        borderRadius: "9px",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 12,
                        fontWeight: 800,
                        color: BRAND_NAVY,
                        bgcolor: alpha(BRAND_NAVY, 0.08),
                      }}
                    >
                      {formatRowIndex(rowIndex)}
                    </Box>
                  </TableCell>

                  {columns.map((col) => {
                  /** Full RHF nested path: e.g. "KPI_0050.0.FOOD_TYPE" */
                  const fieldName = `${formField.fieldKey}.${rowIndex}.${col.columnKey}`;
                  /** Required comes from the column's own isRequired flag, unless the table is locked */
                  const isRequired = !isReadOnly && isTableColumnRequired(col);

                  /** Wrap the column as a FormField so existing controls work as-is */
                  const cellField = columnToFormField(
                    col,
                    fieldName,
                    isReadOnly,
                    isRequired
                  );

                  const controlKey = getControlKey(cellField);
                  const Component = getControlType(controlKey);
                  const isCompact = isCompactValueControl(controlKey);

                  /**
                   * Live uniqueness for DROPDOWN cells only (no watch / no trigger).
                   * Skipped when the backend allows duplicate rows on this table.
                   */
                  const extraValidate = (value: unknown): true | string => {
                    if (allowDuplicateRows) {
                      return true;
                    }
                    const rows = formMethods.getValues(formField.fieldKey);
                    const isDuplicate = isDuplicateDropdownRow(
                      rows,
                      rowIndex,
                      dropdownColumnKeys,
                      { columnKey: col.columnKey, value }
                    );
                    return isDuplicate
                      ? t("validation.duplicateRow", {
                          field: loc(col.labelEn, col.labelAr),
                        })
                      : true;
                  };

                  return (
                    <TableCell
                      key={col.columnKey}
                      sx={{
                        verticalAlign: "middle",
                        py: 0.85,
                        ...(isCompact ? { minWidth: 140 } : {}),
                        "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                      }}
                    >
                      {col.controlType.controlKey === "DROPDOWN" ? (
                        <DropDown
                          formField={cellField}
                          formMethods={formMethods}
                          hideLabel={true}
                          hideHelperText={true}
                          size="small"
                          /** Skip uniqueness when the table is locked or duplicates are allowed */
                          extraValidate={
                            isReadOnly || allowDuplicateRows ? undefined : extraValidate
                          }
                        />
                      ) : Component ? (
                        <Component
                          formField={cellField}
                          formMethods={formMethods}
                          hideLabel={true}
                          hideHelperText={true}
                          size="small"
                          isGridField={true}
                        />
                      ) : (
                        <Typography variant="caption" color="error">
                          {`Unsupported: ${col.controlType.controlKey}`}
                        </Typography>
                      )}
                    </TableCell>
                  );
                })}

                <TableCell sx={{ verticalAlign: "middle", py: 0.85, width: 52, px: 0.5 }}>
                  {fields.length > 1 && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => remove(rowIndex)}
                      aria-label={t("stepper.removeRow", { n: rowIndex + 1 })}
                      disabled={isReadOnly}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
                );
              })}
              {paddingBottom > 0 && (
                <TableRow>
                  <TableCell colSpan={bodyColumnCount} sx={{ p: 0, border: 0, lineHeight: 0 }}>
                    <Box sx={{ height: paddingBottom }} />
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {!hideHelperText && hasNextSubmissionDate && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 0.5, display: "block", fontSize: "0.75rem" }}
        >
          {kpiNextSubmissionDate}
        </Typography>
      )}
      {!hideHelperText && !hasNextSubmissionDate && (formField.helpTextEn || formField.helpTextAr) && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 0.5, display: "block", fontSize: "0.75rem" }}
        >
          {loc(formField.helpTextEn, formField.helpTextAr)}
        </Typography>
      )}
    </Box>
  );
};

export default TableGrid;
