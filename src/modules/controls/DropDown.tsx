import React, { useCallback, useEffect, useMemo, useState } from "react";
import { UseFormReturn, Controller } from "react-hook-form";
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  FormHelperText,
  ListSubheader,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import TextFieldLabel from "./InputFieldLabel";
import { FormField } from "../../core/types/FormField";
import { useLocale } from "../../core/hooks/useLocale";
import { useDropdownOptions } from "../../core/hooks/useFormApi";
import { getValidationRules, getLocalizedErrorMessage } from "../../core/utils/validationUtils";
import { findJordanLookupValueId, isCountriesLookupType } from "../../core/utils/countryLookup";
import { DropdownListValueItem } from "../../core/types/getDropdownListValuesResponse";

interface DropDownProps {
  formField: FormField;
  formMethods: UseFormReturn<Record<string, unknown>>;
  hideLabel?: boolean;
  hideHelperText?: boolean;
  size?: "small" | "medium";
  /** TABLE grids only: reject this cell when the row's dropdown combo already exists */
  extraValidate?: (value: unknown) => true | string;
}

/**
 * True when this option's English name, Arabic name, or code contains the query.
 * Both languages are checked so search still works after a locale switch.
 */
const optionMatchesSearch = (item: DropdownListValueItem, query: string): boolean => {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) {
    return true;
  }
  return (
    item.nameEn.toLowerCase().includes(needle) ||
    item.nameAr.toLowerCase().includes(needle) ||
    item.code.toLowerCase().includes(needle)
  );
};

/** Renders a searchable dropdown select for fields with controlKey "DROPDOWN" */
const DropDown: React.FC<DropDownProps> = ({
  formField,
  formMethods,
  hideLabel = false,
  hideHelperText = false,
  size = "medium",
  extraValidate,
}) => {
  const { control } = formMethods;
  const { loc, t } = useLocale();
  const [searchTerm, setSearchTerm] = useState<string>("");

  /**
   * Prefer the API placeholder; when it is empty, fall back to the field
   * label so standalone lists match TABLE cells (which use the column label).
   */
  const placeholder =
    loc(formField.placeholderEn, formField.placeholderAr) ||
    loc(formField.labelEn, formField.labelAr);
  const helpText = loc(formField.helpTextEn, formField.helpTextAr);

  /** True when a next-submission date is provided for this KPI field */
  const kpiDateEn = formField.kpiNextSubmissionDateEn ?? "";
  const kpiDateAr = formField.kpiNextSubmissionDateAr ?? "";
  const kpiNextSubmissionDate = loc(kpiDateEn, kpiDateAr);
  const hasNextSubmissionDate = kpiNextSubmissionDate !== null && kpiNextSubmissionDate !== "";

  /** The field is read-only either by its own flag or when a next-submission date is set */
  const isReadOnly = formField.isReadOnly || hasNextSubmissionDate;

  const lookupTypeId = formField.lookupType?.lookupTypeId;

  /**
   * useQuery fetches once and caches by lookupTypeId.
   * Every DropDown that shares the same lookupTypeId reads from cache
   * without a network round-trip, so adding new table rows never
   * triggers redundant API calls.
   */
  const { data: dropdownListValues } = useDropdownOptions(lookupTypeId);

  /** Options for this field, keyed by the lookupTypeId from the API response */
  const options = useMemo(
    (): DropdownListValueItem[] =>
      lookupTypeId !== undefined ? (dropdownListValues?.[String(lookupTypeId)] ?? []) : [],
    [dropdownListValues, lookupTypeId]
  );

  /** Options visible after applying the in-menu search filter */
  const filteredOptions = useMemo(
    (): DropdownListValueItem[] => options.filter((item) => optionMatchesSearch(item, searchTerm)),
    [options, searchTerm]
  );

  /**
   * Default lookupValueId when the field is still empty:
   * - COUNTRIES → Jordan (same rule as TABLE / RAW_TABLE)
   * - Standalone lists → first option, matching TABLE grid cells
   * - Grid cells (`hideLabel`) → undefined; TableGrid / RawTable already seed values
   */
  const firstOption = options[0];
  const defaultLookupValueId = isCountriesLookupType(formField.lookupType)
    ? findJordanLookupValueId(options)
    : hideLabel || firstOption === undefined
      ? undefined
      : String(firstOption.lookupValueId);

  /**
   * Once options load, pre-select the default when the field is still empty.
   * Existing submission values are never overwritten.
   */
  useEffect(() => {
    if (defaultLookupValueId === undefined || isReadOnly) {
      return;
    }

    const current = formMethods.getValues(formField.fieldKey);
    if (current !== undefined && current !== null && String(current) !== "") {
      return;
    }

    formMethods.setValue(formField.fieldKey, defaultLookupValueId, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [defaultLookupValueId, formField.fieldKey, formMethods, isReadOnly]);

  /** Clear the filter whenever the menu opens so the full list is shown first */
  const handleMenuOpen = useCallback(() => {
    setSearchTerm("");
  }, []);

  /** Clear the filter when the menu closes so the next open starts fresh */
  const handleMenuClose = useCallback(() => {
    setSearchTerm("");
  }, []);

  /**
   * Keep typing inside the search field. Escape still bubbles so MUI can close the menu.
   */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSearchTerm(e.target.value);
  }, []);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Escape") {
      e.stopPropagation();
    }
  }, []);

  return (
    <Controller
      name={formField.fieldKey}
      control={control}
      defaultValue=""
      rules={{
        ...getValidationRules(formField, loc, t),
        ...(extraValidate !== undefined ? { validate: { duplicate: extraValidate } } : {}),
      }}
      render={({ field, fieldState }) => {
        /**
         * Issue: TABLE / submission APIs often return the country label (or code)
         * while MenuItem values are always lookupValueId — MUI Select stays blank
         * when those do not match.
         * Solution: resolve the stored value (id | code | nameEn | nameAr) to the
         * matching option's lookupValueId before binding it to Select.
         */
        const raw = field.value == null ? "" : String(field.value);

        const matched = options.find(
          (o) =>
            String(o.lookupValueId) === raw || o.code === raw || o.nameEn === raw || o.nameAr === raw
        );
        const selectValue = matched !== undefined ? String(matched.lookupValueId) : raw;

        /** Keep a hidden item for the current value so MUI does not warn when it is filtered out */
        const selectedIsHidden =
          selectValue !== "" &&
          !filteredOptions.some((item) => String(item.lookupValueId) === selectValue);

        return (
          <Box sx={{ mb: 2.5 }}>
            {!hideLabel && <TextFieldLabel field={formField} />}
            <FormControl
              fullWidth
              size={size}
              error={!!fieldState.error}
              sx={{
                minWidth: hideLabel ? "unset" : "200px",
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  backgroundColor: "background.paper",
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "primary.light",
                  },
                  ...(isReadOnly && {
                    backgroundColor: "action.hover",
                  }),
                },
                "& .MuiFormHelperText-root": {
                  mx: 0,
                  mt: 0.75,
                  fontSize: "0.75rem",
                },
              }}
            >
              <Select
                {...field}
                value={selectValue}
                id={formField.fieldKey}
                displayEmpty
                inputProps={{ readOnly: isReadOnly }}
                onChange={(e) => field.onChange(e.target.value)}
                onOpen={handleMenuOpen}
                onClose={handleMenuClose}
                MenuProps={{
                  autoFocus: false,
                  PaperProps: {
                    sx: {
                      maxHeight: "min(360px, 70vh)",
                      minWidth: hideLabel ? 220 : "min(260px, calc(100vw - 24px))",
                      maxWidth: "calc(100vw - 24px)",
                      borderRadius: 2,
                      boxShadow: 4,
                    },
                  },
                }}
              >
                {/* Sticky search field — skipped when the control is locked */}
                {!isReadOnly && (
                  <ListSubheader
                    sx={{
                      px: 1.5,
                      pt: 1.5,
                      pb: 1,
                      lineHeight: "normal",
                      bgcolor: "background.paper",
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                    }}
                  >
                    <TextField
                      autoFocus
                      fullWidth
                      size="small"
                      placeholder={t("controls.search")}
                      value={searchTerm}
                      onChange={handleSearchChange}
                      onClickCapture={(e) => e.stopPropagation()}
                      onKeyDown={handleSearchKeyDown}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: 1.5 },
                      }}
                    />
                  </ListSubheader>
                )}

                {/* Placeholder — hidden while a search is active so it does not clutter results */}
                {searchTerm.trim().length === 0 && (
                  <MenuItem value="" disabled>
                    <em>{placeholder || t("controls.selectValue")}</em>
                  </MenuItem>
                )}

                {filteredOptions.map((item) => (
                  <MenuItem key={item.lookupValueId} value={String(item.lookupValueId)}>
                    {loc(item.nameEn, item.nameAr)}
                  </MenuItem>
                ))}

                {filteredOptions.length === 0 && searchTerm.trim().length > 0 && (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      {t("controls.noMatches")}
                    </Typography>
                  </MenuItem>
                )}

                {selectedIsHidden && <MenuItem value={selectValue} sx={{ display: "none" }} />}
              </Select>
              {fieldState.error && (
                <FormHelperText>
                  {getLocalizedErrorMessage(fieldState.error, formField, loc, t)}
                </FormHelperText>
              )}
              {!fieldState.error && hasNextSubmissionDate && (
                <FormHelperText>{kpiNextSubmissionDate}</FormHelperText>
              )}
              {!fieldState.error && !hasNextSubmissionDate && helpText && !hideLabel && !hideHelperText && (
                <FormHelperText>{helpText}</FormHelperText>
              )}
            </FormControl>
          </Box>
        );
      }}
    />
  );
};

export default DropDown;
