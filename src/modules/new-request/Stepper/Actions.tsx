import React from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import styles from "./Stepper.module.css";
import { useLocale } from "../../../core/hooks/useLocale";

interface ActionsProps {
  activeStep: number;
  isReviewStep: boolean;
  isSubmitDisabled: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

const Actions: React.FC<ActionsProps> = ({
  activeStep,
  isReviewStep,
  isSubmitDisabled,
  isSubmitting,
  onBack,
  onNext,
  onSubmit,
}) => {
  const { t, isAr } = useLocale();

  return (
    <Box
      data-tour="stepper-actions"
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
        "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } },
      }}
    >
      <Button
        disabled={activeStep === 0}
        onClick={onBack}
        variant="outlined"
        color="primary"
        startIcon={isAr ? <ArrowForwardIcon /> : <ArrowBackIcon />}
        sx={{ borderRadius: "8px", px: 4, textTransform: "none", fontWeight: 600 }}
      >
        {t("stepper.back")}
      </Button>

      <Button
        onClick={isReviewStep ? onSubmit : onNext}
        variant="contained"
        color="primary"
        disableElevation
        disabled={isReviewStep && (isSubmitDisabled || isSubmitting)}
        startIcon={
          isReviewStep ? (
            isSubmitting ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <CheckCircleOutlineIcon />
            )
          ) : undefined
        }
        endIcon={
          !isReviewStep ? (isAr ? <ArrowBackIcon /> : <ArrowForwardIcon />) : undefined
        }
        sx={{ borderRadius: "8px", px: 4, textTransform: "none", fontWeight: 600 }}
      >
        {isReviewStep ? t("stepper.submit") : t("stepper.next")}
      </Button>
    </Box>
  );
};

export default Actions;
