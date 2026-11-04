import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import { isRtl } from "../../i18n/languages";
import {
  DEFAULT_THEME_MODE,
  THEME_CONFIG,
  THEME_STORAGE_KEY,
  isThemeMode,
  type ThemeMode,
} from "../constants/theme";

// Define theme context interface
interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

// Create theme context with default value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/** Read the persisted theme preference from localStorage. Falls back to the
 *  app default (light) if no preference has been stored yet. */
const resolveInitialMode = (): ThemeMode => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored !== null && isThemeMode(stored)) return stored;
  } catch {
    // localStorage unavailable (e.g. private-browsing restriction) — ignore.
  }

  return DEFAULT_THEME_MODE;
};

// Theme provider component
export const ThemeContextProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [mode, setModeState] = useState<ThemeMode>(resolveInitialMode);

  // Read language to derive direction
  const { i18n } = useTranslation();
  const direction = isRtl(i18n.language) ? "rtl" : "ltr";

  // Persist the chosen mode whenever it changes.
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.warn("Failed to save theme mode to localStorage:", error);
    }
  }, [mode]);

  // Keep the document root in sync so global CSS (scrollbars, color-scheme) follows the theme.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  const toggleTheme = useCallback((): void => {
    setModeState((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const setTheme = useCallback((requestedMode: ThemeMode): void => {
    setModeState(requestedMode);
  }, []);

  // Create Material-UI theme based on current mode and language direction
  const theme = useMemo(() => {
    const themeConfig = THEME_CONFIG[mode];
    const commonConfig = THEME_CONFIG.common;
    const isDark = mode === "dark";

    // Light mode keeps a white page; dark mode uses the deepest layer so cards stand out.
    const pageBackground = isDark
      ? themeConfig.background.default
      : themeConfig.background.paper;

    // Hairline used to outline floating surfaces (menus, dialogs) in dark mode,
    // where shadows alone are not visible.
    const floatingBorder = `1px solid ${themeConfig.divider}`;

    return createTheme({
      direction,
      palette: {
        mode,
        primary: themeConfig.primary,
        secondary: themeConfig.secondary,
        // MUI uses the spelling "grey" for the gray ramp: `theme.palette.grey[500]`.
        // We store it as `gray` in our config, then map it here to match MUI's API.
        grey: themeConfig.gray,
        background: themeConfig.background,
        text: themeConfig.text,
        divider: themeConfig.divider,
        action: themeConfig.action,
        error: themeConfig.error,
        warning: themeConfig.warning,
        info: themeConfig.info,
        success: themeConfig.success,
      },
      shape: commonConfig.shape,
      typography: {
        ...commonConfig.typography,
        fontFamily: "var(--font-base)",
      },
      transitions: commonConfig.transitions,
      spacing: commonConfig.spacing,
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: pageBackground,
              color: themeConfig.text.primary,
              transition: `background-color ${commonConfig.transitions.duration.standard}ms ${commonConfig.transitions.easing.easeInOut}, color ${commonConfig.transitions.duration.standard}ms ${commonConfig.transitions.easing.easeInOut}`,
              fontFamily: "var(--font-base)",
            },
          },
        },
        MuiCardContent: {
          styleOverrides: {
            root: {
              // MUI adds `padding-bottom: 24px` to the last-child by default.
              // We explicitly remove it project-wide to match desired layout.
              "&:last-child": {
                paddingBottom: 0,
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              // MUI lightens dark papers with a white gradient per elevation,
              // which washes out the navy palette. Use flat surfaces instead.
              ...(isDark && { backgroundImage: "none" }),
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              ...(isDark && { border: floatingBorder }),
              // Keep dialogs inside the phone viewport instead of a desktop sheet.
              '@media (max-width: 767px)': {
                margin: 12,
                width: 'calc(100% - 24px)',
                maxWidth: 'calc(100% - 24px)',
                maxHeight: 'calc(100% - 24px)',
              },
            },
          },
        },
        MuiDialogActions: {
          styleOverrides: {
            root: {
              '@media (max-width: 767px)': {
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 8,
                paddingLeft: 16,
                paddingRight: 16,
                paddingBottom: 16,
                '& > :not(style) ~ :not(style)': { marginLeft: 0 },
              },
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              '@media (max-width: 767px)': {
                '&:not(.MuiButton-sizeSmall)': { minHeight: 44 },
              },
            },
          },
        },
        MuiPopover: {
          styleOverrides: {
            paper: {
              ...(isDark && {
                backgroundColor: themeConfig.background.surface,
                border: floatingBorder,
              }),
            },
          },
        },
        MuiMenu: {
          styleOverrides: {
            paper: {
              ...(isDark && {
                backgroundColor: themeConfig.background.surface,
                border: floatingBorder,
              }),
            },
          },
        },
        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              ...(isDark && {
                backgroundColor: themeConfig.background.surface,
                color: themeConfig.text.primary,
                border: floatingBorder,
                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.45)",
              }),
            },
            arrow: {
              ...(isDark && { color: themeConfig.background.surface }),
            },
          },
        },
        MuiBackdrop: {
          styleOverrides: {
            root: {
              // Only tint modal backdrops; invisible backdrops (menus) stay transparent.
              ...(isDark && {
                "&:not(.MuiBackdrop-invisible)": {
                  backgroundColor: "rgba(3, 8, 15, 0.72)",
                },
              }),
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            notchedOutline: {
              ...(isDark && { borderColor: "rgba(157, 178, 204, 0.28)" }),
            },
            root: {
              ...(isDark && {
                "&:hover:not(.Mui-focused):not(.Mui-error):not(.Mui-disabled) .MuiOutlinedInput-notchedOutline":
                  { borderColor: "rgba(157, 178, 204, 0.55)" },
              }),
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              // MUI darkens the divider for table rules, making them vanish on navy.
              ...(isDark && { borderBottomColor: themeConfig.divider }),
            },
          },
        },
        MuiSkeleton: {
          styleOverrides: {
            root: {
              ...(isDark && { backgroundColor: "rgba(157, 178, 204, 0.12)" }),
            },
          },
        },
      },
    });
  }, [mode, direction]);

  // Context value
  const contextValue: ThemeContextType = useMemo(
    () => ({ mode, toggleTheme, setTheme }),
    [mode, toggleTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeContextProvider");
  }
  return context;
};

// Export the context for direct usage if needed
export { ThemeContext };

