import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocale } from '../../../../core/hooks/useLocale';
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
  Divider,
  Avatar,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Schema as DependenciesIcon,
  Description as FormIcon,
  History as VersionIcon,
  FilterList as FilterIcon,
  Functions as FormulaIcon,
  TableChart as ColumnsIcon,
  EventRepeat as FrequencyIcon,
} from '@mui/icons-material';
import AdminLayout from '../../shared/AdminLayout';
import {
  useAdminFormDetail,
  useAddField,
  useRemoveField,
  useSetCalculation,
} from '../../../../core/hooks/admin/useAdminForms';
import { useAdminControlTypes, useAdminDataTypes, useAdminFrequencies, useAdminLookupTypes } from '../../../../core/hooks/admin/useAdminLookups';
import { ADMIN_ACCENT } from '../../shared/theme/adminTokens';
import { ErrorState, LoadingState, PageHeader, StatusPill } from '../../shared/ui';
import { ControlKeys } from '../../../../core/enums/control-keys.enum';
import type { AdminFormField, AddFieldRequest } from '../../../../core/types/admin/adminForms';
import type { ControlType, DataType, LookupType } from '../../../../core/types/admin/adminLookups';
import { frequencySupportsCustomPeriodStart, toDateInputValue } from '../../../../core/utils/frequencyPeriods';
import CalculationConfigFields from './CalculationConfigFields';
import {
  buildSetCalculationRequest,
  createDefaultCalculationConfig,
  validateCalculationConfig,
  type CalculationConfigDraft,
} from './calculationConfig.utils';
import {
  formatControlTypeLabel,
  getControlRequirements,
  isCalculatedControlType,
  isLookupRequired,
  resolveControlType,
  resolveSuggestedDataTypeId,
} from './controlFieldRequirements';
import ManageTableStructureDialog from './ManageTableStructureDialog';
import ManageFieldFrequencyDialog from './ManageFieldFrequencyDialog';
import EditFieldDialog from './EditFieldDialog';
import RegexPatternSelect from './RegexPatternSelect';
import type { RegexPatternPreset } from './regexPatterns';

// ─── Add Field helpers ────────────────────────────────────────────────────────

const parseOptionalString = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

interface FieldSectionProps {
  title: string;
  children: React.ReactNode;
}

const FieldSection: React.FC<FieldSectionProps> = ({ title, children }) => (
  <Box>
    <Typography
      variant="caption"
      fontWeight={800}
      color="text.secondary"
      sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5 }}
    >
      {title}
    </Typography>
    <Stack spacing={2}>{children}</Stack>
  </Box>
);

const resolveLookupType = (
  lookupTypeId: number | null,
  lookupTypes: LookupType[],
): LookupType | undefined => {
  if (lookupTypeId === null) {
    return undefined;
  }
  return lookupTypes.find((lookupType) => lookupType.lookupTypeId === lookupTypeId);
};

const formatLookupTypeLabel = (
  lookupTypeId: number | null,
  lookupTypes: LookupType[],
  loc: (enVal: string | null | undefined, arVal: string | null | undefined) => string,
): string => {
  const lookupType = resolveLookupType(lookupTypeId, lookupTypes);
  if (lookupType === undefined) {
    return lookupTypeId === null ? '—' : `Lookup #${lookupTypeId}`;
  }
  return loc(lookupType.nameEn, lookupType.nameAr);
};

// ─── Add Field Dialog ─────────────────────────────────────────────────────────

interface AddFieldDialogProps {
  formId: number;
  currentMaxOrder: number;
  inheritedFrequencyName: string | null;
  onClose: () => void;
}

const AddFieldDialog: React.FC<AddFieldDialogProps> = ({ formId, currentMaxOrder, inheritedFrequencyName, onClose }) => {
  const { t, loc } = useLocale();
  const { data: rawControlTypes } = useAdminControlTypes();
  const { data: rawDataTypes } = useAdminDataTypes();
  const { data: rawLookupTypes } = useAdminLookupTypes();
  const { data: rawFrequencies } = useAdminFrequencies();
  const controlTypes = Array.isArray(rawControlTypes) ? rawControlTypes : [];
  const dataTypes = Array.isArray(rawDataTypes) ? rawDataTypes : [];
  const lookupTypes = Array.isArray(rawLookupTypes) ? rawLookupTypes : [];
  const frequencies = Array.isArray(rawFrequencies) ? rawFrequencies : [];
  const addField = useAddField();
  const setCalculation = useSetCalculation();

  const [fieldKey, setFieldKey] = useState('');
  const [labelEn, setLabelEn] = useState('');
  const [labelAr, setLabelAr] = useState('');
  const [dataTypeId, setDataTypeId] = useState<number | ''>('');
  const [controlTypeId, setControlTypeId] = useState<number | ''>('');
  const [displayOrder, setDisplayOrder] = useState(String(currentMaxOrder + 1));
  const [isRequired, setIsRequired] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [regexPattern, setRegexPattern] = useState('');
  const [placeholderEn, setPlaceholderEn] = useState('');
  const [placeholderAr, setPlaceholderAr] = useState('');
  const [helpTextEn, setHelpTextEn] = useState('');
  const [helpTextAr, setHelpTextAr] = useState('');
  const [validationMessageEn, setValidationMessageEn] = useState('');
  const [validationMessageAr, setValidationMessageAr] = useState('');
  const [lookupTypeId, setLookupTypeId] = useState<number | ''>('');
  const [frequencyId, setFrequencyId] = useState<number | ''>('');
  const [periodStartDate, setPeriodStartDate] = useState('');
  const [calculationConfig, setCalculationConfig] = useState<CalculationConfigDraft>(() =>
    createDefaultCalculationConfig(dataTypes, controlTypes),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  const controlReq = getControlRequirements(controlTypeId, controlTypes);
  const isCalculatedControl = isCalculatedControlType(controlTypeId, controlTypes);
  const lookupRequired = isLookupRequired(controlTypeId, controlTypes);

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

    if (fieldKey.trim().length === 0) {
      errs.fieldKey = 'admin.common.required';
    }
    if (labelEn.trim().length === 0) {
      errs.labelEn = 'admin.common.required';
    }
    if (labelAr.trim().length === 0) {
      errs.labelAr = 'admin.common.required';
    }
    if (dataTypeId === '') {
      errs.dataTypeId = 'admin.common.required';
    }
    if (controlTypeId === '') {
      errs.controlTypeId = 'admin.common.required';
    }

    if (lookupRequired && lookupTypeId === '') {
      errs.lookupTypeId = 'admin.forms.field.lookupRequired';
    }

    if (controlReq?.controlKey === ControlKeys.Label) {
      if (placeholderEn.trim().length === 0) {
        errs.placeholderEn = 'admin.forms.field.requiredForLabel';
      }
      if (placeholderAr.trim().length === 0) {
        errs.placeholderAr = 'admin.forms.field.requiredForLabel';
      }
    }

    if (isCalculatedControl) {
      const calculationErrors = validateCalculationConfig(calculationConfig);
      Object.assign(errs, calculationErrors);
    }

    const orderTrimmed = displayOrder.trim();
    if (orderTrimmed.length === 0) {
      errs.displayOrder = 'admin.common.required';
    } else {
      const parsedOrder = Number(orderTrimmed);
      if (Number.isNaN(parsedOrder) || parsedOrder < 1) {
        errs.displayOrder = 'admin.common.positiveNumber';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    if (dataTypeId === '' || controlTypeId === '') {
      return;
    }

    const data: AddFieldRequest = {
      fieldKey: fieldKey.trim().toUpperCase(),
      labelEn: labelEn.trim(),
      labelAr: labelAr.trim(),
      dataTypeId: Number(dataTypeId),
      controlTypeId: Number(controlTypeId),
      displayOrder: Number(displayOrder.trim()),
      isRequired: controlReq?.forceOptional ? false : isRequired,
      // Label and Calculated fields stay read-only; other types default to editable.
      isReadOnly: controlReq?.forceReadOnly ?? false,
      isVisible,
    };

    if (controlReq?.showRegexValidation) {
      const parsedRegex = parseOptionalString(regexPattern);
      if (parsedRegex !== undefined) {
        data.regexPattern = parsedRegex;
      }
    }
    const parsedPlaceholderEn = parseOptionalString(placeholderEn);
    if (parsedPlaceholderEn !== undefined) {
      data.placeholderEn = parsedPlaceholderEn;
    }
    const parsedPlaceholderAr = parseOptionalString(placeholderAr);
    if (parsedPlaceholderAr !== undefined) {
      data.placeholderAr = parsedPlaceholderAr;
    }
    const parsedHelpTextEn = parseOptionalString(helpTextEn);
    if (parsedHelpTextEn !== undefined) {
      data.helpTextEn = parsedHelpTextEn;
    }
    const parsedHelpTextAr = parseOptionalString(helpTextAr);
    if (parsedHelpTextAr !== undefined) {
      data.helpTextAr = parsedHelpTextAr;
    }
    const parsedValidationMessageEn = parseOptionalString(validationMessageEn);
    if (parsedValidationMessageEn !== undefined) {
      data.validationMessageEn = parsedValidationMessageEn;
    }
    const parsedValidationMessageAr = parseOptionalString(validationMessageAr);
    if (parsedValidationMessageAr !== undefined) {
      data.validationMessageAr = parsedValidationMessageAr;
    }
    if (lookupTypeId !== '') {
      data.lookupTypeId = Number(lookupTypeId);
    } else if (lookupRequired) {
      return;
    }
    if (frequencyId !== '') {
      data.frequencyId = Number(frequencyId);
      const selectedFrequency = frequencies.find((item) => item.frequencyId === Number(frequencyId));
      if (frequencySupportsCustomPeriodStart(selectedFrequency)) {
        data.periodStartDate = periodStartDate.trim().length > 0 ? periodStartDate : null;
      }
    }

    try {
      const createdField = await addField.mutateAsync({ formId, data });

      if (isCalculatedControl) {
        await setCalculation.mutateAsync({
          formId,
          fieldId: createdField.fieldId,
          data: buildSetCalculationRequest(calculationConfig),
        });
      }

      onClose();
    } catch {
      setSubmitError(t('admin.forms.field.createError'));
    }
  };

  const handleControlTypeChange = (nextControlTypeId: number | ''): void => {
    setControlTypeId(nextControlTypeId);
    clearError('controlTypeId');
    clearError('lookupTypeId');

    const nextRequirements = getControlRequirements(nextControlTypeId, controlTypes);

    if (nextRequirements === null) {
      return;
    }

    const suggestedDataTypeId = resolveSuggestedDataTypeId(nextRequirements, dataTypes);
    if (suggestedDataTypeId !== '') {
      setDataTypeId(suggestedDataTypeId);
    }

    if (nextRequirements.forceOptional) {
      setIsRequired(false);
    }

    if (!nextRequirements.requiresLookup) {
      setLookupTypeId('');
    }

    if (nextRequirements.requiresCalculation) {
      setCalculationConfig(createDefaultCalculationConfig(dataTypes, controlTypes));
    }
  };

  const isSubmitting = addField.isPending || setCalculation.isPending;

  const textFieldSx = { borderRadius: '12px', fontWeight: 600 };

  const errText = (field: string): string | undefined => {
    const key = errors[field];
    return key !== undefined && key !== '' ? t(key) : undefined;
  };

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Fade}
      PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: -0.5 }}>
          {t('admin.forms.field.addTitle')}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ bgcolor: 'action.hover' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, maxHeight: '70vh' }}>
        <Box component="form" id="add-field-form" onSubmit={handleSubmit} noValidate sx={{ py: 1 }}>
          <Stack spacing={3}>
            <FieldSection title={t('admin.forms.field.basic')}>
              <TextField
                label={t('admin.forms.field.key')}
                value={fieldKey}
                onChange={(e) => { setFieldKey(e.target.value); clearError('fieldKey'); }}
                error={Boolean(errors.fieldKey)}
                helperText={errText('fieldKey') ?? t('admin.forms.field.keyHint')}
                fullWidth
                size="small"
                required
                InputProps={{ sx: textFieldSx }}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label={t('admin.forms.field.labelEn')}
                  value={labelEn}
                  onChange={(e) => { setLabelEn(e.target.value); clearError('labelEn'); }}
                  error={Boolean(errors.labelEn)}
                  helperText={errText('labelEn')}
                  fullWidth
                  size="small"
                  required
                  InputProps={{ sx: textFieldSx }}
                />
                <TextField
                  label={t('admin.forms.field.labelAr')}
                  value={labelAr}
                  onChange={(e) => { setLabelAr(e.target.value); clearError('labelAr'); }}
                  error={Boolean(errors.labelAr)}
                  helperText={errText('labelAr')}
                  fullWidth
                  size="small"
                  required
                  inputProps={{ dir: 'rtl' }}
                  InputProps={{ sx: textFieldSx }}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl size="small" fullWidth required error={Boolean(errors.dataTypeId)}>
                  <InputLabel>{t('admin.forms.field.dataType')}</InputLabel>
                  <Select
                    value={dataTypeId}
                    label={t('admin.forms.field.dataType')}
                    onChange={(e) => { setDataTypeId(e.target.value as number | ''); clearError('dataTypeId'); }}
                    disabled={controlReq?.lockDataType ?? false}
                    sx={{ borderRadius: '12px' }}
                  >
                    {dataTypes.map((dt) => (
                      <MenuItem key={dt.dataTypeId} value={dt.dataTypeId} sx={{ fontWeight: 600 }}>
                        {dt.typeName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth required error={Boolean(errors.controlTypeId)}>
                  <InputLabel>{t('admin.forms.field.controlType')}</InputLabel>
                  <Select
                    value={controlTypeId}
                    label={t('admin.forms.field.controlType')}
                    onChange={(e) => handleControlTypeChange(e.target.value as number | '')}
                    sx={{ borderRadius: '12px' }}
                  >
                    {controlTypes.map((ct) => (
                      <MenuItem key={ct.controlTypeId} value={ct.controlTypeId} sx={{ fontWeight: 600 }}>
                        {ct.controlName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              {controlReq !== null && (
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '12px', bgcolor: alpha(ADMIN_ACCENT, 0.06), borderColor: alpha(ADMIN_ACCENT, 0.2) }}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    {t(controlReq.hint)}
                  </Typography>
                </Paper>
              )}
              <TextField
                label={t('admin.forms.field.displayOrder')}
                value={displayOrder}
                onChange={(e) => { setDisplayOrder(e.target.value); clearError('displayOrder'); }}
                error={Boolean(errors.displayOrder)}
                helperText={errText('displayOrder') ?? t('admin.forms.field.displayOrderHint', { order: currentMaxOrder + 1 })}
                fullWidth
                size="small"
                required
                type="number"
                inputProps={{ min: 1 }}
                InputProps={{ sx: textFieldSx }}
              />
            </FieldSection>

            <Divider sx={{ borderStyle: 'dashed' }} />

            <FieldSection title={t('admin.forms.field.behavior')}>
              <Paper variant="outlined" sx={{ p: 1, px: 2, borderRadius: '12px', bgcolor: 'action.hover', border: 'none' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap">
                  <FormControlLabel
                    control={(
                      <Switch
                        checked={controlReq?.forceOptional ? false : isRequired}
                        onChange={(e) => setIsRequired(e.target.checked)}
                        disabled={controlReq?.forceOptional ?? false}
                      />
                    )}
                    label={<Typography variant="body2" fontWeight={700}>{t('admin.forms.field.required')}</Typography>}
                  />
                  <FormControlLabel
                    control={<Switch checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} />}
                    label={<Typography variant="body2" fontWeight={700}>{t('admin.forms.field.visible')}</Typography>}
                  />
                </Stack>
              </Paper>
            </FieldSection>

            {controlReq?.requiresCalculation && (
              <>
                <Divider sx={{ borderStyle: 'dashed' }} />
                <FieldSection title={t('admin.forms.field.calculation')}>
                  <CalculationConfigFields
                    config={calculationConfig}
                    errors={errors}
                    dataTypes={dataTypes}
                    controlTypes={controlTypes}
                    onChange={setCalculationConfig}
                    onClearError={clearError}
                  />
                </FieldSection>
              </>
            )}

            {controlReq?.requiresLookup && (
              <>
                <Divider sx={{ borderStyle: 'dashed' }} />
                <FieldSection title={t('admin.forms.field.lookup')}>
                  <FormControl
                    size="small"
                    fullWidth
                    required={lookupRequired}
                    error={Boolean(errors.lookupTypeId)}
                  >
                    <InputLabel>{t('admin.forms.field.lookupType')}</InputLabel>
                    <Select
                      value={lookupTypeId}
                      label={t('admin.forms.field.lookupType')}
                      onChange={(e) => {
                        const val = e.target.value as string | number;
                        if (val === '' || val === undefined) {
                          setLookupTypeId('');
                        } else {
                          setLookupTypeId(Number(val));
                        }
                        clearError('lookupTypeId');
                      }}
                      sx={{ borderRadius: '12px' }}
                    >
                      {lookupTypes.map((lt) => (
                        <MenuItem key={lt.lookupTypeId} value={lt.lookupTypeId} sx={{ fontWeight: 600 }}>
                          {loc(lt.nameEn, lt.nameAr)}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.lookupTypeId !== undefined && errors.lookupTypeId !== '' ? (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        {t(errors.lookupTypeId)}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75, display: 'block' }}>
                        {t('admin.forms.field.lookupHint')}
                      </Typography>
                    )}
                  </FormControl>
                </FieldSection>
              </>
            )}

            {controlReq !== null && controlReq.showValidationSection && (
              <>
            <Divider sx={{ borderStyle: 'dashed' }} />

            <FieldSection title={t('admin.forms.field.validation')}>
              {controlReq.showRegexValidation && (
              <RegexPatternSelect
                value={regexPattern}
                onChange={(pattern: string, preset: RegexPatternPreset | null) => {
                  setRegexPattern(pattern);
                  if (preset !== null) {
                    setValidationMessageEn(preset.validationMessageEn);
                    setValidationMessageAr(preset.validationMessageAr);
                  }
                }}
              />
              )}
              {controlReq.showHelpTextInValidation && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label={t('admin.forms.field.helpEn')}
                  value={helpTextEn}
                  onChange={(e) => setHelpTextEn(e.target.value)}
                  helperText={t('admin.forms.field.helpTable')}
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
                <TextField
                  label={t('admin.forms.field.helpAr')}
                  value={helpTextAr}
                  onChange={(e) => setHelpTextAr(e.target.value)}
                  helperText={t('admin.common.optional')}
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  inputProps={{ dir: 'rtl' }}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
              </Stack>
              )}
              {controlReq.showValidationMessages && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label={t('admin.forms.field.validationEn')}
                  value={validationMessageEn}
                  onChange={(e) => setValidationMessageEn(e.target.value)}
                  helperText={t('admin.forms.field.validationHint')}
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
                <TextField
                  label={t('admin.forms.field.validationAr')}
                  value={validationMessageAr}
                  onChange={(e) => setValidationMessageAr(e.target.value)}
                  helperText={t('admin.common.optional')}
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  inputProps={{ dir: 'rtl' }}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
              </Stack>
              )}
            </FieldSection>
              </>
            )}

            {controlReq !== null && controlReq.showContentHelpSection && (
              <>
            <Divider sx={{ borderStyle: 'dashed' }} />

            <FieldSection title={controlReq.controlKey === ControlKeys.Label ? t('admin.forms.field.displayText') : t('admin.forms.field.content')}>
              {controlReq.showPlaceholder && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label={t('admin.forms.field.placeholderEn')}
                  value={placeholderEn}
                  onChange={(e) => { setPlaceholderEn(e.target.value); clearError('placeholderEn'); }}
                  error={Boolean(errors.placeholderEn)}
                  helperText={errText('placeholderEn') ?? (controlReq.controlKey === ControlKeys.Label ? t('admin.forms.field.placeholderHintEn') : t('admin.common.optional'))}
                  fullWidth
                  size="small"
                  required={controlReq.controlKey === ControlKeys.Label}
                  InputProps={{ sx: textFieldSx }}
                />
                <TextField
                  label={t('admin.forms.field.placeholderAr')}
                  value={placeholderAr}
                  onChange={(e) => { setPlaceholderAr(e.target.value); clearError('placeholderAr'); }}
                  error={Boolean(errors.placeholderAr)}
                  helperText={errText('placeholderAr') ?? (controlReq.controlKey === ControlKeys.Label ? t('admin.forms.field.placeholderHintAr') : t('admin.common.optional'))}
                  fullWidth
                  size="small"
                  required={controlReq.controlKey === ControlKeys.Label}
                  inputProps={{ dir: 'rtl' }}
                  InputProps={{ sx: textFieldSx }}
                />
              </Stack>
              )}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label={t('admin.forms.field.helpEn')}
                  value={helpTextEn}
                  onChange={(e) => setHelpTextEn(e.target.value)}
                  helperText={t('admin.common.optional')}
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
                <TextField
                  label={t('admin.forms.field.helpAr')}
                  value={helpTextAr}
                  onChange={(e) => setHelpTextAr(e.target.value)}
                  helperText={t('admin.common.optional')}
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  inputProps={{ dir: 'rtl' }}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
              </Stack>
            </FieldSection>
              </>
            )}

            {controlReq !== null && controlReq.showKpiField && (
              <>
                <Divider sx={{ borderStyle: 'dashed' }} />
                <FieldSection title={t('admin.forms.field.frequencySection')}>
                  <FormControl size="small" fullWidth>
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
                      }}
                      sx={{ borderRadius: '12px' }}
                    >
                      <MenuItem value="" sx={{ fontWeight: 600 }}>
                        {t('admin.forms.frequency.inherit')}
                      </MenuItem>
                      {frequencies.map((item) => (
                        <MenuItem key={item.frequencyId} value={item.frequencyId} sx={{ fontWeight: 600 }}>
                          {loc(item.nameEn, item.nameAr)}
                          {item.hasDiscretePeriods ? ` · ${t('admin.forms.frequency.discrete')}` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75, display: 'block' }}>
                      {inheritedFrequencyName !== null
                        ? t('admin.forms.field.inheritNamed', { name: inheritedFrequencyName })
                        : t('admin.forms.field.inheritDefault')}
                    </Typography>
                  </FormControl>
                  {frequencySupportsCustomPeriodStart(
                    frequencies.find((item) => item.frequencyId === frequencyId),
                  ) && (
                    <TextField
                      label={t('admin.forms.field.periodStart')}
                      type="date"
                      value={periodStartDate}
                      onChange={(e) => setPeriodStartDate(e.target.value)}
                      helperText={t('admin.forms.field.periodStartHint')}
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ sx: textFieldSx }}
                    />
                  )}
                </FieldSection>
              </>
            )}

            {submitError !== '' && (
              <Typography variant="body2" color="error" fontWeight={600}>
                {submitError}
              </Typography>
            )}
          </Stack>
        </Box>
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
          form="add-field-form"
          variant="contained"
          disableElevation
          disabled={isSubmitting}
          sx={{ borderRadius: '12px', fontWeight: 700, textTransform: 'none', px: 4 }}
        >
          {isSubmitting ? t('admin.common.working') : t('admin.forms.field.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Set Calculation Dialog ───────────────────────────────────────────────────

interface SetCalculationDialogProps {
  formId: number;
  field: AdminFormField;
  onClose: () => void;
}

const fieldCalculationToDraft = (
  field: AdminFormField,
  dataTypes: DataType[],
  controlTypes: ControlType[],
): CalculationConfigDraft => {
  const calculation = field.formFieldCalculations;
  if (calculation === null) {
    return createDefaultCalculationConfig(dataTypes, controlTypes);
  }

  return {
    formulaExpression: calculation.formulaExpression,
    resultColumnKey: calculation.resultColumnKey,
    resultLabelEn: calculation.resultLabelEn,
    resultLabelAr: calculation.resultLabelAr,
    resultPrecision: String(calculation.resultPrecision),
    resultDataTypeId: calculation.resultDataTypeId,
    resultControlTypeId: calculation.resultControlTypeId,
    buttonLabelEn: calculation.buttonLabelEn,
    buttonLabelAr: calculation.buttonLabelAr,
    displayFormulaEn: calculation.displayFormulaEn ?? '',
    displayFormulaAr: calculation.displayFormulaAr ?? '',
    helpTextEn: calculation.helpTextEn ?? '',
    helpTextAr: calculation.helpTextAr ?? '',
    inputs: calculation.formFieldCalculationInputs.map((input) => ({
      clientId: `input-${input.inputId}`,
      inputToken: input.inputToken,
      columnKey: input.columnKey,
      labelEn: input.labelEn,
      labelAr: input.labelAr,
      dataTypeId: input.dataTypeId,
      controlTypeId: input.controlTypeId,
      isRequired: input.isRequired,
    })),
  };
};

const SetCalculationDialog: React.FC<SetCalculationDialogProps> = ({ formId, field, onClose }) => {
  const { t, loc } = useLocale();
  const { data: rawControlTypes } = useAdminControlTypes();
  const { data: rawDataTypes } = useAdminDataTypes();
  const controlTypes = Array.isArray(rawControlTypes) ? rawControlTypes : [];
  const dataTypes = Array.isArray(rawDataTypes) ? rawDataTypes : [];
  const setCalculation = useSetCalculation();

  const [config, setConfig] = useState<CalculationConfigDraft>(() =>
    fieldCalculationToDraft(field, dataTypes, controlTypes),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  const clearError = (fieldName: string): void => {
    setErrors((prev) => {
      if (prev[fieldName] === undefined || prev[fieldName] === '') {
        return prev;
      }
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitError('');

    const validationErrors = validateCalculationConfig(config);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await setCalculation.mutateAsync({
        formId,
        fieldId: field.fieldId,
        data: buildSetCalculationRequest(config),
      });
      onClose();
    } catch {
      setSubmitError(t('admin.forms.calc.saveError'));
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Fade}
      PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: -0.5 }}>
          {t('admin.forms.calc.title')}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ bgcolor: 'action.hover' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, maxHeight: '70vh' }}>
        <Box component="form" id="set-calculation-form" onSubmit={handleSubmit} noValidate sx={{ py: 1 }}>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              {t('admin.forms.fieldLabel', { name: loc(field.labelEn, field.labelAr), key: field.fieldKey })}
            </Typography>
            <CalculationConfigFields
              config={config}
              errors={errors}
              dataTypes={dataTypes}
              controlTypes={controlTypes}
              onChange={setConfig}
              onClearError={clearError}
            />
            {submitError !== '' && (
              <Typography variant="body2" color="error" fontWeight={600}>
                {submitError}
              </Typography>
            )}
          </Stack>
        </Box>
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
          form="set-calculation-form"
          variant="contained"
          disableElevation
          disabled={setCalculation.isPending}
          sx={{ borderRadius: '12px', fontWeight: 700, textTransform: 'none', px: 4 }}
        >
          {setCalculation.isPending ? t('admin.common.saving') : t('admin.forms.calc.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Field table presentation (visual only) ───────────────────────────────────

type ConfigTone = 'primary' | 'muted' | 'error' | 'warning';

const configToneColor = (tone: ConfigTone): string => {
  if (tone === 'error') {
    return 'error.main';
  }
  if (tone === 'warning') {
    return 'warning.main';
  }
  if (tone === 'muted') {
    return 'text.disabled';
  }
  return 'text.primary';
};

interface ConfigLineProps {
  label: string;
  value: string;
  tone: ConfigTone;
  mono?: boolean;
}

/** One compact label/value pair inside the configuration cell. */
const ConfigLine: React.FC<ConfigLineProps> = ({ label, value, tone, mono = false }) => (
  <Stack direction="row" spacing={1} alignItems="baseline">
    <Typography
      variant="caption"
      color="text.secondary"
      fontWeight={700}
      sx={{ minWidth: 72, flexShrink: 0 }}
    >
      {label}
    </Typography>
    <Typography
      variant="caption"
      fontWeight={700}
      color={configToneColor(tone)}
      sx={{
        wordBreak: 'break-word',
        fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' : 'inherit',
      }}
    >
      {value}
    </Typography>
  </Stack>
);

interface RowActionProps {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  tone?: 'default' | 'accent' | 'danger';
}

/** Icon action used in the table's actions column. */
const RowAction: React.FC<RowActionProps> = ({ label, onClick, children, tone = 'default' }) => {
  const theme = useTheme();
  const color =
    tone === 'danger' ? theme.palette.error.main : tone === 'accent' ? ADMIN_ACCENT : theme.palette.primary.main;

  return (
    <Tooltip title={label}>
      <IconButton
        size="small"
        aria-label={label}
        onClick={onClick}
        sx={{
          width: 32,
          height: 32,
          borderRadius: '8px',
          color,
          bgcolor: alpha(color, 0.08),
          '&:hover': { bgcolor: color, color: '#fff' },
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
};

interface SummaryCardProps {
  label: string;
  children: React.ReactNode;
}

/** Compact property card shown above the fields table. */
const SummaryCard: React.FC<SummaryCardProps> = ({ label, children }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        height: '100%',
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Typography
        variant="caption"
        fontWeight={800}
        color="text.secondary"
        sx={{ display: 'block', mb: 1, letterSpacing: '0.08em' }}
      >
        {label}
      </Typography>
      {children}
    </Paper>
  );
};

// ─── Field row ────────────────────────────────────────────────────────────────

interface FieldCardProps {
  formId: number;
  field: AdminFormField;
}

const FieldCard: React.FC<FieldCardProps> = ({ formId, field }) => {
  const theme = useTheme();
  const { t, loc, isAr } = useLocale();
  const { data: rawControlTypes } = useAdminControlTypes();
  const { data: rawLookupTypes } = useAdminLookupTypes();
  const controlTypes = Array.isArray(rawControlTypes) ? rawControlTypes : [];
  const lookupTypes = Array.isArray(rawLookupTypes) ? rawLookupTypes : [];
  const fieldRequirements = getControlRequirements(field.controlTypeId, controlTypes);
  const calculation = field.formFieldCalculations;
  const removeField = useRemoveField();
  const [confirmRemoveFieldOpen, setConfirmRemoveFieldOpen] = useState(false);
  const [editFieldOpen, setEditFieldOpen] = useState(false);
  const [calculationDialogOpen, setCalculationDialogOpen] = useState(false);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [frequencyDialogOpen, setFrequencyDialogOpen] = useState(false);

  const handleRemoveField = (): void => {
    removeField.mutate({ formId, fieldId: field.fieldId }, {
      onSuccess: () => setConfirmRemoveFieldOpen(false),
    });
  };

  // Same configuration text the card used to show, compacted into one cell.
  const frequencyLabel = `${field.frequency !== null ? loc(field.frequency.nameEn, field.frequency.nameAr) : t('admin.forms.frequency.notAssigned')}${
    field.periodStartDate !== null && field.periodStartDate.length > 0
      ? ` · start ${toDateInputValue(field.periodStartDate)}`
      : ''
  }`;
  const hasConfiguration =
    fieldRequirements?.showKpiField === true ||
    Boolean(fieldRequirements?.requiresLookup) ||
    Boolean(fieldRequirements?.requiresCalculation) ||
    Boolean(fieldRequirements?.requiresTableColumns) ||
    fieldRequirements?.controlKey === ControlKeys.Label;

  return (
    <>
      <TableRow
        sx={{
          '& td': {
            bgcolor: 'background.paper',
            borderColor: 'divider',
            py: 1.75,
            verticalAlign: 'top',
          },
          '&:hover td': { bgcolor: alpha(theme.palette.text.primary, 0.02) },
          '&:last-child td': { borderBottom: 0 },
          // Dim field content only — keep status + actions at full strength
          ...(field.isActive
            ? {}
            : {
                '& td:not(:nth-last-of-type(-n+2))': { opacity: 0.45 },
              }),
        }}
      >
        {/* Display order */}
        <TableCell sx={{ width: 72 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              fontSize: 12,
              color: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            }}
          >
            {field.displayOrder}
          </Box>
        </TableCell>

        {/* Field identity */}
        <TableCell>
          <Typography variant="body2" fontWeight={800} color="text.primary">
            {loc(field.labelEn, field.labelAr)}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            sx={{ direction: isAr ? 'ltr' : 'rtl', display: 'block', mt: 0.25 }}
          >
            {isAr ? field.labelEn : field.labelAr}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: 'inline-block',
              mt: 0.75,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              bgcolor: alpha(theme.palette.primary.main, 0.06),
              color: theme.palette.primary.main,
              px: 0.75,
              py: 0.25,
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: 11,
            }}
          >
            {field.fieldKey}
          </Typography>
        </TableCell>

        {/* Control type */}
        <TableCell sx={{ minWidth: 120 }}>
          <Chip
            label={formatControlTypeLabel(field.controlTypeId, controlTypes)}
            size="small"
            sx={{
              height: 'auto',
              maxWidth: '100%',
              fontWeight: 700,
              fontSize: 11,
              borderRadius: '6px',
              bgcolor: alpha(ADMIN_ACCENT, 0.1),
              color: ADMIN_ACCENT,
              border: 'none',
              '& .MuiChip-label': { px: 1, whiteSpace: 'normal', textAlign: 'left' },
            }}
          />
        </TableCell>

        {/* Type-specific configuration */}
        <TableCell>
          {hasConfiguration ? (
            <Stack spacing={0.75} alignItems="flex-start">
              {fieldRequirements?.showKpiField === true && (
                <ConfigLine
                  label={t('admin.forms.field.frequencyLabel')}
                  value={frequencyLabel}
                  tone={field.frequency !== null ? 'primary' : 'muted'}
                />
              )}
              {fieldRequirements?.requiresLookup && (
                <ConfigLine
                  label={t('admin.forms.detail.lookup')}
                  value={
                    field.lookupTypeId !== null
                      ? formatLookupTypeLabel(field.lookupTypeId, lookupTypes, loc)
                      : t('admin.forms.frequency.notAssigned')
                  }
                  tone={field.lookupTypeId !== null ? 'primary' : 'error'}
                />
              )}
              {fieldRequirements?.requiresCalculation && (
                <>
                  <ConfigLine
                    label={t('admin.forms.detail.formula')}
                    value={calculation !== null ? calculation.formulaExpression : t('admin.forms.detail.notConfigured')}
                    tone={calculation !== null ? 'primary' : 'error'}
                    mono
                  />
                  <ConfigLine
                    label={t('admin.forms.detail.result')}
                    value={calculation !== null ? loc(calculation.resultLabelEn, calculation.resultLabelAr) : '—'}
                    tone={calculation !== null ? 'primary' : 'muted'}
                  />
                  <ConfigLine
                    label={t('admin.forms.detail.inputs')}
                    value={calculation !== null ? String(calculation.formFieldCalculationInputs.length) : '0'}
                    tone={calculation !== null ? 'primary' : 'muted'}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<FormulaIcon />}
                    onClick={() => setCalculationDialogOpen(true)}
                    sx={{
                      borderRadius: '8px',
                      fontWeight: 700,
                      textTransform: 'none',
                      mt: 0.25,
                      maxWidth: '100%',
                      height: 'auto',
                      py: 0.75,
                      lineHeight: 1.3,
                      whiteSpace: 'normal',
                      textAlign: 'left',
                    }}
                  >
                    {calculation !== null ? t('admin.forms.detail.editCalculation') : t('admin.forms.detail.configureCalculation')}
                  </Button>
                </>
              )}
              {fieldRequirements?.requiresTableColumns && (
                <>
                  <ConfigLine
                    label={t('admin.forms.detail.columns')}
                    value={String(field.formFieldColumns.length)}
                    tone={field.formFieldColumns.length > 0 ? 'primary' : 'warning'}
                  />
                  {fieldRequirements.requiresTableRows && (
                    <ConfigLine
                      label={t('admin.forms.detail.rows')}
                      value={String(field.formFieldRows.length)}
                      tone={field.formFieldRows.length > 0 ? 'primary' : 'warning'}
                    />
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ColumnsIcon />}
                    onClick={() => setTableDialogOpen(true)}
                    sx={{
                      borderRadius: '8px',
                      fontWeight: 700,
                      textTransform: 'none',
                      mt: 0.25,
                      maxWidth: '100%',
                      height: 'auto',
                      py: 0.75,
                      lineHeight: 1.3,
                      whiteSpace: 'normal',
                      textAlign: 'left',
                    }}
                  >
                    {fieldRequirements.requiresTableRows ? t('admin.forms.detail.configureGrid') : t('admin.forms.detail.configureColumns')}
                  </Button>
                </>
              )}
              {fieldRequirements?.controlKey === ControlKeys.Label && (
                <ConfigLine label={t('admin.forms.detail.display')} value={loc(field.placeholderEn, field.placeholderAr) || '—'} tone="primary" />
              )}
              {fieldRequirements?.showKpiField === true && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<FrequencyIcon />}
                  onClick={() => setFrequencyDialogOpen(true)}
                  sx={{
                    borderRadius: '8px',
                    fontWeight: 700,
                    textTransform: 'none',
                    maxWidth: '100%',
                    height: 'auto',
                    py: 0.75,
                    lineHeight: 1.3,
                    whiteSpace: 'normal',
                    textAlign: 'left',
                  }}
                >
                  {field.frequency !== null ? t('admin.forms.detail.manageFrequency') : t('admin.forms.detail.assignFrequency')}
                </Button>
              )}
            </Stack>
          ) : (
            <Typography variant="caption" color="text.disabled" fontWeight={700}>
              —
            </Typography>
          )}
        </TableCell>

        {/* Dependency rules */}
        <TableCell sx={{ minWidth: 148 }}>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <DependenciesIcon
              sx={{
                fontSize: 16,
                color: field.fieldDependencies.length > 0 ? ADMIN_ACCENT : 'text.disabled',
              }}
            />
            <Typography
              variant="caption"
              fontWeight={800}
              color={field.fieldDependencies.length > 0 ? ADMIN_ACCENT : 'text.disabled'}
            >
              {t('admin.forms.detail.rulesActive', { count: field.fieldDependencies.length })}
            </Typography>
          </Stack>
        </TableCell>

        {/* Flags already stored on the field */}
        <TableCell sx={{ minWidth: 120 }}>
          <Stack spacing={0.75} alignItems="flex-start">
            <Chip
              label={field.isActive ? t('admin.status.active') : t('admin.status.inactive')}
              size="small"
              sx={{
                height: 22,
                fontWeight: 800,
                fontSize: 10,
                borderRadius: '6px',
                bgcolor: field.isActive
                  ? alpha(theme.palette.success.main, 0.12)
                  : alpha(theme.palette.error.main, 0.1),
                color: field.isActive ? 'success.main' : 'error.main',
                border: field.isActive ? 'none' : `1px solid ${alpha(theme.palette.error.main, 0.35)}`,
              }}
            />
            {field.isRequired && (
              <Chip
                label={t('admin.common.required')}
                size="small"
                sx={{
                  height: 22,
                  fontSize: 10,
                  fontWeight: 800,
                  borderRadius: '6px',
                  bgcolor: alpha(theme.palette.warning.main, 0.12),
                  color: 'warning.dark',
                }}
              />
            )}
            {field.isReadOnly && (
              <Chip
                label={t('admin.status.readOnly')}
                size="small"
                sx={{
                  height: 22,
                  fontSize: 10,
                  fontWeight: 800,
                  borderRadius: '6px',
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.main,
                }}
              />
            )}
            {!field.isVisible && (
              <Chip
                label={t('admin.status.hidden')}
                size="small"
                sx={{
                  height: 22,
                  fontSize: 10,
                  fontWeight: 800,
                  borderRadius: '6px',
                  bgcolor: alpha(theme.palette.text.primary, 0.06),
                  color: 'text.secondary',
                }}
              />
            )}
          </Stack>
        </TableCell>

        {/* Row actions stay visible when the table scrolls sideways */}
        <TableCell
          align="right"
          sx={{
            width: 96,
            whiteSpace: 'nowrap',
            position: 'sticky',
            right: 0,
            zIndex: 1,
            borderLeft: '1px solid',
            borderLeftColor: alpha(theme.palette.divider, 0.12),
          }}
        >
          <Stack direction="row" spacing={0.75} justifyContent="flex-end">
            <RowAction label={t('admin.forms.detail.editField')} tone="accent" onClick={() => setEditFieldOpen(true)}>
              <EditIcon sx={{ fontSize: 16 }} />
            </RowAction>
            <RowAction label={t('admin.forms.detail.deleteField')} tone="danger" onClick={() => setConfirmRemoveFieldOpen(true)}>
              <DeleteIcon sx={{ fontSize: 16 }} />
            </RowAction>
          </Stack>
        </TableCell>
      </TableRow>

      {editFieldOpen && (
        <EditFieldDialog
          formId={formId}
          field={field}
          onClose={() => setEditFieldOpen(false)}
        />
      )}

      {tableDialogOpen && (
        <ManageTableStructureDialog
          formId={formId}
          field={field}
          onClose={() => setTableDialogOpen(false)}
        />
      )}

      {frequencyDialogOpen && (
        <ManageFieldFrequencyDialog
          formId={formId}
          field={field}
          onClose={() => setFrequencyDialogOpen(false)}
        />
      )}

      {calculationDialogOpen && (
        <SetCalculationDialog
          formId={formId}
          field={field}
          onClose={() => setCalculationDialogOpen(false)}
        />
      )}

      {/* Confirm remove field dialog */}
      <Dialog
        open={confirmRemoveFieldOpen}
        onClose={() => setConfirmRemoveFieldOpen(false)}
        maxWidth="xs"
        fullWidth
        TransitionComponent={Fade}
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle sx={{ p: 3, pb: 2 }}>
          <Typography variant="h6" fontWeight={800} color="error.main">{t('admin.forms.detail.deleteTitle')}</Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            {t('admin.forms.detail.deleteBody', { name: loc(field.labelEn, field.labelAr) })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setConfirmRemoveFieldOpen(false)} variant="contained" color="inherit" sx={{ borderRadius: '12px', bgcolor: 'action.hover', fontWeight: 700 }}>{t('admin.common.cancel')}</Button>
          <Button
            onClick={handleRemoveField}
            variant="contained"
            disableElevation
            color="error"
            disabled={removeField.isPending}
            sx={{ borderRadius: '12px', fontWeight: 700, px: 4 }}
          >
            {removeField.isPending ? '...' : t('admin.common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// ─── FormDetail page ──────────────────────────────────────────────────────────

const FormDetail: React.FC = () => {
  const { formId: formIdParam } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { t, loc, isAr } = useLocale();

  const formId = formIdParam !== undefined ? parseInt(formIdParam, 10) : 0;
  const { data: form, isLoading, isError, refetch, isFetching } = useAdminFormDetail(formId);

  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);

  if (isLoading) {
    return (
      <AdminLayout title={t('admin.forms.detail.eyebrow')}>
        <LoadingState label={t('admin.forms.detail.loading')} />
      </AdminLayout>
    );
  }

  if (isError || form === undefined) {
    return (
      <AdminLayout title={t('admin.forms.detail.eyebrow')}>
        <ErrorState title={t('admin.forms.detail.error')} onRetry={() => void refetch()} />
      </AdminLayout>
    );
  }

  const fields = form.formFields ?? [];
  const filteredFields = isActiveFilter === undefined
    ? fields
    : fields.filter((field) => field.isActive === isActiveFilter);

  const maxFieldOrder = fields.length > 0
    ? Math.max(...fields.map((f) => f.displayOrder))
    : 0;

  // Shared header cell style for the fields table.
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
  };

  return (
    <AdminLayout title={loc(form.nameEn, form.nameAr)}>
      <Box sx={{ width: '100%', maxWidth: 1360 }}>
        <PageHeader
          icon={<FormIcon />}
          tone="violet"
          eyebrow={t('admin.forms.detail.eyebrow')}
          title={loc(form.nameEn, form.nameAr)}
          subtitle={
            <Box component="span" sx={{ direction: isAr ? 'ltr' : 'rtl', display: 'block' }}>
              {isAr ? form.nameEn : form.nameAr}
            </Box>
          }
          leading={
            <IconButton
              onClick={() => navigate('/admin/forms')}
              aria-label={t('admin.forms.detail.back')}
              sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
            >
              <BackIcon />
            </IconButton>
          }
          meta={<StatusPill active={form.isActive} />}
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
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddFieldOpen(true)}>
                {t('admin.forms.detail.addField')}
              </Button>
            </Stack>
          }
        />

        {/* Form properties, laid out beside the table instead of a sidebar */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '220px 260px minmax(0, 1fr)' },
            gap: 2,
            mb: 3,
          }}
        >
          <SummaryCard label={t('admin.forms.detail.status')}>
            <Chip
              label={form.isActive ? t('admin.forms.detail.published') : t('admin.forms.detail.draft')}
              size="small"
              sx={{
                height: 28,
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: 10,
                bgcolor: form.isActive ? alpha(theme.palette.success.main, 0.12) : alpha(theme.palette.text.primary, 0.06),
                color: form.isActive ? 'success.main' : 'text.disabled',
              }}
            />
          </SummaryCard>

          <SummaryCard label={t('admin.forms.detail.version')}>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.main,
                }}
              >
                <VersionIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={800}>
                  v{form.version}.0
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {t('admin.forms.detail.updated', { date: new Date(form.createdAt).toLocaleDateString() })}
                </Typography>
              </Box>
            </Stack>
          </SummaryCard>

          <SummaryCard label={t('admin.forms.detail.description')}>
            <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ lineHeight: 1.6 }}>
              {loc(form.descriptionEn, form.descriptionAr) || t('admin.forms.detail.noDescription')}
            </Typography>
          </SummaryCard>
        </Box>

        {/* Fields table */}
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
            <Box>
              <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                {t('admin.forms.detail.fields')}
              </Typography>
              <Typography variant="caption" color="text.disabled" fontWeight={800} sx={{ letterSpacing: '0.04em' }}>
                {t('admin.forms.detail.autosave')}
              </Typography>
            </Box>
            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select
                  value={isActiveFilter === undefined ? '' : String(isActiveFilter)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setIsActiveFilter(val === '' ? undefined : val === 'true');
                  }}
                  displayEmpty
                  startAdornment={<FilterIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
                  sx={{
                    borderRadius: '10px',
                    bgcolor: 'background.paper',
                    fontWeight: 600,
                    fontSize: 13,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'divider',
                    },
                  }}
                >
                  <MenuItem value="" sx={{ fontWeight: 600 }}>{t('admin.status.all')}</MenuItem>
                  <MenuItem value="true" sx={{ fontWeight: 600 }}>{t('admin.status.activeOnly')}</MenuItem>
                  <MenuItem value="false" sx={{ fontWeight: 600 }}>{t('admin.status.inactiveOnly')}</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ letterSpacing: '0.04em' }}>
                {isActiveFilter === undefined
                  ? t('admin.forms.detail.totalElements', { count: fields.length })
                  : t('admin.forms.detail.filteredElements', { found: filteredFields.length, total: fields.length })}
              </Typography>
            </Stack>
          </Stack>

          {fields.length === 0 ? (
            <Box sx={{ px: 3, py: 10, textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: alpha(theme.palette.text.primary, 0.05),
                  color: 'text.disabled',
                  mx: 'auto',
                  mb: 2.5,
                }}
              >
                <FormIcon />
              </Avatar>
              <Typography variant="h6" fontWeight={800} color="text.secondary" gutterBottom>
                {t('admin.forms.detail.emptyTitle')}
              </Typography>
              <Typography variant="body2" color="text.disabled" fontWeight={600} sx={{ mb: 3 }}>
                {t('admin.forms.detail.emptyBody')}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setAddFieldOpen(true)}
                sx={{ borderRadius: '12px', fontWeight: 700, px: 4, borderColor: ADMIN_ACCENT, color: ADMIN_ACCENT }}
              >
                {t('admin.forms.detail.addFirst')}
              </Button>
            </Box>
          ) : (
            <TableContainer sx={{ overflowX: 'auto', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
              <Table sx={{ width: '100%', '& .MuiTableCell-root': { px: 1.5 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...headerCellSx, width: 56 }}>{t('admin.forms.detail.col.order')}</TableCell>
                    <TableCell sx={headerCellSx}>{t('admin.forms.detail.col.field')}</TableCell>
                    <TableCell sx={headerCellSx}>{t('admin.forms.detail.col.control')}</TableCell>
                    <TableCell sx={headerCellSx}>{t('admin.forms.detail.col.config')}</TableCell>
                    <TableCell sx={headerCellSx}>{t('admin.forms.detail.col.rules')}</TableCell>
                    <TableCell sx={headerCellSx}>{t('admin.common.status')}</TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        ...headerCellSx,
                        width: 96,
                        position: 'sticky',
                        right: 0,
                        zIndex: 3,
                        bgcolor: 'background.paper',
                        borderLeft: '1px solid',
                        borderLeftColor: alpha(theme.palette.divider, 0.12),
                      }}
                    >
                      {t('admin.common.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredFields.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 8, borderBottom: 0 }}>
                        <Typography variant="h6" fontWeight={800} color="text.secondary" gutterBottom>
                          {t('admin.forms.detail.noMatchTitle')}
                        </Typography>
                        <Typography variant="body2" color="text.disabled" fontWeight={600}>
                          {t('admin.forms.detail.noMatchBody')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    [...filteredFields]
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((field) => (
                        <FieldCard key={field.fieldId} formId={form.formId} field={field} />
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      {/* Add field dialog */}
      {addFieldOpen && (
        <AddFieldDialog
          formId={form.formId}
          currentMaxOrder={maxFieldOrder}
          inheritedFrequencyName={form.frequency !== undefined ? loc(form.frequency.nameEn, form.frequency.nameAr) : null}
          onClose={() => setAddFieldOpen(false)}
        />
      )}
    </AdminLayout>
  );
};

export default FormDetail;
