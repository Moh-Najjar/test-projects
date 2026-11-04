import React, { useCallback, useMemo, useState } from 'react';
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
import type { LoginResponse } from '../../core/types/loginResponse';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One labelled row in the read-only account details grid. */
interface ProfileField {
  id: string;
  label: string;
  value: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Placeholder shown when a backend field is missing or blank. */
const EMPTY_VALUE = '—';

/**
 * Accepts only trimmed strings. Anything else (null, number, whitespace)
 * becomes an empty string so the UI never renders unexpected types.
 */
const toSafeString = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
};

/**
 * Accepts only a real array of non-empty strings. A malformed `roles`
 * payload from the API is ignored rather than crashing the page.
 */
const toSafeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

/** Returns the trimmed string, or the shared empty placeholder. */
const displayOrEmpty = (value: string): string => {
  return value.length > 0 ? value : EMPTY_VALUE;
};

/**
 * Prefers the language-specific label and falls back to the other language
 * when the preferred value is blank.
 */
const pickLocalized = (primary: string, fallback: string): string => {
  if (primary.length > 0) {
    return primary;
  }
  return fallback;
};

/** Builds avatar initials from the first and last words of a display name. */
const getInitials = (name: string): string => {
  const parts = name.split(/\s+/u).filter((part) => part.length > 0);
  const first = parts[0];
  if (first === undefined) {
    return '';
  }

  const last = parts[parts.length - 1];
  if (parts.length === 1 || last === undefined || last === first) {
    return first.charAt(0).toUpperCase();
  }

  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
};

/** Maps a known role code to its i18n label; unknown codes stay as-is. */
const roleLabel = (role: string, translate: (key: string, fallback: string) => string): string => {
  return translate(`profile.role.${role}`, role);
};

/** Maps a language code from the session to a readable label. */
const preferredLanguageLabel = (
  code: string,
  translate: (key: string) => string,
): string => {
  if (code === 'ar') {
    return translate('profile.language.ar');
  }
  if (code === 'en') {
    return translate('profile.language.en');
  }
  return displayOrEmpty(code);
};

/** Pulls display-safe account fields from the live backend session. */
const buildProfileView = (
  userInfo: LoginResponse,
  graphRoles: string[],
  isAr: boolean,
  translate: (key: string, fallback?: string) => string,
): {
  displayName: string;
  email: string;
  initials: string;
  roles: string[];
  fields: ProfileField[];
} => {
  const fullNameEn = toSafeString(userInfo.fullNameEn);
  const fullNameAr = toSafeString(userInfo.fullNameAr);
  const displayName = pickLocalized(isAr ? fullNameAr : fullNameEn, isAr ? fullNameEn : fullNameAr);
  const email = toSafeString(userInfo.email);
  const username = toSafeString(userInfo.username);
  const directorate = pickLocalized(
    isAr ? toSafeString(userInfo.directorateNameAr) : toSafeString(userInfo.directorateNameEn),
    isAr ? toSafeString(userInfo.directorateNameEn) : toSafeString(userInfo.directorateNameAr),
  );
  const kpiForm = pickLocalized(
    isAr ? toSafeString(userInfo.kpiFormNameAr) : toSafeString(userInfo.kpiFormNameEn),
    isAr ? toSafeString(userInfo.kpiFormNameEn) : toSafeString(userInfo.kpiFormNameAr),
  );
  const period = pickLocalized(
    isAr ? toSafeString(userInfo.activePeriodLabelAr) : toSafeString(userInfo.activePeriodLabel),
    isAr ? toSafeString(userInfo.activePeriodLabel) : toSafeString(userInfo.activePeriodLabelAr),
  );
  const preferredLanguage = preferredLanguageLabel(toSafeString(userInfo.preferredLanguage), translate);
  // Combine backend session roles with Graph roles, then drop duplicates.
  const roles = Array.from(new Set([...toSafeStringArray(userInfo.roles), ...graphRoles]));

  const fields: ProfileField[] = [
    { id: 'fullNameEn', label: translate('profile.fields.fullNameEn'), value: displayOrEmpty(fullNameEn) },
    { id: 'fullNameAr', label: translate('profile.fields.fullNameAr'), value: displayOrEmpty(fullNameAr) },
    { id: 'username', label: translate('profile.fields.username'), value: displayOrEmpty(username) },
    { id: 'email', label: translate('profile.fields.email'), value: displayOrEmpty(email) },
    { id: 'directorate', label: translate('profile.fields.directorate'), value: displayOrEmpty(directorate) },
    { id: 'kpiForm', label: translate('profile.fields.kpiForm'), value: displayOrEmpty(kpiForm) },
    { id: 'period', label: translate('profile.fields.period'), value: displayOrEmpty(period) },
    { id: 'preferredLanguage', label: translate('profile.fields.preferredLanguage'), value: preferredLanguage },
  ];

  return {
    displayName,
    email,
    initials: getInitials(displayName),
    roles,
    fields,
  };
};

// ---------------------------------------------------------------------------
// Field row
// ---------------------------------------------------------------------------

const ProfileFieldRow: React.FC<Omit<ProfileField, 'id'>> = ({ label, value }) => {
  return (
    <Box
      sx={{
        minWidth: 0,
        py: { xs: '10px', md: 1.5 },
      }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', fontWeight: 700, letterSpacing: '0.02em', mb: '4px' }}>
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600} sx={{ overflowWrap: 'anywhere', lineHeight: 1.5 }}>
        {value}
      </Typography>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const Profile: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { userInfo, userRoles, logout } = useAuth();

  // Confirm before ending the Microsoft session.
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState<boolean>(false);

  const isAr = i18n.language === 'ar';

  const translate = useCallback(
    (key: string, fallback?: string): string => {
      if (fallback === undefined) {
        return t(key);
      }
      return t(key, { defaultValue: fallback });
    },
    [t],
  );

  const graphRoles = useMemo(() => toSafeStringArray(userRoles), [userRoles]);

  const profileView = useMemo(() => {
    if (userInfo === null) {
      return null;
    }
    return buildProfileView(userInfo, graphRoles, isAr, translate);
  }, [userInfo, graphRoles, isAr, translate]);

  const handleOpenLogoutDialog = (): void => {
    setIsLogoutDialogOpen(true);
  };

  const handleCloseLogoutDialog = (): void => {
    setIsLogoutDialogOpen(false);
  };

  const handleConfirmLogout = (): void => {
    setIsLogoutDialogOpen(false);
    logout();
  };

  const heroTitle =
    profileView !== null && profileView.displayName.length > 0
      ? profileView.displayName
      : t('profile.hero.title');

  return (
    <Box component="main" sx={{ minHeight: '100vh', pb: 8 }}>
      <Container maxWidth="lg">
        {/* ---------------------------------------------------------------- */}
        {/* Hero Banner                                                       */}
        {/* ---------------------------------------------------------------- */}
        <HeroBanner
          title={heroTitle}
          subtitle={t('profile.hero.subtitle')}
          badgeLabel={t('profile.hero.badge')}
          BadgeIcon={AccountCircleIcon}
        />

        {/* ---------------------------------------------------------------- */}
        {/* Account details                                                   */}
        {/* ---------------------------------------------------------------- */}
        <Paper
          elevation={0}
          sx={{
            marginBlock: { xs: '16px', md: 4 },
            p: { xs: '16px', md: 3 },
            borderRadius: { xs: '16px', md: '20px' },
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: 'background.paper',
          }}>
          {profileView === null ? (
            <Alert severity="info" sx={{ borderRadius: '12px' }}>
              {t('profile.unavailable.body')}
            </Alert>
          ) : (
            <>
              {/* Identity header: avatar, name, email */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: '12px', md: 2.5 },
                  minWidth: 0,
                }}>
                <Avatar
                  alt={profileView.displayName}
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
                  {profileView.initials.length > 0 ? profileView.initials : <PersonIcon />}
                </Avatar>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    sx={{ fontSize: { xs: '1.15rem', md: '1.4rem' }, overflowWrap: 'anywhere' }}>
                    {displayOrEmpty(profileView.displayName)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: '4px', overflowWrap: 'anywhere' }}>
                    {displayOrEmpty(profileView.email)}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: { xs: '16px', md: 3 } }} />

              {/* Read-only session fields */}
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
                {profileView.fields.map((field) => (
                  <ProfileFieldRow key={field.id} label={field.label} value={field.value} />
                ))}
              </Box>

              <Divider sx={{ my: { xs: '16px', md: 3 } }} />

              {/* Assigned portal roles */}
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                {t('profile.fields.roles')}
              </Typography>
              {profileView.roles.length === 0 ? (
                <Typography variant="body2" color="text.disabled">
                  {t('profile.roles.empty')}
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profileView.roles.map((role) => (
                    <Chip
                      key={role}
                      label={roleLabel(role, translate)}
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  ))}
                </Box>
              )}

              {/* Microsoft-managed notice — this page is read-only on purpose. */}
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

        {/* ---------------------------------------------------------------- */}
        {/* Session actions                                                   */}
        {/* ---------------------------------------------------------------- */}
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
            onClick={handleOpenLogoutDialog}
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
        onClose={handleCloseLogoutDialog}
        onConfirm={handleConfirmLogout}
      />
    </Box>
  );
};

export default Profile;
