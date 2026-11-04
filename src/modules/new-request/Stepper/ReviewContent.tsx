import React, { startTransition, useEffect, useMemo, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { getControlKey, getControlType } from "../../../core/utils/control.utils";
import { groupAttributesByPage } from "../../../core/utils/groupAttributesByPage";
import {
  validateAllFormFields,
  ValidationIssue,
} from "../../../core/utils/validateAllFormFields";
import type { FormField } from "../../../core/types/FormField";
import { useLocale } from "../../../core/hooks/useLocale";
import styles from "./Stepper.module.css";

interface ReviewSectionProps {
  sectionIndex: number;
  sectionTitle: string;
  fields: FormField[];
  formMethods: UseFormReturn<Record<string, unknown>>;
  issues: ValidationIssue[];
  onEdit: (sectionIndex: number) => void;
}

/** Renders one data page as a read-only summary card with an Edit action */
const ReviewSection: React.FC<ReviewSectionProps> = ({
  sectionIndex,
  sectionTitle,
  fields,
  formMethods,
  issues,
  onEdit,
}) => {
  const { t } = useLocale();
  const sectionIssues = issues.filter((issue) => issue.sectionIndex === sectionIndex);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          {sectionTitle}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<EditOutlinedIcon />}
          onClick={() => onEdit(sectionIndex)}
          sx={{ textTransform: "none", fontWeight: 600, borderRadius: "8px" }}
        >
          {t("stepper.edit")}
        </Button>
      </Box>

      {sectionIssues.length > 0 && (
        <Alert severity="error" sx={{ borderRadius: "8px" }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            {t("stepper.reviewSectionErrors", { count: sectionIssues.length })}
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {sectionIssues.map((issue) => (
              <Box component="li" key={issue.rhfPath}>
                <Typography variant="body2">
                  {issue.fieldLabel}: {issue.message}
                </Typography>
              </Box>
            ))}
          </Box>
        </Alert>
      )}

      <Box className={styles.stepperContent} sx={{ marginBlock: 0 }}>
        {fields.map((field) => {
          if (!field.isVisible) {
            return null;
          }

          const controlKey = getControlKey(field);
          const Component = getControlType(controlKey);

          if (Component === undefined) {
            return null;
          }

          const readOnlyField: FormField = { ...field, isReadOnly: true };

          return (
            <Component
              key={field.fieldId}
              formField={readOnlyField}
              formMethods={formMethods}
              hideHelperText={true}
            />
          );
        })}
      </Box>
    </Paper>
  );
};

interface ReviewContentProps {
  formFieldsData: FormField[];
  formMethods: UseFormReturn<Record<string, unknown>>;
  onEditSection: (sectionIndex: number) => void;
  isConfirmed: boolean;
  onConfirmChange: (confirmed: boolean) => void;
  onValidationChange: (issues: ValidationIssue[]) => void;
}

/** Avoids redundant state updates when validation output is unchanged */
const areValidationIssuesEqual = (
  prev: ValidationIssue[],
  next: ValidationIssue[]
): boolean => {
  if (prev.length !== next.length) {
    return false;
  }

  return prev.every(
    (issue, index) =>
      issue.rhfPath === next[index]?.rhfPath &&
      issue.message === next[index]?.message
  );
};

const ReviewContent: React.FC<ReviewContentProps> = ({
  formFieldsData,
  formMethods,
  onEditSection,
  isConfirmed,
  onConfirmChange,
  onValidationChange,
}) => {
  const { t, loc } = useLocale();
  const { i18n } = useTranslation();
  const { watch, getValues } = formMethods;
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const onValidationChangeRef = useRef(onValidationChange);
  onValidationChangeRef.current = onValidationChange;

  const groupedFields = useMemo((): Record<number, FormField[]> => {
    if (formFieldsData.length === 0) {
      return {};
    }
    return groupAttributesByPage(formFieldsData);
  }, [formFieldsData]);

  const sectionCount = Object.keys(groupedFields).length;

  /** Re-run full-form validation whenever form values or language change */
  useEffect(() => {
    const runValidation = (): void => {
      const issues = validateAllFormFields(formFieldsData, getValues(), loc, t);

      setValidationIssues((prev) => {
        if (areValidationIssuesEqual(prev, issues)) {
          return prev;
        }

        onValidationChangeRef.current(issues);
        return issues;
      });
    };

    // Let the review table paint before walking every row.
    const frame = window.requestAnimationFrame(() => {
      startTransition(runValidation);
    });

    const subscription = watch(() => {
      startTransition(runValidation);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      subscription.unsubscribe();
    };
  }, [formFieldsData, getValues, watch, i18n.language, loc, t]);

  return (
    <Box className={styles.stepperContent} data-tour="review-content">
      <Typography variant="h6" fontWeight={600}>
        {t("stepper.review")}
      </Typography>

      {validationIssues.length > 0 && (
        <Alert severity="warning" sx={{ borderRadius: "8px" }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            {t("stepper.reviewValidationSummary")}
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {validationIssues.map((issue) => (
              <Box component="li" key={issue.rhfPath}>
                <Typography variant="body2">
                  {issue.fieldLabel}: {issue.message}
                </Typography>
              </Box>
            ))}
          </Box>
        </Alert>
      )}

      {Array.from({ length: sectionCount }, (_, index) => {
        const pageNumber = index + 1;
        const pageFields = groupedFields[pageNumber] ?? [];

        return (
          <ReviewSection
            key={pageNumber}
            sectionIndex={index}
            sectionTitle={t("stepper.page", { n: pageNumber })}
            fields={pageFields}
            formMethods={formMethods}
            issues={validationIssues}
            onEdit={onEditSection}
          />
        );
      })}

      <FormControlLabel
        control={
          <Checkbox
            checked={isConfirmed}
            onChange={(event) => onConfirmChange(event.target.checked)}
            color="primary"
          />
        }
        label={t("stepper.reviewConfirm")}
        sx={{ mt: 1, alignItems: "center" }}
      />
    </Box>
  );
};

export default ReviewContent;
