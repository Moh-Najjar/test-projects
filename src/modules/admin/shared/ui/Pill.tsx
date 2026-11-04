import React from 'react';
import { Box, alpha, useTheme } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { ADMIN_MONO_FONT } from '../theme/adminTokens';

interface PillProps {
  label: React.ReactNode;
  /** Base colour; text uses it directly and the background a soft tint. */
  color: string;
  /** Shows a leading status dot. */
  dot?: boolean;
  /** Pulses the dot (used for "live"/active states). */
  pulse?: boolean;
  /** Renders the label in the monospace stack. */
  mono?: boolean;
  /** Draws an outline instead of a tinted fill. */
  outlined?: boolean;
  sx?: SxProps<Theme>;
}

/** Compact tinted label used for statuses, counts and metadata. */
export const Pill: React.FC<PillProps> = ({ label, color, dot = false, pulse = false, mono = false, outlined = false, sx }) => (
  <Box
    component="span"
    sx={[
      {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        maxWidth: '100%',
        px: 1,
        py: 0.25,
        minHeight: 24,
        borderRadius: '8px',
        fontSize: '0.75rem',
        fontWeight: 700,
        lineHeight: 1.5,
        whiteSpace: 'nowrap',
        color,
        fontFamily: mono ? ADMIN_MONO_FONT : 'inherit',
        bgcolor: outlined ? 'transparent' : alpha(color, 0.12),
        border: '1px solid',
        borderColor: outlined ? alpha(color, 0.35) : 'transparent',
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {dot && (
      <Box
        component="span"
        aria-hidden
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: color,
          flexShrink: 0,
          boxShadow: pulse ? `0 0 0 0 ${alpha(color, 0.6)}` : 'none',
          animation: pulse ? 'adminPillPulse 2s infinite' : 'none',
          '@keyframes adminPillPulse': {
            '0%': { boxShadow: `0 0 0 0 ${alpha(color, 0.55)}` },
            '70%': { boxShadow: `0 0 0 6px ${alpha(color, 0)}` },
            '100%': { boxShadow: `0 0 0 0 ${alpha(color, 0)}` },
          },
        }}
      />
    )}
    <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {label}
    </Box>
  </Box>
);

interface StatusPillProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

/** Active / inactive status indicator with a pulsing dot when active. */
export const StatusPill: React.FC<StatusPillProps> = ({ active, activeLabel, inactiveLabel }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolvedActive = activeLabel ?? t('admin.status.active');
  const resolvedInactive = inactiveLabel ?? t('admin.status.inactive');
  return (
    <Pill
      label={active ? resolvedActive : resolvedInactive}
      color={active ? theme.palette.success.main : theme.palette.text.secondary}
      dot
      pulse={active}
    />
  );
};

interface KeyBadgeProps {
  children: React.ReactNode;
}

/** Monospace badge for technical identifiers (form keys, field keys). */
export const KeyBadge: React.FC<KeyBadgeProps> = ({ children }) => {
  const theme = useTheme();
  return <Pill label={children} color={theme.palette.primary.main} mono sx={{ fontSize: '0.6875rem', whiteSpace: 'normal', wordBreak: 'break-all' }} />;
};
