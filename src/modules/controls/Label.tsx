import React from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { Box, Typography } from "@mui/material";
import TextFieldLabel from "./InputFieldLabel";
import { FormField } from "../../core/types/FormField";
import { useLocale } from "../../core/hooks/useLocale";

interface LabelProps {
  formField: FormField;
  formMethods: UseFormReturn<Record<string, unknown>>;
  hideLabel?: boolean;
  hideHelperText?: boolean;
  size?: "small" | "medium";
  isGridField?: boolean;
}

/**
 * Returns the first bilingual string that has visible (non-whitespace) text.
 * Empty strings are skipped so a missing primary source can fall back cleanly.
 */
const firstNonEmpty = (...values: string[]): string => {
  for (const value of values) {
    if (value.trim() !== "") {
      return value;
    }
  }
  return "";
};

/**
 * Renders a read-only label control.
 *
 * Displays static, non-editable text in place of an input field.
 * Grid cells (RAW_TABLE) show the row's label name (`labelEn`/`labelAr`).
 * Standalone LABEL fields still prefer placeholder text, which the admin UI
 * stores as the visible display string.
 *
 * A hidden <input> registered with React Hook Form ensures the text value
 * is included in the form submission payload at the field's RHF path.
 */
const Label: React.FC<LabelProps> = ({
  formField,
  formMethods,
  hideLabel = false,
  hideHelperText = false,
  size = "medium",
  isGridField = false,
}) => {
  const { control } = formMethods;
  const { loc } = useLocale();

  const labelText = loc(formField.labelEn ?? "", formField.labelAr ?? "");
  const placeholderText = loc(
    formField.placeholderEn ?? "",
    formField.placeholderAr ?? ""
  );

  /**
   * Grid (RAW_TABLE) LABEL cells: prefer the row/field label name.
   * Standalone LABEL fields: prefer placeholder (admin "display text").
   */
  const displayText = isGridField
    ? firstNonEmpty(labelText, placeholderText)
    : firstNonEmpty(placeholderText, labelText);

  return (
    <Controller
      name={formField.fieldKey}
      control={control}
      /** Pre-seed RHF with the display text so it is always present on submit */
      defaultValue={displayText}
      render={({ field }) => (
        <Box sx={{ mb: isGridField ? 0 : 2.5 }}>
          {!hideLabel && <TextFieldLabel field={formField} />}

          {/* Hidden native input keeps the value registered in the RHF state */}
          <input type="hidden" {...field} value={displayText} />

          {/* Plain text label — no border, no background, no box */}
          <Typography
            variant={size === "small" ? "body2" : "body1"}
            component="div"
            sx={{
              color: "text.primary",
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            {displayText}
          </Typography>

          {/* Optional help text below the label */}
          {!hideHelperText &&
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
      )}
    />
  );
};

export default Label;
