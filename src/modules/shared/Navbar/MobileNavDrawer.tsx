import React, { useCallback, useMemo, useState } from 'react';

import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useTranslation } from 'react-i18next';

import type { NavbarNavItem } from './navLinks';

export interface MobileNavDrawerProps {
  /** Whether the drawer is visible. */
  open: boolean;
  /** Header logo source (recommended: same as Navbar). */
  logoSrc?: string;
  /** Header logo alt text. */
  logoAlt?: string;
  /** The full nav tree to render. */
  items: ReadonlyArray<NavbarNavItem>;
  /** Current pathname for active highlighting. */
  activePathname: string;
  /** Called when the drawer should close (backdrop click, escape, close button). */
  onClose: () => void;
  /** Called when the user selects a leaf nav item. */
  onNavigate: (to: string) => void;
  /** Phone number to display in the drawer. */
  phoneNumber?: string;
}

function hasChildren(item: NavbarNavItem): item is NavbarNavItem & {
  children: ReadonlyArray<NavbarNavItem>;
} {
  return typeof item.children !== 'undefined' && item.children.length > 0;
}

function isItemActive(item: NavbarNavItem, pathname: string): boolean {
  // Direct match for leaf items.
  if (item.to === pathname) {
    return true;
  }

  // If this is a parent item, any active descendant should mark it active too.
  if (hasChildren(item)) {
    return item.children.some((child) => isItemActive(child, pathname));
  }

  return false;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  open,
  logoSrc,
  logoAlt = 'Logo',
  items,
  activePathname,
  onClose,
  onNavigate,
  phoneNumber = '800 79',
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  // Track which parent sections are expanded (by nav item id).
  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({});

  const resetExpanded = useCallback((): void => {
    setExpandedById({});
  }, []);

  const handleClose = useCallback((): void => {
    onClose();
    resetExpanded();
  }, [onClose, resetExpanded]);

  const toggleExpanded = useCallback((id: string): void => {
    setExpandedById((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const handleNavigate = useCallback(
    (to: string): void => {
      onNavigate(to);
      handleClose();
    },
    [handleClose, onNavigate]
  );

  const drawerPaperSx = useMemo(
    () => ({
      width: 340,
      maxWidth: '90vw',
      bgcolor: 'background.paper',
      display: 'flex',
      flexDirection: 'column',
      p: 8,
    }),
    []
  );

  const renderItem = useCallback(
    function renderItemFn(item: NavbarNavItem, level: number): React.ReactNode {
      const itemActive = isItemActive(item, activePathname);
      const isCategory = level === 0;
      const isRamadanCampaign = item.id === 'ramadanCampaign2026';

      if (hasChildren(item)) {
        const isOpen = Boolean(expandedById[item.id]);

        return (
          <Box key={item.id}>
            <ListItemButton
              onClick={() => toggleExpanded(item.id)}
              sx={{
                px: 2,
                pl: 2.5 + level * 2,
                py: 1.5,
                '&:hover': {
                  bgcolor: 'transparent',
                },
              }}>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  sx: {
                    fontWeight: isCategory ? 600 : itemActive ? 800 : 600,
                    fontSize: isCategory ? theme.typography.h4.fontSize : theme.typography.body1.fontSize,
                    color: itemActive ? 'primary.main' : 'text.primary',
                  },
                }}
              />

              <ListItemIcon
                sx={{
                  minWidth: 32,
                  justifyContent: 'center',
                  color: 'primary.main',
                }}>
                {isOpen ? <ExpandLessIcon sx={{ fontSize: 23 }} /> : <ExpandMoreIcon sx={{ fontSize: 23 }} />}
              </ListItemIcon>
            </ListItemButton>

            <Box
              sx={{
                display: isOpen ? 'block' : 'none',
                pb: 1,
              }}>
              <List disablePadding>{item.children.map((child) => renderItemFn(child, level + 1))}</List>
            </Box>
          </Box>
        );
      }

      return (
        <ListItemButton
          key={item.id}
          onClick={() => handleNavigate(item.to)}
          sx={{
            px: 2,
            pl: 2.5 + level * 2,
            py: 1,
            '&:hover': {
              bgcolor: 'transparent',
            },
          }}>
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              sx: {
                fontWeight: isCategory ? 600 : itemActive ? 800 : 600,
                fontSize: isCategory ? theme.typography.h4.fontSize : theme.typography.body1.fontSize,
                // Ramadan campaign link should always be red (requested).
                color: isRamadanCampaign ? 'error.main' : itemActive ? 'primary.main' : 'text.primary',
              },
            }}
          />
        </ListItemButton>
      );
    },
    // Include `theme` because typography values are read inside the callback.
    [activePathname, expandedById, handleNavigate, theme, toggleExpanded]
  );

  return (
    <Drawer
      open={open}
      anchor="left"
      onClose={handleClose}
      ModalProps={{
        keepMounted: true,
      }}
      PaperProps={{ sx: drawerPaperSx }}>
      {/* Drawer header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 2 }}>
        {typeof logoSrc === 'string' && logoSrc.trim().length > 0 ? (
          <Box
            component="img"
            src={logoSrc}
            alt={logoAlt}
            onClick={() => handleNavigate('/')}
            sx={{
              width: 200,
              height: 60,
              objectFit: 'contain',
              cursor: 'pointer',
              // Same light-logo file: drop the white box on a dark drawer.
              ...(theme.palette.mode === 'dark'
                ? {
                    filter: 'grayscale(1) invert(1)',
                    mixBlendMode: 'screen',
                  }
                : {}),
            }}
          />
        ) : null}
        {/* Explicit close icon */}
        <IconButton aria-label={t('navbar.aria.closeMenu')} onClick={handleClose} sx={{ color: 'primary.main' }}>
          <CloseIcon sx={{ fontSize: 23 }} />
        </IconButton>
      </Stack>

      {/* Nav items scrollable area */}
      <Box
        role="navigation"
        sx={{
          flex: 1,
          overflowY: 'auto',
          py: 1,
        }}>
        <List disablePadding>{items.map((item) => renderItem(item, 0))}</List>
      </Box>

      {/* Drawer Footer / Bottom Section */}
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Divider sx={{ mb: 3 }} />

        <Stack spacing={3}>
          {/* Row 1: My Requests (one side) | divider | New Request (other side) */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ gap: 2 }}>
            {/* My Requests quick link */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              onClick={() => handleNavigate('/my-requests')}
              sx={{
                flex: 1,
                cursor: 'pointer',
                '&:hover': { opacity: 0.75 },
              }}>
              <IconButton
                sx={{
                  color: 'primary.main',
                  p: 0,
                  pointerEvents: 'none',
                }}>
                <ListAltIcon sx={{ fontSize: 22 }} />
              </IconButton>
              <Stack spacing={0}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: 'text.secondary', lineHeight: 1.2 }}>
                  {t('nav.myRequests', 'My Requests')}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                    fontSize: theme.typography.body2.fontSize,
                    lineHeight: 1.3,
                  }}>
                  {t('nav.viewAll', 'View All')}
                </Typography>
              </Stack>
            </Stack>

            {/* Vertical divider */}
            <Divider orientation="vertical" flexItem sx={{ alignSelf: 'stretch' }} />

            {/* New Request quick link */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              onClick={() => handleNavigate('/my-requests/new')}
              sx={{
                flex: 1,
                cursor: 'pointer',
                '&:hover': { opacity: 0.75 },
              }}>
              <IconButton
                sx={{
                  color: 'primary.main',
                  p: 0,
                  pointerEvents: 'none',
                }}>
                <AddCircleOutlineIcon sx={{ fontSize: 22 }} />
              </IconButton>
              <Stack spacing={0}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: 'text.secondary', lineHeight: 1.2 }}>
                  {t('nav.services', 'Services')}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                    fontSize: theme.typography.body2.fontSize,
                    lineHeight: 1.3,
                  }}>
                  {t('nav.newRequest', 'New Request')}
                </Typography>
              </Stack>
            </Stack>
          </Stack>

          {/* Row 2: Phone number with icon */}
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                width: 36,
                height: 36,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
              <LocalPhoneIcon sx={{ fontSize: 20 }} />
            </Box>
            <Stack spacing={0}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, color: 'text.secondary', lineHeight: 1.2 }}>
                {t('nav.callUs', 'Call Us')}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  fontSize: theme.typography.body1.fontSize,
                  lineHeight: 1.3,
                  direction: 'ltr',
                }}>
                {phoneNumber}
              </Typography>
            </Stack>
          </Stack>

          {/* Row 3: Centered contact button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
            <Button
              variant="contained"
              onClick={() => handleNavigate('/contact')}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                borderRadius: 1,
                px: 6,
                py: 1.5,
                fontSize: theme.typography.body1.fontSize,
                fontWeight: 600,
                textTransform: 'none',
              }}>
              {t('nav.contactUs')}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Drawer>
  );
};
