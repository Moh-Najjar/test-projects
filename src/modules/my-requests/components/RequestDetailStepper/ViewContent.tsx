import React, { useEffect, useMemo, useState, useTransition } from "react";

import { useQueries } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { UseFormReturn } from "react-hook-form";

import { getDropdownListValues } from "../../../../core/api/form";
import { ControlKeys } from "../../../../core/enums/control-keys.enum";
import { DROPDOWN_LIST_VALUES_QUERY_KEY } from "../../../../core/hooks/useFormApi";
import { useLocale } from "../../../../core/hooks/useLocale";
import type { FormField } from "../../../../core/types/FormField";
import type { GetDropdownListValuesResponse } from "../../../../core/types/getDropdownListValuesResponse";
import type { FieldValue } from "../../../../core/types/getSubmissionDetailsResponse";
import { getControlKey, getControlType } from "../../../../core/utils/control.utils";
import { groupAttributesByPage } from "../../../../core/utils/groupAttributesByPage";
import { fieldValueToFormField } from "../../utils/fieldValueToFormField";
import styles from "../../../new-request/Stepper/Stepper.module.css";

/**
 * Pages at or above this many controls are mounted in a transition so the
 * status message can paint before the main thread is busy building them.
 */
const HEAVY_CONTROL_THRESHOLD = 6;

/** Stable empty list so memo dependencies do not change on every render */
const EMPTY_PAGE_FIELDS: FormField[] = [];

interface ViewContentProps {
  activeStep: number;
  formMethods: UseFormReturn<Record<string, unknown>>;
  /** The saved field values from the submission detail API response */
  fieldValues: FieldValue[] | undefined;
  isLoading: boolean;
  isError: boolean;
  /** True after saved values have been written into the form */
  valuesReady: boolean;
}

interface FieldStatusProps {
  title: string;
  detail: string | null;
  hint: string;
}

interface FieldPageProps {
  pageFields: FormField[];
  formMethods: UseFormReturn<Record<string, unknown>>;
  valuesReady: boolean;
  lookupsPending: boolean;
  isHeavy: boolean;
  controlCount: number;
}

/** True when this control needs a lookup list before its selected label can show */
const isLookupControl = (controlKey: string): boolean =>
  controlKey === ControlKeys.Dropdown || controlKey === ControlKeys.Multiselect;

/**
 * Collects every lookup type used by the current page, including cells
 * inside TABLE and RAW_TABLE fields. Ids are sorted so the query list is stable.
 */
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

/**
 * Counts the controls React will actually mount.
 * TABLE rows are virtualized, so a 2,000-row grid still counts as one control.
 */
const estimateControlCount = (
  fields: FormField[],
  fieldValueById: Map<number, FieldValue>,
): number =>
  fields.reduce((count, field) => {
    if (!field.isVisible) {
      return count;
    }

    const source = fieldValueById.get(field.fieldId);
    const controlKey = field.controlType.controlKey;

    if (controlKey === ControlKeys.Table) {
      return count + 1;
    }

    if (controlKey === ControlKeys.RawTable) {
      const cellCount = field.grid?.cells.length ?? 0;
      if (cellCount > 0) {
        return count + cellCount;
      }

      const columnCount = field.columns?.length ?? 0;
      const rowCount = source?.rawTableValues?.length ?? 1;
      return count + Math.max(columnCount, 1) * Math.max(rowCount, 1);
    }

    return count + 1;
  }, 0);

/** Centered status shown while submission data or field controls are not ready */
const FieldStatus: React.FC<FieldStatusProps> = ({ title, detail, hint }) => (
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
    {detail !== null && (
      <Typography variant="body2" color="text.secondary" textAlign="center">
        {detail}
      </Typography>
    )}
    {hint.trim().length > 0 && (
      <Typography
        variant="body2"
        color="text.secondary"
        textAlign="center"
        sx={{ maxWidth: 440 }}
      >
        {hint}
      </Typography>
    )}
  </Box>
);

/**
 * Mounts one stepper page. Large pages and pages still waiting on lookup
 * lists keep the rendering message up so the user does not see a blank form.
 */
const FieldPage: React.FC<FieldPageProps> = ({
  pageFields,
  formMethods,
  valuesReady,
  lookupsPending,
  isHeavy,
  controlCount,
}) => {
  const { t } = useLocale();
  const [isMounted, setIsMounted] = useState<boolean>(
    !isHeavy && valuesReady && !lookupsPending,
  );
  const [, startFieldRender] = useTransition();

  useEffect(() => {
    if (!valuesReady || lookupsPending) {
      return;
    }

    // Small pages can appear immediately once their values and lists are ready.
    if (!isHeavy) {
      setIsMounted(true);
      return;
    }

    // Keep the status message on screen while React builds the heavy control tree.
    startFieldRender(() => {
      setIsMounted(true);
    });
  }, [valuesReady, lookupsPending, isHeavy, startFieldRender]);

  const waitingForFields = !valuesReady || lookupsPending || !isMounted;

  if (waitingForFields) {
    return (
      <FieldStatus
        title={t("requestDetail.renderingFields")}
        detail={
          controlCount > 1
            ? t("requestDetail.renderingFieldsCount", { count: controlCount })
            : null
        }
        hint={t("requestDetail.renderingFieldsHint")}
      />
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

        if (Component === undefined) {
          return null;
        }

        return (
          <Component
            key={field.fieldId}
            formField={field}
            formMethods={formMethods}
            hideHelperText={true}
          />
        );
      })}
    </Box>
  );
};

const ViewContent: React.FC<ViewContentProps> = ({
  activeStep,
  formMethods,
  fieldValues,
  isLoading,
  isError,
  valuesReady,
}) => {
  const { t } = useLocale();

  const groupedFields = useMemo((): Record<number, FormField[]> => {
    if (fieldValues === undefined || fieldValues.length === 0) {
      return {};
    }
    return groupAttributesByPage(fieldValues.map(fieldValueToFormField));
  }, [fieldValues]);

  // activeStep is 0-based; groupAttributesByPage uses 1-based keys
  const pageFields: FormField[] = groupedFields[activeStep + 1] ?? EMPTY_PAGE_FIELDS

  const fieldValueById = useMemo(() => {
    const byId = new Map<number, FieldValue>();
    if (fieldValues === undefined) {
      return byId;
    }

    fieldValues.forEach((fieldValue) => {
      byId.set(fieldValue.fieldId, fieldValue);
    });

    return byId;
  }, [fieldValues]);

  const controlCount = useMemo(
    () => estimateControlCount(pageFields, fieldValueById),
    [pageFields, fieldValueById],
  );

  const isHeavy = controlCount >= HEAVY_CONTROL_THRESHOLD;

  const lookupTypeIds = useMemo(() => collectLookupTypeIds(pageFields), [pageFields]);

  // Same cache key as DropDown / MultiSelect, so the controls render with
  // labels already resolved instead of flashing empty selects.
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

  if (isLoading) {
    return (
      <FieldStatus
        title={t("requestDetail.loadingDetails")}
        detail={null}
        hint=""
      />
    );
  }

  if (isError) {
    return (
      <Box className={styles.stepperContent} role="alert">
        <Typography color="error">{t("common.errorLoading")}</Typography>
      </Box>
    );
  }

  return (
    <FieldPage
      key={`${activeStep}:${lookupTypeIds.join(",")}`}
      pageFields={pageFields}
      formMethods={formMethods}
      valuesReady={valuesReady}
      lookupsPending={lookupsPending}
      isHeavy={isHeavy}
      controlCount={controlCount}
    />
  );
};

export default ViewContent;
