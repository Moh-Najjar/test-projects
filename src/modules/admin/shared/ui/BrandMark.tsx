import React from 'react';
import { Box, alpha } from '@mui/material';
import { AdminPanelSettingsRounded as AdminIcon } from '@mui/icons-material';
import { ADMIN_INDIGO } from '../theme/adminTokens';

interface BrandMarkProps {
  /** Edge length of the mark in pixels. */
  size?: number;
}

/** Gradient shield used as the admin console logo. */
const BrandMark: React.FC<BrandMarkProps> = ({ size = 44 }) => (
  <Box
    aria-hidden
    sx={{
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: `${Math.round(size * 0.3)}px`,
      display: 'grid',
      placeItems: 'center',
      bgcolor: ADMIN_INDIGO,
      boxShadow: `0 12px 28px -10px ${alpha(ADMIN_INDIGO, 0.55)}, inset 0 1px 0 ${alpha('#FFFFFF', 0.18)}`,
      '& svg': { fontSize: Math.round(size * 0.5), color: '#FFFFFF' },
    }}
  >
    <AdminIcon />
  </Box>
);

export default BrandMark;
