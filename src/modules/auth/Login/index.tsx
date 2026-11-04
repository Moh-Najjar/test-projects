import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMsal } from '@azure/msal-react';
import { Box, Button, Stack, Typography, alpha } from '@mui/material';
import { AdminPanelSettings as AdminIcon, Security as SecurityIcon } from '@mui/icons-material';
import { loginRequest } from '../../../core/config/authConfig';
import { isRtl } from '../../../i18n/languages';
import { BRAND_ACCENT, BRAND_NAVY, BRAND_NAVY_DARK } from '../../../core/constants/theme';
import LoginShell, { LoginLogo, MicrosoftLogo } from './LoginShell';

const Login: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { instance } = useMsal();
  const navigate = useNavigate();
  const isRtlLayout = isRtl(i18n.language);
  const currentYear = new Date().getFullYear();

  const handleAzureLogin = (): void => {
    instance.loginRedirect(loginRequest).catch((error: unknown) => {
      console.error('Login failed:', error);
    });
  };

  return (
    <LoginShell>
      <Box sx={{ mb: { xs: '28px', md: 0 }, display: { xs: 'flex', md: 'none' } }}>
        <LoginLogo variant="light" size="sm" />
      </Box>

      <Box
        sx={{
          width: 42,
          height: 4,
          borderRadius: 99,
          mb: { xs: '22px', md: 2 },
          background: `linear-gradient(90deg, ${BRAND_NAVY} 0%, ${BRAND_ACCENT} 100%)`,
        }}
      />

      <Typography
        variant="h3"
        sx={{
          fontWeight: 800,
          color: BRAND_NAVY,
          letterSpacing: isRtlLayout ? 0 : '-0.04em',
          lineHeight: 1.15,
          fontSize: { xs: '1.85rem', sm: '2.15rem' },
          mb: { xs: '14px', md: 1.25 },
        }}
      >
        {t('login.welcomeBack')}
      </Typography>
      <Typography
        sx={{
          color: 'text.secondary',
          fontWeight: 500,
          fontSize: 15.5,
          lineHeight: 1.7,
          maxWidth: 400,
          mb: { xs: '32px', md: 4 },
        }}
      >
        {t('login.signInSubtitle')}
      </Typography>

      <Typography
        variant="overline"
        sx={{
          display: 'block',
          color: BRAND_ACCENT,
          fontWeight: 800,
          letterSpacing: isRtlLayout ? '0.06em' : '0.14em',
          mb: { xs: '16px', md: 1.5 },
        }}
      >
        {t('login.useYourAccount')}
      </Typography>

      <Button
        fullWidth
        size="large"
        onClick={handleAzureLogin}
        startIcon={<MicrosoftLogo />}
        sx={{
          py: 1.7,
          borderRadius: '14px',
          bgcolor: BRAND_NAVY,
          color: '#FFFFFF',
          fontWeight: 800,
          fontSize: '0.98rem',
          textTransform: 'none',
          boxShadow: `0 14px 28px ${alpha(BRAND_NAVY, 0.28)}`,
          '&:hover': {
            bgcolor: BRAND_NAVY_DARK,
            boxShadow: `0 18px 32px ${alpha(BRAND_NAVY, 0.34)}`,
          },
        }}
      >
        {t('login.signInButton')}
      </Button>

      <Stack spacing={{ xs: '18px', md: 1.5 }} sx={{ mt: { xs: '28px', md: 3.5 } }}>
        <Stack direction="row" alignItems="flex-start" gap={1.25}>
          <Box
            sx={{
              mt: 0.15,
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              bgcolor: alpha(BRAND_ACCENT, 0.12),
              color: BRAND_ACCENT,
            }}
          >
            <SecurityIcon sx={{ fontSize: 15 }} />
          </Box>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: 'text.secondary', lineHeight: 1.55 }}>
            {t('login.securityFootnote')}
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.disabled' }}>
          {t('login.copyright', { year: currentYear })}
        </Typography>
      </Stack>

      <Button
        fullWidth
        variant="text"
        onClick={() => navigate('/admin/login')}
        startIcon={<AdminIcon sx={{ fontSize: 18 }} />}
        sx={{
          mt: { xs: '20px', md: 2.5 },
          py: 1,
          borderRadius: '12px',
          color: 'text.disabled',
          fontWeight: 600,
          fontSize: '0.8rem',
          textTransform: 'none',
          '&:hover': {
            color: 'text.secondary',
            bgcolor: alpha(BRAND_NAVY, 0.04),
          },
        }}
      >
        {t('login.loginAsAdmin')}
      </Button>
    </LoginShell>
  );
};

export default Login;
