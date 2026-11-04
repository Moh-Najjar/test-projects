import React from 'react';

import { ArrowBack, ArrowForward, HomeOutlined } from '@mui/icons-material';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import { useDirection } from '../../../core/context/DirectionContext';
import { useDeviceType } from '../../../core/hooks/useDeviceType';

const NotFound: React.FC = () => {
  const { t } = useTranslation();
  const dir = useDirection();
  const navigate = useNavigate();

  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';

  const BackIcon = dir === 'rtl' ? ArrowForward : ArrowBack;

  const handleGoBack = (): void => {
    const hasHistory =
      typeof window !== 'undefined' &&
      typeof window.history !== 'undefined' &&
      window.history.length > 1;
    if (hasHistory) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <Box
      component="main"
      sx={{
        width: '100%',
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 10,
      }}>
      <Container maxWidth="sm">
        <Stack spacing={4} alignItems="center" textAlign="center">
          {/* Large 404 number */}
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '6rem', md: '9rem' },
              fontWeight: 800,
              lineHeight: 1,
              color: 'primary.main',
              letterSpacing: '-0.04em',
            }}>
            {t('notFound.code', '404')}
          </Typography>

          {/* Title and description */}
          <Stack spacing={1.5} alignItems="center">
            <Typography variant="h4" fontWeight={700}>
              {t('notFound.title', 'Page Not Found')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
              {t('notFound.subtitle', "The page you're looking for doesn't exist or has been moved.")}
            </Typography>
          </Stack>

          {/* Action buttons */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 2 }}>
            <Button
              variant="contained"
              size="large"
              component={RouterLink}
              to="/"
              startIcon={<HomeOutlined />}
              sx={{
                px: isMobile ? 6 : 4,
                py: isMobile ? 3 : 1,
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
              }}>
              {t('notFound.goHome', 'Go Home')}
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={handleGoBack}
              startIcon={<BackIcon />}
              sx={{
                px: isMobile ? 6 : 4,
                py: isMobile ? 3 : 1,
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
              }}>
              {t('notFound.goBack', 'Go Back')}
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default NotFound;
