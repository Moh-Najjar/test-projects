import React, { useEffect, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import TextFieldLabel from "./InputFieldLabel";
import { FormField, GridCell } from "../../core/types/FormField";
import { ControlKeys } from "../../core/enums/control-keys.enum";
import { getControlKey, getControlType } from "../../core/utils/control.utils";
import { useLocale } from "../../core/hooks/useLocale";
import { useMultiDropdownOptions } from "../../core/hooks/useFormApi";
import { findJordanLookupValueId, isCountriesLookupType } from "../../core/utils/countryLookup";
import { isRawTableCellRequired } from "../../core/utils/tableRequired";
import { BRAND_NAVY } from "../../core/constants/theme";

interface RawTableProps {
  formField: FormField;
  formMethods: UseFormReturn<Record<string, unknown>>;
  hideHelperText?: boolean;
}

/** Minimal row entry derived from grid.cells (unique rowKeys ordered by row index) */
interface RenderRow {
  rowKey: string;
  rowLabelEn: string;
  rowLabelAr: string;
}

/**
 * Resolves the bilingual row label name for a LABEL cell.
 * Prefers `formField.rows[].labelEn/Ar` (the row's label name), then the
 * cell's `rowLabelEn/Ar`.
 */
const resolveLabelCellName = (
  cell: GridCell,
  parentField: FormField
): { labelEn: string; labelAr: string } => {
  const matchingRow = (parentField.rows ?? []).find(
    (row) => row.rowKey === cell.rowKey
  );

  const rowLabelEn = matchingRow?.labelEn ?? "";
  const rowLabelAr = matchingRow?.labelAr ?? "";
  const hasRowDefLabel =
    rowLabelEn.trim() !== "" || rowLabelAr.trim() !== "";

  return {
    labelEn: hasRowDefLabel ? rowLabelEn : cell.rowLabelEn,
    labelAr: hasRowDefLabel ? rowLabelAr : cell.rowLabelAr,
  };
};

/**
 * True when the parent RAW_TABLE field is locked, either by its own read-only
 * flag or because a KPI next-submission date is set. Every cell inherits this.
 */
const isParentFieldLocked = (parentField: FormField): boolean => {
  const kpiDateEn = parentField.kpiNextSubmissionDateEn ?? "";
  const kpiDateAr = parentField.kpiNextSubmissionDateAr ?? "";
  return parentField.isReadOnly || kpiDateEn !== "" || kpiDateAr !== "";
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build a synthetic FormField from a GridCell so existing control
// components (InputField, DropDown, etc.) can render each cell unchanged.
// RHF path: "<parentFieldKey>.<rowKey>.<columnKey>"
// ─────────────────────────────────────────────────────────────────────────────
const gridCellToFormField = (
  cell: GridCell,
  fieldName: string,
  parentField: FormField
): FormField => {
  const isLabelCell = cell.controlType.controlKey === ControlKeys.Label;
  const labelCellName = isLabelCell
    ? resolveLabelCellName(cell, parentField)
    : null;

  /** A locked parent makes every cell read-only and never required */
  const isLocked = isParentFieldLocked(parentField);

  /**
   * Number cells are narrow. A long placeholder is clipped mid-word, and the
   * column header already names the value, so those cells stay blank until typed.
   */
  const hidePlaceholder = isCompactValueControl(cell.controlType.controlKey);

  return {
    fieldId: 0,
    formId: 0,
    fieldKey: fieldName,
    // LABEL cells show the row's label name, not the column header (e.g. "DESCRIPTION")
    labelEn: labelCellName !== null ? labelCellName.labelEn : cell.columnLabelEn,
    labelAr: labelCellName !== null ? labelCellName.labelAr : cell.columnLabelAr,
    dataType: cell.dataType,
    controlType: cell.controlType,
    // Required comes from the row's isRequired flag, unless the parent is locked
    isRequired: !isLocked && isRawTableCellRequired(cell, parentField),
    displayOrder: cell.column,
    isReadOnly: isLocked || cell.isReadOnly,
    isVisible: cell.isVisible,
    lookupType: cell.lookupType,
    placeholderEn: hidePlaceholder ? "" : cell.placeholderEn,
    placeholderAr: hidePlaceholder ? "" : cell.placeholderAr,
    helpTextEn: cell.helpTextEn ?? "",
    helpTextAr: cell.helpTextAr ?? "",
    columns: null,
    rows: null,
    grid: null,
    rowLabelEn: cell.rowLabelEn,
    rowLabelAr: cell.rowLabelAr,
    regexPattern: parentField.regexPattern,
    validationMessageEn: cell.validationMessageEn,
    validationMessageAr: cell.validationMessageAr,
    // Inherit next-submission date from the parent RAW_TABLE field so cell
    // controls apply the same read-only + helper-text behaviour as InputField.
    kpiNextSubmissionDateEn: parentField.kpiNextSubmissionDateEn,
    kpiNextSubmissionDateAr: parentField.kpiNextSubmissionDateAr,
    calculation: null,
  };
};

/** Number and percentage cells stay narrow and centered. */
const isCompactValueControl = (controlKey: string): boolean =>
  controlKey === ControlKeys.Number || controlKey === ControlKeys.Percentage;

/** Zero-padded row index shown beside each row. */
const formatRowIndex = (index: number): string =>
  String(index + 1).padStart(2, "0");

/** Opaque header fill. Alpha tints show body rows through a sticky header. */
const headerBackground = (mode: string): string =>
  mode === "dark" ? "#16324A" : "#F3F8FC";

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders a fixed-row table for fields with controlKey "RAW_TABLE".
 *
 * Data sources:
 *  • formField.columns[]  — column headers (label, columnKey)
 *  • formField.grid.cells — row structure and per-cell control properties
 *                           (controlType, dataType, lookupType, validation…)
 *
 * Row-label column:
 *  Shown only when formField.rowLabelEn or formField.rowLabelAr is non-empty.
 *  That value is used as the column header (e.g. "Record Type").
 *
 * RHF path per cell: "<fieldKey>.<rowKey>.<columnKey>"
 * Submit shape:      { [rowKey]: { [columnKey]: value } }  → rawTableValues
 */
const RawTable: React.FC<RawTableProps> = ({
  formField,
  formMethods,
  hideHelperText = false,
}) => {
  const { loc } = useLocale();
  const { setValue, getValues } = formMethods;

  /** True when a next-submission date is provided for this RAW_TABLE KPI field */
  const kpiDateEn = formField.kpiNextSubmissionDateEn ?? "";
  const kpiDateAr = formField.kpiNextSubmissionDateAr ?? "";
  const kpiNextSubmissionDate = loc(kpiDateEn, kpiDateAr);
  const hasNextSubmissionDate =
    kpiNextSubmissionDate !== null && kpiNextSubmissionDate !== "";

  /** The table is read-only either by its own flag or when a next-submission date is set */
  const isTableReadOnly = isParentFieldLocked(formField);

  /** Column definitions are taken directly from formField.columns */
  const columns = formField.columns ?? [];

  /**
   * Row-label column is shown only when the field provides a non-empty header label.
   * Coalescing to "" guards against both null and undefined (the API may omit the
   * key entirely when it has no value, producing undefined at runtime).
   */
  const hasRowLabelColumn =
    (formField.rowLabelEn ?? "") !== "" ||
    (formField.rowLabelAr ?? "") !== "";

  const grid = formField.grid;

  // ── Unique ordered rows derived from grid.cells ───────────────────────────
  const renderRows = useMemo((): RenderRow[] => {
    if (grid === null) return [];
    const seen = new Set<string>();
    return [...grid.cells]
      .sort((a, b) => a.row - b.row)
      .reduce<RenderRow[]>((acc, cell) => {
        if (!seen.has(cell.rowKey)) {
          seen.add(cell.rowKey);
          acc.push({
            rowKey: cell.rowKey,
            rowLabelEn: cell.rowLabelEn,
            rowLabelAr: cell.rowLabelAr,
          });
        }
        return acc;
      }, []);
  }, [grid]);

  /** Fast cell lookup: "rowKey.columnKey" → GridCell */
  const cellMap = useMemo((): Map<string, GridCell> => {
    if (grid === null) return new Map();
    return grid.cells.reduce<Map<string, GridCell>>((map, cell) => {
      map.set(`${cell.rowKey}.${cell.columnKey}`, cell);
      return map;
    }, new Map());
  }, [grid]);

  // ── DROPDOWN pre-seeding ──────────────────────────────────────────────────
  /** Collect unique lookupTypeIds for every DROPDOWN cell in the grid */
  const dropdownLookupIds = useMemo((): number[] => {
    if (grid === null) return [];
    const ids = new Set<number>();
    for (const cell of grid.cells) {
      if (
        cell.controlType.controlKey === "DROPDOWN" &&
        cell.lookupType !== null
      ) {
        ids.add(cell.lookupType.lookupTypeId);
      }
    }
    return [...ids];
  }, [grid]);

  const { data: dropdownOptionsMap = {} } = useMultiDropdownOptions(
    dropdownLookupIds
  );

  const optionsReady =
    dropdownLookupIds.length === 0 ||
    Object.keys(dropdownOptionsMap).length > 0;

  /** Guard prevents double-seeding under React StrictMode */
  const hasSeeded = React.useRef(false);

  /**
   * Once options arrive, set a default value for every DROPDOWN cell the user
   * has not yet touched: Jordan for COUNTRIES lookups, otherwise the first option.
   */
  useEffect(() => {
    if (!optionsReady || hasSeeded.current || grid === null) return;
    hasSeeded.current = true;

    for (const cell of grid.cells) {
      if (
        cell.controlType.controlKey !== "DROPDOWN" ||
        cell.lookupType === null ||
        isTableReadOnly ||
        cell.isReadOnly ||
        !cell.isVisible
      ) {
        continue;
      }
      const path = `${formField.fieldKey}.${cell.rowKey}.${cell.columnKey}`;
      const current = getValues(path as never);
      if (current === undefined || current === "") {
        const options =
          dropdownOptionsMap[String(cell.lookupType.lookupTypeId)] ?? [];
        if (isCountriesLookupType(cell.lookupType)) {
          const jordanId = findJordanLookupValueId(options);
          if (jordanId !== undefined) {
            setValue(path as never, jordanId as never);
          }
        } else if (options.length > 0) {
          setValue(path as never, String(options[0].lookupValueId) as never);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsReady]);

  // ── Cell FormField resolver ───────────────────────────────────────────────
  /**
   * Returns a synthetic FormField for the (rowKey, columnKey) intersection,
   * or null when the cell is absent or invisible.
   */
  const getCellFormField = (
    rowKey: string,
    colKey: string,
  ): FormField | null => {
    const cell = cellMap.get(`${rowKey}.${colKey}`);
    if (cell === undefined || !cell.isVisible) return null;
    const fieldName = `${formField.fieldKey}.${rowKey}.${colKey}`;
    return gridCellToFormField(cell, fieldName, formField);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
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
          sx={{
            maxWidth: "100%",
            /** Long row lists scroll inside the card instead of stretching the page */
            maxHeight: 460,
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
            /** Grid controls keep a form margin; drop it so rows sit closer together. */
            "& .MuiTableCell-body > .MuiBox-root": { mb: 0 },
          }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...headerCellSx, width: 56, px: 1 }} />

                {hasRowLabelColumn && (
                  <TableCell sx={{ ...headerCellSx, minWidth: 220 }}>
                    {loc(formField.rowLabelEn ?? "", formField.rowLabelAr ?? "")}
                  </TableCell>
                )}

                {columns.map((col) => (
                  <TableCell
                    key={col.columnKey}
                    align={isCompactValueControl(col.controlType.controlKey) ? "center" : "inherit"}
                    sx={{
                      ...headerCellSx,
                      whiteSpace: "nowrap",
                      ...(isCompactValueControl(col.controlType.controlKey)
                        ? { width: 160 }
                        : {}),
                    }}
                  >
                    {loc(col.labelEn, col.labelAr)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {renderRows.map((row, rowIndex) => (
                <TableRow
                  key={row.rowKey}
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

                  {hasRowLabelColumn && (
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        verticalAlign: "middle",
                        lineHeight: 1.5,
                        minWidth: 220,
                      }}
                    >
                      {loc(row.rowLabelEn, row.rowLabelAr)}
                      {!isTableReadOnly && (formField.rows ?? []).some(
                        (rowDef) =>
                          rowDef.rowKey === row.rowKey && rowDef.isRequired
                      ) && (
                        <Box component="span" sx={{ color: "error.main", mx: 0.5 }}>
                          *
                        </Box>
                      )}
                    </TableCell>
                  )}

                  {columns.map((col) => {
                    const cellField = getCellFormField(row.rowKey, col.columnKey);

                    if (cellField === null) {
                      return <TableCell key={col.columnKey} />;
                    }

                    const controlKey = getControlKey(cellField);
                    const Component = getControlType(controlKey);
                    const isLabel = controlKey === ControlKeys.Label;
                    const isCompact = isCompactValueControl(controlKey);

                    return (
                      <TableCell
                        key={col.columnKey}
                        sx={{
                          verticalAlign: "middle",
                          py: isLabel ? 1.25 : 0.85,
                          ...(isLabel
                            ? { fontWeight: 600, lineHeight: 1.55, minWidth: 220 }
                            : {}),
                          ...(isCompact
                            ? {
                                width: 160,
                                "& .MuiTextField-root": { maxWidth: 132, mx: "auto" },
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "10px",
                                  bgcolor: alpha(BRAND_NAVY, 0.03),
                                },
                                "& .MuiOutlinedInput-input": {
                                  textAlign: "center",
                                  fontWeight: 700,
                                },
                              }
                            : {
                                "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                              }),
                        }}
                      >
                        {Component !== undefined ? (
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
                            {`Unsupported: ${cellField.controlType.controlKey}`}
                          </Typography>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Next-submission date helper — shown once below the table */}
      {!hideHelperText && hasNextSubmissionDate && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 0.5, display: "block", fontSize: "0.75rem" }}
        >
          {kpiNextSubmissionDate}
        </Typography>
      )}

      {/* Regular field-level help text when no next-submission date is set */}
      {!hideHelperText &&
        !hasNextSubmissionDate &&
        (formField.helpTextEn !== "" || formField.helpTextAr !== "") && (
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

export default RawTable;
