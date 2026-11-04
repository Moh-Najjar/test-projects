import React from "react";
import { Box, Stepper, Step, StepLabel } from "@mui/material";
import styles from "./Stepper.module.css";
import { StepIconProps } from "@mui/material/StepIcon";
import { styled } from "@mui/material/styles";

interface ContentProps {
  activeStep: number;
  steps: { Key: number; Title: string }[];
}

// Add custom styling for the step icon
const CustomStepIcon = styled("div")<{
  ownerState: { completed?: boolean; active?: boolean };
}>(({ theme, ownerState }) => ({
  backgroundColor: ownerState.completed
    ? theme.palette.primary.main
    : ownerState.active
    ? theme.palette.primary.main
    : theme.palette.background.paper,
  zIndex: 1,
  color: ownerState.active || ownerState.completed ? theme.palette.common.white : theme.palette.text.disabled,
  width: "40px",
  height: "40px",
  [theme.breakpoints.down("md")]: {
    width: "32px",
    height: "32px",
    fontSize: "0.8rem",
  },
  display: "flex",
  borderRadius: "50%",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
  border: `1px solid ${
    ownerState.active || ownerState.completed ? theme.palette.primary.main : theme.palette.divider
  }`,
  fontWeight: "bold",
  transition: "all 0.3s ease",
  boxShadow: ownerState.active ? `0 0 0 4px ${theme.palette.primary.light}40` : "none",
}));

const StyledStep = styled(Step)(({ theme }) => ({
  "& .MuiStepLabel-label": {
    fontWeight: 500,
    marginTop: "8px !important",
    color: theme.palette.text.secondary,
    "&.Mui-active": {
      color: theme.palette.primary.main,
      fontWeight: 700,
    },
    "&.Mui-completed": {
      color: theme.palette.text.primary,
    },
  },
}));

const Header: React.FC<ContentProps> = ({ activeStep, steps }) => {
  return (
    // Horizontal scroll is only for narrow screens with many steps.
    // overflow-x: auto also computes overflow-y to auto, so the active-step
    // ring (4px box-shadow) and the header's bottom margin were painting a
    // vertical scrollbar. Lock the vertical axis and pad so the ring is not clipped.
    <Box
      sx={{
        width: "100%",
        overflowX: "auto",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
        py: "6px",
        mb: "3rem",
      }}
    >
    <Stepper
      data-tour="stepper-header"
      activeStep={activeStep}
      alternativeLabel
      className={styles.stepperHeader}
      sx={{
        minWidth: { xs: Math.max(steps.length, 1) * 92, md: "100%" },
        mb: 0,
        "& .MuiStepLabel-label": {
          fontSize: { xs: "0.7rem", md: "0.875rem" },
        },
        "& .MuiStepConnector-line": {
          borderColor: "divider",
          borderTopWidth: "2px",
        },
        "& .MuiStepConnector-root.Mui-active .MuiStepConnector-line": {
          borderColor: "primary.main",
        },
        "& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line": {
          borderColor: "primary.main",
        },
      }}
    >
      {steps.map((page) => (
        <StyledStep key={page.Key}>
          <StepLabel
            StepIconComponent={(props: StepIconProps) => (
              <CustomStepIcon ownerState={props}>
                {props.completed ? "✓" : props.icon}
              </CustomStepIcon>
            )}
          >
            {page.Title}
          </StepLabel>
        </StyledStep>
      ))}
    </Stepper>
    </Box>
  );
};

export default Header;
