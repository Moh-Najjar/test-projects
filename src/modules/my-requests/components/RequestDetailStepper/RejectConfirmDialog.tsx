import React, { useState } from "react";

import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";

import { MY_SUBMISSIONS_QUERY_KEY, SUBMISSION_DETAILS_QUERY_KEY } from "../../../../core/hooks/useFormApi";
import { useRejectSubmission } from "../../../../core/hooks/useRequestApi";
import { useLocale } from "../../../../core/hooks/useLocale";
import ConfirmationDialog from "../../../shared/ConfirmationDialog";

interface RejectConfirmDialogProps {
  /** Controls dialog visibility */
  open: boolean;
  /** ID of the submission to reject */
  submissionId: number;
  /** Called when the user dismisses the dialog without confirming */
  onClose: () => void;
  /** Called after the API responds with success */
  onSuccess: () => void;
}

const RejectConfirmDialog: React.FC<RejectConfirmDialogProps> = ({
  open,
  submissionId,
  onClose,
  onSuccess,
}) => {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { mutate: reject, isPending, error, reset } = useRejectSubmission();

  // Local state for the rejection reason text field
  const [reason, setReason] = useState<string>("");
  const [reasonError, setReasonError] = useState<string>("");

  // Reset all local state and mutation error on close
  const handleClose = (): void => {
    setReason("");
    setReasonError("");
    reset();
    onClose();
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setReason(e.target.value);
    // Clear the inline validation error as soon as the user starts typing
    if (reasonError.length > 0) setReasonError("");
  };

  const handleConfirm = (): void => {
    const trimmed = reason.trim();

    // Client-side validation: reason must not be empty
    if (trimmed.length === 0) {
      setReasonError(t("myRequests.reject.reasonRequired"));
      return;
    }

    setReasonError("");

    reject(
      { submissionId, reason: trimmed },
      {
        onSuccess: () => {
          // Invalidate both the list and this submission's detail cache so
          // re-opening the request immediately shows the updated status
          void queryClient.invalidateQueries({ queryKey: [MY_SUBMISSIONS_QUERY_KEY] });
          void queryClient.invalidateQueries({ queryKey: [SUBMISSION_DETAILS_QUERY_KEY, submissionId] });
          onSuccess();
        },
      },
    );
  };

  return (
    <ConfirmationDialog
      open={open}
      onClose={handleClose}
      onConfirm={handleConfirm}
      isConfirmLoading={isPending}
      confirmColor="error"
      confirmText={t("myRequests.actions.reject")}
      cancelText={t("myRequests.actions.cancel")}
      title={t("myRequests.reject.title")}
      headerIcon={
        <CancelOutlinedIcon sx={{ color: "error.main", fontSize: 28, ml: 1 }} />
      }
      description={
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="body1" color="text.primary">
            {t("myRequests.reject.description")}
          </Typography>

          {/* Rejection reason input — required before the confirm button is accepted */}
          <TextField
            label={t("myRequests.reject.reasonLabel")}
            placeholder={t("myRequests.reject.reasonPlaceholder")}
            value={reason}
            onChange={handleReasonChange}
            multiline
            rows={3}
            fullWidth
            size="small"
            disabled={isPending}
            error={reasonError.length > 0}
            helperText={reasonError.length > 0 ? reasonError : ""}
          />

          {/* Inline API error — shown only when the mutation has failed */}
          {error !== null && (
            <Typography variant="body2" color="error.main">
              {error.message}
            </Typography>
          )}
        </Box>
      }
    />
  );
};

export default RejectConfirmDialog;
