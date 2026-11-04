import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BreadcrumbsMui from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

/**
 * Breadcrumbs component that dynamically generates links based on the current path.
 * It uses translations for the path segments.
 */
const Breadcrumbs: React.FC = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const theme = useTheme();
  const isRtl = i18n.language === 'ar';

  const pathnames = location.pathname.split('/').filter((x) => x);

  // Mapping of full paths to translation keys for context-specific segments if needed
  const fullPathMap: Record<string, string> = {
    '/profile': 'nav.profile',
    '/my-requests': 'nav.my-requests',
    '/my-requests/new': 'newRequest.pageTitle',
    '/new-request': 'newRequest.pageTitle',
    '/home': 'nav.home',
  };

  // Mapping of individual path segments to translation keys
  const breadcrumbNameMap: Record<string, string> = {
    'my-requests': 'nav.my-requests',
    'new-request': 'newRequest.pageTitle',
    new: 'newRequest.pageTitle',
    edit: 'editRequest.breadcrumb',
    profile: 'nav.profile',
    login: 'nav.login',
    home: 'nav.home',
  };

  // If we are on the home page, don't show breadcrumbs
  if (pathnames.length === 0) {
    return null;
  }

  return (
    <Box sx={{ py: { xs: '12px', md: 2 } }}>
      <BreadcrumbsMui
        separator={
          isRtl ? (
            <NavigateBeforeIcon sx={{ fontSize: '1.1rem', opacity: 0.6 }} />
          ) : (
            <NavigateNextIcon sx={{ fontSize: '1.1rem', opacity: 0.6 }} />
          )
        }
        aria-label={t('breadcrumbs.aria.label', { defaultValue: 'Breadcrumbs' })}
        sx={{
          '& .MuiBreadcrumbs-ol': { flexWrap: 'wrap', rowGap: '4px' },
          '& .MuiBreadcrumbs-separator': {
            color: theme.palette.text.disabled,
            mx: 0.5,
          },
        }}>
        <Link
          component={RouterLink}
          underline="hover"
          color="text.secondary"
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.9rem',
            fontWeight: 500,
            transition: 'all 0.2s',
            '&:hover': {
              color: theme.palette.primary.main,
            },
          }}>
          {t('nav.home')}
        </Link>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;

          // Check full path map first, then fall back to segment map.
          // If the segment is a numeric ID (e.g. submission id), display "Request No. 31".
          const isNumericId = /^\d+$/.test(value);
          const translationKey = fullPathMap[to] ?? breadcrumbNameMap[value];
          const label = translationKey
            ? t(translationKey)
            : isNumericId
              ? t('breadcrumbs.requestNo', { number: value })
              : value;

          return last ? (
            <Typography
              key={to}
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 600,
                fontSize: '0.9rem',
              }}>
              {label}
            </Typography>
          ) : (
            <Link
              component={RouterLink}
              underline="hover"
              color="text.secondary"
              to={to}
              key={to}
              sx={{
                fontSize: '0.9rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                '&:hover': {
                  color: theme.palette.primary.main,
                },
              }}>
              {label}
            </Link>
          );
        })}
      </BreadcrumbsMui>
    </Box>
  );
};

export default Breadcrumbs;
