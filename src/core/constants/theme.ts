import { alpha, type Theme } from '@mui/material/styles';

// Gray scale "degrees" used across the app (50 → lightest, 900 → darkest).
// Typed to prevent missing shades and keep usage consistent.
export type GrayShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export type GrayScale = { [K in GrayShade]: string };

// Shared neutral gray ramp (very close to MUI default `grey` scale).
export const GRAY_SCALE = {
  light: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  } satisfies GrayScale,
  dark: {
    // Inverted ramp for dark surfaces — lighter shades read as text, darker as backgrounds.
    50: '#131e2e',
    100: '#1a2838',
    200: '#243648',
    300: '#2d4258',
    400: '#4a6f90',
    500: '#6a8fb0',
    600: '#8aaad0',
    700: '#a8c0de',
    800: '#c8daf5',
    900: '#e8eef5',
  } satisfies GrayScale,
} as const;

// ─── Brand palette ────────────────────────────────────────────────────────────
// These tokens are the single source of truth for the app's design language.
// The Navbar, Login page, and any other component that needs brand colours
// should derive from the theme rather than re-declaring them locally.

/** Deep blue — primary brand colour, AppBar / headers. */
export const BRAND_NAVY = '#0367A6';
/** Slightly lighter blue used for hover / active states. */
export const BRAND_NAVY_LIGHT = '#3698BF';
/** Darkest blue shade for pressed states. */
export const BRAND_NAVY_DARK = '#024a78';
/** Teal brand mark, highlights, CTAs. */
export const BRAND_ACCENT = '#14A697';
/** Lighter teal for hover states on accent surfaces. */
export const BRAND_ACCENT_LIGHT = '#15BF8F';
/** Darker teal for pressed / active accent states. */
export const BRAND_ACCENT_DARK = '#0d7a6e';

/** Deep navy used for brand panels (sidebars, hero banners) in dark mode,
 *  where the bright brand gradient would glare. */
export const BRAND_PANEL_DARK = '#0D2238';
/** Lighter end of the dark-mode brand panel gradient. */
export const BRAND_PANEL_DARK_LIGHT = '#143A5C';

/** Category hues for colour-coded cards and sections. Each has a dark-mode
 *  variant chosen to stay readable as text on dark surfaces. */
export const CATEGORY_COLORS = {
  navy: { light: BRAND_NAVY, dark: '#3A9BD5' },
  purple: { light: '#7b1fa2', dark: '#C08CF0' },
  teal: { light: BRAND_ACCENT, dark: BRAND_ACCENT },
  amber: { light: '#ed6c02', dark: '#FFA940' },
} as const;

export type CategoryColor = keyof typeof CATEGORY_COLORS;

/** Card / panel outline colour. Light mode keeps the requested faint tint;
 *  dark mode uses the full divider, since a faint tint vanishes on navy. */
export const subtleBorder = (theme: Theme, lightAlpha: number): string =>
  theme.palette.mode === 'dark' ? theme.palette.divider : alpha(theme.palette.divider, lightAlpha);

/** Returns the hex value of a category colour for the active theme mode. */
export const resolveCategoryColor = (color: CategoryColor, mode: ThemeMode): string =>
  CATEGORY_COLORS[color][mode];

// Theme configuration constants
export const THEME_CONFIG = {
  // ── Light theme ─────────────────────────────────────────────────────────────
  light: {
    gray: GRAY_SCALE.light,
    primary: {
      main: BRAND_NAVY,
      light: BRAND_NAVY_LIGHT,
      dark: BRAND_NAVY_DARK,
      contrastText: '#ffffff',
    },
    secondary: {
      main: BRAND_ACCENT,
      light: BRAND_ACCENT_LIGHT,
      dark: BRAND_ACCENT_DARK,
      // White text on teal background for better contrast.
      contrastText: '#ffffff',
    },
    background: {
      // Soft blue-grey tint matching the Login page backdrop.
      default: '#f0f4f9',
      paper: '#ffffff',
      surface: '#e8f0fb',
    },
    border: {
      default: BRAND_NAVY,
    },
    text: {
      primary: BRAND_NAVY,
      secondary: '#4d6180',
      success: '#009245',
    },
    divider: '#c5d5e8',
    // MUI's light defaults, listed explicitly so both modes share one shape.
    action: {
      active: 'rgba(0, 0, 0, 0.54)',
      hover: 'rgba(0, 0, 0, 0.04)',
      selected: 'rgba(0, 0, 0, 0.08)',
      focus: 'rgba(0, 0, 0, 0.12)',
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
    success: {
      main: '#009245',
      light: '#4caf50',
      dark: '#1b5e20',
    },
  },

  // ── Dark theme ──────────────────────────────────────────────────────────────
  dark: {
    gray: GRAY_SCALE.dark,
    primary: {
      // Brand blue lifted so it passes contrast as text on dark surfaces
      // while still carrying white text on contained buttons.
      main: '#3A9BD5',
      light: '#6CB8E4',
      dark: '#1F78B0',
      contrastText: '#ffffff',
    },
    secondary: {
      // Teal accent from the palette.
      main: BRAND_ACCENT,
      light: '#2FD1BF',
      dark: BRAND_ACCENT_DARK,
      contrastText: '#ffffff',
    },
    border: {
      default: '#3A9BD5',
    },
    background: {
      // Layered navy surfaces: page < card < raised element.
      default: '#0B1623',
      paper: '#111F31',
      surface: '#182A40',
    },
    text: {
      primary: '#E3ECF7',
      secondary: '#9DB2CC',
      success: '#4CC38A',
    },
    // Blue-tinted hairline instead of neutral grey so borders blend with navy surfaces.
    divider: '#2A3E57',
    action: {
      active: '#9DB2CC',
      hover: 'rgba(148, 184, 226, 0.08)',
      selected: 'rgba(148, 184, 226, 0.16)',
      focus: 'rgba(148, 184, 226, 0.16)',
      disabled: 'rgba(227, 236, 247, 0.32)',
      disabledBackground: 'rgba(227, 236, 247, 0.10)',
    },
    // Softer, slightly desaturated status colours avoid glare on dark backgrounds.
    error: {
      main: '#F26D6D',
      light: '#F59A9A',
      dark: '#D64545',
    },
    warning: {
      main: '#FFA940',
      light: '#FFC069',
      dark: '#D48806',
    },
    info: {
      main: '#4FB0F0',
      light: '#80C8F5',
      dark: '#2A8FD4',
    },
    success: {
      main: '#3EC27F',
      light: '#6FD6A1',
      dark: '#2A9A62',
    },
  },

  // Common theme settings
  common: {
    shape: {
      borderRadius: 8,
    },
    // typography: {
    //   fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Cairo", "Tajawal", sans-serif',
    //   h1: {
    //     fontSize: 'clamp(20px, 2.8vw, 9999px)',
    //   },
    //   h2: {
    //     fontSize: 'clamp(18px, 2.4vw, 9999px)',
    //   },
    //   h3: {
    //     fontSize: 'clamp(16px, 1.8vw, 9999px)',
    //   },
    //   h4: {
    //     fontSize: 'clamp(14px, 1.6vw, 9999px)',
    //   },
    //   h5: {
    //     fontSize: 'clamp(12px, 1.4vw, 9999px)',
    //   },
    //   h6: {
    //     fontSize: 'clamp(11px, 1vw, 9999px)',
    //   },
    //   body1: {
    //     fontSize: 'clamp(12px, 1vw, 9999px)',
    //   },
    //   body2: {
    //     fontSize: 'clamp(10px, 0.9vw, 9999px)',
    //   },
    //   body3: {
    //     fontSize: 'clamp(9px, 0.8vw, 9999px)',
    //   },
    // },
    typography: {
      /**
       * Base font stack
       * English first, Arabic fallback handled by lang selector
       */
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Cairo", "Tajawal", sans-serif',

      /**
       * Headings
       * Used for page titles, section titles, and major emphasis
       */

      h1: {
        // Page title / main screen heading
        // Min: 30px (desktop readable)
        // Fluid scaling for large screens
        fontSize: 'clamp(30px, 2.3vw, 42px)',
        fontWeight: 700,
        lineHeight: 1.2,
      },

      h2: {
        // Section titles
        fontSize: 'clamp(26px, 2vw, 34px)',
        fontWeight: 600,
        lineHeight: 1.25,
      },

      h3: {
        // Sub-section titles
        fontSize: 'clamp(21px, 1.7vw, 30px)',
        fontWeight: 600,
        lineHeight: 1.3,
      },

      h4: {
        // Card titles / dialog titles
        fontSize: 'clamp(19px, 1.5vw, 26px)',
        fontWeight: 600,
        lineHeight: 1.35,
      },

      h5: {
        // Small headings / labels
        fontSize: 'clamp(17px, 1.3vw, 21px)',
        fontWeight: 500,
        lineHeight: 1.4,
      },

      h6: {
        // Micro headings
        fontSize: 'clamp(15px, 1.2vw, 19px)',
        fontWeight: 500,
        lineHeight: 1.4,
      },

      /**
       * Body text
       * Used for paragraphs, table cells, forms
       */

      body1: {
        // Primary body text
        fontSize: 'clamp(15px, 1.05vw, 17px)',
        fontWeight: 400,
        lineHeight: 1.6,
      },

      body2: {
        // Secondary text / helper text
        fontSize: 'clamp(14px, 1vw, 15px)',
        fontWeight: 400,
        lineHeight: 1.6,
      },

      body3: {
        // Metadata, captions, timestamps
        fontSize: 'clamp(13px, 1vw, 14px)',
        fontWeight: 400,
        lineHeight: 1.5,
      },
    },
    transitions: {
      easing: {
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
      duration: {
        shortest: 150,
        shorter: 200,
        short: 250,
        standard: 300,
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195,
      },
    },
    // font size is dynamic based on the screen size
    spacing: (factor: number) => `${0.5 * factor}vw`,
  },
};

// Theme mode types
export type ThemeMode = 'light' | 'dark';

// Type guard to validate values coming from untyped sources (e.g., localStorage).
export const isThemeMode = (value: string): value is ThemeMode => {
  // Explicitly check allowed values to avoid accidental invalid mode usage.
  return value === 'light' || value === 'dark';
};

// Local storage key for theme preference
export const THEME_STORAGE_KEY = 'theme-mode';

// Default theme mode
export const DEFAULT_THEME_MODE: ThemeMode = 'light';

// Theme transition duration in milliseconds
export const THEME_TRANSITION_DURATION = 300;
