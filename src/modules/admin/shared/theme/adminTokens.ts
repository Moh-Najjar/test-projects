import { alpha, type Theme } from '@mui/material/styles';
import {
  BRAND_ACCENT,
  BRAND_ACCENT_DARK,
  BRAND_ACCENT_LIGHT,
  BRAND_NAVY,
  BRAND_NAVY_DARK,
  BRAND_NAVY_LIGHT,
  type CategoryColor,
  type ThemeMode,
} from '../../../../core/constants/theme';

// ─── Admin design tokens ──────────────────────────────────────────────────────
// Actions and brand marks reuse the public app navy / teal so the console feels
// like ASEZA, not a separate dark theme. Surfaces stay independent (sand canvas,
// obsidian sidebar). Buttons are solid fills — no multi-hue gradient.

/** App teal — tints, icon highlights and focus rings. */
export const ADMIN_ACCENT = BRAND_ACCENT;
/** App navy — primary actions, logo tile and active nav. */
export const ADMIN_INDIGO = BRAND_NAVY;
/** Hover / lifted navy used on primary buttons. */
export const ADMIN_INDIGO_HOVER = BRAND_NAVY_LIGHT;
/** Pressed navy. */
export const ADMIN_INDIGO_DARK = BRAND_NAVY_DARK;
/** Warm gold used for hairlines and the active-nav tick. */
export const ADMIN_GOLD = '#C4A35A';
/** App teal, used for secondary glows. */
export const ADMIN_CYAN = BRAND_ACCENT;

/**
 * Same-hue vertical sheen for a few decorative fills.
 * Primary buttons stay solid navy — they do not use this.
 */
export const ADMIN_GRADIENT = `linear-gradient(180deg, ${BRAND_NAVY_LIGHT} 0%, ${BRAND_NAVY} 100%)`;
/** Slightly lifted sheen used on hover of gradient surfaces. */
export const ADMIN_GRADIENT_HOVER = `linear-gradient(180deg, ${BRAND_NAVY_LIGHT} 0%, ${BRAND_NAVY} 100%)`;

/** Deep ink background of the sidebar and cinematic panels. */
export const ADMIN_INK = '#080A10';
/** Raised surface on top of the ink background. */
export const ADMIN_INK_SURFACE = '#12151F';

/** Monospace stack used for keys, formulas and code samples. */
export const ADMIN_MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

// ─── Mode palettes ────────────────────────────────────────────────────────────

/** Shape of a single colour ramp entry passed to MUI. */
export interface AdminColorRamp {
  main: string;
  light: string;
  dark: string;
  contrastText: string;
}

/** Full palette for one theme mode. */
export interface AdminModePalette {
  primary: AdminColorRamp;
  secondary: AdminColorRamp;
  success: AdminColorRamp;
  warning: AdminColorRamp;
  error: AdminColorRamp;
  info: AdminColorRamp;
  background: { default: string; paper: string };
  /** Muted surface used for table headers, dialog footers and inset panels. */
  surfaceMuted: string;
  text: { primary: string; secondary: string; disabled: string };
  divider: string;
  inputBorder: string;
  inputBorderHover: string;
  /** Small elevation shadow for cards. */
  shadowSm: string;
  /** Large elevation shadow for popovers and dialogs. */
  shadowLg: string;
}

export const ADMIN_PALETTE: Record<ThemeMode, AdminModePalette> = {
  light: {
    primary: { main: BRAND_NAVY, light: BRAND_NAVY_LIGHT, dark: BRAND_NAVY_DARK, contrastText: '#FFFFFF' },
    secondary: { main: BRAND_ACCENT, light: BRAND_ACCENT_LIGHT, dark: BRAND_ACCENT_DARK, contrastText: '#FFFFFF' },
    success: { main: '#0F9F6E', light: '#31C48D', dark: '#057A55', contrastText: '#FFFFFF' },
    warning: { main: '#D97706', light: '#F59E0B', dark: '#B45309', contrastText: '#FFFFFF' },
    error: { main: '#E11D48', light: '#F43F5E', dark: '#BE123C', contrastText: '#FFFFFF' },
    info: { main: '#0284C7', light: '#0EA5E9', dark: '#0369A1', contrastText: '#FFFFFF' },
    background: { default: '#F3EFE6', paper: '#FFFDF8' },
    surfaceMuted: '#F7F3EA',
    text: { primary: '#16140F', secondary: '#5C574C', disabled: '#A39C8E' },
    divider: '#E7E1D4',
    inputBorder: '#DDD6C8',
    inputBorderHover: '#C4BBA8',
    shadowSm: '0 1px 2px rgba(22, 20, 15, 0.04), 0 8px 24px -12px rgba(22, 20, 15, 0.12)',
    shadowLg: '0 24px 48px -12px rgba(22, 20, 15, 0.22)',
  },
  dark: {
    primary: { main: BRAND_NAVY_LIGHT, light: '#6BB3D4', dark: BRAND_NAVY, contrastText: '#FFFFFF' },
    secondary: { main: BRAND_ACCENT, light: BRAND_ACCENT_LIGHT, dark: BRAND_ACCENT_DARK, contrastText: '#FFFFFF' },
    success: { main: '#34D399', light: '#6EE7B7', dark: '#10B981', contrastText: '#080A10' },
    warning: { main: '#FBBF24', light: '#FCD34D', dark: '#F59E0B', contrastText: '#080A10' },
    error: { main: '#FB7185', light: '#FDA4AF', dark: '#F43F5E', contrastText: '#080A10' },
    info: { main: '#38BDF8', light: '#7DD3FC', dark: '#0EA5E9', contrastText: '#080A10' },
    background: { default: '#07080C', paper: '#10131A' },
    surfaceMuted: '#161A24',
    text: { primary: '#F3EEE4', secondary: '#A39B8C', disabled: '#6B665C' },
    divider: '#232833',
    inputBorder: '#2C3340',
    inputBorderHover: '#454C5C',
    shadowSm: '0 1px 2px rgba(0, 0, 0, 0.35), 0 8px 24px -12px rgba(0, 0, 0, 0.55)',
    shadowLg: '0 24px 56px -12px rgba(0, 0, 0, 0.72)',
  },
};

/** Neutral grey ramp shared by both modes. */
export const ADMIN_GREY = {
  50: '#F8F6F1',
  100: '#EFEBE3',
  200: '#E2DCCF',
  300: '#C9C1B0',
  400: '#9A9284',
  500: '#6F695E',
  600: '#524E45',
  700: '#3A372F',
  800: '#24221C',
  900: '#16140F',
} as const;

// ─── Tones ────────────────────────────────────────────────────────────────────

/** Named colour tones used by stat cards, icon tiles and page headers. */
export type AdminTone = 'indigo' | 'violet' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'slate';

/** Solid colour and matching gradient for a tone. */
export interface AdminToneStyle {
  main: string;
  gradient: string;
}

export const ADMIN_TONES: Record<AdminTone, AdminToneStyle> = {
  indigo: { main: BRAND_NAVY, gradient: `linear-gradient(180deg, ${BRAND_NAVY_LIGHT} 0%, ${BRAND_NAVY} 100%)` },
  violet: { main: '#4A3F6B', gradient: 'linear-gradient(180deg, #5A4F7B 0%, #4A3F6B 100%)' },
  emerald: { main: '#1B6B4A', gradient: 'linear-gradient(180deg, #228056 0%, #1B6B4A 100%)' },
  amber: { main: '#A67C2D', gradient: 'linear-gradient(180deg, #B88A38 0%, #A67C2D 100%)' },
  rose: { main: '#B42341', gradient: 'linear-gradient(180deg, #C42E4C 0%, #B42341 100%)' },
  cyan: { main: BRAND_ACCENT, gradient: `linear-gradient(180deg, ${BRAND_ACCENT_LIGHT} 0%, ${BRAND_ACCENT} 100%)` },
  slate: { main: '#5C574C', gradient: 'linear-gradient(180deg, #6F695E 0%, #5C574C 100%)' },
};

// ─── Category colours (documentation sections) ────────────────────────────────

/** Admin re-mapping of the shared category keys onto the admin palette. */
const ADMIN_CATEGORY_COLORS: Record<CategoryColor, Record<ThemeMode, string>> = {
  navy: { light: BRAND_NAVY, dark: BRAND_NAVY_LIGHT },
  purple: { light: '#4A3F6B', dark: '#B7A9D4' },
  teal: { light: BRAND_ACCENT, dark: BRAND_ACCENT_LIGHT },
  amber: { light: '#C9922A', dark: '#E0B35A' },
};

/** Returns the admin hex value of a category colour for the active theme mode. */
export const resolveAdminCategoryColor = (color: CategoryColor, mode: ThemeMode): string =>
  ADMIN_CATEGORY_COLORS[color][mode];

/** Card / panel outline that stays visible in both theme modes. */
export const adminSubtleBorder = (theme: Theme, lightAlpha: number): string =>
  theme.palette.mode === 'dark' ? theme.palette.divider : alpha(theme.palette.divider, Math.max(lightAlpha, 0.7));
