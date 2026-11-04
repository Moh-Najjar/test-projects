import React, { useState } from 'react';
import {
  Avatar,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Popover,
  Stack,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../core/context/AuthContext';
import { useDeviceType } from '../../../core/hooks/useDeviceType';

export const UserProfile = () => {
  const { t, i18n } = useTranslation();
  const { logout, userInfo } = useAuth();

  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';

  const navigate = useNavigate();
  const theme = useTheme();

  // User menu state (avatar dropdown).
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);
  const userMenuOpen = Boolean(userMenuAnchorEl);


  // Derive display values from the live backend session.
  const userName = userInfo?.fullNameEn ?? '';
  const userEmail = userInfo?.email ?? '';

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>): void => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = (): void => {
    setUserMenuAnchorEl(null);
  };

  const handleProfileClick = (): void => {
    navigate('/profile');
    handleUserMenuClose();
  };

  const handleLogoutClick = (): void => {
    handleUserMenuClose();
    logout();
  };

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        onClick={handleUserMenuOpen}
        sx={{
          cursor: 'pointer',
          ml: isMobile ? 0 : 1,
          mr: 0,
          transition: 'opacity 0.2s',
          '&:hover': { opacity: 0.8 },
        }}>
        <Avatar
          alt={userName}
          sx={{
            width: isMobile ? 32 : 40,
            height: isMobile ? 32 : 40,
            border: `2px solid ${theme.palette.primary.main}`,
            bgcolor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            fontWeight: 700,
            fontSize: isMobile ? '1rem' : '1.25rem',
          }}>
          <PersonIcon sx={{ fontSize: isMobile ? '1.1rem' : '1.4rem' }} />
        </Avatar>
      </Stack>

      <Popover
        open={userMenuOpen}
        anchorEl={userMenuAnchorEl}
        onClose={handleUserMenuClose}
        disableScrollLock
        anchorOrigin={{ vertical: 'bottom', horizontal: i18n.language === 'ar' ? 'right' : 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: i18n.language === 'ar' ? 'right' : 'left' }}
        PaperProps={{
          sx: {
            mt: '8px',
            borderRadius: 2,
            width: 'min(320px, calc(100vw - 24px))',
            maxWidth: 'calc(100vw - 24px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          },
        }}>
        {/* Header Section */}
        <Box
          sx={{
            p: isMobile ? '16px' : 2.5,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                width: 48,
                height: 48,
                border: '2px solid rgba(255,255,255,0.8)',
                bgcolor: theme.palette.primary.dark,
                color: theme.palette.primary.contrastText,
                fontWeight: 700,
              }}>
              <PersonIcon sx={{ fontSize: '1.5rem' }} />
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="body1" fontWeight={700} noWrap sx={{ lineHeight: 1.2, mb: 0.5 }}>
                {userName}
              </Typography>
              <Typography variant="body1" noWrap sx={{ opacity: 0.9, fontWeight: 400 }}>
                {userEmail}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider />

        {/* Profile Navigation */}
        <Box sx={{ py: isMobile ? 5 : 1 }}>
          <MenuList dense sx={{ py: 0 }}>
            <MenuItem
              onClick={handleProfileClick}
              sx={{
                px: 2.5,
                py: 1,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <PersonIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={t('nav.profile', 'Profile')}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: 600,
                }}
              />
            </MenuItem>
          </MenuList>
        </Box>

        <Divider />

        {/* Footer Section - Logout */}
        <Box sx={{ p: 1, bgcolor: 'action.hover' }}>
          <MenuItem
            onClick={handleLogoutClick}
            sx={{
              borderRadius: 1,
              px: 1.5,
              py: 1,
              color: 'error.main',
              '&:hover': {
                backgroundColor: (t) => alpha(t.palette.error.main, 0.08),
              },
            }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText
              primary={t('nav.logout', 'Logout')}
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: 600,
              }}
            />
          </MenuItem>
        </Box>
      </Popover>
    </>
  );
};
