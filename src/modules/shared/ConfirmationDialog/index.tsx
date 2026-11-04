import React from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";

/**
 * Shared ConfirmationDialog
 *
 * A simple, reusable confirmation dialog that can be used across the app.
 * - Strict TypeScript (no `any`)
 * - Defensive runtime validation
 * - Designed to work well with async confirm actions (loading state)
 */
export type ConfirmationDialogProps = Readonly<{
  /** Whether the dialog is visible. */
  open: boolean;
  /** Dialog title shown at the top. */
  title: string;
  /** Dialog body text (use `ReactNode` so callers can pass rich content if needed). */
  description: React.ReactNode;
  /** Optional icon shown in the dialog header (next to title). */
  headerIcon?: React.ReactNode;
  /** Callback when the user cancels/closes the dialog. */
  onClose: () => void;
  /** Callback when the user confirms. */
  onConfirm: () => void;
  /** Optional: disable/lock UI while confirm action is running. */
  isConfirmLoading?: boolean;
  /** Optional: override button labels. */
  confirmText?: string;
  cancelText?: string;
  /** Optional: make confirm button "danger" (error) or default (primary). */
  confirmColor?: "primary" | "error";
  /** Optional: auto-focus the confirm button (useful for primary actions). */
  autoFocusConfirm?: boolean;
  /** Optional: whether to show the cancel button. */
  hasCancelButton?: boolean;
}>;

const toNonEmptyStringOrFallback = (value: string, fallback: string): string => {
  // Defensive runtime validation: only accept non-empty trimmed strings.
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title,
  description,
  headerIcon,
  onClose,
  onConfirm,
  isConfirmLoading = false,
  confirmText,
  cancelText,
  confirmColor = "primary",
  autoFocusConfirm = false,
  hasCancelButton = true,
}) => {
  // Resolve labels with safe fallbacks (no empty labels).
  const resolvedTitle = toNonEmptyStringOrFallback(title, "Confirm");
  const resolvedConfirmText = toNonEmptyStringOrFallback(confirmText ?? "Confirm", "Confirm");
  const resolvedCancelText = toNonEmptyStringOrFallback(cancelText ?? "Cancel", "Cancel");

  return (
    <Dialog
      open={open}
      // Close only when not loading, to avoid accidental dismissal mid-request.
      onClose={isConfirmLoading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
    >
      <DialogTitle id="confirmation-dialog-title">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1, color: "primary.main" }}>
            {resolvedTitle}
          </Typography>
          {headerIcon ?? null}
        </Box>
      </DialogTitle>

      <DialogContent>
        <DialogContentText
          id="confirmation-dialog-description"
          variant="body1"
          sx={{ fontWeight: 600, lineHeight: 1, mt: 2 }}
        >
          {description}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {hasCancelButton && (
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={isConfirmLoading}
          sx={{ borderRadius: 2, px: 3, textTransform: "none", fontWeight: 700 }}
        >
            {resolvedCancelText}
          </Button>
        )}

        <Button
          onClick={onConfirm}
          variant="contained"
          color={confirmColor}
          disabled={isConfirmLoading}
          autoFocus={autoFocusConfirm}
          sx={{ borderRadius: 2, px: 3, textTransform: "none", fontWeight: 700 }}
        >
          {isConfirmLoading ? (
            <>
              <CircularProgress size={18} sx={{ color: "inherit", mr: 1 }} />
              {resolvedConfirmText}
            </>
          ) : (
            resolvedConfirmText
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;


