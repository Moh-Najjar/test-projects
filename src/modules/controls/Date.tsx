import React from "react";
import { UseFormReturn, Controller } from "react-hook-form";
import { Box, TextField } from "@mui/material";
import TextFieldLabel from "./InputFieldLabel";
import { getValidationRules, getLocalizedErrorMessage } from "../../core/utils/validationUtils";
import { FormField } from "../../core/types/FormField";
import { useLocale } from "../../core/hooks/useLocale";

interface DatePickerProps {
  formField: FormField;
  formMethods: UseFormReturn<Record<string, unknown>>;
  hideLabel?: boolean;
  hideHelperText?: boolean;
  size?: "small" | "medium";
}

/** Renders a date input control for fields with controlKey "DATEPICKER" */
const DatePickerInput: React.FC<DatePickerProps> = ({
  formField,
  formMethods,
  hideLabel = false,
  hideHelperText = false,
  size = "medium",
}) => {
  const { control } = formMethods;
  const { loc, t } = useLocale();

  /** True when a next-submission date is provided for this KPI field */
  const kpiDateEn = formField.kpiNextSubmissionDateEn ?? "";
  const kpiDateAr = formField.kpiNextSubmissionDateAr ?? "";
  const kpiNextSubmissionDate = loc(kpiDateEn, kpiDateAr);
  const hasNextSubmissionDate = kpiNextSubmissionDate !== null && kpiNextSubmissionDate !== "";

  /** The field is read-only either by its own flag or when a next-submission date is set */
  const isReadOnly = formField.isReadOnly || hasNextSubmissionDate;

  return (
    <Controller
      name={formField.fieldKey}
      control={control}
      defaultValue=""
      rules={getValidationRules(formField, loc, t)}
      render={({ field, fieldState }) => {
        /**
         * Resolve helper text: validation error takes priority, then next-submission date, then regular help text.
         * Use getLocalizedErrorMessage so the message always reflects the current language,
         * even when fieldState.error.message still holds the previous-language string.
         */
        const helperText: string | undefined = fieldState.error
          ? getLocalizedErrorMessage(fieldState.error, formField, loc, t)
          : hasNextSubmissionDate
            ? (kpiNextSubmissionDate ?? undefined)
            : hideHelperText
              ? undefined
              : loc(formField.helpTextEn, formField.helpTextAr) ?? undefined;

        return (
          <Box sx={{ mb: 2.5 }}>
            {!hideLabel && <TextFieldLabel field={formField} />}
            <TextField
              {...field}
              id={formField.fieldKey}
              type="date"
              size={size}
              fullWidth
              error={!!fieldState.error}
              helperText={helperText}
              InputProps={{ readOnly: isReadOnly }}
              onChange={(e) => field.onChange(e.target.value)}
              sx={{
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
                minWidth: hideLabel ? "unset" : "200px",
              }}
            />
          </Box>
        );
      }}
    />
  );
};

export default DatePickerInput;
