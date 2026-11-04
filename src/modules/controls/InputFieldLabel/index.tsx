import { InputLabel, Typography, Box } from "@mui/material";
import { FormField } from "../../../core/types/FormField";
import { useLocale } from "../../../core/hooks/useLocale";
import React from "react";

interface TextFieldLabelProps {
  field: FormField;
}

/** Renders a bilingual label for a form control, with a required asterisk when isRequired is true */
const TextFieldLabel: React.FC<TextFieldLabelProps> = ({ field }) => {
  const { loc } = useLocale();

  return (
    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
      <Box
        sx={{
          width: 4,
          height: 16,
          borderRadius: 1,
          bgcolor: "secondary.main",
          mr: 1,
          opacity: 0.8,
        }}
      />
      <InputLabel
        htmlFor={field.fieldKey}
        sx={{
          fontSize: "0.875rem",
          fontWeight: 700,
          color: "primary.main",
          mb: 0,
          // Allow the label to wrap onto multiple lines instead of clipping.
          whiteSpace: "normal",
          overflow: "visible",
          textOverflow: "unset",
          display: "flex",
          alignItems: "center",
        }}
      >
        {loc(field.labelEn, field.labelAr)}
        {field.isRequired && (
          <Typography
            component="span"
            sx={{
              color: "error.main",
              fontWeight: "bold",
              fontSize: "1.2rem",
              lineHeight: 0,
              ml: 0.5,
              verticalAlign: "middle",
            }}
          >
            *
          </Typography>
        )}
      </InputLabel>
    </Box>
  );
};

export default TextFieldLabel;
