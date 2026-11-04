import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import {
  AlternateEmailRounded as EmailIcon,
  ArrowBackRounded as ArrowBackIcon,
  Security as SecurityIcon,
  VisibilityRounded as Visibility,
  VisibilityOffRounded as VisibilityOff,
} from '@mui/icons-material';
import {
  consumeAdminSessionEndedReason,
  type AdminSessionEndReason,
} from '../../../core/api/admin/adminSessionEvents';
import { useAdminAuth } from '../../../core/context/AdminAuthContext';
import { isRtl } from '../../../i18n/languages';
import { BRAND_ACCENT, BRAND_NAVY, BRAND_NAVY_DARK } from '../../../core/constants/theme';
import LoginShell, { LoginLogo } from '../../auth/Login/LoginShell';

interface LoginFieldErrors {
  username?: string;
  password?: string;
}

const AdminLogin: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { adminLogin, isAdminLoginPending, adminLoginError } = useAdminAuth();
  const isRtlLayout = isRtl(i18n.language);
  const currentYear = new Date().getFullYear();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // const [username, setUsername] = useState('admin@aseza.local');
  // const [password, setPassword] = useState('ChangeMe!123');

  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  /** One-time banner after JWT expiry or a 401; cleared from sessionStorage on read. */
  const [sessionEndedReason] = useState<AdminSessionEndReason | null>(
    () => consumeAdminSessionEndedReason(),
  );

  const validate = (): boolean => {
    const errors: LoginFieldErrors = {};

    if (username.trim().length === 0) {
      errors.username = t('login.validation.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username.trim())) {
      errors.username = t('login.validation.invalidEmail');
    }

    if (password.length === 0) {
      errors.password = t('login.validation.required');
    } else if (password.length < 6) {
      errors.password = t('login.validation.minPassword');
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await adminLogin(username.trim(), password);
      navigate('/admin', { replace: true });
    } catch {
      // Error is surfaced through AdminAuthContext
    }
  };

  const togglePasswordVisibility = (): void => {
    setShowPassword((previous) => !previous);
  };

  return (
    <LoginShell>
      <Box sx={{ mb: { xs: '28px', md: 0 }, display: { xs: 'flex', md: 'none' } }}>
        <LoginLogo variant="light" size="sm" />
      </Box>

      <Button
        component={RouterLink}
        to="/login"
        startIcon={<ArrowBackIcon sx={{ transform: isRtlLayout ? 'scaleX(-1)' : 'none' }} />}
        sx={{
          mb: { xs: '22px', md: 2.5 },
          px: 0,
          alignSelf: 'flex-start',
          color: 'text.secondary',
          fontWeight: 700,
          textTransform: 'none',
          '&:hover': { bgcolor: 'transparent', color: BRAND_NAVY },
        }}
      >
        {t('login.backToUserLogin')}
      </Button>

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
        {t('login.adminTitle')}
      </Typography>
      <Typography
        sx={{
          color: 'text.secondary',
          fontWeight: 500,
          fontSize: 15.5,
          lineHeight: 1.7,
          maxWidth: 400,
          mb: { xs: '32px', md: 3.5 },
        }}
      >
        {t('login.adminSubtitle')}
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={{ xs: '18px', md: 2 }}>
          {sessionEndedReason !== null && (
            <Alert severity="info" sx={{ borderRadius: '14px', fontWeight: 600 }}>
              {sessionEndedReason === 'unauthorized'
                ? t('login.sessionUnauthorized')
                : t('login.sessionExpired')}
            </Alert>
          )}

          {adminLoginError !== null && adminLoginError !== undefined && adminLoginError.length > 0 && (
            <Alert severity="error" sx={{ borderRadius: '14px', fontWeight: 600 }}>
              {adminLoginError}
            </Alert>
          )}

          <TextField
            fullWidth
            label={t('login.username')}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            error={Boolean(fieldErrors.username)}
            helperText={fieldErrors.username}
            autoComplete="username"
            inputProps={{
              dir: 'ltr',
              style: { textAlign: isRtlLayout ? 'right' : 'left' },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label={t('login.password')}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={Boolean(fieldErrors.password)}
            helperText={fieldErrors.password}
            autoComplete="current-password"
            inputProps={{
              dir: 'ltr',
              style: { textAlign: isRtlLayout ? 'right' : 'left' },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={togglePasswordVisibility} edge="end" aria-label={t('login.togglePassword')}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            size="large"
            disabled={isAdminLoginPending}
            sx={{
              py: 1.55,
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
            {isAdminLoginPending ? <CircularProgress size={22} color="inherit" /> : t('login.adminSubmit')}
          </Button>
        </Stack>
      </Box>

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
            {t('login.adminSecurityFootnote')}
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.disabled' }}>
          {t('login.copyright', { year: currentYear })}
        </Typography>
      </Stack>
    </LoginShell>
  );
};

export default AdminLogin;
