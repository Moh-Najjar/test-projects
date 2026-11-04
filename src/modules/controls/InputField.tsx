import { getValidationRules, getLocalizedErrorMessage } from "../../core/utils/validationUtils";
import { UseFormReturn, Controller } from "react-hook-form";
import TextField from "@mui/material/TextField";
import TextFieldLabel from "./InputFieldLabel";
import { FormField } from "../../core/types/FormField";
import { useLocale } from "../../core/hooks/useLocale";
import { Box } from "@mui/material";
import React from "react";
import { ControlKeys } from "../../core/enums/control-keys.enum";

interface InputFieldProps {
  formField: FormField;
  formMethods: UseFormReturn<Record<string, unknown>>;
  hideLabel?: boolean;
  hideHelperText?: boolean;
  size?: "small" | "medium";
  isGridField?: boolean;
}

/** Renders a numeric input control for fields with controlKey "NUMBER" */
const InputField: React.FC<InputFieldProps> = ({
  formField,
  formMethods,
  hideLabel = false,
  hideHelperText = false,
  size = "medium",
  isGridField = false,
}) => {
  const { control } = formMethods;
  const { loc, t } = useLocale();

  const { controlKey } = formField.controlType;
  const typeName = controlKey === ControlKeys.Number ? 'number' : 'text';

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
      rules={getValidationRules(formField, loc, t, isGridField)}
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
              type={typeName}
              size={size}
              error={!!fieldState.error}
              helperText={helperText}
              variant="outlined"
              fullWidth
              placeholder={loc(
                formField.placeholderEn,
                formField.placeholderAr
              )}
              InputProps={{ readOnly: isReadOnly }}
              inputProps={{
                ...(controlKey === ControlKeys.Number && { min: 0 }),
              }}
              onKeyDown={(e) => {
                /** Prevent the minus sign from being entered in the number input */
                if (controlKey === ControlKeys.Number && (e.key === '-' || e.key === 'Minus')) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                /** Remove the minus sign from the number input value */
                const value = controlKey === ControlKeys.Number ? e.target.value.replace(/-/g, '') : e.target.value;
                field.onChange(value);
              }}
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
                /** Grid cells hide the label, so keep the same floor as standalone fields. */
                minWidth: isGridField || !hideLabel ? "150px" : "unset",
              }}
            />
          </Box>
        );
      }}
    />
  );
};

export default InputField;
