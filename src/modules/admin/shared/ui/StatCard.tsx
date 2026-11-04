import React from 'react';
import { Box, Paper, Stack, Typography, alpha } from '@mui/material';
import { ADMIN_TONES, type AdminTone } from '../theme/adminTokens';
import IconTile from './IconTile';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: AdminTone;
  /** Short helper line under the value. */
  hint?: string;
  /** Stagger index for the entrance animation. */
  index?: number;
}

/** KPI-style count card with a gradient icon tile and a soft tone glow. */
const StatCard: React.FC<StatCardProps> = ({ label, value, icon, tone = 'indigo', hint, index = 0 }) => {
  const toneColor = ADMIN_TONES[tone].main;

  return (
    <Paper
      sx={{
        position: 'relative',
        overflow: 'hidden',
        p: 2.5,
        borderRadius: '20px',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        animation: `adminStatIn 0.45s ease-out ${index * 0.06}s both`,
        '@keyframes adminStatIn': {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: alpha(toneColor, 0.4),
          boxShadow: `0 16px 32px -18px ${alpha(toneColor, 0.6)}`,
        },
      }}
    >
      {/* Decorative glow behind the tile */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          insetInlineEnd: -40,
          top: -40,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(toneColor, 0.16)} 0%, transparent 70%)`,
        }}
      />
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2} sx={{ position: 'relative' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
            {label}
          </Typography>
          <Typography sx={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.15, mt: 0.5, color: 'text.primary' }}>
            {value}
          </Typography>
          {hint !== undefined && (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mt: 0.5 }}>
              {hint}
            </Typography>
          )}
        </Box>
        <IconTile icon={icon} tone={tone} size={44} variant="solid" />
      </Stack>
    </Paper>
  );
};

export default StatCard;
