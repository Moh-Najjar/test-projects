import React from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { AdminTone } from '../theme/adminTokens';
import IconTile from './IconTile';

interface SurfaceCardProps {
  /** Card heading; omitted when a custom `toolbar` is provided. */
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Optional icon shown next to the heading. */
  icon?: React.ReactNode;
  tone?: AdminTone;
  /** Controls aligned to the end of the header. */
  actions?: React.ReactNode;
  /** Fully custom header content (replaces title/subtitle/actions). */
  toolbar?: React.ReactNode;
  /** Removes body padding — useful for edge-to-edge tables. */
  disablePadding?: boolean;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

/** Standard bordered card used to group content on admin pages. */
const SurfaceCard: React.FC<SurfaceCardProps> = ({
  title,
  subtitle,
  icon,
  tone = 'indigo',
  actions,
  toolbar,
  disablePadding = false,
  children,
  sx,
}) => {
  // Render a header only when there is something to show in it.
  const hasHeader = toolbar !== undefined || title !== undefined || actions !== undefined;

  return (
    <Paper
      sx={[
        (theme) => ({
          borderRadius: '20px',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -16px rgba(15, 23, 42, 0.12)',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {hasHeader && (
        <Box sx={{ px: { xs: 2, md: 3 }, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          {toolbar ?? (
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={1.5}>
              <Stack direction="row" alignItems="center" gap={1.5} sx={{ minWidth: 0 }}>
                {icon !== undefined && <IconTile icon={icon} tone={tone} size={36} />}
                <Box sx={{ minWidth: 0 }}>
                  {title !== undefined && (
                    <Typography variant="subtitle1" color="text.primary" sx={{ lineHeight: 1.3 }}>
                      {title}
                    </Typography>
                  )}
                  {subtitle !== undefined && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {subtitle}
                    </Typography>
                  )}
                </Box>
              </Stack>
              {actions !== undefined && (
                <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                  {actions}
                </Stack>
              )}
            </Stack>
          )}
        </Box>
      )}
      <Box sx={{ p: disablePadding ? 0 : { xs: 2, md: 3 } }}>{children}</Box>
    </Paper>
  );
};

export default SurfaceCard;
