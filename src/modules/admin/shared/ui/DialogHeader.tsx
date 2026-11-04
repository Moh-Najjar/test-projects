import React from 'react';
import { Box, DialogTitle, IconButton, Stack, Typography } from '@mui/material';
import { CloseRounded as CloseIcon } from '@mui/icons-material';
import { useLocale } from '../../../../core/hooks/useLocale';
import type { AdminTone } from '../theme/adminTokens';
import IconTile from './IconTile';

interface DialogHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Icon rendered in a gradient tile (ignored when `avatar` is provided). */
  icon?: React.ReactNode;
  /** Custom leading visual such as a user avatar. */
  avatar?: React.ReactNode;
  tone?: AdminTone;
  onClose: () => void;
}

/** Consistent dialog title bar: leading visual, title/subtitle and a close button. */
const DialogHeader: React.FC<DialogHeaderProps> = ({ title, subtitle, icon, avatar, tone = 'indigo', onClose }) => {
  const { t } = useLocale();

  return (
  <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
    <Stack direction="row" alignItems="center" gap={1.75} sx={{ minWidth: 0 }}>
      {avatar ?? (icon !== undefined && <IconTile icon={icon} tone={tone} size={44} variant="solid" />)}
      <Box sx={{ minWidth: 0 }}>
        <Typography component="h2" variant="h6" color="text.primary" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
          {title}
        </Typography>
        {subtitle !== undefined && (
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
    <IconButton onClick={onClose} size="small" aria-label={t('admin.common.closeDialog')} sx={{ border: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
      <CloseIcon fontSize="small" />
    </IconButton>
  </DialogTitle>
  );
};

export default DialogHeader;
