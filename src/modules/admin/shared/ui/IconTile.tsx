import React from 'react';
import { Box, alpha } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { ADMIN_TONES, type AdminTone } from '../theme/adminTokens';

interface IconTileProps {
  /** Icon rendered in the centre of the tile. */
  icon: React.ReactNode;
  /** Colour tone of the tile. */
  tone?: AdminTone;
  /** Edge length in pixels. */
  size?: number;
  /** `solid` fills with the tone colour and white glyphs, `soft` a light tint. */
  variant?: 'solid' | 'soft';
  sx?: SxProps<Theme>;
}

/** Rounded square holding an icon — the basic visual anchor across admin screens. */
const IconTile: React.FC<IconTileProps> = ({ icon, tone = 'indigo', size = 44, variant = 'soft', sx }) => {
  // Resolve tone colours once.
  const toneStyle = ADMIN_TONES[tone];
  const isSolid = variant === 'solid';

  return (
    <Box
      aria-hidden
      sx={[
        {
          width: size,
          height: size,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          // Corner radius scales with the tile size.
          borderRadius: `${Math.round(size * 0.3)}px`,
          color: isSolid ? '#FFFFFF' : toneStyle.main,
          backgroundImage: 'none',
          bgcolor: isSolid ? toneStyle.main : alpha(toneStyle.main, 0.12),
          boxShadow: isSolid ? `0 10px 24px -10px ${alpha(toneStyle.main, 0.8)}` : 'none',
          '& svg': { fontSize: Math.round(size * 0.5) },
        },
        // Allow callers to pass either a single sx object or an array.
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {icon}
    </Box>
  );
};

export default IconTile;
