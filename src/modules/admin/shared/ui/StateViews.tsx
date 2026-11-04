import React from 'react';
import { Box, Button, CircularProgress, Stack, Typography, alpha, useTheme } from '@mui/material';
import { ErrorOutlineRounded as ErrorIcon, RefreshRounded as RetryIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { ADMIN_ACCENT } from '../theme/adminTokens';

// ─── Loading ──────────────────────────────────────────────────────────────────

interface LoadingStateProps {
  label?: string;
}

/** Centered spinner with a soft glow, used while page data loads. */
export const LoadingState: React.FC<LoadingStateProps> = ({ label }) => {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t('admin.common.loading');
  return (
  <Stack alignItems="center" justifyContent="center" gap={2} sx={{ py: 12 }}>
    <Box sx={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(ADMIN_ACCENT, 0.25)} 0%, transparent 70%)`,
        }}
      />
      <CircularProgress size={36} />
    </Box>
    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
      {resolvedLabel}
    </Typography>
  </Stack>
  );
};

// ─── Error ────────────────────────────────────────────────────────────────────

interface ErrorStateProps {
  title: string;
  description?: string;
  onRetry: () => void;
}

/** Friendly error panel with a retry action. */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  description,
  onRetry,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolvedDescription = description ?? t('admin.common.errorDescription');
  return (
    <Stack alignItems="center" textAlign="center" gap={1} sx={{ py: 10, px: 3 }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          mb: 1,
          borderRadius: '20px',
          display: 'grid',
          placeItems: 'center',
          color: 'error.main',
          bgcolor: alpha(theme.palette.error.main, 0.1),
        }}
      >
        <ErrorIcon sx={{ fontSize: 32 }} />
      </Box>
      <Typography variant="subtitle1" color="text.primary">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380 }}>
        {resolvedDescription}
      </Typography>
      <Button onClick={onRetry} variant="outlined" startIcon={<RetryIcon />} sx={{ mt: 1.5 }}>
        {t('admin.common.retry')}
      </Button>
    </Stack>
  );
};

// ─── Empty ────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Vertical padding override for compact contexts. */
  compact?: boolean;
}

/** Illustrated empty state with stacked rings behind the icon. */
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, compact = false }) => {
  const theme = useTheme();
  const ringColor = alpha(theme.palette.primary.main, 0.08);

  return (
    <Stack alignItems="center" textAlign="center" gap={1} sx={{ py: compact ? 5 : 10, px: 3 }}>
      <Box sx={{ position: 'relative', width: 96, height: 96, display: 'grid', placeItems: 'center', mb: 1 }}>
        {/* Concentric decorative rings */}
        <Box aria-hidden sx={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px dashed ${alpha(theme.palette.primary.main, 0.25)}` }} />
        <Box aria-hidden sx={{ position: 'absolute', inset: 14, borderRadius: '50%', bgcolor: ringColor }} />
        <Box sx={{ position: 'relative', color: 'primary.main', display: 'flex', '& svg': { fontSize: 32 } }}>{icon}</Box>
      </Box>
      <Typography variant="subtitle1" color="text.primary">
        {title}
      </Typography>
      {description !== undefined && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      )}
      {action !== undefined && <Box sx={{ mt: 1.5 }}>{action}</Box>}
    </Stack>
  );
};
