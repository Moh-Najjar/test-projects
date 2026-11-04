import { startTransition, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  useSubmitForm,
  useUpdateSubmission,
  MY_SUBMISSIONS_QUERY_KEY,
  FORM_FIELDS_QUERY_KEY,
  SUBMISSION_DETAILS_QUERY_KEY,
} from "./useFormApi";
import { SubmitFormRequest } from "../types/submitFormRequest";
import type { GetSubmissionDetailsResponse } from "../types/getSubmissionDetailsResponse";
import { mapFormDataToFieldValues } from "../utils/formDataMapper";
import { FormField } from "../types/FormField";
import { useLocale } from "./useLocale";
import { groupAttributesByPage } from "../utils/groupAttributesByPage";
import {
  applyValidationIssues,
  validateAllFormFields,
} from "../utils/validateAllFormFields";
import { useAuth } from "../context/AuthContext";

interface StepperPage {
  Key: number;
  Title: string;
  UIViewAlias: string | null;
}

interface UseStepperOptions {
  /** When set, the stepper updates this submission instead of creating a new one */
  editSubmission?: GetSubmissionDetailsResponse;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useStepper = (
  pages: StepperPage[],
  formMethods: UseFormReturn<Record<string, unknown>>,
  formFieldsData: FormField[],
  options?: UseStepperOptions
) => {
  const editSubmission = options?.editSubmission;
  const [activeStep, setActiveStep] = useState(0);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate: submitForm, isPending: isCreating } = useSubmitForm();
  const { mutate: updateSubmission, isPending: isUpdating } = useUpdateSubmission();
  const isSubmitting = isCreating || isUpdating;

  const { t, loc } = useLocale();
  const { authSession } = useAuth();

  /** Number of data-entry pages (excludes the review step) */
  const dataStepCount = pages.length - 1;
  /** 0-based index of the review & confirm step */
  const reviewStepIndex = pages.length - 1;

  /** Scrolls to the first field with a validation error */
  const scrollToFirstError = (): void => {
    const { errors } = formMethods.formState;
    const firstError = Object.entries(errors).find(
      ([, error]) => error?.type === "required" || error?.type === "pattern" || error?.type === "manual"
    );

    if (firstError !== undefined) {
      const fieldElement = document.getElementById(firstError[0]);
      fieldElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  /** Returns the fields belonging to the given 0-based data step index */
  const getPageFields = (stepIndex: number): FormField[] => {
    const grouped = groupAttributesByPage(formFieldsData);
    return grouped[stepIndex + 1] ?? [];
  };

  /**
   * Move only after the next screen is ready to paint.
   * An urgent step change destroys the current table first and leaves a blank
   * frame while the next one mounts.
   */
  const goToStep = (step: number): void => {
    startTransition(() => {
      setActiveStep(step);
    });
  };

  const handleNext = (): void => {
    const formValues = formMethods.getValues();
    const pageFields = getPageFields(activeStep);
    // One pass over the page. trigger() on every table cell blocks Next
    // when a grid has a few thousand rows.
    const pageIssues = validateAllFormFields(pageFields, formValues, loc, t);

    if (activeStep < dataStepCount - 1) {
      if (pageIssues.length === 0) {
        formMethods.clearErrors();
        goToStep(activeStep + 1);
      } else {
        applyValidationIssues(formMethods, pageIssues);
        scrollToFirstError();
      }
      return;
    }

    if (activeStep === dataStepCount - 1) {
      const allIssues = validateAllFormFields(formFieldsData, formValues, loc, t);

      if (pageIssues.length > 0 || allIssues.length > 0) {
        applyValidationIssues(formMethods, allIssues);
        scrollToFirstError();
        return;
      }

      formMethods.clearErrors();
      goToStep(reviewStepIndex);
    }
  };

  const handleBack = (): void => {
    if (activeStep > 0) {
      goToStep(activeStep - 1);
    }
  };

  /** Navigates to a specific data step — used by Edit buttons on the review screen */
  const handleGoToStep = (stepIndex: number): void => {
    if (stepIndex >= 0 && stepIndex < dataStepCount) {
      goToStep(stepIndex);
    }
  };

  const checkIfAllFieldsHaveNextSubmissionDate = async (): Promise<boolean> => {
    return formFieldsData.every(
      (field) =>
        field.kpiNextSubmissionDateEn !== null &&
        field.kpiNextSubmissionDateAr !== null
    );
  };

  /**
   * Called by React Hook Form's `handleSubmit` wrapper from the review step only.
   * Maps the raw field values to the API request shape and fires the mutation.
   */
  const handleSubmit = async (formData: Record<string, unknown>): Promise<void> => {
    // Edit mode: keep the original submission's metadata and replace only the values
    if (editSubmission !== undefined) {
      updateSubmission(
        {
          submissionId: editSubmission.submissionId,
          data: {
            formId: editSubmission.formId,
            directorateId: editSubmission.directorateId,
            reportingDate: editSubmission.reportingDate.split("T")[0],
            periodYear: editSubmission.periodYear,
            periodMonth: editSubmission.periodMonth,
            kpiId: editSubmission.kpiId,
            notes: editSubmission.notes ?? "",
            fieldValues: mapFormDataToFieldValues(formData, formFieldsData),
          },
        },
        {
          onSuccess: async () => {
            void queryClient.invalidateQueries({ queryKey: [MY_SUBMISSIONS_QUERY_KEY] });
            // Wait for fresh details so the detail page opens with the saved values
            await queryClient.invalidateQueries({
              queryKey: [SUBMISSION_DETAILS_QUERY_KEY, editSubmission.submissionId],
              refetchType: "all",
            });
            toast.success(t("editRequest.success"));
            navigate(`/my-requests/${editSubmission.submissionId}`, { replace: true });
          },
        }
      );
      return;
    }

    const request: SubmitFormRequest = {
      formId: authSession?.kpiFormId ?? 0,
      directorateId: authSession?.directorateId ?? 0,
      reportingDate: new Date().toISOString().split("T")[0],
      periodYear: new Date().getFullYear(),
      periodMonth: new Date().getMonth() + 1,
      kpiId: null,
      notes: "",
      fieldValues: mapFormDataToFieldValues(formData, formFieldsData),
    };

    const allFieldsHaveNextSubmissionDate =
      await checkIfAllFieldsHaveNextSubmissionDate();

    if (allFieldsHaveNextSubmissionDate) {
      toast.info(t("validation.waitNextSubmissionDate"));
      void queryClient.invalidateQueries({ queryKey: [FORM_FIELDS_QUERY_KEY] });
      setActiveStep(0);
      return;
    }

    submitForm(request, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: [MY_SUBMISSIONS_QUERY_KEY] });
        void queryClient.invalidateQueries({ queryKey: [FORM_FIELDS_QUERY_KEY] });
        setIsSuccessDialogOpen(true);
      },
    });
  };

  /** Closes the success dialog and navigates to the my-requests page */
  const handleSuccessDialogConfirm = (): void => {
    setIsSuccessDialogOpen(false);
    navigate("/my-requests", { replace: true });
  };


  return {
    activeStep,
    dataStepCount,
    reviewStepIndex,
    handleNext,
    handleBack,
    handleGoToStep,
    handleSubmit,
    isSubmitting,
    isSuccessDialogOpen,
    handleSuccessDialogConfirm,
  };
};
