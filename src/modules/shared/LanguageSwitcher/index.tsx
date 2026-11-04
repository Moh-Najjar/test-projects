import React from "react";
import {
  Box,
  ButtonBase,
  Stack,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { AppLanguage } from "../../../i18n/languages";
import { useDeviceType } from "../../../core/hooks/useDeviceType";

// ─── Flag Icons ──────────────────────────────────────────────────────────────

/** Simple circle UK flag */
const EnglishFlag: React.FC = () => (
  <Box
    component="svg"
    viewBox="0 0 100 100"
    sx={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0 }}
  >
    <rect width="100" height="100" fill="#012169" />
    <path d="M0,0 L100,100 M100,0 L0,100" stroke="#fff" strokeWidth="20" />
    <path d="M0,0 L100,100 M100,0 L0,100" stroke="#C8102E" strokeWidth="12" />
    <path d="M50,0 V100 M0,50 H100" stroke="#fff" strokeWidth="30" />
    <path d="M50,0 V100 M0,50 H100" stroke="#C8102E" strokeWidth="18" />
  </Box>
);

/** Simple circle Jordan flag */
const ArabicFlag: React.FC = () => (
  <Box
    component="svg"
    viewBox="0 0 100 100"
    sx={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0 }}
  >
    <rect width="100" height="33.3" fill="#000" />
    <rect y="33.3" width="100" height="33.3" fill="#fff" />
    <rect y="66.6" width="100" height="33.3" fill="#007A3D" />
    <path d="M0,0 L50,50 L0,100 Z" fill="#CE1126" />
    {/* Seven-pointed star simplified but larger */}
    <path
      d="M10,50 L16,44 L23,44 L29,50 L23,56 L16,56 Z"
      fill="#fff"
    />
  </Box>
);

// ─── LanguageSwitcher ─────────────────────────────────────────────────────────

const LanguageSwitcher: React.FC = () => {
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const { i18n } = useTranslation();
  const theme = useTheme();

  // Get current language with proper type checking
  const currentLanguage = i18n.language;
  const current: AppLanguage = currentLanguage === "ar" ? "ar" : "en";

  // Handle language switching
  const switchTo = (lng: AppLanguage): void => {
    if (lng === current) {
      return; // Prevent unnecessary switches
    }
    i18n.changeLanguage(lng);
  };

  const languages = [
    { id: "en" as const, label: "English", flag: <EnglishFlag /> },
    { id: "ar" as const, label: "العربية", flag: <ArabicFlag /> },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        backgroundColor: "background.paper",
        // Pixel padding so the admin theme's 8px scale does not inflate the control on a phone.
        p: isMobile ? "3px" : 0.5,
        borderRadius: isMobile ? "999px" : 2,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 2px 4px rgba(0,0,0,0.04)", // Subtle shadow
        overflow: "hidden",
      }}
    >
      <Stack direction="row" spacing={0.5}>
        {languages.map((lang) => {
          const isActive = current === lang.id;
          return (
            <ButtonBase
              key={lang.id}
              onClick={() => switchTo(lang.id)}
              sx={{
                px: isMobile ? "12px" : 1.5,
                py: isMobile ? "8px" : 0.75,
                borderRadius: 1.5,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                backgroundColor: isActive
                  ? alpha(theme.palette.primary.main, 0.08)
                  : "transparent",
                color: isActive ? "primary.main" : "text.secondary",
                "&:hover": {
                  backgroundColor: isActive
                    ? alpha(theme.palette.primary.main, 0.12)
                    : alpha(theme.palette.text.primary, 0.04),
                  transform: isActive ? "none" : "translateY(-1px)",
                },
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.25}
                sx={{
                  // Reversing for Arabic label placement if needed
                  flexDirection: lang.id === "ar" ? "row-reverse" : "row",
                  gap: lang.id === "ar" ? 1 : 0,
                }}
              >
                <Box>
                  {lang.flag}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "0.85rem",
                    letterSpacing: lang.id === "en" ? "0.2px" : "0",
                    fontFamily:
                      lang.id === "ar" ? '"Tajawal", sans-serif' : "inherit",
                  }}
                >
                  {lang.label}
                </Typography>
              </Stack>
            </ButtonBase>
          );
        })}
      </Stack>
    </Box>
  );
};

export default LanguageSwitcher;
