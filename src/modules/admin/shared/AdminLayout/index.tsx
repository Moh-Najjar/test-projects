import React, { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Box,
  Breadcrumbs,
  Divider,
  Drawer,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  PeopleAltRounded as UsersIcon,
  AccountTreeRounded as DirectoratesIcon,
  GroupsRounded as GroupsIcon,
  DynamicFormRounded as FormsIcon,
  HistoryRounded as AuditIcon,
  SpaceDashboardRounded as DashboardIcon,
  LogoutRounded as LogoutIcon,
  MenuRounded as MenuIcon,
  KeyboardDoubleArrowLeftRounded as CollapseIcon,
  KeyboardDoubleArrowRightRounded as ExpandIcon,
  NotificationsNoneRounded as NotificationsIcon,
  AutoStoriesRounded as DocsIcon,
  NavigateNextRounded as CrumbSeparatorIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAdminAuth } from '../../../../core/context/AdminAuthContext';
import LanguageSwitcher from '../../../shared/LanguageSwitcher';
import {
  ADMIN_ACCENT,
  ADMIN_CYAN,
  ADMIN_GOLD,
  ADMIN_INDIGO,
  ADMIN_INK,
  ADMIN_INK_SURFACE,
} from '../theme/adminTokens';
import BrandMark from '../ui/BrandMark';

// ─── Sidebar constants ────────────────────────────────────────────────────────

const SIDEBAR_EXPANDED_WIDTH = 272;
const SIDEBAR_COLLAPSED_WIDTH = 84;
const HEADER_HEIGHT = 72;

interface NavItem {
  /** i18n key used for the sidebar label, tooltip, and default page title. */
  labelKey: string;
  path: string;
  icon: React.ReactNode;
}

interface NavGroup {
  /** i18n key of the group caption. */
  labelKey: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: 'admin.nav.group.overview',
    items: [{ labelKey: 'admin.nav.dashboard', path: '/admin', icon: <DashboardIcon /> }],
  },
  {
    labelKey: 'admin.nav.group.management',
    items: [
      { labelKey: 'admin.nav.users', path: '/admin/users', icon: <UsersIcon /> },
      { labelKey: 'admin.nav.directorates', path: '/admin/directorates', icon: <DirectoratesIcon /> },
      { labelKey: 'admin.nav.groupMappings', path: '/admin/group-mappings', icon: <GroupsIcon /> },
      { labelKey: 'admin.nav.forms', path: '/admin/forms', icon: <FormsIcon /> },
      { labelKey: 'admin.nav.auditLogs', path: '/admin/audit-logs', icon: <AuditIcon /> },
    ],
  },
  {
    labelKey: 'admin.nav.group.resources',
    items: [{ labelKey: 'admin.nav.documentation', path: '/admin/docs', icon: <DocsIcon /> }],
  },
];

/** Flat list of every nav item, used to resolve the active page title. */
const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

// ─── Sidebar content ──────────────────────────────────────────────────────────

interface SidebarContentProps {
  expanded: boolean;
  isActive: (path: string) => boolean;
  onNavigate?: () => void;
  onLogout: () => void;
}

/** Brand, grouped navigation and user footer — shared by desktop and mobile sidebars. */
const SidebarContent: React.FC<SidebarContentProps> = ({ expanded, isActive, onNavigate, onLogout }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isRtlLayout = theme.direction === 'rtl';

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: ADMIN_INK,
        color: '#FFFFFF',
        overflow: 'hidden',
        borderInlineEnd: `1px solid ${alpha(ADMIN_GOLD, 0.14)}`,
      }}
    >
      {/* Aurora glows behind the content */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: [
            `radial-gradient(420px 260px at 0% 0%, ${alpha(ADMIN_INDIGO, 0.4)}, transparent 70%)`,
            `radial-gradient(360px 260px at 100% 100%, ${alpha(ADMIN_GOLD, 0.16)}, transparent 70%)`,
            `radial-gradient(240px 200px at 100% 35%, ${alpha(ADMIN_GOLD, 0.1)}, transparent 70%)`,
            `radial-gradient(240px 200px at 0% 80%, ${alpha(ADMIN_CYAN, 0.08)}, transparent 70%)`,
          ].join(', '),
        }}
      />

      {/* Brand header */}
      <Stack
        direction="row"
        alignItems="center"
        gap={1.5}
        sx={{ position: 'relative', px: expanded ? 2.5 : 2, height: HEADER_HEIGHT + 8, justifyContent: expanded ? 'flex-start' : 'center' }}
      >
        <BrandMark size={44} />
        {expanded && (
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2, color: '#FFFFFF' }} noWrap>
              {t('admin.brand.title')}
            </Typography>
            <Typography
              sx={{ color: alpha('#FFFFFF', 0.5), fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 10 }}
              noWrap
            >
              {t('admin.brand.subtitle')}
            </Typography>
          </Box>
        )}
      </Stack>

      {/* Grouped navigation */}
      <Box component="nav" aria-label={t('admin.brand.subtitle')} sx={{ position: 'relative', flex: 1, overflowY: 'auto', px: 1.5, pb: 2 }}>
        {NAV_GROUPS.map((group) => (
          <Box key={group.labelKey} sx={{ mt: 2 }}>
            {expanded ? (
              <Typography
                sx={{ px: 1.5, mb: 1, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: alpha('#FFFFFF', 0.35) }}
              >
                {t(group.labelKey)}
              </Typography>
            ) : (
              <Divider sx={{ mx: 2, mb: 1.5, borderColor: alpha('#FFFFFF', 0.08) }} />
            )}

            <Stack gap={0.5}>
              {group.items.map((item) => {
                const active = isActive(item.path);
                const label = t(item.labelKey);
                return (
                  <Tooltip key={item.path} title={expanded ? '' : label} placement={isRtlLayout ? 'left' : 'right'}>
                    <Box
                      component={RouterLink}
                      to={item.path}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      sx={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: expanded ? 1.25 : 0,
                        justifyContent: expanded ? 'flex-start' : 'center',
                        height: 46,
                        borderRadius: '14px',
                        textDecoration: 'none',
                        color: active ? '#FFFFFF' : alpha('#FFFFFF', 0.62),
                        background: active
                          ? `linear-gradient(90deg, ${alpha(ADMIN_INDIGO, 0.38)} 0%, ${alpha(ADMIN_ACCENT, 0.12)} 100%)`
                          : 'transparent',
                        boxShadow: active ? `inset 0 0 0 1px ${alpha('#FFFFFF', 0.08)}` : 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          color: '#FFFFFF',
                          bgcolor: active ? undefined : alpha('#FFFFFF', 0.05),
                        },
                        '&:focus-visible': { outline: `2px solid ${alpha(ADMIN_ACCENT, 0.8)}`, outlineOffset: 2 },
                        // Leading ink bar for the active page.
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          insetInlineStart: -12,
                          top: 11,
                          bottom: 11,
                          width: 3,
                          borderRadius: 4,
                          bgcolor: ADMIN_GOLD,
                          opacity: active ? 1 : 0,
                          transition: 'opacity 0.2s ease',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: '10px',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          bgcolor: active ? ADMIN_INDIGO : alpha('#FFFFFF', 0.04),
                          boxShadow: active ? `0 8px 18px -8px ${alpha(ADMIN_ACCENT, 0.9)}` : 'none',
                          '& svg': { fontSize: 19 },
                        }}
                      >
                        {item.icon}
                      </Box>
                      {expanded && (
                        <Typography noWrap sx={{ fontSize: 14, fontWeight: active ? 700 : 600 }}>
                          {label}
                        </Typography>
                      )}
                    </Box>
                  </Tooltip>
                );
              })}
            </Stack>
          </Box>
        ))}
      </Box>

      {/* User card + version */}
      <Box sx={{ position: 'relative', p: 1.5 }}>
        <Stack
          direction={expanded ? 'row' : 'column'}
          alignItems="center"
          gap={1.25}
          sx={{
            p: 1.25,
            borderRadius: '16px',
            bgcolor: alpha(ADMIN_INK_SURFACE, 0.9),
            border: `1px solid ${alpha('#FFFFFF', 0.06)}`,
          }}
        >
          <Avatar sx={{ width: 36, height: 36, fontSize: 13, bgcolor: ADMIN_INDIGO, color: '#FFFFFF' }}>AD</Avatar>
          {expanded && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                {t('admin.user.name')}
              </Typography>
              <Typography noWrap sx={{ fontSize: 11, fontWeight: 600, color: alpha('#FFFFFF', 0.5) }}>
                {t('admin.user.role')}
              </Typography>
            </Box>
          )}
          <Tooltip title={t('admin.logout')} placement={expanded ? 'top' : isRtlLayout ? 'left' : 'right'}>
            <IconButton
              size="small"
              onClick={onLogout}
              aria-label={t('admin.logout')}
              sx={{ color: alpha('#FFFFFF', 0.6), '&:hover': { color: '#FB7185', bgcolor: alpha('#FB7185', 0.12) } }}
            >
              <LogoutIcon fontSize="small" sx={{ transform: isRtlLayout ? 'scaleX(-1)' : 'none' }} />
            </IconButton>
          </Tooltip>
        </Stack>
        {expanded && (
          <Typography sx={{ mt: 1.25, textAlign: 'center', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: alpha('#FFFFFF', 0.28) }}>
            {t('admin.version')}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// ─── AdminLayout ──────────────────────────────────────────────────────────────

interface AdminLayoutProps {
  children: React.ReactNode;
  /** Optional page title shown in the top header. */
  title?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { adminLogout } = useAdminAuth();
  const theme = useTheme();
  const isRtlLayout = theme.direction === 'rtl';

  // Below the md breakpoint the sidebar becomes a temporary drawer.
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const sidebarWidth = expanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (): void => {
    setAnchorEl(null);
  };

  const handleLogout = (): void => {
    handleMenuClose();
    adminLogout();
    navigate('/admin/login', { replace: true });
  };

  const isActive = (path: string): boolean => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  // Toggle collapses the sidebar on desktop and opens the drawer on mobile.
  const handleToggle = (): void => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
      return;
    }
    setExpanded((prev) => !prev);
  };

  // Resolve the current nav entry for breadcrumbs and the default title.
  const activeItem = NAV_ITEMS.find((item) => isActive(item.path));
  const pageTitle = title ?? (activeItem !== undefined ? t(activeItem.labelKey) : '');

  // Collapse/expand arrows point the other way in RTL.
  const collapseGlyph = expanded ? <CollapseIcon /> : <ExpandIcon />;

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      {/* ── Desktop sidebar ── */}
      {!isMobile && (
        <Box
          component="aside"
          sx={{
            width: sidebarWidth,
            flexShrink: 0,
            height: '100%',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: `0 0 0 1px ${alpha('#000000', 0.2)}`,
            zIndex: 2,
          }}
        >
          <SidebarContent expanded={expanded} isActive={isActive} onLogout={handleLogout} />
        </Box>
      )}

      {/* ── Mobile drawer ── */}
      {isMobile && (
        <Drawer
          variant="temporary"
          anchor={isRtlLayout ? 'right' : 'left'}
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { width: SIDEBAR_EXPANDED_WIDTH, border: 'none', bgcolor: ADMIN_INK } }}
        >
          <SidebarContent expanded isActive={isActive} onNavigate={() => setMobileOpen(false)} onLogout={handleLogout} />
        </Drawer>
      )}

      {/* ── Main content area ── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, position: 'relative' }}>
        {/* Soft aurora wash across the top of the canvas */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            insetInline: 0,
            top: 0,
            height: 420,
            pointerEvents: 'none',
            background: [
              `radial-gradient(900px 320px at 85% -10%, ${alpha(ADMIN_GOLD, theme.palette.mode === 'dark' ? 0.1 : 0.08)}, transparent 70%)`,
              `radial-gradient(700px 280px at 10% -20%, ${alpha(ADMIN_INDIGO, theme.palette.mode === 'dark' ? 0.18 : 0.1)}, transparent 70%)`,
            ].join(', '),
          }}
        />

        {/* Top header bar */}
        <Box
          component="header"
          sx={{
            position: 'relative',
            zIndex: 3,
            height: { xs: 'auto', md: HEADER_HEIGHT },
            minHeight: HEADER_HEIGHT,
            py: { xs: 1, md: 0 },
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: { xs: 2, md: 4 },
            bgcolor: alpha(theme.palette.background.default, 0.7),
            backdropFilter: 'saturate(180%) blur(14px)',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Tooltip title={isMobile ? '' : t(expanded ? 'admin.sidebar.collapse' : 'admin.sidebar.expand')}>
            <IconButton
              onClick={handleToggle}
              aria-label={t(expanded ? 'admin.sidebar.collapse' : 'admin.sidebar.expand')}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                '& svg': { transform: isRtlLayout ? 'scaleX(-1)' : 'none' },
              }}
            >
              {isMobile ? <MenuIcon /> : collapseGlyph}
            </IconButton>
          </Tooltip>

          {/* Breadcrumb + page title */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Breadcrumbs
              separator={<CrumbSeparatorIcon sx={{ fontSize: 14, transform: isRtlLayout ? 'scaleX(-1)' : 'none' }} />}
              sx={{ '& .MuiBreadcrumbs-separator': { mx: 0.5, color: 'text.disabled' }, display: { xs: 'none', sm: 'block' } }}
            >
              <Typography
                component={RouterLink}
                to="/admin"
                sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
              >
                {t('admin.breadcrumb.root')}
              </Typography>
              {activeItem !== undefined && activeItem.path !== '/admin' && (
                <Typography
                  component={RouterLink}
                  to={activeItem.path}
                  sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
                >
                  {t(activeItem.labelKey)}
                </Typography>
              )}
            </Breadcrumbs>
            <Typography
              variant="h6"
              color="text.primary"
              sx={{
                fontWeight: 800,
                lineHeight: 1.3,
                fontSize: { xs: '0.95rem', md: '1.25rem' },
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {pageTitle}
            </Typography>
          </Box>

          <Stack direction="row" alignItems="center" gap={1}>
            {/* EN / AR toggle — persists via i18n localStorage and flips RTL layout. */}
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <LanguageSwitcher />
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 2, display: { xs: 'none', sm: 'block' } }} />

            {/* User profile trigger */}
            <Box
              component="button"
              type="button"
              onClick={handleMenuOpen}
              aria-haspopup="menu"
              aria-expanded={Boolean(anchorEl)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                cursor: 'pointer',
                p: 0.5,
                pr: { xs: 0.5, sm: 1.5 },
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '999px',
                bgcolor: 'background.paper',
                font: 'inherit',
                color: 'inherit',
                transition: 'all 0.2s ease',
                '&:hover': { borderColor: alpha(theme.palette.primary.main, 0.4), boxShadow: `0 6px 16px -10px ${alpha(theme.palette.primary.main, 0.6)}` },
              }}
            >
              <Avatar sx={{ width: 34, height: 34, fontSize: 12, bgcolor: ADMIN_INDIGO, color: '#FFFFFF' }}>AD</Avatar>
              <Box sx={{ textAlign: 'start', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {t('admin.user.name')}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  {t('admin.user.role')}
                </Typography>
              </Box>
            </Box>

            {/* User menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{ paper: { sx: { mt: 1, minWidth: 220 } } }}
            >
              <Stack direction="row" alignItems="center" gap={1.5} sx={{ px: 1.5, py: 1.25 }}>
                <Avatar sx={{ width: 38, height: 38, fontSize: 13, bgcolor: ADMIN_INDIGO, color: '#FFFFFF' }}>AD</Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap>
                    {t('admin.user.name')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    admin@aseza.com
                  </Typography>
                </Box>
              </Stack>
              {isMobile && (
                <Box sx={{ px: 1.5, py: 1 }}>
                  <LanguageSwitcher />
                </Box>
              )}
              <Divider sx={{ my: 0.5 }} />
              <MenuItem
                onClick={handleLogout}
                sx={{ color: 'error.main', fontWeight: 600, '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) } }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: '32px !important' }}>
                  <LogoutIcon fontSize="small" sx={{ transform: isRtlLayout ? 'scaleX(-1)' : 'none' }} />
                </ListItemIcon>
                {t('admin.logout')}
              </MenuItem>
            </Menu>
          </Stack>
        </Box>

        {/* Page content */}
        <Box
          component="main"
          sx={{
            position: 'relative',
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            px: { xs: 2, md: 4 },
            py: { xs: 2.5, md: 4 },
            animation: 'adminFadeIn 0.4s ease-out',
            '@keyframes adminFadeIn': {
              '0%': { opacity: 0, transform: 'translateY(6px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto' }}>{children}</Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;
