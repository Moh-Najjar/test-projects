import React, { useState, useCallback, useMemo } from "react";
import { UseFormReturn, Controller } from "react-hook-form";
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  FormHelperText,
  OutlinedInput,
  Checkbox,
  ListItemText,
  ListSubheader,
  InputAdornment,
  TextField,
  Typography,
  Chip,
  SelectChangeEvent,
} from "@mui/material";
import { Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";
import TextFieldLabel from "./InputFieldLabel";
import { FormField } from "../../core/types/FormField";
import { useLocale } from "../../core/hooks/useLocale";
import { useDropdownOptions } from "../../core/hooks/useFormApi";
import {
  getValidationRules,
  getLocalizedErrorMessage,
} from "../../core/utils/validationUtils";

/** Sentinel value used as the "Select All" menu item's value */
const SELECT_ALL = "__select_all__";

interface MultiSelectProps {
  formField: FormField;
  formMethods: UseFormReturn<Record<string, unknown>>;
  hideLabel?: boolean;
  hideHelperText?: boolean;
  size?: "small" | "medium";
}

/** Renders a searchable multi-select control for fields with controlKey "MULTISELECT" */
const MultiSelect: React.FC<MultiSelectProps> = ({
  formField,
  formMethods,
  hideLabel = false,
  hideHelperText = false,
  size = "medium",
}) => {
  const { control } = formMethods;
  const { loc, t } = useLocale();

  const [searchTerm, setSearchTerm] = useState<string>("");

  const placeholder = loc(formField.placeholderEn, formField.placeholderAr);
  const helpText = loc(formField.helpTextEn, formField.helpTextAr);

  /** KPI next-submission date, if present */
  const kpiDateEn = formField.kpiNextSubmissionDateEn ?? "";
  const kpiDateAr = formField.kpiNextSubmissionDateAr ?? "";
  const kpiNextSubmissionDate = loc(kpiDateEn, kpiDateAr);
  const hasNextSubmissionDate =
    kpiNextSubmissionDate !== null && kpiNextSubmissionDate !== "";

  /** The field is read-only either by its own flag or when a next-submission date is set */
  const isReadOnly = formField.isReadOnly || hasNextSubmissionDate;

  const lookupTypeId = formField.lookupType?.lookupTypeId;

  /**
   * useQuery fetches once and caches by lookupTypeId.
   * Every MultiSelect sharing the same lookupTypeId reads from cache
   * without a network round-trip.
   */
  const { data: dropdownListValues } = useDropdownOptions(lookupTypeId);

  /** Full option list for this field */
  const options = useMemo(
    () =>
      lookupTypeId !== undefined
        ? (dropdownListValues?.[String(lookupTypeId)] ?? [])
        : [],
    [dropdownListValues, lookupTypeId]
  );

  /** Options visible after applying the search filter */
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const lower = searchTerm.toLowerCase();
    return options.filter((item) =>
      loc(item.nameEn, item.nameAr).toLowerCase().includes(lower)
    );
  }, [options, searchTerm, loc]);

  /** String IDs of the currently visible (filtered) options */
  const filteredIds = useMemo(
    () => filteredOptions.map((item) => String(item.lookupValueId)),
    [filteredOptions]
  );

  /** Quick id→label map so renderValue can show human-readable names */
  const labelById = useMemo(
    () =>
      options.reduce<Record<string, string>>((acc, item) => {
        acc[String(item.lookupValueId)] = loc(item.nameEn, item.nameAr);
        return acc;
      }, {}),
    [options, loc]
  );

  /** Reset search text when the dropdown opens */
  const handleMenuOpen = useCallback(() => {
    setSearchTerm("");
  }, []);

  /** Update search term while preventing the Select from intercepting key events */
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      setSearchTerm(e.target.value);
    },
    []
  );

  /**
   * Render the selected items as dismissible chips inside the trigger.
   * Falls back to a placeholder when nothing is selected.
   * The chip's onDelete calls field.onChange via a setter forwarded from the render prop.
   */
  const buildRenderValue = useCallback(
    (
      selectedValues: string[],
      onRemove: (id: string) => void
    ) =>
      (selected: string[]) => {
        if (selected.length === 0) {
          return (
            <Typography
              color="text.secondary"
              variant="body2"
              sx={{ fontStyle: "italic" }}
            >
              {placeholder ?? t("common.selectOptions", "Select options")}
            </Typography>
          );
        }

        return (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {selected.map((id) => (
              <Chip
                key={id}
                label={labelById[id] ?? id}
                size="small"
                deleteIcon={
                  <CloseIcon
                    fontSize="small"
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                }
                onDelete={
                  isReadOnly ? undefined : () => onRemove(id)
                }
                sx={{
                  borderRadius: "6px",
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  fontWeight: 500,
                  "& .MuiChip-deleteIcon": {
                    color: "primary.contrastText",
                    opacity: 0.7,
                    "&:hover": { opacity: 1 },
                  },
                }}
              />
            ))}
          </Box>
        );
      },
    [placeholder, t, labelById, isReadOnly]
  );

  return (
    <Controller
      name={formField.fieldKey}
      control={control}
      defaultValue={[]}
      rules={
        {
          ...getValidationRules(formField, loc, t),
          validate: (value) => {
            const val = value as string[];

            if ((!val || val.length !== 10) && !isReadOnly) {
              return t("validation.minSelection", { min: 10 });
            }
            return true;
          }
        }
      }
      render={({ field, fieldState }) => {
        const selectedValues: string[] = Array.isArray(field.value)
          ? (field.value as string[])
          : [];

        /** True when every visible (filtered) option is already selected */
        const hasCheckedAll =
          filteredIds.length > 0 &&
          filteredIds.every((id) => selectedValues.includes(id));

        /** Remove a single chip from the selection */
        const handleRemoveChip = (id: string) => {
          field.onChange(selectedValues.filter((v) => v !== id));
        };

        /** Handle both regular selection and the "Select All" sentinel */
        const handleChange = (event: SelectChangeEvent<string[]>) => {
          const newValue = event.target.value as string[];

          if (newValue.includes(SELECT_ALL)) {
            // Toggle: clear all visible selections or select them all
            field.onChange(hasCheckedAll ? [] : filteredIds);
          } else {
            field.onChange(newValue);
          }
        };

        return (
          <Box>
            {!hideLabel && <TextFieldLabel field={formField} />}

            <FormControl
              fullWidth
              size={size}
              error={!!fieldState.error}
              sx={{
                minWidth: hideLabel ? "unset" : "200px",
              }}
            >
              <Select
                {...field}
                id={formField.fieldKey}
                multiple
                displayEmpty
                inputProps={{ readOnly: isReadOnly }}
                input={<OutlinedInput />}
                value={selectedValues}
                onChange={handleChange}
                onOpen={handleMenuOpen}
                onClose={() => setSearchTerm("")}
                renderValue={buildRenderValue(selectedValues, handleRemoveChip)}
                sx={{
                  ...(isReadOnly && { backgroundColor: "action.hover" }),
                }}
                MenuProps={{
                  autoFocus: false,
                  PaperProps: {
                    sx: {
                      maxHeight: "min(420px, 70vh)",
                      minWidth: "min(260px, calc(100vw - 24px))",
                      maxWidth: "calc(100vw - 24px)",
                      borderRadius: 2,
                      boxShadow: 4,
                    },
                  },
                }}
              >
                {/* ── Sticky search header ── */}
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
                    placeholder={t("common.search", "Search…")}
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onClickCapture={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
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

                {/* ── Select All toggle ── */}
                {filteredIds.length > 0 && (
                  <MenuItem
                    value={SELECT_ALL}
                    dense
                    sx={{
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      mb: 0.5,
                    }}
                  >
                    <Checkbox
                      checked={hasCheckedAll}
                      indeterminate={
                        !hasCheckedAll &&
                        filteredIds.some((id) => selectedValues.includes(id))
                      }
                      size="small"
                      sx={{ py: 0.5 }}
                    />
                    <ListItemText
                      primary={t("common.selectAll", "Select all")}
                      primaryTypographyProps={{
                        variant: "body2",
                        fontWeight: 600,
                      }}
                    />
                  </MenuItem>
                )}

                {/* ── Option list ── */}
                {filteredOptions.map((item) => {
                  const id = String(item.lookupValueId);
                  return (
                    <MenuItem key={id} value={id} dense sx={{ px: 1.5 }}>
                      <Checkbox
                        checked={selectedValues.includes(id)}
                        size="small"
                        sx={{ py: 0.5 }}
                      />
                      <ListItemText
                        primary={labelById[id] ?? id}
                        primaryTypographyProps={{ variant: "body2" }}
                      />
                    </MenuItem>
                  );
                })}

                {/* ── Empty state ── */}
                {filteredOptions.length === 0 && (
                  <Box sx={{ textAlign: "center", py: 4, px: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t("common.noMatches", "No results found")}
                    </Typography>
                  </Box>
                )}
              </Select>

              {/* ── Helper / error text ── */}
              {fieldState.error && (
                <FormHelperText>
                  {getLocalizedErrorMessage(fieldState.error, formField, loc, t)}
                </FormHelperText>
              )}
              {!fieldState.error && hasNextSubmissionDate && (
                <FormHelperText>{kpiNextSubmissionDate}</FormHelperText>
              )}
              {!fieldState.error &&
                !hasNextSubmissionDate &&
                helpText &&
                !hideLabel &&
                !hideHelperText && (
                  <FormHelperText>{helpText}</FormHelperText>
                )}
            </FormControl>
          </Box>
        );
      }}
    />
  );
};

export default MultiSelect;
