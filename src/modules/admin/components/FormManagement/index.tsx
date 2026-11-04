import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
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
  Tooltip,
  Typography,
  alpha,
  useTheme,
  Fade,
  InputAdornment,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import {
  Add as AddIcon,
  OpenInNew as OpenIcon,
  Delete as DeactivateIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Description as FormIcon,
  History as VersionIcon,
  Search as SearchIcon,
  CheckCircleOutline as ActiveIcon,
  PauseCircleOutline as InactiveIcon,
} from '@mui/icons-material';
import AdminLayout from '../../shared/AdminLayout';
import {
  useAdminForms,
  useCreateForm,
  useDeactivateForm,
} from '../../../../core/hooks/admin/useAdminForms';
import { useAdminDirectorates } from '../../../../core/hooks/admin/useAdminDirectorates';
import { useAdminFrequencies } from '../../../../core/hooks/admin/useAdminLookups';
import { ADMIN_ACCENT } from '../../shared/theme/adminTokens';
import { DialogHeader, ErrorState, LoadingState, PageHeader, StatCard, StatusPill } from '../../shared/ui';
import type { CreateFormRequest } from '../../../../core/types/admin/adminForms';
import { useLocale } from '../../../../core/hooks/useLocale';

// ─── Create Form Dialog ───────────────────────────────────────────────────────

interface CreateFormDialogProps {
  onClose: () => void;
}

const CreateFormDialog: React.FC<CreateFormDialogProps> = ({ onClose }) => {
  const { t, loc } = useLocale();
  const createForm = useCreateForm();

  const { data: rawDirectorates, isLoading: directoratesLoading } = useAdminDirectorates();
  const { data: rawFrequencies, isLoading: frequenciesLoading } = useAdminFrequencies();

  const directorates = Array.isArray(rawDirectorates) ? rawDirectorates : [];
  const frequencies = Array.isArray(rawFrequencies) ? rawFrequencies : [];

  const [formKey, setFormKey] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [directorateId, setDirectorateId] = useState<number | ''>('');
  const [frequencyId, setFrequencyId] = useState<number | ''>('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const lookupsLoading = directoratesLoading || frequenciesLoading;

  const clearError = (field: string): void => {
    setErrors((prev) => {
      if (prev[field] === undefined || prev[field] === '') {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (formKey.trim().length === 0) {
      errs.formKey = t('admin.forms.create.keyRequired');
    }
    if (nameEn.trim().length === 0) {
      errs.nameEn = t('admin.forms.create.nameEnRequired');
    }
    if (nameAr.trim().length === 0) {
      errs.nameAr = t('admin.forms.create.nameArRequired');
    }
    if (directorateId === '') {
      errs.directorateId = t('admin.forms.create.directorateRequired');
    }
    if (frequencyId === '') {
      errs.frequencyId = t('admin.forms.create.frequencyRequired');
    }
    if (
      effectiveFrom.trim().length > 0 &&
      effectiveTo.trim().length > 0 &&
      effectiveTo < effectiveFrom
    ) {
      errs.effectiveTo = t('admin.forms.create.effectiveRange');
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!validate()) return;

    if (directorateId === '' || frequencyId === '') {
      return;
    }

    const data: CreateFormRequest = {
      formKey: formKey.trim().toUpperCase(),
      nameEn: nameEn.trim(),
      nameAr: nameAr.trim(),
      descriptionEn: descEn.trim().length > 0 ? descEn.trim() : undefined,
      descriptionAr: descAr.trim().length > 0 ? descAr.trim() : undefined,
      directorateId: Number(directorateId),
      frequencyId: Number(frequencyId),
      effectiveFrom: effectiveFrom.trim().length > 0 ? effectiveFrom.trim() : null,
      effectiveTo: effectiveTo.trim().length > 0 ? effectiveTo.trim() : null,
      isActive,
    };

    createForm.mutate(data, { onSuccess: onClose });
  };

  const handleDirectorateChange = (e: SelectChangeEvent<number | string>): void => {
    const val = e.target.value;
    setDirectorateId(val === '' ? '' : Number(val));
    clearError('directorateId');
  };

  const handleFrequencyChange = (e: SelectChangeEvent<number | string>): void => {
    const val = e.target.value;
    setFrequencyId(val === '' ? '' : Number(val));
    clearError('frequencyId');
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
      <DialogHeader icon={<FormIcon />} tone="violet" title={t('admin.forms.create.title')} subtitle={t('admin.forms.create.subtitle')} onClose={onClose} />

      <DialogContent sx={{ px: 3 }}>
        {lookupsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Box component="form" id="create-form-form" onSubmit={handleSubmit} noValidate sx={{ py: 1 }}>
            <Stack spacing={3}>
              <TextField
                label={t('admin.forms.create.key')}
                value={formKey}
                onChange={(e) => {
                  setFormKey(e.target.value);
                  clearError('formKey');
                }}
                error={errors.formKey !== undefined && errors.formKey !== ''}
                helperText={errors.formKey ?? t('admin.forms.create.keyHint')}
                fullWidth
                size="small"
                required
                InputProps={{ sx: { borderRadius: '12px', fontWeight: 600 } }}
              />

              <Stack direction="row" spacing={2}>
                <TextField
                  label={t('admin.forms.create.nameEn')}
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
                  label={t('admin.forms.create.nameAr')}
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

              <TextField
                label={t('admin.forms.create.descEn')}
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                fullWidth
                size="small"
                multiline
                rows={2}
                InputProps={{ sx: { borderRadius: '12px' } }}
              />
              <TextField
                label={t('admin.forms.create.descAr')}
                value={descAr}
                onChange={(e) => setDescAr(e.target.value)}
                fullWidth
                size="small"
                multiline
                rows={2}
                inputProps={{ dir: 'rtl' }}
                InputProps={{ sx: { borderRadius: '12px' } }}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl size="small" fullWidth required error={errors.directorateId !== undefined && errors.directorateId !== ''}>
                  <InputLabel>{t('admin.forms.create.directorate')}</InputLabel>
                  <Select
                    value={directorateId}
                    label={t('admin.forms.create.directorate')}
                    onChange={handleDirectorateChange}
                    sx={{ borderRadius: '12px' }}
                  >
                    {directorates.length === 0 ? (
                      <MenuItem disabled value="">
                        {t('admin.forms.create.noDirectorates')}
                      </MenuItem>
                    ) : (
                      directorates.map((d) => (
                        <MenuItem key={d.directorateId} value={d.directorateId} sx={{ fontWeight: 600 }}>
                          {loc(d.nameEn, d.nameAr)}
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

                <FormControl size="small" fullWidth required error={errors.frequencyId !== undefined && errors.frequencyId !== ''}>
                  <InputLabel>{t('admin.forms.create.frequency')}</InputLabel>
                  <Select
                    value={frequencyId}
                    label={t('admin.forms.create.frequency')}
                    onChange={handleFrequencyChange}
                    sx={{ borderRadius: '12px' }}
                  >
                    {frequencies.length === 0 ? (
                      <MenuItem disabled value="">
                        {t('admin.forms.create.noFrequencies')}
                      </MenuItem>
                    ) : (
                      frequencies.map((f) => (
                        <MenuItem key={f.frequencyId} value={f.frequencyId} sx={{ fontWeight: 600 }}>
                          {loc(f.nameEn, f.nameAr)}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {errors.frequencyId !== undefined && errors.frequencyId !== '' && (
                    <Typography variant="caption" color="error.main" sx={{ mt: 0.5, ml: 1.75 }}>
                      {errors.frequencyId}
                    </Typography>
                  )}
                </FormControl>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label={t('admin.forms.create.effectiveFrom')}
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => {
                    setEffectiveFrom(e.target.value);
                    clearError('effectiveFrom');
                    clearError('effectiveTo');
                  }}
                  error={errors.effectiveFrom !== undefined && errors.effectiveFrom !== ''}
                  helperText={errors.effectiveFrom ?? t('admin.common.optional')}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: { borderRadius: '12px', fontWeight: 600 } }}
                />
                <TextField
                  label={t('admin.forms.create.effectiveTo')}
                  type="date"
                  value={effectiveTo}
                  onChange={(e) => {
                    setEffectiveTo(e.target.value);
                    clearError('effectiveTo');
                  }}
                  error={errors.effectiveTo !== undefined && errors.effectiveTo !== ''}
                  helperText={errors.effectiveTo ?? t('admin.common.optional')}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: effectiveFrom.length > 0 ? effectiveFrom : undefined }}
                  InputProps={{ sx: { borderRadius: '12px', fontWeight: 600 } }}
                />
              </Stack>

              <Paper
                variant="outlined"
                sx={{ p: 1, px: 2, borderRadius: '12px', bgcolor: 'action.hover', border: 'none' }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                  }
                  label={
                    <Typography variant="body2" fontWeight={700}>
                      {t('admin.forms.create.active')}
                    </Typography>
                  }
                />
              </Paper>
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={onClose}
          variant="contained"
          color="inherit"
          sx={{ borderRadius: '12px', bgcolor: 'action.hover', fontWeight: 700, textTransform: 'none' }}
        >
          {t('admin.common.cancel')}
        </Button>
        <Button
          type="submit"
          form="create-form-form"
          variant="contained"
          disableElevation
          disabled={createForm.isPending || lookupsLoading}
          sx={{ borderRadius: '12px', fontWeight: 700, textTransform: 'none', px: 4 }}
        >
          {createForm.isPending ? t('admin.common.creating') : t('admin.forms.create.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Search helpers ───────────────────────────────────────────────────────────

/** Arabic diacritics (tashkeel) and the tatweel stretch character. */
const ARABIC_MARKS_PATTERN = /[\u064B-\u065F\u0670\u0640]/g;

/**
 * Normalises text for case- and spelling-tolerant matching:
 * lowercases Latin text, strips Arabic diacritics, and unifies common
 * Arabic letter variants (أ/إ/آ → ا, ى → ي, ة → ه).
 */
const normalizeSearchText = (value: string | null | undefined): string => {
  if (typeof value !== 'string') {
    return '';
  }
  return value
    .trim()
    .toLowerCase()
    .replace(ARABIC_MARKS_PATTERN, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ');
};

// ─── FormManagement page ──────────────────────────────────────────────────────

const FormManagement: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { t, loc, isAr } = useLocale();

  const { data: rawForms, isLoading, isError, refetch, isFetching } = useAdminForms();
  const forms = Array.isArray(rawForms) ? rawForms : [];
  const deactivateForm = useDeactivateForm();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDeactivate = (): void => {
    if (confirmDeactivateId === null) return;
    deactivateForm.mutate(confirmDeactivateId, {
      onSuccess: () => setConfirmDeactivateId(null),
    });
  };

  // Filter by English or Arabic name; an empty query shows every form.
  const normalizedQuery = normalizeSearchText(searchQuery);
  const filteredForms =
    normalizedQuery.length === 0
      ? forms
      : forms.filter(
          (form) =>
            normalizeSearchText(form.nameEn).includes(normalizedQuery) ||
            normalizeSearchText(form.nameAr).includes(normalizedQuery),
        );
  const activeCount = forms.filter((form) => form.isActive).length;

  // Shared header cell style for the forms table.
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
      <Box sx={{ width: '100%', maxWidth: 1360 }}>
        <PageHeader
          icon={<FormIcon />}
          tone="violet"
          eyebrow={t('admin.forms.eyebrow')}
          title={t('admin.forms.title')}
          subtitle={t('admin.forms.subtitle')}
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
                {t('admin.forms.new')}
              </Button>
            </Stack>
          }
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
            gap: 2,
            mb: 3,
          }}
        >
          <StatCard label={t('admin.forms.total')} value={forms.length} icon={<FormIcon />} tone="violet" index={0} />
          <StatCard label={t('admin.status.active')} value={activeCount} icon={<ActiveIcon />} tone="emerald" index={1} />
          <StatCard label={t('admin.status.inactive')} value={forms.length - activeCount} icon={<InactiveIcon />} tone="slate" index={2} />
        </Box>

        {/* Forms table */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '16px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            overflow: 'hidden',
          }}
        >
          {/* Toolbar with search */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
            spacing={1.5}
            sx={{
              px: 2.5,
              py: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <TextField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('admin.forms.search')}
              size="small"
              inputProps={{ 'aria-label': t('admin.forms.searchAria') }}
              sx={{
                width: { xs: '100%', sm: 380 },
                '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 14, fontWeight: 600 },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment:
                  searchQuery.length > 0 ? (
                    <InputAdornment position="end">
                      <IconButton size="small" aria-label={t('admin.common.clearSearch')} onClick={() => setSearchQuery('')}>
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
              }}
            />
            <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ letterSpacing: '0.04em' }}>
              {normalizedQuery.length === 0
                ? t('admin.forms.count', { count: forms.length })
                : t('admin.forms.countFiltered', { found: filteredForms.length, total: forms.length })}
            </Typography>
          </Stack>

          {isLoading ? (
            <LoadingState label={t('admin.forms.loading')} />
          ) : isError ? (
            <ErrorState title={t('admin.forms.error')} onRetry={() => void refetch()} />
          ) : (
            <TableContainer sx={{ overflowX: 'auto', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
              <Table sx={{ minWidth: 900, '& .MuiTableCell-root': { px: 2 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headerCellSx}>{t('admin.forms.col.key')}</TableCell>
                    <TableCell sx={headerCellSx}>{t('admin.forms.col.name')}</TableCell>
                    <TableCell sx={headerCellSx}>{t('admin.forms.col.directorate')}</TableCell>
                    <TableCell sx={headerCellSx}>{t('admin.forms.col.structure')}</TableCell>
                    <TableCell sx={headerCellSx}>{t('admin.common.status')}</TableCell>
                    <TableCell align="right" sx={headerCellSx}>
                      {t('admin.common.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {forms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 10, borderBottom: 0 }}>
                        <Typography color="text.secondary" fontWeight={600}>{t('admin.forms.empty')}</Typography>
                      </TableCell>
                    </TableRow>
                  ) : filteredForms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8, borderBottom: 0 }}>
                        <SearchIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="subtitle1" fontWeight={800} color="text.secondary">
                          {t('admin.forms.noMatch')}
                        </Typography>
                        <Typography variant="body2" color="text.disabled" fontWeight={600} sx={{ mb: 2 }}>
                          {t('admin.forms.noMatchHint', { query: searchQuery.trim() })}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setSearchQuery('')}
                          sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}
                        >
                          {t('admin.common.clearSearch')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredForms.map((form) => (
                      <TableRow
                        key={form.formId}
                        sx={{
                          '& td': {
                            borderColor: 'divider',
                            py: 1.75,
                            bgcolor: form.isActive ? 'transparent' : alpha(theme.palette.grey[500], 0.08),
                            transition: 'background-color 0.15s ease',
                          },
                          '& td:first-of-type': {
                            boxShadow: `inset 3px 0 0 ${form.isActive ? ADMIN_ACCENT : theme.palette.text.disabled}`,
                          },
                          '&:nth-of-type(even) td': {
                            bgcolor: form.isActive ? alpha(theme.palette.primary.main, 0.03) : alpha(theme.palette.grey[500], 0.11),
                          },
                          '&:hover td': { bgcolor: alpha(ADMIN_ACCENT, 0.08) },
                          '&:last-child td': { borderBottom: 0 },
                        }}
                      >
                        {/* Identifier */}
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
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
                              <FormIcon fontSize="small" />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'inline-block',
                                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                                  color: theme.palette.primary.main,
                                  px: 0.75,
                                  py: 0.25,
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  fontSize: 11,
                                  wordBreak: 'break-all',
                                }}
                              >
                                {form.formKey}
                              </Typography>
                              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                                <VersionIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                  v{form.version}
                                </Typography>
                              </Stack>
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Names */}
                        <TableCell>
                          <Typography variant="body2" fontWeight={800} color="text.primary">
                            {loc(form.nameEn, form.nameAr)}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                            sx={{ direction: isAr ? 'ltr' : 'rtl', display: 'block', mt: 0.25 }}
                          >
                            {isAr ? form.nameEn : form.nameAr}
                          </Typography>
                        </TableCell>

                        {/* Directorate */}
                        <TableCell>
                          {form.directorate !== undefined ? (
                            <>
                              <Typography variant="body2" fontWeight={700} color="text.primary">
                                {loc(form.directorate.nameEn, form.directorate.nameAr)}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={600}
                                sx={{ direction: isAr ? 'ltr' : 'rtl', display: 'block' }}
                              >
                                {isAr ? form.directorate.nameEn : form.directorate.nameAr}
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="caption" color="text.disabled" fontWeight={700}>
                              —
                            </Typography>
                          )}
                        </TableCell>

                        {/* Structure */}
                        <TableCell>
                          <Stack spacing={0.75} alignItems="flex-start">
                            <Chip
                              label={form.formFields !== undefined ? t('admin.forms.fieldsCount', { count: form.formFields.length }) : t('admin.forms.metadataOnly')}
                              size="small"
                              variant="outlined"
                              sx={{
                                height: 22,
                                fontWeight: 800,
                                fontSize: 10,
                                borderRadius: '6px',
                                borderColor: 'divider',
                                color: 'text.secondary',
                              }}
                            />
                            {form.frequency !== undefined && (
                              <Chip
                                label={loc(form.frequency.nameEn, form.frequency.nameAr)}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontWeight: 800,
                                  fontSize: 10,
                                  borderRadius: '6px',
                                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                                  color: theme.palette.primary.main,
                                }}
                              />
                            )}
                          </Stack>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <StatusPill active={form.isActive} />
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Stack direction="row" spacing={0.75} justifyContent="flex-end">
                            <Tooltip title={t('admin.forms.configure')}>
                              <IconButton
                                size="small"
                                aria-label={t('admin.forms.configure')}
                                onClick={() => navigate(`/admin/forms/${form.formId}`)}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '8px',
                                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                                  color: theme.palette.primary.main,
                                  '&:hover': { bgcolor: theme.palette.primary.main, color: '#fff' },
                                }}
                              >
                                <OpenIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            {form.isActive && (
                              <Tooltip title={t('admin.forms.deactivate')}>
                                <IconButton
                                  size="small"
                                  aria-label={t('admin.forms.deactivate')}
                                  onClick={() => setConfirmDeactivateId(form.formId)}
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '8px',
                                    bgcolor: alpha(theme.palette.error.main, 0.08),
                                    color: 'error.main',
                                    '&:hover': { bgcolor: 'error.main', color: '#fff' },
                                  }}
                                >
                                  <DeactivateIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      {/* Create form dialog */}
      {createDialogOpen && (
        <CreateFormDialog onClose={() => setCreateDialogOpen(false)} />
      )}

      {/* Confirm deactivate dialog */}
      <Dialog
        open={confirmDeactivateId !== null}
        onClose={() => setConfirmDeactivateId(null)}
        maxWidth="xs"
        fullWidth
        TransitionComponent={Fade}
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle sx={{ p: 3, pb: 2 }}>
          <Typography variant="h6" fontWeight={800} color="error.main">{t('admin.forms.deactivateTitle')}</Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ lineHeight: 1.6 }}>
            {t('admin.forms.deactivateBody')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setConfirmDeactivateId(null)}
            variant="contained"
            color="inherit"
            sx={{ borderRadius: '12px', bgcolor: 'action.hover', fontWeight: 700, textTransform: 'none' }}
          >
            {t('admin.common.cancel')}
          </Button>
          <Button
            onClick={handleDeactivate}
            variant="contained"
            disableElevation
            color="error"
            disabled={deactivateForm.isPending}
            sx={{ borderRadius: '12px', fontWeight: 700, textTransform: 'none', px: 4 }}
          >
            {deactivateForm.isPending ? t('admin.common.working') : t('admin.common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};

export default FormManagement;
