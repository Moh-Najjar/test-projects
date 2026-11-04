import React from "react";

import { Brightness4, Brightness7 } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";

import { useTheme } from "../../../core/context/ThemeContext";

const ThemeToggle: React.FC = () => {
  const { mode, toggleTheme } = useTheme();

  return (
    <Tooltip title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}>
      <IconButton
        onClick={toggleTheme}
        color="inherit"
        aria-label={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
        sx={{
          transition: "transform 0.2s ease",
          "&:hover": {
            transform: "scale(1.1)",
          },
        }}
      >
        {mode === "light" ? <Brightness4 /> : <Brightness7 />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
