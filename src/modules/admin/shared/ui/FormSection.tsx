import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { ADMIN_INDIGO } from '../theme/adminTokens';

interface FormSectionProps {
  title: string;
  /** Optional helper line under the title. */
  description?: string;
  children: React.ReactNode;
}

/** Titled group of inputs inside dialogs, marked with a short gradient bar. */
const FormSection: React.FC<FormSectionProps> = ({ title, description, children }) => (
  <Box
    component="section"
    sx={{
      p: { xs: 2, sm: 2.5 },
      borderRadius: '16px',
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
    }}
  >
    <Stack direction="row" alignItems="center" gap={1.25} sx={{ mb: description !== undefined ? 0.5 : 2 }}>
      <Box aria-hidden sx={{ width: 3, height: 16, borderRadius: 4, bgcolor: ADMIN_INDIGO, flexShrink: 0 }} />
      <Typography variant="overline" color="text.primary" sx={{ lineHeight: 1.4 }}>
        {title}
      </Typography>
    </Stack>
    {description !== undefined && (
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontWeight: 500 }}>
        {description}
      </Typography>
    )}
    <Stack spacing={2}>{children}</Stack>
  </Box>
);

export default FormSection;
