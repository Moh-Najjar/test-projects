import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Fade,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import {
  Add as AddIcon,
  GroupsRounded as GroupsIcon,
  Refresh as RefreshIcon,
  HubRounded as MappingIcon,
} from '@mui/icons-material';
import AdminLayout from '../../shared/AdminLayout';
import {
  useAdminExternalGroupRoleMappings,
  useCreateExternalGroupRoleMapping,
} from '../../../../core/hooks/admin/useAdminExternalGroupRoleMappings';
import { useAdminAllRoles } from '../../../../core/hooks/admin/useAdminUsers';
import { useAdminDirectorates } from '../../../../core/hooks/admin/useAdminDirectorates';
import type {
  CreateExternalGroupRoleMappingRequest,
  ExternalGroupRoleMapping,
} from '../../../../core/types/admin/adminExternalGroupRoleMappings';
import type { AdminRole } from '../../../../core/types/admin/adminUsers';
import type { AdminDirectorate } from '../../../../core/types/admin/adminDirectorates';
import { useLocale } from '../../../../core/hooks/useLocale';
import {
  DialogHeader,
  EmptyState,
  KeyBadge,
  LoadingState,
  PageHeader,
  StatusPill,
  SurfaceCard,
} from '../../shared/ui';
import { ADMIN_ACCENT } from '../../shared/theme/adminTokens';

// ─── Create Mapping Dialog ────────────────────────────────────────────────────

interface CreateMappingErrors {
  groupObjectId?: string;
  groupKey?: string;
  groupNameEn?: string;
  groupNameAr?: string;
  roleId?: string;
  directorateId?: string;
}

interface CreateMappingDialogProps {
  onClose: () => void;
}

const CreateMappingDialog: React.FC<CreateMappingDialogProps> = ({ onClose }) => {
  const { t, loc } = useLocale();
  const createMapping = useCreateExternalGroupRoleMapping();

  const { data: rawRoles, isLoading: rolesLoading } = useAdminAllRoles();
  const { data: rawDirectorates, isLoading: directoratesLoading } = useAdminDirectorates();

  const roles = Array.isArray(rawRoles) ? rawRoles : [];
  const directorates = Array.isArray(rawDirectorates) ? rawDirectorates : [];

  const [groupObjectId, setGroupObjectId] = useState('');
  const [groupKey, setGroupKey] = useState('');
  const [groupNameEn, setGroupNameEn] = useState('');
  const [groupNameAr, setGroupNameAr] = useState('');
  const [roleId, setRoleId] = useState<number | ''>('');
  const [directorateId, setDirectorateId] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<CreateMappingErrors>({});

  const lookupsLoading = rolesLoading || directoratesLoading;

  const clearError = (field: keyof CreateMappingErrors): void => {
    setErrors((prev) => {
      if (prev[field] === undefined) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = (): boolean => {
    const nextErrors: CreateMappingErrors = {};

    if (groupObjectId.trim().length === 0) {
      nextErrors.groupObjectId = t('admin.mappings.create.objectIdRequired');
    }
    if (groupKey.trim().length === 0) {
      nextErrors.groupKey = t('admin.mappings.create.keyRequired');
    }
    if (groupNameEn.trim().length === 0) {
      nextErrors.groupNameEn = t('admin.mappings.create.nameEnRequired');
    }
    if (groupNameAr.trim().length === 0) {
      nextErrors.groupNameAr = t('admin.mappings.create.nameArRequired');
    }
    if (roleId === '') {
      nextErrors.roleId = t('admin.mappings.create.roleRequired');
    }
    if (directorateId === '') {
      nextErrors.directorateId = t('admin.mappings.create.directorateRequired');
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!validate()) return;
    if (roleId === '' || directorateId === '') return;

    const data: CreateExternalGroupRoleMappingRequest = {
      groupObjectId: groupObjectId.trim(),
      groupKey: groupKey.trim().toUpperCase(),
      groupNameEn: groupNameEn.trim(),
      groupNameAr: groupNameAr.trim(),
      roleId: Number(roleId),
      directorateId: Number(directorateId),
      isActive,
    };

    createMapping.mutate(data, { onSuccess: onClose });
  };

  const handleRoleChange = (e: SelectChangeEvent<number | string>): void => {
    const val = e.target.value;
    setRoleId(val === '' ? '' : Number(val));
    clearError('roleId');
  };

  const handleDirectorateChange = (e: SelectChangeEvent<number | string>): void => {
    const val = e.target.value;
    setDirectorateId(val === '' ? '' : Number(val));
    clearError('directorateId');
  };

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Fade}
      PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
    >
      <DialogHeader
        icon={<GroupsIcon />}
        tone="cyan"
        title={t('admin.mappings.create.title')}
        subtitle={t('admin.mappings.create.subtitle')}
        onClose={onClose}
      />

      <DialogContent sx={{ px: 3 }}>
        {lookupsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Box component="form" id="create-mapping-form" onSubmit={handleSubmit} noValidate sx={{ py: 1 }}>
            <Stack spacing={3}>
              <TextField
                label={t('admin.mappings.create.objectId')}
                value={groupObjectId}
                onChange={(e) => {
                  setGroupObjectId(e.target.value);
                  clearError('groupObjectId');
                }}
                error={errors.groupObjectId !== undefined && errors.groupObjectId !== ''}
                helperText={errors.groupObjectId ?? t('admin.mappings.create.objectIdHint')}
                fullWidth
                size="small"
                required
                InputProps={{ sx: { borderRadius: '12px', fontWeight: 600 } }}
              />

              <TextField
                label={t('admin.mappings.create.key')}
                value={groupKey}
                onChange={(e) => {
                  setGroupKey(e.target.value);
                  clearError('groupKey');
                }}
                error={errors.groupKey !== undefined && errors.groupKey !== ''}
                helperText={errors.groupKey ?? t('admin.mappings.create.keyHint')}
                fullWidth
                size="small"
                required
                InputProps={{ sx: { borderRadius: '12px', fontWeight: 600 } }}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label={t('admin.mappings.create.nameEn')}
                  value={groupNameEn}
                  onChange={(e) => {
                    setGroupNameEn(e.target.value);
                    clearError('groupNameEn');
                  }}
                  error={errors.groupNameEn !== undefined && errors.groupNameEn !== ''}
                  helperText={errors.groupNameEn}
                  fullWidth
                  size="small"
                  required
                  InputProps={{ sx: { borderRadius: '12px', fontWeight: 600 } }}
                />
                <TextField
                  label={t('admin.mappings.create.nameAr')}
                  value={groupNameAr}
                  onChange={(e) => {
                    setGroupNameAr(e.target.value);
                    clearError('groupNameAr');
                  }}
                  error={errors.groupNameAr !== undefined && errors.groupNameAr !== ''}
                  helperText={errors.groupNameAr}
                  fullWidth
                  size="small"
                  required
                  inputProps={{ dir: 'rtl' }}
                  InputProps={{ sx: { borderRadius: '12px', fontWeight: 600 } }}
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl size="small" fullWidth required error={errors.roleId !== undefined && errors.roleId !== ''}>
                  <InputLabel>{t('admin.mappings.create.role')}</InputLabel>
                  <Select
                    value={roleId}
                    label={t('admin.mappings.create.role')}
                    onChange={handleRoleChange}
                    sx={{ borderRadius: '12px' }}
                  >
                    {roles.length === 0 ? (
                      <MenuItem disabled value="">
                        {t('admin.mappings.create.noRoles')}
                      </MenuItem>
                    ) : (
                      roles.map((role) => (
                        <MenuItem key={role.roleId} value={role.roleId} sx={{ fontWeight: 600 }}>
                          {role.roleName}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {errors.roleId !== undefined && errors.roleId !== '' && (
                    <Typography variant="caption" color="error.main" sx={{ mt: 0.5, ml: 1.75 }}>
                      {errors.roleId}
                    </Typography>
                  )}
                </FormControl>

                <FormControl
                  size="small"
                  fullWidth
                  required
                  error={errors.directorateId !== undefined && errors.directorateId !== ''}
                >
                  <InputLabel>{t('admin.mappings.create.directorate')}</InputLabel>
                  <Select
                    value={directorateId}
                    label={t('admin.mappings.create.directorate')}
                    onChange={handleDirectorateChange}
                    sx={{ borderRadius: '12px' }}
                  >
                    {directorates.length === 0 ? (
                      <MenuItem disabled value="">
                        {t('admin.mappings.create.noDirectorates')}
                      </MenuItem>
                    ) : (
                      directorates.map((directorate) => (
                        <MenuItem key={directorate.directorateId} value={directorate.directorateId} sx={{ fontWeight: 600 }}>
                          {loc(directorate.nameEn, directorate.nameAr)}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {errors.directorateId !== undefined && errors.directorateId !== '' && (
                    <Typography variant="caption" color="error.main" sx={{ mt: 0.5, ml: 1.75 }}>
                      {errors.directorateId}
                    </Typography>
                  )}
                </FormControl>
              </Stack>

              <Paper
                variant="outlined"
                sx={{ p: 1, px: 2, borderRadius: '12px', bgcolor: 'action.hover', border: 'none' }}
              >
                <FormControlLabel
                  control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
                  label={
                    <Typography variant="body2" fontWeight={700}>
                      {t('admin.mappings.create.active')}
                    </Typography>
                  }
                />
              </Paper>
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="contained" color="inherit">
          {t('admin.common.cancel')}
        </Button>
        <Button
          type="submit"
          form="create-mapping-form"
          variant="contained"
          disabled={createMapping.isPending || lookupsLoading}
          startIcon={<AddIcon />}
        >
          {createMapping.isPending ? t('admin.common.creating') : t('admin.mappings.create.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Display helpers ──────────────────────────────────────────────────────────

const resolveRoleLabel = (mapping: ExternalGroupRoleMapping, roles: AdminRole[], fallback: string): string => {
  if (mapping.role !== undefined) {
    return mapping.role.roleName;
  }
  const found = roles.find((role) => role.roleId === mapping.roleId);
  return found !== undefined ? found.roleName : fallback;
};

const resolveDirectorateLabel = (
  mapping: ExternalGroupRoleMapping,
  directorates: AdminDirectorate[],
  loc: (enVal: string | null | undefined, arVal: string | null | undefined) => string,
  fallback: string,
): string => {
  if (mapping.directorate !== undefined) {
    return loc(mapping.directorate.nameEn, mapping.directorate.nameAr);
  }
  const found = directorates.find((directorate) => directorate.directorateId === mapping.directorateId);
  return found !== undefined ? loc(found.nameEn, found.nameAr) : fallback;
};

// ─── GroupRoleMappingManagement page ──────────────────────────────────────────

const GroupRoleMappingManagement: React.FC = () => {
  const theme = useTheme();
  const { t, loc } = useLocale();

  const { data: rawMappings, isLoading, isError, refetch, isFetching } = useAdminExternalGroupRoleMappings();
  const { data: rawRoles } = useAdminAllRoles();
  const { data: rawDirectorates } = useAdminDirectorates();

  const mappings = Array.isArray(rawMappings) ? rawMappings : [];
  const roles = Array.isArray(rawRoles) ? rawRoles : [];
  const directorates = Array.isArray(rawDirectorates) ? rawDirectorates : [];

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const headerCellSx: SxProps<Theme> = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'text.secondary',
    bgcolor: alpha(theme.palette.text.primary, 0.03),
    borderBottom: '1px solid',
    borderColor: 'divider',
    py: 1.75,
    whiteSpace: 'nowrap',
  };

  return (
    <AdminLayout>
      <PageHeader
        icon={<MappingIcon />}
        tone="cyan"
        eyebrow={t('admin.mappings.eyebrow')}
        title={t('admin.mappings.title')}
        subtitle={t('admin.mappings.subtitle')}
        meta={<Chip size="small" label={t('admin.mappings.count', { count: mappings.length })} sx={{ fontWeight: 800 }} />}
        actions={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="outlined"
              onClick={() => void refetch()}
              disabled={isFetching}
              startIcon={isFetching ? <CircularProgress size={16} /> : <RefreshIcon />}
            >
              {t('admin.common.refresh')}
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}>
              {t('admin.mappings.new')}
            </Button>
          </Stack>
        }
      />

      <SurfaceCard disablePadding>
        {isLoading ? (
          <LoadingState label={t('admin.mappings.loading')} />
        ) : isError ? (
          <EmptyState
            icon={<GroupsIcon />}
            title={t('admin.mappings.error')}
            description={t('admin.mappings.errorHint')}
            action={
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                <Button variant="outlined" onClick={() => void refetch()}>
                  {t('admin.common.retry')}
                </Button>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}>
                  {t('admin.mappings.new')}
                </Button>
              </Stack>
            }
          />
        ) : mappings.length === 0 ? (
          <EmptyState
            icon={<GroupsIcon />}
            title={t('admin.mappings.empty')}
            description={t('admin.mappings.emptyHint')}
            action={
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}>
                {t('admin.mappings.new')}
              </Button>
            }
          />
        ) : (
          <TableContainer sx={{ overflowX: 'auto', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
            <Table sx={{ minWidth: 900, '& .MuiTableCell-root': { px: 2 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellSx}>{t('admin.mappings.col.group')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('admin.mappings.col.objectId')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('admin.mappings.col.role')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('admin.mappings.col.directorate')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('admin.common.status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow key={mapping.mappingId} hover>
                    <TableCell sx={{ py: 1.75 }}>
                      <Stack direction="row" alignItems="center" gap={1.5}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            flexShrink: 0,
                            borderRadius: '10px',
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: alpha(ADMIN_ACCENT, 0.12),
                            color: ADMIN_ACCENT,
                          }}
                        >
                          <GroupsIcon fontSize="small" />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={800} color="text.primary">
                            {loc(mapping.groupNameEn, mapping.groupNameAr)}
                          </Typography>
                          <KeyBadge>{mapping.groupKey}</KeyBadge>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                          fontWeight: 700,
                          wordBreak: 'break-all',
                        }}
                      >
                        {mapping.groupObjectId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {resolveRoleLabel(mapping, roles, t('admin.mappings.roleFallback', { id: mapping.roleId }))}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {resolveDirectorateLabel(
                          mapping,
                          directorates,
                          loc,
                          t('admin.mappings.directorateFallback', { id: mapping.directorateId }),
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusPill active={mapping.isActive} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SurfaceCard>

      {createDialogOpen && <CreateMappingDialog onClose={() => setCreateDialogOpen(false)} />}
    </AdminLayout>
  );
};

export default GroupRoleMappingManagement;
