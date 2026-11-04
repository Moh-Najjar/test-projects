import { useQueries } from "@tanstack/react-query";
import { groupAttributesByPage } from "../../../core/utils/groupAttributesByPage";
import { getControlKey, getControlType } from "../../../core/utils/control.utils";
import { FormField } from "../../../core/types/FormField";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import styles from "./Stepper.module.css";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useLocale } from "../../../core/hooks/useLocale";
import { getDropdownListValues } from "../../../core/api/form";
import { ControlKeys } from "../../../core/enums/control-keys.enum";
import { DROPDOWN_LIST_VALUES_QUERY_KEY } from "../../../core/hooks/useFormApi";
import type { GetDropdownListValuesResponse } from "../../../core/types/getDropdownListValuesResponse";

/** Pages with at least this many controls wait one paint so the status can show first */
const HEAVY_CONTROL_THRESHOLD = 6;

const EMPTY_PAGE_FIELDS: FormField[] = [];

const isLookupControl = (controlKey: string): boolean =>
  controlKey === ControlKeys.Dropdown || controlKey === ControlKeys.Multiselect;

/** Lookup ids for this page, including cells inside tables */
const collectLookupTypeIds = (fields: FormField[]): number[] => {
  const ids = new Set<number>();

  fields.forEach((field) => {
    if (!field.isVisible) {
      return;
    }

    if (isLookupControl(field.controlType.controlKey) && field.lookupType !== null) {
      ids.add(field.lookupType.lookupTypeId);
    }

    field.columns?.forEach((column) => {
      if (isLookupControl(column.controlType.controlKey) && column.lookupType !== null) {
        ids.add(column.lookupType.lookupTypeId);
      }
    });

    field.grid?.cells.forEach((cell) => {
      if (
        cell.isVisible &&
        isLookupControl(cell.controlType.controlKey) &&
        cell.lookupType !== null
      ) {
        ids.add(cell.lookupType.lookupTypeId);
      }
    });
  });

  return [...ids].sort((left, right) => left - right);
};

/** Counts inputs the page will mount. TABLE rows are virtualized, so a grid counts as one control. */
const estimateControlCount = (fields: FormField[]): number =>
  fields.reduce((count, field) => {
    if (!field.isVisible) {
      return count;
    }

    const controlKey = field.controlType.controlKey;

    if (controlKey === ControlKeys.Table) {
      return count + 1;
    }

    if (controlKey === ControlKeys.RawTable) {
      const cellCount = field.grid?.cells.length ?? 0;
      if (cellCount > 0) {
        return count + cellCount;
      }

      const columnCount = field.columns?.length ?? 1;
      const rowCount = field.rows?.length ?? 1;
      return count + Math.max(columnCount, 1) * Math.max(rowCount, 1);
    }

    return count + 1;
  }, 0);

/** Field augmented with the latest value from react-hook-form watch (for consumers that read _currentValue). */
type TrackedFormField = FormField & { _currentValue?: unknown };

interface ContentProps {
  activeStep: number;
  formMethods: UseFormReturn<Record<string, unknown>>;
  /** Form field definitions fetched by the parent Stepper. */
  formFieldsData: FormField[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: Error | null;
  /** False while an edited submission is still being copied into the form */
  valuesReady: boolean;
}

const Content: React.FC<ContentProps> = ({
  activeStep,
  formMethods,
  formFieldsData,
  isLoading,
  isError,
  isSuccess,
  error,
  valuesReady,
}) => {
  const { t } = useLocale();
  const { watch } = formMethods;

  // Group the flat API list into stepper pages (same layout rules as before).
  const groupedFields = useMemo((): Record<number, FormField[]> => {
    if (formFieldsData === undefined || formFieldsData.length === 0) {
      return {};
    }
    return groupAttributesByPage(formFieldsData);
  }, [formFieldsData]);

  // 1-indexed pages: activeStep is 0-based, so use activeStep + 1.
  const pageFields: FormField[] = groupedFields[activeStep + 1] ?? EMPTY_PAGE_FIELDS;

  const lookupTypeIds = useMemo(() => collectLookupTypeIds(pageFields), [pageFields]);
  const controlCount = useMemo(() => estimateControlCount(pageFields), [pageFields]);
  const isHeavy = controlCount >= HEAVY_CONTROL_THRESHOLD;
  const pageKey = `${activeStep}:${lookupTypeIds.join(",")}`;

  // Warm the same cache DropDown uses, so selects are not blank on first paint.
  const dropdownQueries = useQueries({
    queries: lookupTypeIds.map((lookupTypeId) => ({
      queryKey: [DROPDOWN_LIST_VALUES_QUERY_KEY, lookupTypeId],
      queryFn: async (): Promise<GetDropdownListValuesResponse> =>
        getDropdownListValues({ lookupTypeIds: [lookupTypeId] }),
      staleTime: Infinity,
      retry: 1,
    })),
  });

  const lookupsPending = dropdownQueries.some((query) => query.isLoading);
  const [revealedKey, setRevealedKey] = useState<string>("");
  const isRevealed = revealedKey === pageKey;

  useEffect(() => {
    if (!valuesReady || lookupsPending || !isHeavy) {
      return;
    }

    // Let the status paint, then mount a large page.
    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      if (!cancelled) {
        setRevealedKey(pageKey);
      }
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [valuesReady, lookupsPending, isHeavy, pageKey]);

  const holdForRender = !valuesReady || lookupsPending || (isHeavy && !isRevealed);

  // Local copy of fields merged with live form values for tracking/debug output.
  const [fieldList, setFieldList] = useState<TrackedFormField[]>([]);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const prevValuesRef = useRef<Record<string, unknown>>({});

  // When the step or the loaded field definitions change, reset tracking to the server list.
  useEffect(() => {
    if (formFieldsData === undefined) {
      setFieldList([]);
      return;
    }
    setFieldList(formFieldsData.map((field) => ({ ...field })));
  }, [activeStep, formFieldsData]);

  // Subscribe to all form values and merge them into fieldList when something actually changes.
  useEffect(() => {
    if (formFieldsData === undefined) {
      return;
    }

    const fieldsSource = formFieldsData;

    subscriptionRef.current = watch((value) => {
      // Skip if the value reference is identical (no real change).
      if (prevValuesRef.current === value) {
        return;
      }

      // Detect whether at least one field value actually changed.
      const hasChanged = Object.keys(value).some(
        (key) =>
          value[key] != null &&
          value[key] !== undefined &&
          prevValuesRef.current[key] !== value[key]
      );

      if (!hasChanged) {
        return;
      }

      prevValuesRef.current = value as Record<string, unknown>;

      // Merge current form values into the field list for local tracking.
      const updatedFields: TrackedFormField[] = fieldsSource.map((field) => {
        const currentValue = value[field.fieldKey];
        if (currentValue !== undefined) {
          return { ...field, _currentValue: currentValue };
        }
        return { ...field };
      });

      //console.log("updatedFields", updatedFields);
      setFieldList(updatedFields);
    });

    return () => subscriptionRef.current?.unsubscribe();
  }, [watch, activeStep, formFieldsData]);

  if (isLoading || holdForRender) {
    const title = isLoading
      ? t("stepper.loadingFormFields")
      : t("requestDetail.renderingFields");

    return (
      <Box
        className={styles.stepperContent}
        role="status"
        aria-live="polite"
        aria-busy="true"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight={240}
        gap={1.5}
        sx={{ py: 6, px: 2 }}
      >
        <CircularProgress aria-label={title} />
        <Typography variant="subtitle1" fontWeight={700} textAlign="center">
          {title}
        </Typography>
        {!isLoading && controlCount > 1 && (
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {t("requestDetail.renderingFieldsCount", { count: controlCount })}
          </Typography>
        )}
        {!isLoading && (
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ maxWidth: 440 }}
          >
            {t("requestDetail.renderingFieldsHint")}
          </Typography>
        )}
      </Box>
    );
  }

  if (formFieldsData?.length === 0 || !isSuccess) {
    return (
      <Box className={styles.stepperContent} role="alert">
        <Typography textAlign="center" color="primary">
          {t("stepper.noFormFields")}
        </Typography>
      </Box>
    );
  }

  if (isError) {
    const message =
      error instanceof Error ? error.message : t("stepper.loadFormFieldsError");
    return (
      <Box className={styles.stepperContent} role="alert">
        <Typography color="error">{message}</Typography>
      </Box>
    );
  }

  return (
    <Box className={styles.stepperContent}>
      {pageFields.map((field) => {
        if (!field.isVisible) {
          return null;
        }

        const controlKey = getControlKey(field);
        const Component = getControlType(controlKey);

        if (!Component) {
          return null;
        }

        // Prefer the locally tracked field (may include _currentValue from watch).
        const trackedField =
          fieldList.find((f) => f.fieldId === field.fieldId) ?? field;

        return (
          <Component
            key={field.fieldId}
            formField={trackedField}
            formMethods={formMethods}
          />
        );
      })}
    </Box>
  );
};

export default Content;
