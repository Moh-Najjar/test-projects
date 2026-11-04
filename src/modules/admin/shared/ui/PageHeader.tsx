import React from 'react';
import { Box, Paper, Stack, Typography, alpha } from '@mui/material';
import { ADMIN_TONES, type AdminTone } from '../theme/adminTokens';
import IconTile from './IconTile';

interface PageHeaderProps {
  /** Icon shown in the gradient tile. */
  icon: React.ReactNode;
  /** Colour tone used for the tile, eyebrow and decorative glow. */
  tone?: AdminTone;
  /** Small uppercase label above the title. */
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Chips or badges displayed under the subtitle. */
  meta?: React.ReactNode;
  /** Buttons aligned to the end of the header. */
  actions?: React.ReactNode;
  /** Optional element before the icon tile (e.g. a back button). */
  leading?: React.ReactNode;
}

/** Hero-style header card placed at the top of every admin page. */
const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  tone = 'indigo',
  eyebrow,
  title,
  subtitle,
  meta,
  actions,
  leading,
}) => {
  const toneColor = ADMIN_TONES[tone].main;

  return (
    <Paper
      component="header"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        mb: 3,
        p: { xs: 2.5, md: 3.5 },
        borderRadius: '24px',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: (theme) => (theme.palette.mode === 'dark' ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)'),
      }}
    >
      {/* Decorative tone glow in the trailing corner */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          insetInlineEnd: -120,
          top: -160,
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(toneColor, 0.18)} 0%, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />
      {/* Decorative dot grid, faded towards the start edge */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(${alpha(toneColor, 0.22)} 1px, transparent 1px)`,
          backgroundSize: '18px 18px',
          // Fade from the trailing edge, which flips with the text direction.
          maskImage: (theme) =>
            `linear-gradient(to ${theme.direction === 'rtl' ? 'right' : 'left'}, rgba(0,0,0,0.55), transparent 45%)`,
          pointerEvents: 'none',
        }}
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        gap={2.5}
        sx={{ position: 'relative' }}
      >
        <Stack direction="row" alignItems="center" gap={2} sx={{ minWidth: 0 }}>
          {leading}
          <IconTile icon={icon} tone={tone} size={56} variant="solid" />
          <Box sx={{ minWidth: 0 }}>
            {eyebrow !== undefined && (
              <Typography variant="overline" sx={{ color: toneColor, display: 'block', lineHeight: 1.4 }}>
                {eyebrow}
              </Typography>
            )}
            <Typography variant="h4" color="text.primary" sx={{ wordBreak: 'break-word' }}>
              {title}
            </Typography>
            {subtitle !== undefined && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                {subtitle}
              </Typography>
            )}
            {meta !== undefined && (
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
                {meta}
              </Stack>
            )}
          </Box>
        </Stack>

        {actions !== undefined && (
          <Stack
            direction="row"
            alignItems="center"
            gap={1.25}
            flexWrap="wrap"
            sx={{ flexShrink: 0, width: { xs: '100%', md: 'auto' }, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}
          >
            {actions}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};

export default PageHeader;
