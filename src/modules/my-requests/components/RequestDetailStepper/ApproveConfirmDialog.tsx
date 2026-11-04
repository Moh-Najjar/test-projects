import React from "react";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";

import { MY_SUBMISSIONS_QUERY_KEY, SUBMISSION_DETAILS_QUERY_KEY } from "../../../../core/hooks/useFormApi";
import { useApproveSubmission } from "../../../../core/hooks/useRequestApi";
import { useLocale } from "../../../../core/hooks/useLocale";
import ConfirmationDialog from "../../../shared/ConfirmationDialog";

interface ApproveConfirmDialogProps {
  /** Controls dialog visibility */
  open: boolean;
  /** ID of the submission to approve */
  submissionId: number;
  /** Called when the user dismisses the dialog without confirming */
  onClose: () => void;
  /** Called after the API responds with success */
  onSuccess: () => void;
}

const ApproveConfirmDialog: React.FC<ApproveConfirmDialogProps> = ({
  open,
  submissionId,
  onClose,
  onSuccess,
}) => {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { mutate: approve, isPending, error, reset } = useApproveSubmission();

  // Reset mutation state whenever the dialog is dismissed without confirming
  const handleClose = (): void => {
    reset();
    onClose();
  };

  const handleConfirm = (): void => {
    approve(submissionId, {
      onSuccess: () => {
        // Invalidate both the list and this submission's detail cache so
        // re-opening the request immediately shows the updated status
        void queryClient.invalidateQueries({ queryKey: [MY_SUBMISSIONS_QUERY_KEY] });
        void queryClient.invalidateQueries({ queryKey: [SUBMISSION_DETAILS_QUERY_KEY, submissionId] });
        onSuccess();
      },
    });
  };

  return (
    <ConfirmationDialog
      open={open}
      onClose={handleClose}
      onConfirm={handleConfirm}
      isConfirmLoading={isPending}
      confirmColor="primary"
      confirmText={t("myRequests.actions.approve")}
      cancelText={t("myRequests.actions.cancel")}
      title={t("myRequests.approve.title")}
      headerIcon={
        <CheckCircleOutlineIcon sx={{ color: "success.main", fontSize: 28, ml: 1 }} />
      }
      description={
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="body1" color="text.primary">
            {t("myRequests.approve.description")}
          </Typography>

          {/* Inline API error — shown only when the mutation has failed */}
          {error !== null && (
            <Typography variant="body2" color="error.main" sx={{ mt: 0.5 }}>
              {error.message}
            </Typography>
          )}
        </Box>
      }
    />
  );
};

export default ApproveConfirmDialog;
