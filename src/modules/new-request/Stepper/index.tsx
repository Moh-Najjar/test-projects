import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";

import { useStepper } from "../../../core/hooks/useStepper";
import { useLocale } from "../../../core/hooks/useLocale";
import { useFormFields } from "../../../core/hooks/useFormApi";
import { FIELDS_PER_PAGE } from "../../../core/utils/groupAttributesByPage";
import type { ValidationIssue } from "../../../core/utils/validateAllFormFields";
import SubmissionSuccessDialog from "../../shared/SubmissionSuccessDialog";
import Content from "./Content";
import ReviewContent from "./ReviewContent";
import Actions from "./Actions";
import Header from "./Header";
import styles from "./Stepper.module.css";
import type { FormField } from "../../../core/types/FormField";
import type { GetSubmissionDetailsResponse } from "../../../core/types/getSubmissionDetailsResponse";
import { buildFormDefaultValues } from "../../my-requests/utils/buildFormDefaultValues";

interface StepperProps {
  onStepChange?: (step: number, total: number) => void;
  /** When set, the stepper is prefilled with this submission and saves via PUT */
  editSubmission?: GetSubmissionDetailsResponse;
}

const Stepper: React.FC<StepperProps> = ({ onStepChange, editSubmission }) => {
  const { t } = useLocale();
  const { i18n } = useTranslation();

  const { data: liveFormFields, isError, error, isLoading, isSuccess } = useFormFields();

  /** In edit mode, clear next-submission dates: controls treat them as a lock */
  const formFieldsData = useMemo(
    (): FormField[] | undefined =>
      editSubmission === undefined
        ? liveFormFields
        : liveFormFields?.map((field) => ({
            ...field,
            kpiNextSubmissionDateEn: null,
            kpiNextSubmissionDateAr: null,
          })),
    [editSubmission, liveFormFields]
  );

  /** Number of data-entry pages derived from the live API response */
  const dataStepCount = useMemo(
    () =>
      formFieldsData !== undefined && formFieldsData.length > 0
        ? Math.ceil(formFieldsData.length / FIELDS_PER_PAGE)
        : 0,
    [formFieldsData]
  );

  /** Total steps includes one final review & confirm page */
  const totalSteps = dataStepCount + 1;

  const methods = useForm<Record<string, unknown>>({
    mode: "onChange",
    shouldUnregister: false,
  });

  /**
   * Edit mode stays false until saved values are reset into the form.
   * New requests have nothing to prefill, so they start ready.
   */
  const [valuesReady, setValuesReady] = useState<boolean>(editSubmission === undefined);

  // Prefill the form once per submission, after field definitions are ready
  const prefilledSubmissionIdRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (editSubmission === undefined) {
      setValuesReady(true);
      return;
    }

    if (formFieldsData === undefined) {
      setValuesReady(false);
      return;
    }

    if (prefilledSubmissionIdRef.current !== editSubmission.submissionId) {
      prefilledSubmissionIdRef.current = editSubmission.submissionId;
      methods.reset(buildFormDefaultValues(editSubmission.fieldValues));
    }

    setValuesReady(true);
  }, [editSubmission, formFieldsData, methods]);

  const prevLanguageRef = useRef(i18n.language);
  useEffect(() => {
    if (prevLanguageRef.current === i18n.language) return;
    prevLanguageRef.current = i18n.language;

    const fieldsWithErrors = Object.keys(methods.formState.errors) as Array<
      keyof Record<string, unknown>
    >;

    if (fieldsWithErrors.length > 0) {
      void methods.trigger(fieldsWithErrors);
    }
  }, [i18n.language, methods]);

  const attributePagesTitles = useMemo(
    () => [
      ...Array.from({ length: dataStepCount }, (_, i) => ({
        Key: i + 1,
        Title: t("stepper.page", { n: i + 1 }),
        UIViewAlias: null as string | null,
      })),
      {
        Key: dataStepCount + 1,
        Title: t("stepper.review"),
        UIViewAlias: null as string | null,
      },
    ],
    [dataStepCount, t]
  );

  const {
    activeStep,
    reviewStepIndex,
    handleNext,
    handleBack,
    handleGoToStep,
    handleSubmit,
    isSubmitting,
    isSuccessDialogOpen,
    handleSuccessDialogConfirm,
  } = useStepper(attributePagesTitles, methods, formFieldsData ?? [], { editSubmission });

  const isReviewStep = dataStepCount > 0 && activeStep === reviewStepIndex;

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);

  /** Reset confirmation when leaving the review step */
  useEffect(() => {
    if (!isReviewStep) {
      setIsConfirmed(false);
    }
  }, [isReviewStep]);

  const handleValidationChange = useCallback((issues: ValidationIssue[]): void => {
    setValidationIssues(issues);
  }, []);

  const handleEditSection = useCallback(
    (sectionIndex: number): void => {
      setIsConfirmed(false);
      handleGoToStep(sectionIndex);
    },
    [handleGoToStep]
  );

  useEffect(() => {
    onStepChange?.(activeStep, totalSteps);
  }, [activeStep, totalSteps, onStepChange]);

  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
  }, [activeStep]);

  const isSubmitDisabled = !isConfirmed || validationIssues.length > 0;

  return (
    <>
      <SubmissionSuccessDialog
        open={isSuccessDialogOpen}
        onConfirm={handleSuccessDialogConfirm}
      />
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleSubmit)}>
          <Box ref={topRef} className={styles.stepperContainer} sx={{ p: 0, minWidth: 0 }}>
            <Header activeStep={activeStep} steps={attributePagesTitles} />
            {isReviewStep ? (
              <ReviewContent
                formFieldsData={formFieldsData ?? []}
                formMethods={methods}
                onEditSection={handleEditSection}
                isConfirmed={isConfirmed}
                onConfirmChange={setIsConfirmed}
                onValidationChange={handleValidationChange}
              />
            ) : (
              <Content
                activeStep={activeStep}
                formMethods={methods}
                formFieldsData={formFieldsData}
                isLoading={isLoading}
                isError={isError}
                isSuccess={isSuccess}
                error={error instanceof Error ? error : null}
                valuesReady={valuesReady}
              />
            )}
            <Actions
              activeStep={activeStep}
              isReviewStep={isReviewStep}
              isSubmitDisabled={isSubmitDisabled}
              isSubmitting={isSubmitting}
              onBack={handleBack}
              onNext={handleNext}
              onSubmit={methods.handleSubmit(handleSubmit)}
            />
          </Box>
        </form>
      </FormProvider>
    </>
  );
};

export default Stepper;
