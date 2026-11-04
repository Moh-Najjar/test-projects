import React from "react";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";

import { useLocale } from "../../../../core/hooks/useLocale";
import styles from "../../../new-request/Stepper/Stepper.module.css";
import { useAuth } from "../../../../core/context/AuthContext";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import { RequestStatus } from "../../types";

interface ViewActionsProps {
  activeStep: number;
  stepsCount: number;

  requestStatus: RequestStatus;

  /** Opens the edit page for this submission */
  onEdit?: () => void;
  onBack: () => void;
  onNext: () => void;
  /** Navigates the user back to the My Requests list */
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

const ViewActions: React.FC<ViewActionsProps> = ({
  activeStep,
  stepsCount,
  onBack,
  onNext,
  onClose,
  onApprove,
  onReject,
  requestStatus,
  onEdit,
}) => {
  const { t, isAr } = useLocale();
  const isLastStep = activeStep === stepsCount - 1;
  const { userRoles } = useAuth();
  const isApprover = userRoles.includes("APPROVER");
  const isPendingReview = requestStatus.toUpperCase() === 'SUBMITTED';

  return (
    <Box
      className={styles.actionsContainer}
      sx={{
        mt: 4,
        pt: 3,
        borderTop: "1px solid",
        borderColor: "divider",
        justifyContent: { xs: "stretch", sm: "space-between" },
        alignItems: { xs: "stretch", sm: "center" },
        flexDirection: { xs: "column", sm: "row" },
        gap: "8px",
      }}
    >
      {/* ── Left: Back ── */}
      <Button
        disabled={activeStep === 0}
        onClick={onBack}
        variant="outlined"
        startIcon={isAr ? <ArrowForwardIcon /> : <ArrowBackIcon />}
        sx={{ borderRadius: "8px", px: 4, textTransform: "none", fontWeight: 600 }}
      >
        {t("stepper.back")}
      </Button>

      <Box sx={{ display: "flex", gap: "8px", flexDirection: { xs: "column", sm: "row" }, width: { xs: "100%", sm: "auto" }, "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } } }}>
        {isApprover && isLastStep && isPendingReview && <>
          <Tooltip
            title={t("myRequests.detail.cannotEditTooltip")}
            arrow>
            {/* span is required so Tooltip works on a disabled button */}
            <span>
              <Button
                onClick={onReject}
                variant="contained"
                color="error"
                startIcon={<CancelOutlinedIcon />}
                sx={{ borderRadius: "8px", px: 3, textTransform: "none", fontWeight: 600 }}
              >
                {t("myRequests.actions.reject")}
              </Button>
            </span>
          </Tooltip>

          <Tooltip
            title={t("myRequests.detail.cannotEditTooltip")}
            arrow>
            {/* span is required so Tooltip works on a disabled button */}
            <span>
              <Button
                onClick={onApprove}
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                sx={{ borderRadius: "8px", px: 3, textTransform: "none", fontWeight: 600 }}
              >
                {t("myRequests.actions.approve")}
              </Button>
            </span>
          </Tooltip>
        </>}

        <Button
          onClick={onEdit}
          variant="outlined"
          startIcon={<EditOutlinedIcon />}
          sx={{ borderRadius: "8px", px: 3, textTransform: "none", fontWeight: 600 }}
        >
          {t("myRequests.actions.edit")}
        </Button>

        {isLastStep ? (
          <Button
            onClick={onClose}
            variant="contained"
            startIcon={<CloseIcon />}
            disableElevation
            sx={{ borderRadius: "8px", px: 4, textTransform: "none", fontWeight: 600 }}
          >
            {t("myRequests.actions.close")}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            variant="contained"
            endIcon={isAr ? <ArrowBackIcon /> : <ArrowForwardIcon />}
            disableElevation
            sx={{ borderRadius: "8px", px: 4, textTransform: "none", fontWeight: 600 }}
          >
            {t("stepper.next")}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default ViewActions;
