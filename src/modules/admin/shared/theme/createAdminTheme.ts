import { alpha, createTheme, type Theme } from '@mui/material/styles';
import type { ThemeMode } from '../../../../core/constants/theme';
import {
  ADMIN_GREY,
  ADMIN_INDIGO,
  ADMIN_INDIGO_HOVER,
  ADMIN_INK,
  ADMIN_PALETTE,
} from './adminTokens';

/** Text direction accepted by the admin theme. */
export type AdminDirection = 'ltr' | 'rtl';

/** Shared easing curve for micro-interactions. */
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

/**
 * Builds the MUI theme used by every admin screen.
 * Component defaults are restyled here so dialogs, tables and inputs deep inside
 * the admin pages pick up the new design without per-component overrides.
 */
export const createAdminTheme = (mode: ThemeMode, direction: AdminDirection): Theme => {
  // Resolve the palette for the requested mode.
  const p = ADMIN_PALETTE[mode];
  const isDark = mode === 'dark';

  // Focus ring drawn around inputs and buttons.
  const focusRing = `0 0 0 4px ${alpha(p.primary.main, isDark ? 0.28 : 0.16)}`;
  const floatingBorder = `1px solid ${p.divider}`;

  return createTheme({
    direction,
    palette: {
      mode,
      primary: p.primary,
      secondary: p.secondary,
      success: p.success,
      warning: p.warning,
      error: p.error,
      info: p.info,
      grey: ADMIN_GREY,
      background: p.background,
      text: p.text,
      divider: p.divider,
      action: {
        hover: alpha(p.primary.main, isDark ? 0.08 : 0.05),
        selected: alpha(p.primary.main, isDark ? 0.16 : 0.1),
        focus: alpha(p.primary.main, 0.16),
      },
    },
    shape: { borderRadius: 14 },
    spacing: 8,
    typography: {
      fontFamily: 'var(--font-base)',
      h3: { fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' },
      h4: { fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.015em' },
      h5: { fontSize: '1.375rem', fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.01em' },
      h6: { fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.4 },
      subtitle1: { fontSize: '1rem', fontWeight: 700, lineHeight: 1.5 },
      subtitle2: { fontSize: '0.875rem', fontWeight: 700, lineHeight: 1.5 },
      body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
      body2: { fontSize: '0.875rem', lineHeight: 1.6 },
      caption: { fontSize: '0.75rem', lineHeight: 1.5 },
      overline: { fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.12em', lineHeight: 1.6 },
      button: { textTransform: 'none', fontWeight: 700, letterSpacing: 0 },
    },
    components: {
      // ── Buttons ────────────────────────────────────────────────────────────
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 10,
            minHeight: 38,
            paddingInline: 16,
            transition: `all 0.2s ${EASE}`,
            '&.Mui-focusVisible': { boxShadow: focusRing },
          },
          sizeSmall: { minHeight: 30, paddingInline: 12, fontSize: '0.8125rem', borderRadius: 8 },
          sizeLarge: { minHeight: 48, paddingInline: 22, fontSize: '0.975rem', borderRadius: 12 },
          // Solid app navy in both modes — no multi-hue gradient.
          containedPrimary: {
            color: '#FFFFFF',
            backgroundColor: ADMIN_INDIGO,
            backgroundImage: 'none',
            boxShadow: `0 8px 18px -10px ${alpha(ADMIN_INDIGO, 0.55)}`,
            '&:hover': {
              backgroundColor: ADMIN_INDIGO_HOVER,
              backgroundImage: 'none',
              boxShadow: `0 10px 22px -10px ${alpha(ADMIN_INDIGO, 0.65)}`,
              transform: 'translateY(-1px)',
            },
            '&.Mui-disabled': { backgroundImage: 'none', boxShadow: 'none' },
          },
          containedError: {
            boxShadow: `0 8px 20px -10px ${alpha(p.error.main, 0.8)}`,
          },
          outlined: {
            borderColor: p.inputBorder,
            backgroundColor: isDark ? alpha('#FFFFFF', 0.02) : '#FFFFFF',
            '&:hover': { borderColor: p.inputBorderHover },
          },
          outlinedPrimary: {
            borderColor: alpha(p.primary.main, 0.35),
            '&:hover': { borderColor: p.primary.main, backgroundColor: alpha(p.primary.main, 0.06) },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            transition: `all 0.2s ${EASE}`,
            '&.Mui-focusVisible': { boxShadow: focusRing },
          },
        },
      },

      // ── Inputs ─────────────────────────────────────────────────────────────
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: isDark ? alpha('#FFFFFF', 0.02) : '#FFFFFF',
            transition: `box-shadow 0.2s ${EASE}, background-color 0.2s ${EASE}`,
            '&:hover:not(.Mui-focused):not(.Mui-error):not(.Mui-disabled) .MuiOutlinedInput-notchedOutline': {
              borderColor: p.inputBorderHover,
            },
            '&.Mui-focused': { boxShadow: focusRing },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 1, borderColor: p.primary.main },
            '&.Mui-error.Mui-focused': { boxShadow: `0 0 0 4px ${alpha(p.error.main, 0.16)}` },
            '&.Mui-disabled': { backgroundColor: p.surfaceMuted },
          },
          notchedOutline: { borderColor: p.inputBorder },
          input: { fontWeight: 500 },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { fontWeight: 600, color: p.text.secondary },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: { fontWeight: 500, marginInline: 4 },
        },
      },
      MuiSelect: {
        styleOverrides: {
          select: { fontWeight: 500 },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: { borderRadius: 8 },
        },
      },
      // iOS-style switch with a filled brand track.
      MuiSwitch: {
        styleOverrides: {
          root: {
            width: 42,
            height: 26,
            padding: 0,
            margin: 8,
            overflow: 'visible',
          },
          switchBase: {
            padding: 3,
            '&.Mui-checked': {
              transform: 'translateX(16px)',
              color: '#FFFFFF',
              '& + .MuiSwitch-track': { backgroundColor: p.primary.main, opacity: 1 },
            },
            '&.Mui-disabled + .MuiSwitch-track': { opacity: 0.45 },
            '&.Mui-disabled .MuiSwitch-thumb': { color: isDark ? '#9AA1B9' : '#F1F5F9' },
          },
          thumb: {
            width: 20,
            height: 20,
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)',
          },
          track: {
            borderRadius: 13,
            opacity: 1,
            backgroundColor: isDark ? '#353B60' : '#CBD2E1',
            transition: `background-color 0.2s ${EASE}`,
          },
          sizeSmall: {
            width: 34,
            height: 20,
            '& .MuiSwitch-switchBase': {
              padding: 3,
              '&.Mui-checked': { transform: 'translateX(14px)' },
            },
            '& .MuiSwitch-thumb': { width: 14, height: 14 },
          },
        },
      },

      // ── Surfaces ───────────────────────────────────────────────────────────
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { backgroundImage: 'none' },
          outlined: { borderColor: p.divider },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: 20, border: floatingBorder, boxShadow: p.shadowSm },
        },
      },
      MuiAccordion: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: floatingBorder,
            '&:before': { display: 'none' },
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: p.divider },
        },
      },

      // ── Dialogs ────────────────────────────────────────────────────────────
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 20,
            border: floatingBorder,
            boxShadow: p.shadowLg,
            backgroundImage: 'none',
            overflow: 'hidden',
            '@media (max-width: 767px)': {
              margin: 8,
              width: 'calc(100% - 16px)',
              maxWidth: 'calc(100% - 16px)',
              maxHeight: 'calc(100% - 16px)',
              borderRadius: 16,
            },
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: { padding: '20px 24px', fontWeight: 800, fontSize: '1.125rem' },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: { padding: '8px 24px 20px' },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: '14px 24px',
            borderTop: floatingBorder,
            backgroundColor: p.surfaceMuted,
            '@media (max-width: 767px)': {
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: 8,
              '& > :not(style) ~ :not(style)': { marginLeft: 0 },
            },
          },
        },
      },
      MuiBackdrop: {
        styleOverrides: {
          root: {
            // Only tint modal backdrops; invisible backdrops (menus) stay transparent.
            '&:not(.MuiBackdrop-invisible)': {
              backgroundColor: alpha(ADMIN_INK, isDark ? 0.72 : 0.42),
              backdropFilter: 'blur(4px)',
            },
          },
        },
      },

      // ── Floating layers ────────────────────────────────────────────────────
      MuiPopover: {
        styleOverrides: {
          paper: { borderRadius: 14, border: floatingBorder, boxShadow: p.shadowLg },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: { borderRadius: 14, border: floatingBorder, boxShadow: p.shadowLg },
          list: { padding: 6 },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            minHeight: 36,
            fontSize: '0.875rem',
            fontWeight: 500,
            '&.Mui-selected': {
              backgroundColor: alpha(p.primary.main, isDark ? 0.18 : 0.1),
              fontWeight: 700,
              '&:hover': { backgroundColor: alpha(p.primary.main, isDark ? 0.24 : 0.14) },
            },
          },
        },
      },
      MuiTooltip: {
        defaultProps: { arrow: true },
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#22264A' : '#111427',
            color: '#F1F2F8',
            fontSize: '0.75rem',
            fontWeight: 600,
            borderRadius: 8,
            padding: '6px 10px',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)',
          },
          arrow: { color: isDark ? '#22264A' : '#111427' },
        },
      },

      // ── Data display ───────────────────────────────────────────────────────
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: p.text.secondary,
              backgroundColor: p.surfaceMuted,
              borderBottom: floatingBorder,
              whiteSpace: 'nowrap',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottomColor: p.divider, fontSize: '0.875rem' },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: `background-color 0.15s ${EASE}`,
            '&.MuiTableRow-hover:hover': { backgroundColor: alpha(p.primary.main, isDark ? 0.08 : 0.035) },
          },
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          selectLabel: { fontWeight: 600, fontSize: '0.8125rem' },
          displayedRows: { fontWeight: 600, fontSize: '0.8125rem' },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8, fontWeight: 700 },
          sizeSmall: { fontSize: '0.75rem' },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: { fontWeight: 700 },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: { borderRadius: 10 },
        },
      },
      MuiCircularProgress: {
        defaultProps: { thickness: 4.5 },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 999 },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: { backgroundColor: alpha(p.text.primary, isDark ? 0.08 : 0.06) },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 12, fontWeight: 500 },
        },
      },
    },
  });
};
