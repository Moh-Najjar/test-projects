import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Fade,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  ManageAccounts as ManageIcon,
  PersonAdd as AssignRoleIcon,
  Business as DirectorateIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  PeopleAltRounded as UsersIcon,
} from '@mui/icons-material';
import type { SelectChangeEvent } from '@mui/material';
import AdminLayout from '../../shared/AdminLayout';
import {
  useAdminUsers,
  useAdminAllRoles,
  useAdminUserRoles,
  useAssignRoleToUser,
  useRemoveRoleFromUser,
  useAssignDirectorateToUser,
} from '../../../../core/hooks/admin/useAdminUsers';
import { useAdminDirectorates } from '../../../../core/hooks/admin/useAdminDirectorates';
import type { AdminUser, UserRoleAssignment } from '../../../../core/types/admin/adminUsers';
import { useLocale } from '../../../../core/hooks/useLocale';
import {
  DialogHeader,
  EmptyState,
  ErrorState,
  FormSection,
  IconAction,
  LoadingState,
  PageHeader,
  StatusPill,
  SurfaceCard,
} from '../../shared/ui';
import { ADMIN_INDIGO } from '../../shared/theme/adminTokens';

// ─── Manage User Dialog ───────────────────────────────────────────────────────

interface ManageUserDialogProps {
  user: AdminUser;
  onClose: () => void;
}

const ManageUserDialog: React.FC<ManageUserDialogProps> = ({ user, onClose }) => {
  const theme = useTheme();
  const { t, loc } = useLocale();
  const displayName = loc(user.fullNameEn, user.fullNameAr);
  const { data: rawAllRoles } = useAdminAllRoles();
  const allRoles = Array.isArray(rawAllRoles) ? rawAllRoles : [];

  const { data: rawDialogDirectorates } = useAdminDirectorates();
  const directorates = Array.isArray(rawDialogDirectorates) ? rawDialogDirectorates : [];

  const { data: rawUserRoles, isLoading: rolesLoading } = useAdminUserRoles(user.userId);
  const userRoleList: UserRoleAssignment[] = Array.isArray(rawUserRoles) ? rawUserRoles : [];

  const assignRole = useAssignRoleToUser();
  const removeRole = useRemoveRoleFromUser();
  const assignDirectorate = useAssignDirectorateToUser();

  const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');
  const [selectedDirectorateId, setSelectedDirectorateId] = useState<number | ''>(user.directorateId ?? '');

  const handleAssignRole = (): void => {
    if (selectedRoleId === '') return;
    assignRole.mutate({ userId: user.userId, data: { roleId: Number(selectedRoleId) } });
    setSelectedRoleId('');
  };

  const handleRemoveRole = (assignment: UserRoleAssignment): void => {
    removeRole.mutate({ userId: user.userId, roleId: assignment.roleId });
  };

  const handleAssignDirectorate = (): void => {
    assignDirectorate.mutate({
      userId: user.userId,
      data: { directorateId: selectedDirectorateId === '' ? null : Number(selectedDirectorateId) },
    });
  };

  const handleDirectorateChange = (e: SelectChangeEvent<number | string>): void => {
    const val = e.target.value;
    setSelectedDirectorateId(val === '' ? '' : Number(val));
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth TransitionComponent={Fade}>
      <DialogHeader
        title={t('admin.users.dialog.title')}
        subtitle={user.email}
        tone="indigo"
        onClose={onClose}
        avatar={
          <Avatar sx={{ width: 48, height: 48, fontWeight: 800, bgcolor: ADMIN_INDIGO, color: '#FFFFFF' }}>
            {displayName.charAt(0)}
          </Avatar>
        }
      />

      <DialogContent>
        <Stack spacing={2}>
          <FormSection title={t('admin.users.roles.title')} description={t('admin.users.roles.description')}>
            <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: 'action.hover' }}>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {rolesLoading ? (
                  <CircularProgress size={16} />
                ) : userRoleList.length === 0 ? (
                  <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                    {t('admin.users.roles.empty')}
                  </Typography>
                ) : (
                  userRoleList.map((assignment) => (
                    <Chip
                      key={assignment.userRoleId}
                      label={assignment.role.roleName}
                      size="small"
                      onDelete={() => handleRemoveRole(assignment)}
                    />
                  ))
                )}
              </Stack>
            </Box>

            <Stack direction="row" gap={1.5}>
              <FormControl size="small" fullWidth>
                <InputLabel>{t('admin.users.roles.add')}</InputLabel>
                <Select
                  value={selectedRoleId}
                  label={t('admin.users.roles.add')}
                  onChange={(e) => setSelectedRoleId(e.target.value as number | '')}
                >
                  {allRoles.map((role) => (
                    <MenuItem key={role.roleId} value={role.roleId} sx={{ fontWeight: 600 }}>
                      {role.roleName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                disabled={selectedRoleId === '' || assignRole.isPending}
                onClick={handleAssignRole}
                startIcon={<AssignRoleIcon />}
              >
                {t('admin.common.add')}
              </Button>
            </Stack>
          </FormSection>

          <FormSection title={t('admin.users.directorate.title')} description={t('admin.users.directorate.description')}>
            <Stack direction="row" gap={1.5}>
              <FormControl size="small" fullWidth>
                <InputLabel>{t('admin.users.directorate.select')}</InputLabel>
                <Select value={selectedDirectorateId} label={t('admin.users.directorate.select')} onChange={handleDirectorateChange}>
                  <MenuItem value="">
                    <em>{t('admin.users.directorate.none')}</em>
                  </MenuItem>
                  {directorates.map((d) => (
                    <MenuItem key={d.directorateId} value={d.directorateId} sx={{ fontWeight: 600 }}>
                      {loc(d.nameEn, d.nameAr)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="outlined" disabled={assignDirectorate.isPending} onClick={handleAssignDirectorate}>
                {assignDirectorate.isPending ? '...' : t('admin.common.save')}
              </Button>
            </Stack>

            {user.directorate !== null && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.16),
                }}
              >
                <Typography variant="caption" fontWeight={700} color="primary.main">
                  {t('admin.users.directorate.current')}
                </Typography>
                <Typography variant="body2" fontWeight={800} color="text.primary">
                  {user.directorate !== null ? loc(user.directorate.nameEn, user.directorate.nameAr) : ''}
                </Typography>
              </Box>
            )}
          </FormSection>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained" color="inherit" fullWidth>
          {t('admin.common.finished')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/** Wait this long after the last keystroke before asking the server for matching emails. */
const EMAIL_SEARCH_DEBOUNCE_MS = 500;

// ─── UserManagement page ──────────────────────────────────────────────────────

const UserManagement: React.FC = () => {
  const theme = useTheme();
  const { t, loc } = useLocale();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [managingUser, setManagingUser] = useState<AdminUser | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useAdminUsers({
    page: page + 1,
    pageSize,
    search: search.length > 0 ? search : undefined,
    isActive: isActiveFilter,
  });

  // The list API treats `search` as a username/email filter. This box sends the email.
  const applyEmailSearch = (value: string): void => {
    const email = value.trim();
    setSearchInput(email);
    setSearch(email);
    setPage(0);
  };

  const handleSearchSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    // Enter searches immediately instead of waiting out the debounce.
    applyEmailSearch(searchInput);
  };

  /** Clears the box and the active email filter, then reloads the full list. */
  const handleClearSearch = (): void => {
    applyEmailSearch('');
  };

  const handleSearchInputChange = (value: string): void => {
    setSearchInput(value);
    // An empty box should show every user right away, not after the debounce.
    if (value.trim().length === 0 && search.length > 0) {
      setSearch('');
      setPage(0);
    }
  };

  // Apply the typed email after the user pauses, so each keystroke does not hit the API.
  useEffect(() => {
    const email = searchInput.trim();
    if (email.length === 0 || email === search) return undefined;

    const timer = window.setTimeout(() => {
      setSearch(email);
      setPage(0);
    }, EMAIL_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [searchInput, search]);

  const handlePageChange = (_: unknown, newPage: number): void => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPageSize(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <AdminLayout>
      <PageHeader
        icon={<UsersIcon />}
        tone="indigo"
        eyebrow={t('admin.users.eyebrow')}
        title={t('admin.users.title')}
        subtitle={t('admin.users.subtitle')}
        meta={
          <Chip
            size="small"
            label={data !== undefined ? t('admin.users.count', { count: data.total }) : '…'}
            sx={{ fontWeight: 800, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}
          />
        }
        actions={
          <Stack direction="row" gap={1.25} flexWrap="wrap" sx={{ width: { xs: '100%', md: 'auto' } }}>
            <Box component="form" onSubmit={handleSearchSubmit} sx={{ flex: { xs: 1, md: 'none' } }}>
              <TextField
                size="small"
                placeholder={t('admin.users.search')}
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                inputProps={{
                  'aria-label': t('admin.users.searchAria'),
                  autoComplete: 'off',
                  spellCheck: false,
                  inputMode: 'email',
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="disabled" />
                    </InputAdornment>
                  ),
                  endAdornment: searchInput.length > 0 ? (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        size="small"
                        aria-label={t('admin.common.clearSearch')}
                        onClick={handleClearSearch}
                      >
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                }}
                sx={{ width: { xs: '100%', md: 320 } }}
              />
            </Box>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={isActiveFilter === undefined ? '' : String(isActiveFilter)}
                onChange={(e) => {
                  const val = e.target.value;
                  setIsActiveFilter(val === '' ? undefined : val === 'true');
                  setPage(0);
                }}
                displayEmpty
                startAdornment={<FilterIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
              >
                <MenuItem value="" sx={{ fontWeight: 600 }}>
                  {t('admin.status.all')}
                </MenuItem>
                <MenuItem value="true" sx={{ fontWeight: 600 }}>
                  {t('admin.status.activeOnly')}
                </MenuItem>
                <MenuItem value="false" sx={{ fontWeight: 600 }}>
                  {t('admin.status.inactive')}
                </MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              onClick={() => void refetch()}
              disabled={isFetching}
              startIcon={isFetching ? <CircularProgress size={16} /> : <RefreshIcon />}
            >
              {t('admin.common.refresh')}
            </Button>
          </Stack>
        }
      />

      <SurfaceCard disablePadding>
        {isLoading ? (
          <LoadingState label={t('admin.users.loading')} />
        ) : isError ? (
          <ErrorState title={t('admin.users.error')} onRetry={() => void refetch()} />
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('admin.users.col.user')}</TableCell>
                    <TableCell>{t('admin.users.col.directorate')}</TableCell>
                    <TableCell>{t('admin.common.status')}</TableCell>
                    <TableCell>{t('admin.users.col.lastLogin')}</TableCell>
                    <TableCell align="right">{t('admin.common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!Array.isArray(data?.items) || data.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ borderBottom: 0 }}>
                        <EmptyState
                          icon={<UsersIcon />}
                          title={t('admin.users.empty')}
                          description={t('admin.users.emptyHint')}
                          compact
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.items.map((user) => (
                        <TableRow key={user.userId} hover>
                          <TableCell sx={{ py: 2 }}>
                            <Stack direction="row" alignItems="center" gap={2}>
                              <Avatar
                                sx={{
                                  width: 40,
                                  height: 40,
                                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                                  color: 'primary.main',
                                  fontWeight: 800,
                                  fontSize: 15,
                                }}
                              >
                                {loc(user.fullNameEn, user.fullNameAr).charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={800} color="text.primary">
                                  {loc(user.fullNameEn, user.fullNameAr)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                  {user.email}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" gap={1}>
                              <DirectorateIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                              <Typography variant="body2" fontWeight={600} color="text.primary">
                                {user.directorate !== null ? (
                                  loc(user.directorate.nameEn, user.directorate.nameAr)
                                ) : (
                                  <Typography component="span" variant="caption" sx={{ fontStyle: 'italic', opacity: 0.5 }}>
                                    {t('admin.status.unassigned')}
                                  </Typography>
                                )}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <StatusPill active={user.isActive} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                              {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : t('admin.status.never')}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <IconAction label={t('admin.users.manage')} tone="accent" onClick={() => setManagingUser(user)}>
                              <ManageIcon />
                            </IconAction>
                          </TableCell>
                        </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={data?.total ?? 0}
              page={page}
              onPageChange={handlePageChange}
              rowsPerPage={pageSize}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[10, 20, 50]}
              sx={{ borderTop: '1px solid', borderColor: 'divider' }}
            />
          </>
        )}
      </SurfaceCard>

      {managingUser !== null && <ManageUserDialog user={managingUser} onClose={() => setManagingUser(null)} />}
    </AdminLayout>
  );
};

export default UserManagement;
