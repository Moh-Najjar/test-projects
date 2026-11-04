import React, { startTransition, useEffect, useMemo, useRef, useState } from "react";

import Box from "@mui/material/Box";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useLocale } from "../../../../core/hooks/useLocale";
import type { GetSubmissionDetailsResponse } from "../../../../core/types/getSubmissionDetailsResponse";
import { FIELDS_PER_PAGE } from "../../../../core/utils/groupAttributesByPage";
import { buildFormDefaultValues } from "../../utils/buildFormDefaultValues";
import Header from "../../../new-request/Stepper/Header";
import styles from "../../../new-request/Stepper/Stepper.module.css";
import ViewActions from "./ViewActions";
import ViewContent from "./ViewContent";
import { mapApiStatus } from "../../utils/statusHelpers";
import ApproveConfirmDialog from "./ApproveConfirmDialog";
import RejectConfirmDialog from "./RejectConfirmDialog";

interface RequestDetailStepperProps {
  detail: GetSubmissionDetailsResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  /** Navigates back to the My Requests list */
  onClose: () => void;
  /** Called when the user clicks Edit — only triggered when canEdit is true */
  onEdit?: (submissionId: number) => void;
  /** Fires on every step change so the parent can track progress (e.g. progress bar) */
  onStepChange?: (current: number, total: number) => void;
}

const RequestDetailStepper: React.FC<RequestDetailStepperProps> = ({
  detail,
  isLoading,
  isError,
  onClose,
  onEdit,
  onStepChange,
}) => {
  const { t } = useLocale();
  const { i18n } = useTranslation();

  const [activeStep, setActiveStep] = useState<number>(0);

  /**
   * True only after saved values have been written into the form.
   * Field controls stay hidden until then, so the user never sees empty inputs
   * while a large submission is being prepared.
   */
  const [valuesReady, setValuesReady] = useState<boolean>(detail !== undefined);

  // Dialog open states for approve/reject confirmation
  const [approveOpen, setApproveOpen] = useState<boolean>(false);
  const [rejectOpen, setRejectOpen] = useState<boolean>(false);

  // Derive total page count from the number of field values
  const totalSteps = useMemo<number>(() => {
    if (detail === undefined || detail.fieldValues.length === 0) return 1;
    return Math.ceil(detail.fieldValues.length / FIELDS_PER_PAGE);
  }, [detail]);

  // Build step labels — re-evaluates on language change because t() is reactive
  const steps = useMemo(
    () =>
      Array.from({ length: totalSteps }, (_, i) => ({
        Key: i + 1,
        Title: t("stepper.page", { n: i + 1 }),
        UIViewAlias: null as string | null,
      })),
    // i18n.language is intentionally included so labels update on locale switch
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [totalSteps, t, i18n.language]
  );

  const methods = useForm<Record<string, unknown>>({
    defaultValues: detail !== undefined ? buildFormDefaultValues(detail.fieldValues) : {},
    mode: "onChange",
    // Virtualized table rows unmount off-screen. Their values must stay registered.
    shouldUnregister: false,
  });

  // When the submission data loads (async), populate the form with the saved values.
  // A ref guard ensures reset only fires once per unique submissionId.
  const loadedSubmissionIdRef = useRef<number | undefined>(
    detail !== undefined ? detail.submissionId : undefined,
  );
  useEffect(() => {
    if (detail === undefined) {
      setValuesReady(false);
      return;
    }

    if (loadedSubmissionIdRef.current !== detail.submissionId) {
      loadedSubmissionIdRef.current = detail.submissionId;
      methods.reset(buildFormDefaultValues(detail.fieldValues));
    }

    // Controls may mount only after this flag flips, so their first paint
    // already has the saved month/year and table values.
    setValuesReady(true);
  }, [detail, methods]);

  // Notify parent whenever the active step or total changes (used for the sidebar progress bar)
  useEffect(() => {
    onStepChange?.(activeStep, totalSteps);
  }, [activeStep, totalSteps, onStepChange]);

  /** Ref attached to the top of the stepper so we can scroll back to it on every step change. */
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
  }, [activeStep]);

  /**
   * Keep the current page mounted until the next one can paint.
   * Destroying a large table first leaves the white gap between steps.
   */
  const handleNext = (): void => {
    startTransition(() => {
      setActiveStep((prev) => Math.min(prev + 1, totalSteps - 1));
    });
  };

  const handleBack = (): void => {
    startTransition(() => {
      setActiveStep((prev) => Math.max(prev - 1, 0));
    });
  };

  const handleApprove = (): void => {
    setApproveOpen(true);
  };

  const handleReject = (): void => {
    setRejectOpen(true);
  };

  // Called by either dialog after a successful API response
  const handleActionSuccess = (): void => {
    setApproveOpen(false);
    setRejectOpen(false);
    // Navigate back to the My Requests list so the user sees the updated status
    onClose();
  };

  return (
    <FormProvider {...methods}>
      {/* A <form> wrapper is needed because the underlying controls use Controller,
          which requires a form context — even though we never submit here. */}
      <form>
        <Box ref={topRef} className={styles.stepperContainer} sx={{ p: 0, minWidth: 0 }}>
          <Header activeStep={activeStep} steps={steps} />

          <ViewContent
            activeStep={activeStep}
            formMethods={methods}
            fieldValues={detail?.fieldValues}
            isLoading={isLoading}
            isError={isError}
            valuesReady={valuesReady}
          />

          <ViewActions
            activeStep={activeStep}
            stepsCount={steps.length}
            onBack={handleBack}
            onNext={handleNext}
            onClose={onClose}
            onApprove={handleApprove}
            onReject={handleReject}
            onEdit={detail !== undefined ? () => onEdit?.(detail.submissionId) : undefined}
            requestStatus={mapApiStatus(detail?.submissionStatus ?? '')}
          />
        </Box>
      </form>

      {/* Approve / Reject confirmation dialogs — only mounted when submissionId is known */}
      {detail !== undefined && (
        <>
          <ApproveConfirmDialog
            open={approveOpen}
            submissionId={detail.submissionId}
            onClose={() => setApproveOpen(false)}
            onSuccess={handleActionSuccess}
          />

          <RejectConfirmDialog
            open={rejectOpen}
            submissionId={detail.submissionId}
            onClose={() => setRejectOpen(false)}
            onSuccess={handleActionSuccess}
          />
        </>
      )}
    </FormProvider>
  );
};

export default RequestDetailStepper;
