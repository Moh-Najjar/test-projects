import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { alpha, useTheme } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';

import logoUrlEn from '../../../assets/logo-en.png';
import logoUrlAr from '../../../assets/logo-ar.png';
import { CONTACT_ITEMS, BOTTOM_LINKS, POWERED_BY, isExternalHref } from './footerLinks';
import { useAuth } from '../../../core/context/AuthContext';
import { BRAND_ACCENT, BRAND_PANEL_DARK } from '../../../core/constants/theme';
import { createNavLinks, type NavbarNavItem } from '../Navbar/navLinks';
import { useNavItems } from '../Navbar/useNavItems';
import type { UserRole } from '../../../core/types/roles';

/**
 * Strongly-typed props for the shared Footer component.
 */
export interface FooterProps {
  sx?: SxProps<Theme>;
}

/** Every role the RBAC layer knows about; used to narrow raw role strings from the auth context. */
const KNOWN_ROLES: ReadonlyArray<UserRole> = ['DATA_ENTRY', 'APPROVER'];

/** Type guard: narrows an arbitrary role string to a known `UserRole`. */
const isUserRole = (value: string): value is UserRole => KNOWN_ROLES.some((role) => role === value);

/**
 * The logo PNG is navy/teal ink on a solid white background. On the blue footer
 * these filters turn it into a white mark and blend the white box away.
 */
const logoOnBrandSx: SxProps<Theme> = {
  filter: 'grayscale(1) invert(1)',
  mixBlendMode: 'screen',
};

/** Shared look for every text link in the footer. */
const footerLinkSx: SxProps<Theme> = {
  color: 'inherit',
  textDecoration: 'none',
  opacity: 0.85,
  transition: 'opacity 150ms ease',
  '&:hover': { opacity: 1, textDecoration: 'underline' },
  '&:focus-visible': { opacity: 1, outline: '2px solid currentColor', outlineOffset: '2px', borderRadius: '2px' },
};

/** Column heading style (kept in px because the theme spacing is viewport-relative). */
const columnTitleSx: SxProps<Theme> = {
  mb: '16px',
  fontWeight: 600,
  fontSize: '1.05rem',
  color: 'inherit',
};

interface FooterNavLinkProps {
  href: string;
  children: React.ReactNode;
}

/**
 * Renders a footer link as a SPA `RouterLink` for in-app routes,
 * or as a plain anchor (new tab for web URLs) for external targets.
 */
const FooterNavLink: React.FC<FooterNavLinkProps> = ({ href, children }) => {
  // External targets (web, mailto, tel) must be real anchors.
  if (isExternalHref(href)) {
    const opensNewTab = href.startsWith('http://') || href.startsWith('https://');
    return (
      <Link
        href={href}
        target={opensNewTab ? '_blank' : undefined}
        rel={opensNewTab ? 'noopener noreferrer' : undefined}
        sx={footerLinkSx}>
        {children}
      </Link>
    );
  }

  // Internal routes use client-side navigation.
  return (
    <Link component={RouterLink} to={href} sx={footerLinkSx}>
      {children}
    </Link>
  );
};

const Footer: React.FC<FooterProps> = ({ sx }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { isAuthenticated, userRoles } = useAuth();

  // Narrow raw role strings from the auth context to known roles (no casting).
  const knownRoles = useMemo<ReadonlyArray<UserRole>>(
    () => (Array.isArray(userRoles) ? userRoles.filter(isUserRole) : []),
    [userRoles]
  );

  // Reuse the Navbar's link tree + RBAC filter so the footer never offers a page the navbar hides.
  const allNavLinks = useMemo<ReadonlyArray<NavbarNavItem>>(() => createNavLinks(t), [t]);
  const quickLinks = useNavItems(allNavLinks, knownRoles);

  // Hooks above must run on every render; bail out only after they have been called.
  if (!isAuthenticated) {
    return null;
  }

  const isDark = theme.palette.mode === 'dark';
  const isArabic = i18n.language === 'ar';
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        mt: '48px',
        // Dark mode uses the deep brand panel; the lifted primary blue would glare as a large fill.
        backgroundColor: isDark ? BRAND_PANEL_DARK : theme.palette.primary.main,
        // Thin teal stripe echoes the accent colour used in the logo.
        borderTop: `4px solid ${BRAND_ACCENT}`,
        color: '#ffffff',
        ...sx,
      }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto', px: { xs: '16px', md: '24px' }, pt: '40px', pb: '24px' }}>
        <Grid container columnSpacing="32px" rowSpacing="32px" sx={{ mb: '32px' }}>
          {/* Column 1: logo and short description of the portal */}
          <Grid size={{ xs: 12, md: 5 }} sx={{ textAlign: { xs: 'center', md: 'start' } }}>
            <Box
              component={RouterLink}
              to="/home"
              aria-label={t('nav.home')}
              sx={{ display: 'inline-flex', mb: '16px' }}>
              <Box
                component="img"
                src={isArabic ? logoUrlAr : logoUrlEn}
                alt={t('footer.alt.logo')}
                sx={{ width: '240px', maxWidth: '100%', height: 'auto', ...logoOnBrandSx }}
              />
            </Box>
            <Typography
              variant="body2"
              sx={{ opacity: 0.85, lineHeight: 1.8, maxWidth: { md: '380px' }, mx: { xs: 'auto', md: 0 } }}>
              {t('footer.description')}
            </Typography>
          </Grid>

          {/* Column 2: quick links (same RBAC-filtered items as the navbar) */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography component="h2" sx={columnTitleSx}>
              {t('footer.quickLinks')}
            </Typography>
            <Stack component="ul" spacing="10px" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {quickLinks.map((item) => (
                <Box component="li" key={item.id} sx={{ fontSize: '0.95rem' }}>
                  <FooterNavLink href={item.to}>{item.label}</FooterNavLink>
                </Box>
              ))}
            </Stack>
          </Grid>

          {/* Column 3: ASEZA contact details */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography component="h2" sx={columnTitleSx}>
              {t('footer.contactUs')}
            </Typography>
            <Stack component="ul" spacing="12px" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {CONTACT_ITEMS.map((item) => {
                // Translated rows (address) follow page direction; literal values (phone/email/URL) stay LTR.
                const isTranslated = typeof item.labelKey === 'string';
                const content = typeof item.labelKey === 'string' ? t(item.labelKey) : (item.text ?? '');

                // Skip misconfigured rows rather than rendering an empty line.
                if (content.length === 0) {
                  return null;
                }

                const Icon = item.icon;
                const text = (
                  <Typography
                    component="span"
                    variant="body2"
                    dir={isTranslated ? undefined : 'ltr'}
                    sx={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
                    {content}
                  </Typography>
                );

                return (
                  <Stack component="li" key={item.id} direction="row" spacing="10px" alignItems="flex-start">
                    <Icon sx={{ fontSize: '1.15rem', mt: '3px', color: BRAND_ACCENT, flexShrink: 0 }} />
                    {item.link ? (
                      <FooterNavLink href={item.link}>{text}</FooterNavLink>
                    ) : (
                      <Box sx={{ opacity: 0.85 }}>{text}</Box>
                    )}
                  </Stack>
                );
              })}
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: alpha('#ffffff', 0.15), mb: '20px' }} />

        {/* Bottom bar: copyright on one side, secondary links on the other */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems="center"
          spacing="12px"
          sx={{ fontSize: '0.85rem' }}>
          <Typography variant="body2" sx={{ opacity: 0.8, fontSize: 'inherit', textAlign: 'center' }}>
            {t('login.copyright', { year: currentYear })}
            {` · ${t('footer.rightsReserved')}`}
          </Typography>

          <Stack direction="row" spacing="20px" alignItems="center" flexWrap="wrap" justifyContent="center" useFlexGap>
            {BOTTOM_LINKS.map((link) => (
              <FooterNavLink key={link.id} href={link.href}>
                {t(link.labelKey)}
              </FooterNavLink>
            ))}
          </Stack>
        </Stack>

        {/* Vendor credit; the brand name is kept untranslated */}
        <Typography
          variant="body2"
          sx={{ mt: '16px', textAlign: 'center', fontSize: '0.8rem', opacity: 0.75 }}>
          {`${t('footer.poweredBy')} `}
          <Link
            href={POWERED_BY.href}
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
            sx={{ color: 'inherit', textDecoration: 'underline', '&:hover': { opacity: 1, color: BRAND_ACCENT } }}>
            {POWERED_BY.name}
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default Footer;
