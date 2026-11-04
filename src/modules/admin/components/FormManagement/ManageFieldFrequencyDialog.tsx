import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  alpha,
  Fade,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import {
  useAdminFieldFrequency,
  useAssignFieldFrequency,
} from '../../../../core/hooks/admin/useAdminForms';
import { useAdminFrequencies, useAdminFrequencyPeriods } from '../../../../core/hooks/admin/useAdminLookups';
import { ADMIN_ACCENT } from '../../shared/theme/adminTokens';
import { useLocale } from '../../../../core/hooks/useLocale';
import type { AdminFormField, AssignFieldFrequencyRequest } from '../../../../core/types/admin/adminForms';
import type { Frequency, FrequencyPeriodWindow } from '../../../../core/types/admin/adminLookups';
import {
  formatPeriodRange,
  formatPeriodWindowLabel,
  frequencyRequiresMonth,
  frequencySupportsCustomPeriodStart,
  toDateInputValue,
} from '../../../../core/utils/frequencyPeriods';

interface ManageFieldFrequencyDialogProps {
  formId: number;
  field: AdminFormField;
  onClose: () => void;
}

const textFieldSx = { borderRadius: '12px', fontWeight: 600 };

const MONTH_VALUES: ReadonlyArray<number> = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const currentYear = (): number => new Date().getFullYear();
const currentMonth = (): number => new Date().getMonth() + 1;

const resolveFrequency = (
  frequencyId: number | '',
  frequencies: Frequency[],
): Frequency | undefined => {
  if (frequencyId === '') {
    return undefined;
  }
  return frequencies.find((item) => item.frequencyId === frequencyId);
};

interface PeriodWindowsListProps {
  title: string;
  emptyLabel: string;
  periods: FrequencyPeriodWindow[];
  submittedKeys: ReadonlySet<string>;
  isLoading: boolean;
}

const PeriodWindowsList: React.FC<PeriodWindowsListProps> = ({
  title,
  emptyLabel,
  periods,
  submittedKeys,
  isLoading,
}) => {
  const { t } = useLocale();

  return (
  <Box>
    <Typography
      variant="caption"
      fontWeight={800}
      color="text.secondary"
      sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5 }}
    >
      {title}
    </Typography>
    {isLoading ? (
      <Stack direction="row" alignItems="center" gap={1} sx={{ py: 1 }}>
        <CircularProgress size={16} thickness={6} />
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          {t('admin.forms.freq.loadingPeriods')}
        </Typography>
      </Stack>
    ) : periods.length === 0 ? (
      <Typography variant="body2" color="text.secondary" fontWeight={600}>
        {emptyLabel}
      </Typography>
    ) : (
      <Stack spacing={1}>
        {periods.map((period) => {
          const itemKey = period.periodKey.length > 0
            ? period.periodKey
            : `${period.periodStartDate}-${period.periodEndDate}`;
          const isSubmitted = submittedKeys.has(period.periodKey);
          const range = formatPeriodRange(period);

          return (
            <Paper
              key={itemKey}
              variant="outlined"
              sx={{ p: 1.25, px: 1.5, borderRadius: '12px', bgcolor: 'action.hover', border: 'none' }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                <Box>
                  <Typography variant="body2" fontWeight={800}>
                    {formatPeriodWindowLabel(period)}
                  </Typography>
                  {range.length > 0 && (
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {range}
                    </Typography>
                  )}
                </Box>
                {isSubmitted && (
                  <Chip
                    label={t('admin.forms.freq.submitted')}
                    size="small"
                    sx={{ height: 20, fontSize: 10, fontWeight: 800, bgcolor: alpha(ADMIN_ACCENT, 0.12), color: ADMIN_ACCENT }}
                  />
                )}
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    )}
  </Box>
  );
};

const ManageFieldFrequencyDialog: React.FC<ManageFieldFrequencyDialogProps> = ({
  formId,
  field,
  onClose,
}) => {
  const { t, loc } = useLocale();
  const { data: rawFrequencies, isLoading: frequenciesLoading } = useAdminFrequencies();
  const frequencies = Array.isArray(rawFrequencies) ? rawFrequencies : [];
  const assignFrequency = useAssignFieldFrequency();

  const [frequencyId, setFrequencyId] = useState<number | ''>(field.frequencyId ?? '');
  const [periodStartDate, setPeriodStartDate] = useState(toDateInputValue(field.periodStartDate));
  const [yearInput, setYearInput] = useState(String(currentYear()));
  const [month, setMonth] = useState<number>(currentMonth());
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [hasAssigned, setHasAssigned] = useState(false);

  const parsedYear = Number(yearInput.trim());
  const yearIsValid = Number.isInteger(parsedYear) && parsedYear >= 1900 && parsedYear <= 2100;

  const selectedFrequency = resolveFrequency(frequencyId, frequencies);
  const needsMonth = frequencyRequiresMonth(selectedFrequency);
  const showCustomStart = frequencySupportsCustomPeriodStart(selectedFrequency);
  const previewMonth = needsMonth ? month : undefined;
  const previewStartDate = showCustomStart && periodStartDate.trim().length > 0
    ? periodStartDate
    : undefined;

  const previewPeriods = useAdminFrequencyPeriods(
    frequencyId === '' ? 0 : frequencyId,
    yearIsValid ? parsedYear : 0,
    previewMonth,
    previewStartDate,
  );

  const assignedFrequencyQuery = useAdminFieldFrequency(
    formId,
    field.fieldId,
    yearIsValid && (field.frequencyId !== null || hasAssigned) ? parsedYear : 0,
    field.frequency !== null && frequencyRequiresMonth(field.frequency) ? month : undefined,
  );

  const submittedKeys = useMemo(() => {
    const periods = assignedFrequencyQuery.data?.submittedPeriods ?? [];
    return new Set(periods.map((period) => period.periodKey).filter((key) => key.length > 0));
  }, [assignedFrequencyQuery.data?.submittedPeriods]);

  const assignedLabel = field.frequency !== null
    ? loc(field.frequency.nameEn, field.frequency.nameAr)
    : t('admin.forms.frequency.notAssigned');

  const handleAssign = async (): Promise<void> => {
    setSubmitError('');
    setError('');

    if (frequencyId === '') {
      setError(t('admin.forms.freq.selectBefore'));
      return;
    }
    if (!yearIsValid) {
      setError(t('admin.forms.freq.invalidYear'));
      return;
    }

    try {
      const data: AssignFieldFrequencyRequest = { frequencyId };
      if (frequencySupportsCustomPeriodStart(selectedFrequency)) {
        data.periodStartDate = periodStartDate.trim().length > 0 ? periodStartDate : null;
      }
      await assignFrequency.mutateAsync({
        formId,
        fieldId: field.fieldId,
        data,
      });
      setHasAssigned(true);
    } catch {
      setSubmitError(t('admin.forms.freq.assignError'));
    }
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
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: -0.5 }}>
            {t('admin.forms.freq.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            {t('admin.forms.fieldLabel', { name: loc(field.labelEn, field.labelAr), key: field.fieldKey })}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ bgcolor: 'action.hover' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, maxHeight: '70vh' }}>
        <Stack spacing={3} sx={{ py: 1 }}>
          <Paper
            variant="outlined"
            sx={{ p: 1.5, borderRadius: '12px', bgcolor: alpha(ADMIN_ACCENT, 0.06), borderColor: alpha(ADMIN_ACCENT, 0.2) }}
          >
            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              {t('admin.forms.freq.current')}
            </Typography>
            <Typography variant="body2" fontWeight={800}>
              {assignedLabel}
              {field.frequency !== null ? ` (${field.frequency.code})` : ''}
            </Typography>
            {field.periodStartDate !== null && field.periodStartDate.length > 0 && (
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mt: 0.5 }}>
                {t('admin.forms.freq.customStart', { date: toDateInputValue(field.periodStartDate) })}
              </Typography>
            )}
            {field.kpiId === null && (
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mt: 0.5 }}>
                {t('admin.forms.freq.kpiHint')}
              </Typography>
            )}
          </Paper>

          <FormControl size="small" fullWidth error={error.length > 0} required>
            <InputLabel>{t('admin.forms.field.frequencyLabel')}</InputLabel>
            <Select
              value={frequencyId}
              label={t('admin.forms.field.frequencyLabel')}
              onChange={(e) => {
                const val = e.target.value as string | number;
                if (val === '' || val === undefined) {
                  setFrequencyId('');
                } else {
                  setFrequencyId(Number(val));
                }
                setError('');
              }}
              sx={{ borderRadius: '12px' }}
            >
              <MenuItem value="" sx={{ fontWeight: 600 }}>
                {frequenciesLoading ? t('admin.forms.freq.loading') : t('admin.forms.freq.select')}
              </MenuItem>
              {frequencies.map((item) => (
                <MenuItem key={item.frequencyId} value={item.frequencyId} sx={{ fontWeight: 600 }}>
                  {loc(item.nameEn, item.nameAr)}
                  {item.hasDiscretePeriods ? ` · ${t('admin.forms.frequency.discrete')}` : ''}
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" color={error.length > 0 ? 'error' : 'text.secondary'} sx={{ mt: 0.5, ml: 1.75, display: 'block' }}>
              {error.length > 0 ? error : t('admin.forms.freq.putHint')}
            </Typography>
          </FormControl>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label={t('admin.forms.freq.year')}
              value={yearInput}
              onChange={(e) => {
                setYearInput(e.target.value);
                setError('');
              }}
              error={!yearIsValid}
              helperText={yearIsValid ? t('admin.forms.freq.yearHint') : t('admin.forms.freq.yearError')}
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 1900, max: 2100, step: 1 }}
              InputProps={{ sx: textFieldSx }}
            />
            {needsMonth && (
              <FormControl size="small" fullWidth>
                <InputLabel>{t('admin.forms.freq.month')}</InputLabel>
                <Select
                  value={month}
                  label={t('admin.forms.freq.month')}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  sx={{ borderRadius: '12px' }}
                >
                  {MONTH_VALUES.map((value) => (
                    <MenuItem key={value} value={value} sx={{ fontWeight: 600 }}>
                      {t(`admin.month.${value}`)}
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75, display: 'block' }}>
                  {t('admin.forms.freq.monthHint')}
                </Typography>
              </FormControl>
            )}
            {showCustomStart && (
              <TextField
                label={t('admin.forms.field.periodStart')}
                type="date"
                value={periodStartDate}
                onChange={(e) => setPeriodStartDate(e.target.value)}
                helperText={t('admin.forms.freq.periodStartHint')}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: textFieldSx }}
              />
            )}
          </Stack>

          <PeriodWindowsList
            title={t('admin.forms.freq.preview')}
            emptyLabel={t('admin.forms.freq.previewEmpty')}
            periods={previewPeriods.data ?? []}
            submittedKeys={submittedKeys}
            isLoading={previewPeriods.isFetching}
          />

          {(field.frequencyId !== null || hasAssigned) && (
            <>
              <Divider sx={{ borderStyle: 'dashed' }} />
              <PeriodWindowsList
                title={t('admin.forms.freq.expected')}
                emptyLabel={t('admin.forms.freq.expectedEmpty')}
                periods={assignedFrequencyQuery.data?.expectedPeriods ?? []}
                submittedKeys={submittedKeys}
                isLoading={assignedFrequencyQuery.isFetching}
              />
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={800}
                  color="text.secondary"
                  sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1 }}
                >
                  {t('admin.forms.freq.submittedTitle')}
                </Typography>
                <Typography variant="body2" fontWeight={700} color="text.secondary">
                  {t('admin.forms.freq.submittedCount', { count: assignedFrequencyQuery.data?.submittedPeriods.length ?? 0 })}
                </Typography>
              </Box>
            </>
          )}

          {submitError !== '' && (
            <Typography variant="body2" color="error" fontWeight={600}>
              {submitError}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={onClose}
          variant="contained"
          color="inherit"
          sx={{ borderRadius: '12px', bgcolor: 'action.hover', fontWeight: 700, textTransform: 'none' }}
        >
          {t('admin.common.close')}
        </Button>
        <Button
          onClick={() => {
            void handleAssign();
          }}
          variant="contained"
          disableElevation
          disabled={assignFrequency.isPending || frequencyId === ''}
          sx={{ borderRadius: '12px', fontWeight: 700, textTransform: 'none', px: 4 }}
        >
          {assignFrequency.isPending ? t('admin.common.saving') : t('admin.forms.freq.assign')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManageFieldFrequencyDialog;
