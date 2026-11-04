import React from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { Box, Typography } from "@mui/material";
import ConfirmationDialog from "../ConfirmationDialog";
import { useLocale } from "../../../core/hooks/useLocale";

interface SubmissionSuccessDialogProps {
  /** Controls dialog visibility */
  open: boolean;
  /** Called when the user clicks OK — the caller should navigate away */
  onConfirm: () => void;
}

/**
 * Shown after a successful form submission.
 * Displays a confirmation message and navigates to /home when the user clicks OK.
 */
const SubmissionSuccessDialog: React.FC<SubmissionSuccessDialogProps> = ({
  open,
  onConfirm,
}) => {
  const { t } = useLocale();

  return (
    <ConfirmationDialog
      open={open}
      onClose={onConfirm}
      onConfirm={onConfirm}
      hasCancelButton={false}
      confirmText={t("submission.success.confirm")}
      autoFocusConfirm
      title={t("submission.success.title")}
      headerIcon={
        <CheckCircleOutlineIcon
          sx={{ color: "success.main", fontSize: 28, ml: 1 }}
        />
      }
      description={
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="body1" color="text.primary">
            {t("submission.success.body")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("submission.success.note")}
          </Typography>
        </Box>
      }
    />
  );
};

export default SubmissionSuccessDialog;
