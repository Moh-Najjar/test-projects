import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Stack, Typography, alpha } from '@mui/material';
import { isRtl } from '../../../i18n/languages';
import logoAr from '../../../assets/aseza-logo-ar.png';
import logoEn from '../../../assets/aseza-logo-en.png';
import heroImage from '../../../assets/images/home/aqaba-1.jpg';
import { BRAND_ACCENT, BRAND_NAVY, BRAND_NAVY_DARK } from '../../../core/constants/theme';
import LanguageSwitcher from '../../shared/LanguageSwitcher';

interface LogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md';
}

/** ASEZA wordmark used on both login screens. */
export const LoginLogo: React.FC<LogoProps> = ({ variant = 'dark', size = 'md' }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language === 'ar' ? 'ar' : 'en';
  const logoSrc = currentLang === 'ar' ? logoAr : logoEn;
  const height = size === 'sm' ? 44 : 72;

  return (
    <Box
      component="img"
      src={logoSrc}
      alt="ASEZA Logo"
      sx={{
        height,
        display: 'block',
        filter: variant === 'dark' ? 'brightness(0) invert(1)' : 'none',
        objectFit: 'contain',
      }}
    />
  );
};

/** Microsoft four-square mark for the Azure sign-in button. */
export const MicrosoftLogo: React.FC = () => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '2.5px',
      width: 20,
      height: 20,
      flexShrink: 0,
    }}
  >
    <Box sx={{ bgcolor: '#f35325', borderRadius: '1px' }} />
    <Box sx={{ bgcolor: '#81bc06', borderRadius: '1px' }} />
    <Box sx={{ bgcolor: '#05a6f0', borderRadius: '1px' }} />
    <Box sx={{ bgcolor: '#ffba08', borderRadius: '1px' }} />
  </Box>
);

interface LoginShellProps {
  children: React.ReactNode;
}

/**
 * Shared two-column login chrome: Aqaba hero + form panel.
 * Column order follows the active language; form content is provided by the page.
 */
const LoginShell: React.FC<LoginShellProps> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const isRtlLayout = isRtl(i18n.language);
  const pageDir: 'rtl' | 'ltr' = isRtlLayout ? 'rtl' : 'ltr';
  const formColumnOrder = isRtlLayout ? 1 : 2;
  const heroColumnOrder = isRtlLayout ? 2 : 1;

  const trustBadges = [
    t('login.trustSecureSso'),
    t('login.trustIso'),
    t('login.trustAccess'),
  ];

  const heroSideWash = isRtlLayout
    ? `linear-gradient(90deg, ${alpha(BRAND_NAVY_DARK, 0.4)} 0%, transparent 58%)`
    : `linear-gradient(270deg, ${alpha(BRAND_NAVY_DARK, 0.4)} 0%, transparent 58%)`;

  return (
    <Box
      dir="ltr"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
        minHeight: '100vh',
        bgcolor: 'background.default',
        overflow: { xs: 'visible', md: 'hidden' },
      }}
    >
      <Box
        dir={pageDir}
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          // Phones start the form under the language control. Desktop keeps it centered.
          justifyContent: { xs: 'flex-start', md: 'center' },
          minHeight: '100vh',
          px: { xs: '20px', sm: 6, lg: 8 },
          pt: { xs: '20px', md: 6 },
          pb: { xs: '32px', md: 6 },
          bgcolor: 'background.paper',
          order: { xs: 1, md: formColumnOrder },
          overflowY: { xs: 'auto', md: 'hidden' },
          backgroundImage: [
            `radial-gradient(520px 320px at 0% 0%, ${alpha(BRAND_NAVY, 0.08)}, transparent 70%)`,
            `radial-gradient(420px 280px at 100% 100%, ${alpha(BRAND_ACCENT, 0.1)}, transparent 68%)`,
          ].join(', '),
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            flexShrink: 0,
            mb: { xs: '36px', md: 0 },
            // Desktop floats the switch so it does not push the centered form down.
            position: { xs: 'static', md: 'absolute' },
            top: { md: 16 },
            insetInlineEnd: { md: 28 },
            zIndex: 10,
          }}
        >
          <LanguageSwitcher />
        </Box>

        <Box sx={{ width: '100%', maxWidth: 440, mx: 'auto' }}>{children}</Box>
      </Box>

      <Box
        dir={pageDir}
        sx={{
          display: { xs: 'none', md: 'flex' },
          position: 'relative',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { md: 5, lg: 7 },
          color: '#FFFFFF',
          bgcolor: BRAND_NAVY_DARK,
          overflow: 'hidden',
          order: { xs: 2, md: heroColumnOrder },
        }}
      >
        <Box
          aria-hidden
          component="img"
          src={heroImage}
          alt=""
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 60%',
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            background: [
              `linear-gradient(180deg, ${alpha(BRAND_NAVY_DARK, 0.72)} 0%, ${alpha(BRAND_NAVY, 0.28)} 42%, ${alpha(BRAND_NAVY_DARK, 0.78)} 100%)`,
              heroSideWash,
            ].join(', '),
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            width: 280,
            height: 280,
            borderRadius: '50%',
            bgcolor: alpha(BRAND_ACCENT, 0.22),
            filter: 'blur(40px)',
            bottom: -80,
            insetInlineStart: -40,
          }}
        />

        <Box sx={{ position: 'relative' }}>
          <LoginLogo variant="dark" size="md" />
        </Box>

        <Box sx={{ position: 'relative', maxWidth: 460, textAlign: 'start' }}>
          <Box
            sx={{
              width: 48,
              height: 4,
              borderRadius: 99,
              mb: 2.5,
              background: `linear-gradient(90deg, ${BRAND_ACCENT} 0%, ${alpha('#FFFFFF', 0.7)} 100%)`,
            }}
          />
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: isRtlLayout ? 0 : '-0.03em',
              mb: 1.75,
              textShadow: `0 12px 32px ${alpha(BRAND_NAVY_DARK, 0.45)}`,
            }}
          >
            {t('login.tagline')}
          </Typography>
          <Typography sx={{ color: alpha('#FFFFFF', 0.82), fontSize: 16, lineHeight: 1.7, maxWidth: 400 }}>
            {t('login.taglineSubtitle')}
          </Typography>
        </Box>

        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ position: 'relative' }}>
          {trustBadges.map((label) => (
            <Box
              key={label}
              sx={{
                px: 1.75,
                py: 0.7,
                border: `1px solid ${alpha('#FFFFFF', 0.28)}`,
                borderRadius: '999px',
                fontSize: 12.5,
                fontWeight: 600,
                color: alpha('#FFFFFF', 0.92),
                bgcolor: alpha('#FFFFFF', 0.1),
                backdropFilter: 'blur(8px)',
              }}
            >
              {label}
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default LoginShell;
