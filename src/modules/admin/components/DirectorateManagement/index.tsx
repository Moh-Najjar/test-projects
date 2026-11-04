import React, { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Fade,
  FormControl,
  FormControlLabel,
  FormGroup,
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
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as RemoveIcon,
  Refresh as RefreshIcon,
  AccountTree as DirectorateIcon,
  Description as FormIcon,
  Security as PermissionsIcon,
} from '@mui/icons-material';
import AdminLayout from '../../shared/AdminLayout';
import {
  useAdminDirectorates,
  useCreateDirectorate,
  useDirectorateForms,
  useActiveFormsDropdown,
  useAssignFormToDirectorate,
  useRemoveFormFromDirectorate,
} from '../../../../core/hooks/admin/useAdminDirectorates';
import type {
  AdminDirectorate,
  CreateDirectorateRequest,
  DirectorateFormAccess,
} from '../../../../core/types/admin/adminDirectorates';
import { useLocale } from '../../../../core/hooks/useLocale';
import {
  DialogHeader,
  EmptyState,
  ErrorState,
  FormSection,
  IconAction,
  IconTile,
  KeyBadge,
  LoadingState,
  PageHeader,
  Pill,
  StatusPill,
} from '../../shared/ui';
import { ADMIN_ACCENT } from '../../shared/theme/adminTokens';

// ─── Create Directorate Dialog ────────────────────────────────────────────────

interface CreateDirectorateErrors {
  directorateKey?: string;
  nameEn?: string;
  nameAr?: string;
}

interface CreateDirectorateDialogProps {
  onClose: () => void;
}

const CreateDirectorateDialog: React.FC<CreateDirectorateDialogProps> = ({ onClose }) => {
  const { t } = useLocale();
  const createDirectorate = useCreateDirectorate();

  const [directorateKey, setDirectorateKey] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<CreateDirectorateErrors>({});

  const clearError = (field: keyof CreateDirectorateErrors): void => {
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
    const nextErrors: CreateDirectorateErrors = {};

    if (directorateKey.trim().length === 0) {
      nextErrors.directorateKey = t('admin.directorates.create.keyRequired');
    }
    if (nameEn.trim().length === 0) {
      nextErrors.nameEn = t('admin.directorates.create.nameEnRequired');
    }
    if (nameAr.trim().length === 0) {
      nextErrors.nameAr = t('admin.directorates.create.nameArRequired');
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!validate()) return;

    const data: CreateDirectorateRequest = {
      directorateKey: directorateKey.trim().toUpperCase(),
      nameEn: nameEn.trim(),
      nameAr: nameAr.trim(),
      isActive,
    };

    createDirectorate.mutate(data, { onSuccess: onClose });
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
        icon={<DirectorateIcon />}
        tone="amber"
        title={t('admin.directorates.create.title')}
        subtitle={t('admin.directorates.create.subtitle')}
        onClose={onClose}
      />

      <DialogContent sx={{ px: 3 }}>
        <Box component="form" id="create-directorate-form" onSubmit={handleSubmit} noValidate sx={{ py: 1 }}>
          <Stack spacing={3}>
            <TextField
              label={t('admin.directorates.create.key')}
              value={directorateKey}
              onChange={(e) => {
                setDirectorateKey(e.target.value);
                clearError('directorateKey');
              }}
              error={errors.directorateKey !== undefined && errors.directorateKey !== ''}
              helperText={errors.directorateKey ?? t('admin.directorates.create.keyHint')}
              fullWidth
              size="small"
              required
              InputProps={{ sx: { borderRadius: '12px', fontWeight: 600 } }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('admin.directorates.create.nameEn')}
                value={nameEn}
                onChange={(e) => {
                  setNameEn(e.target.value);
                  clearError('nameEn');
                }}
                error={errors.nameEn !== undefined && errors.nameEn !== ''}
                helperText={errors.nameEn}
                fullWidth
                size="small"
                required
                InputProps={{ sx: { borderRadius: '12px', fontWeight: 600 } }}
              />
              <TextField
                label={t('admin.directorates.create.nameAr')}
                value={nameAr}
                onChange={(e) => {
                  setNameAr(e.target.value);
                  clearError('nameAr');
                }}
                error={errors.nameAr !== undefined && errors.nameAr !== ''}
                helperText={errors.nameAr}
                fullWidth
                size="small"
                required
                inputProps={{ dir: 'rtl' }}
                InputProps={{ sx: { borderRadius: '12px', fontWeight: 600 } }}
              />
            </Stack>

            <Paper
              variant="outlined"
              sx={{ p: 1, px: 2, borderRadius: '12px', bgcolor: 'action.hover', border: 'none' }}
            >
              <FormControlLabel
                control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
                label={
                  <Typography variant="body2" fontWeight={700}>
                    {t('admin.directorates.create.active')}
                  </Typography>
                }
              />
            </Paper>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="contained" color="inherit">
          {t('admin.common.cancel')}
        </Button>
        <Button
          type="submit"
          form="create-directorate-form"
          variant="contained"
          disabled={createDirectorate.isPending}
          startIcon={<AddIcon />}
        >
          {createDirectorate.isPending ? t('admin.common.creating') : t('admin.directorates.create.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Assign Form Dialog ───────────────────────────────────────────────────────

interface AssignFormDialogProps {
  directorate: AdminDirectorate;
  assignedFormIds: number[];
  onClose: () => void;
}

const AssignFormDialog: React.FC<AssignFormDialogProps> = ({ directorate, assignedFormIds, onClose }) => {
  const { t, loc } = useLocale();
  const { data: rawActiveForms, isFetching: formsFetching } = useActiveFormsDropdown();
  const activeForms = Array.isArray(rawActiveForms) ? rawActiveForms : [];
  const assignForm = useAssignFormToDirectorate();

  const [selectedFormId, setSelectedFormId] = useState<number | ''>('');
  const [canView, setCanView] = useState(true);
  const [canSubmit, setCanSubmit] = useState(false);
  const [canApprove, setCanApprove] = useState(false);

  const availableForms = activeForms.filter((f) => !assignedFormIds.includes(f.formId));

  const handleAssign = (): void => {
    if (selectedFormId === '') return;
    assignForm.mutate(
      {
        directorateId: directorate.directorateId,
        data: { formId: Number(selectedFormId), canView, canSubmit, canApprove },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth TransitionComponent={Fade}>
      <DialogHeader
        icon={<FormIcon />}
        tone="amber"
        title={t('admin.directorates.assign.title')}
        subtitle={t('admin.directorates.assign.target', { name: loc(directorate.nameEn, directorate.nameAr) })}
        onClose={onClose}
      />

      <DialogContent>
        <Stack spacing={2.5} sx={{ py: 0.5 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>{t('admin.directorates.assign.select')}</InputLabel>
            <Select
              value={selectedFormId}
              label={t('admin.directorates.assign.select')}
              onChange={(e) => setSelectedFormId(e.target.value as number | '')}
              disabled={formsFetching}
            >
              {formsFetching ? (
                <MenuItem disabled>{t('admin.common.loading')}</MenuItem>
              ) : availableForms.length === 0 ? (
                <MenuItem disabled>{t('admin.directorates.assign.allAssigned')}</MenuItem>
              ) : (
                availableForms.map((f) => (
                  <MenuItem key={f.formId} value={f.formId} sx={{ fontWeight: 600 }}>
                    {loc(f.nameEn, f.nameAr)}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          <FormSection title={t('admin.directorates.assign.permissions')}>
            <FormGroup>
              <FormControlLabel
                control={<Checkbox checked={canView} onChange={(e) => setCanView(e.target.checked)} size="small" />}
                label={<Typography variant="body2" fontWeight={600}>{t('admin.directorates.assign.canView')}</Typography>}
              />
              <FormControlLabel
                control={<Checkbox checked={canSubmit} onChange={(e) => setCanSubmit(e.target.checked)} size="small" />}
                label={<Typography variant="body2" fontWeight={600}>{t('admin.directorates.assign.canSubmit')}</Typography>}
              />
              <FormControlLabel
                control={<Checkbox checked={canApprove} onChange={(e) => setCanApprove(e.target.checked)} size="small" />}
                label={<Typography variant="body2" fontWeight={600}>{t('admin.directorates.assign.canApprove')}</Typography>}
              />
            </FormGroup>
          </FormSection>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained" color="inherit">
          {t('admin.common.cancel')}
        </Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          disabled={selectedFormId === '' || assignForm.isPending || formsFetching}
          startIcon={<PermissionsIcon />}
        >
          {assignForm.isPending ? t('admin.directorates.assign.pending') : t('admin.directorates.assign.action')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Directorate Row (expanded content) ──────────────────────────────────────

interface DirectorateRowProps {
  directorate: AdminDirectorate;
}

const DirectorateRow: React.FC<DirectorateRowProps> = ({ directorate }) => {
  const theme = useTheme();
  const { t, loc } = useLocale();

  const { data: rawForms, isLoading } = useDirectorateForms(directorate.directorateId);
  const forms = Array.isArray(rawForms) ? rawForms : [];
  const removeForm = useRemoveFormFromDirectorate();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const assignedFormIds = forms.map((f) => f.formId);

  const handleRemove = (access: DirectorateFormAccess): void => {
    removeForm.mutate({ directorateId: directorate.directorateId, formId: access.formId });
  };

  const permissionBadge = (label: string, granted: boolean): React.ReactNode => (
    <Pill
      key={label}
      label={label}
      color={granted ? theme.palette.success.main : theme.palette.text.disabled}
      outlined={!granted}
    />
  );

  return (
    <>
      {isLoading ? (
        <LoadingState label={t('admin.directorates.loadingForms')} />
      ) : (
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" gap={1}>
              <FormIcon fontSize="small" sx={{ color: ADMIN_ACCENT }} />
              <Typography variant="subtitle2" color="text.primary">
                {t('admin.directorates.assigned')}
              </Typography>
            </Stack>
            <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setAssignDialogOpen(true)}>
              {t('admin.directorates.assignNew')}
            </Button>
          </Stack>

          {forms.length === 0 ? (
            <EmptyState
              compact
              icon={<FormIcon />}
              title={t('admin.directorates.noForms')}
              description={t('admin.directorates.noFormsHint')}
              action={
                <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setAssignDialogOpen(true)}>
                  {t('admin.directorates.assign.action')}
                </Button>
              }
            />
          ) : (
            <TableContainer sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('admin.directorates.col.form')}</TableCell>
                    <TableCell>{t('admin.directorates.col.permissions')}</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {forms.map((access) => (
                    <TableRow key={access.accessId} hover>
                      <TableCell sx={{ py: 1.75 }}>
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                          {access.form !== undefined && access.form !== null
                            ? loc(access.form.nameEn, access.form.nameAr)
                            : t('admin.directorates.formFallback', { id: access.formId })}
                        </Typography>
                        {access.form?.formKey !== undefined && <KeyBadge>{access.form.formKey}</KeyBadge>}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" gap={0.75} flexWrap="wrap">
                          {permissionBadge(t('admin.directorates.perm.view'), access.canView)}
                          {permissionBadge(t('admin.directorates.perm.submit'), access.canSubmit)}
                          {permissionBadge(t('admin.directorates.perm.approve'), access.canApprove)}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <IconAction
                          label={t('admin.directorates.remove')}
                          tone="danger"
                          onClick={() => handleRemove(access)}
                          disabled={removeForm.isPending}
                        >
                          <RemoveIcon />
                        </IconAction>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {assignDialogOpen && (
        <AssignFormDialog
          directorate={directorate}
          assignedFormIds={assignedFormIds}
          onClose={() => setAssignDialogOpen(false)}
        />
      )}
    </>
  );
};

// ─── DirectorateManagement page ───────────────────────────────────────────────

const DirectorateManagement: React.FC = () => {
  const theme = useTheme();
  const { t, loc } = useLocale();
  const { data: rawDirectorates, isLoading, isError, refetch: refetchDirectorates, isFetching } = useAdminDirectorates();
  const directorates = Array.isArray(rawDirectorates) ? rawDirectorates : [];
  const [expanded, setExpanded] = useState<number | false>(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleAccordionChange = (id: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? id : false);
  };

  const openCreateDialog = (): void => {
    setCreateDialogOpen(true);
  };

  return (
    <AdminLayout>
      <PageHeader
        icon={<DirectorateIcon />}
        tone="amber"
        eyebrow={t('admin.directorates.eyebrow')}
        title={t('admin.directorates.title')}
        subtitle={t('admin.directorates.subtitle')}
        meta={<Chip size="small" label={t('admin.directorates.count', { count: directorates.length })} sx={{ fontWeight: 800 }} />}
        actions={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="outlined"
              onClick={() => void refetchDirectorates()}
              disabled={isFetching}
              startIcon={isFetching ? <CircularProgress size={16} /> : <RefreshIcon />}
            >
              {t('admin.common.refresh')}
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
              {t('admin.directorates.new')}
            </Button>
          </Stack>
        }
      />

      {isLoading ? (
        <LoadingState label={t('admin.directorates.loading')} />
      ) : isError ? (
        <ErrorState title={t('admin.directorates.error')} onRetry={() => void refetchDirectorates()} />
      ) : directorates.length === 0 ? (
        <EmptyState
          icon={<DirectorateIcon />}
          title={t('admin.directorates.empty')}
          description={t('admin.directorates.emptyHint')}
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
              {t('admin.directorates.new')}
            </Button>
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {directorates.map((dir, index) => (
            <Accordion
              key={dir.directorateId}
              expanded={expanded === dir.directorateId}
              onChange={handleAccordionChange(dir.directorateId)}
              sx={{
                animation: `adminDirIn 0.4s ease-out ${index * 0.04}s both`,
                '@keyframes adminDirIn': {
                  '0%': { opacity: 0, transform: 'translateY(12px)' },
                  '100%': { opacity: 1, transform: 'translateY(0)' },
                },
                '&.Mui-expanded': {
                  borderColor: alpha(theme.palette.secondary.main, 0.4),
                  boxShadow: `0 16px 32px -22px ${alpha(theme.palette.secondary.main, 0.7)}`,
                },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: { xs: 1.5, md: 2.5 }, '& .MuiAccordionSummary-content': { alignItems: 'center', my: 1.25, flexWrap: 'wrap', gap: 1 } }}>
                <Stack direction="row" alignItems="center" gap={2} sx={{ flex: 1, minWidth: 0, pr: 2 }}>
                  <IconTile icon={<DirectorateIcon />} tone="amber" size={44} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" color="text.primary" noWrap>
                      {loc(dir.nameEn, dir.nameAr)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {dir.directorateKey}
                    </Typography>
                  </Box>
                </Stack>
                <StatusPill active={dir.isActive} />
              </AccordionSummary>

              <AccordionDetails sx={{ px: { xs: 2, md: 3 }, pb: 3, pt: 0 }}>
                {expanded === dir.directorateId && <DirectorateRow directorate={dir} />}
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}

      {createDialogOpen && <CreateDirectorateDialog onClose={() => setCreateDialogOpen(false)} />}
    </AdminLayout>
  );
};

export default DirectorateManagement;
