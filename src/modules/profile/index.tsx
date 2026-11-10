import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { alpha, useTheme } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';

import HeroBanner from '../shared/HeroBanner';
import ConfirmationDialog from '../shared/ConfirmationDialog';
import { useAuth } from '../../core/context/AuthContext';
import { formatLastLogin } from '../../core/utils/formatLastLogin';

const Profile: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { userInfo, userRoles, logout } = useAuth();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const isAr = i18n.language === 'ar';
  const dash = '—';

  const displayName = isAr
    ? userInfo?.fullNameAr || userInfo?.fullNameEn || ''
    : userInfo?.fullNameEn || userInfo?.fullNameAr || '';
  const email = userInfo?.email || '';
  const directorate = isAr
    ? userInfo?.directorateNameAr || userInfo?.directorateNameEn || ''
    : userInfo?.directorateNameEn || userInfo?.directorateNameAr || '';
  const kpiForm = isAr
    ? userInfo?.kpiFormNameAr || userInfo?.kpiFormNameEn || ''
    : userInfo?.kpiFormNameEn || userInfo?.kpiFormNameAr || '';
  const period = isAr
    ? userInfo?.activePeriodLabelAr || userInfo?.activePeriodLabel || ''
    : userInfo?.activePeriodLabel || userInfo?.activePeriodLabelAr || '';
  const languageCode = userInfo?.preferredLanguage || '';
  const languageLabel =
    languageCode === 'ar'
      ? t('profile.language.ar')
      : languageCode === 'en'
        ? t('profile.language.en')
        : languageCode;
  const initials = displayName
    .trim()
    .split(/\s+/u)
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  const roles = Array.from(new Set([...(userInfo?.roles ?? []), ...userRoles]));

  const fields = [
    { id: 'fullNameEn', label: t('profile.fields.fullNameEn'), value: userInfo?.fullNameEn || dash },
    { id: 'fullNameAr', label: t('profile.fields.fullNameAr'), value: userInfo?.fullNameAr || dash },
    { id: 'username', label: t('profile.fields.username'), value: userInfo?.username || dash },
    { id: 'email', label: t('profile.fields.email'), value: email || dash },
    { id: 'directorate', label: t('profile.fields.directorate'), value: directorate || dash },
    { id: 'kpiForm', label: t('profile.fields.kpiForm'), value: kpiForm || dash },
    { id: 'period', label: t('profile.fields.period'), value: period || dash },
    { id: 'preferredLanguage', label: t('profile.fields.preferredLanguage'), value: languageLabel || dash },
    {
      id: 'lastLoginAt',
      label: t('profile.fields.lastLoginAt'),
      value: formatLastLogin(userInfo?.lastLoginAt, isAr) || dash,
    },
  ];

  return (
    <Box component="main" sx={{ minHeight: '100vh', pb: 8 }}>
      <Container maxWidth="lg">
        <HeroBanner
          title={displayName || t('profile.hero.title')}
          subtitle={t('profile.hero.subtitle')}
          badgeLabel={t('profile.hero.badge')}
          BadgeIcon={AccountCircleIcon}
        />

        <Paper
          elevation={0}
          sx={{
            marginBlock: { xs: '16px', md: 4 },
            p: { xs: '16px', md: 3 },
            borderRadius: { xs: '16px', md: '20px' },
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: 'background.paper',
          }}>
          {userInfo === null ? (
            <Alert severity="info" sx={{ borderRadius: '12px' }}>
              {t('profile.unavailable.body')}
            </Alert>
          ) : (
            <>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: '12px', md: 2.5 },
                  minWidth: 0,
                }}>
                <Avatar
                  alt={displayName}
                  sx={{
                    width: { xs: 56, md: 72 },
                    height: { xs: 56, md: 72 },
                    fontWeight: 800,
                    fontSize: { xs: '1.25rem', md: '1.6rem' },
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    border: `2px solid ${theme.palette.primary.main}`,
                    flexShrink: 0,
                  }}>
                  {initials.length > 0 ? initials : <PersonIcon />}
                </Avatar>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    sx={{ fontSize: { xs: '1.15rem', md: '1.4rem' }, overflowWrap: 'anywhere' }}>
                    {displayName || dash}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: '4px', overflowWrap: 'anywhere' }}>
                    {email || dash}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: { xs: '16px', md: 3 } }} />

              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                {t('profile.identity.section')}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  columnGap: { md: 4 },
                  rowGap: 0,
                }}>
                {fields.map((field) => (
                  <Box key={field.id} sx={{ minWidth: 0, py: { xs: '10px', md: 1.5 } }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', fontWeight: 700, letterSpacing: '0.02em', mb: '4px' }}>
                      {field.label}
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ overflowWrap: 'anywhere', lineHeight: 1.5 }}>
                      {field.value}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Divider sx={{ my: { xs: '16px', md: 3 } }} />

              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                {t('profile.fields.roles')}
              </Typography>
              {roles.length === 0 ? (
                <Typography variant="body2" color="text.disabled">
                  {t('profile.roles.empty')}
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {roles.map((role) => (
                    <Chip
                      key={role}
                      label={t(`profile.role.${role}`, { defaultValue: role })}
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  ))}
                </Box>
              )}

              <Box
                sx={{
                  mt: { xs: '16px', md: 3 },
                  p: { xs: '14px', md: 2 },
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  backgroundColor: alpha(theme.palette.primary.main, 0.06),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
                }}>
                <SecurityIcon sx={{ mt: '2px', color: 'primary.main', flexShrink: 0 }} fontSize="small" />
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {t('profile.managedBy')}
                </Typography>
              </Box>
            </>
          )}
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: { xs: '16px', md: 3 },
            borderRadius: { xs: '16px', md: '20px' },
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: 'background.paper',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {t('profile.logout.sectionTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: '4px', lineHeight: 1.6 }}>
              {t('profile.logout.sectionBody')}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={() => setIsLogoutDialogOpen(true)}
            sx={{
              borderRadius: '10px',
              fontWeight: 700,
              textTransform: 'none',
              px: 2.5,
              width: { xs: '100%', sm: 'auto' },
              whiteSpace: 'nowrap',
            }}>
            {t('profile.logout')}
          </Button>
        </Paper>
      </Container>

      <ConfirmationDialog
        open={isLogoutDialogOpen}
        title={t('profile.logout.title')}
        description={t('profile.logout.description')}
        confirmText={t('profile.logout.confirm')}
        cancelText={t('profile.logout.cancel')}
        confirmColor="error"
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={() => {
          setIsLogoutDialogOpen(false);
          logout();
        }}
      />
    </Box>
  );
};

export default Profile;
