import React, { useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useTheme as useAppThemeMode } from '../../../../core/context/ThemeContext';
import { isRtl } from '../../../../i18n/languages';
import { createAdminTheme, type AdminDirection } from './createAdminTheme';

/**
 * Scopes the admin design system to the admin routes.
 * Light/dark mode and text direction still follow the global app preferences,
 * so the shared theme toggle and language switcher keep working.
 */
const AdminThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // Current light/dark mode from the global theme context.
  const { mode } = useAppThemeMode();

  // Direction is derived from the active language, matching the global theme.
  const { i18n } = useTranslation();
  const direction: AdminDirection = isRtl(i18n.language) ? 'rtl' : 'ltr';

  // Rebuild the admin theme only when mode or direction change.
  const theme = useMemo(() => createAdminTheme(mode, direction), [mode, direction]);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export default AdminThemeProvider;
