import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  alpha,
  Fade,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useUpdateField } from '../../../../core/hooks/admin/useAdminForms';
import { useAdminControlTypes, useAdminDataTypes, useAdminFrequencies, useAdminLookupTypes } from '../../../../core/hooks/admin/useAdminLookups';
import { ADMIN_ACCENT } from '../../shared/theme/adminTokens';
import { ControlKeys } from '../../../../core/enums/control-keys.enum';
import type { AdminFormField, UpdateFieldRequest } from '../../../../core/types/admin/adminForms';
import {
  formatControlTypeLabel,
  getControlRequirements,
  isLookupRequired,
} from './controlFieldRequirements';
import RegexPatternSelect from './RegexPatternSelect';
import type { RegexPatternPreset } from './regexPatterns';
import { frequencySupportsCustomPeriodStart, toDateInputValue } from '../../../../core/utils/frequencyPeriods';
import { useLocale } from '../../../../core/hooks/useLocale';

interface EditFieldDialogProps {
  formId: number;
  field: AdminFormField;
  onClose: () => void;
}

const textFieldSx = { borderRadius: '12px', fontWeight: 600 };

const nullableNumberToString = (value: number | null): string =>
  value === null ? '' : String(value);

const nullableStringToString = (value: string | null): string =>
  value ?? '';

const parseOptionalString = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const parseOptionalNumber = (
  value: string,
  fieldName: string,
  errs: Record<string, string>,
): number | undefined => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed)) {
    errs[fieldName] = 'admin.common.validNumber';
    return undefined;
  }
  return parsed;
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

const EditFieldDialog: React.FC<EditFieldDialogProps> = ({ formId, field, onClose }) => {
  const { t, loc } = useLocale();
  const { data: rawControlTypes } = useAdminControlTypes();
  const { data: rawDataTypes } = useAdminDataTypes();
  const { data: rawLookupTypes } = useAdminLookupTypes();
  const { data: rawFrequencies } = useAdminFrequencies();
  const controlTypes = Array.isArray(rawControlTypes) ? rawControlTypes : [];
  const dataTypes = Array.isArray(rawDataTypes) ? rawDataTypes : [];
  const lookupTypes = Array.isArray(rawLookupTypes) ? rawLookupTypes : [];
  const frequencies = Array.isArray(rawFrequencies) ? rawFrequencies : [];
  const updateField = useUpdateField();

  const [labelEn, setLabelEn] = useState(field.labelEn);
  const [labelAr, setLabelAr] = useState(field.labelAr);
  const [displayOrder, setDisplayOrder] = useState(String(field.displayOrder));
  const [isRequired, setIsRequired] = useState(field.isRequired);
  const [isActive, setIsActive] = useState(field.isActive);
  const [minLength, setMinLength] = useState(nullableNumberToString(field.minLength));
  const [maxLength, setMaxLength] = useState(nullableNumberToString(field.maxLength));
  const [regexPattern, setRegexPattern] = useState(nullableStringToString(field.regexPattern));
  const [placeholderEn, setPlaceholderEn] = useState(nullableStringToString(field.placeholderEn));
  const [placeholderAr, setPlaceholderAr] = useState(nullableStringToString(field.placeholderAr));
  const [helpTextEn, setHelpTextEn] = useState(nullableStringToString(field.helpTextEn));
  const [helpTextAr, setHelpTextAr] = useState(nullableStringToString(field.helpTextAr));
  const [validationMessageEn, setValidationMessageEn] = useState(nullableStringToString(field.validationMessageEn));
  const [validationMessageAr, setValidationMessageAr] = useState(nullableStringToString(field.validationMessageAr));
  const [lookupTypeId, setLookupTypeId] = useState<number | ''>(field.lookupTypeId ?? '');
  const [frequencyId, setFrequencyId] = useState<number | ''>(field.frequencyId ?? '');
  const [periodStartDate, setPeriodStartDate] = useState(toDateInputValue(field.periodStartDate));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  const controlReq = getControlRequirements(field.controlTypeId, controlTypes);
  const lookupRequired = isLookupRequired(field.controlTypeId, controlTypes);

  const dataTypeName = dataTypes.find((dt) => dt.dataTypeId === field.dataTypeId)?.typeName
    ?? `Type #${field.dataTypeId}`;

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

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (labelEn.trim().length === 0) {
      errs.labelEn = 'admin.common.required';
    }
    if (labelAr.trim().length === 0) {
      errs.labelAr = 'admin.common.required';
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

    const orderTrimmed = displayOrder.trim();
    if (orderTrimmed.length === 0) {
      errs.displayOrder = 'admin.common.required';
    } else {
      const parsedOrder = Number(orderTrimmed);
      if (Number.isNaN(parsedOrder) || parsedOrder < 1) {
        errs.displayOrder = 'admin.common.positiveNumber';
      }
    }

    const parsedMinLength = parseOptionalNumber(minLength, 'minLength', errs);
    const parsedMaxLength = parseOptionalNumber(maxLength, 'maxLength', errs);

    if (
      parsedMinLength !== undefined &&
      parsedMaxLength !== undefined &&
      parsedMinLength > parsedMaxLength
    ) {
      errs.maxLength = 'admin.forms.field.maxLengthRange';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) {
      return;
    }

    const validationErrs: Record<string, string> = {};
    const parsedMinLength = parseOptionalNumber(minLength, 'minLength', validationErrs);
    const parsedMaxLength = parseOptionalNumber(maxLength, 'maxLength', validationErrs);

    if (Object.keys(validationErrs).length > 0) {
      setErrors((prev) => ({ ...prev, ...validationErrs }));
      return;
    }

    if (lookupRequired && lookupTypeId === '') {
      return;
    }

    const data: UpdateFieldRequest = {
      labelEn: labelEn.trim(),
      labelAr: labelAr.trim(),
      displayOrder: Number(displayOrder.trim()),
      isRequired: controlReq?.forceOptional ? false : isRequired,
      // Keep the stored flags; Label and Calculated fields stay read-only.
      isReadOnly: controlReq?.forceReadOnly ? true : field.isReadOnly,
      isVisible: field.isVisible,
      isActive,
    };

    if (controlReq?.showLengthValidation) {
      if (parsedMinLength !== undefined) {
        data.minLength = parsedMinLength;
      }
      if (parsedMaxLength !== undefined) {
        data.maxLength = parsedMaxLength;
      }
    }

    if (controlReq?.showRegexValidation) {
      const parsedRegex = parseOptionalString(regexPattern);
      if (parsedRegex !== undefined) {
        data.regexPattern = parsedRegex;
      }
    }

    const parsedValidationMessageEn = parseOptionalString(validationMessageEn);
    if (parsedValidationMessageEn !== undefined) {
      data.validationMessageEn = parsedValidationMessageEn;
    }
    const parsedValidationMessageAr = parseOptionalString(validationMessageAr);
    if (parsedValidationMessageAr !== undefined) {
      data.validationMessageAr = parsedValidationMessageAr;
    }

    if (controlReq?.showPlaceholder) {
      const parsedPlaceholderEn = parseOptionalString(placeholderEn);
      if (parsedPlaceholderEn !== undefined) {
        data.placeholderEn = parsedPlaceholderEn;
      }
      const parsedPlaceholderAr = parseOptionalString(placeholderAr);
      if (parsedPlaceholderAr !== undefined) {
        data.placeholderAr = parsedPlaceholderAr;
      }
    }

    if (controlReq?.showContentHelpSection || controlReq?.showHelpTextInValidation) {
      const parsedHelpTextEn = parseOptionalString(helpTextEn);
      if (parsedHelpTextEn !== undefined) {
        data.helpTextEn = parsedHelpTextEn;
      }
      const parsedHelpTextAr = parseOptionalString(helpTextAr);
      if (parsedHelpTextAr !== undefined) {
        data.helpTextAr = parsedHelpTextAr;
      }
    }

    if (controlReq?.requiresLookup && lookupTypeId !== '') {
      data.lookupTypeId = Number(lookupTypeId);
    }
    if (frequencyId !== '') {
      data.frequencyId = Number(frequencyId);
      const selectedFrequency = frequencies.find((item) => item.frequencyId === Number(frequencyId));
      if (frequencySupportsCustomPeriodStart(selectedFrequency)) {
        data.periodStartDate = periodStartDate.trim().length > 0 ? periodStartDate : null;
      }
    }

    try {
      await updateField.mutateAsync({ formId, fieldId: field.fieldId, data });
      onClose();
    } catch {
      setSubmitError(t('admin.forms.field.updateError'));
    }
  };

  const errText = (fieldName: string): string | undefined => {
    const key = errors[fieldName];
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
          {t('admin.forms.field.editTitle')}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ bgcolor: 'action.hover' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, maxHeight: '70vh' }}>
        <Box component="form" id="edit-field-form" onSubmit={handleSubmit} noValidate sx={{ py: 1 }}>
          <Stack spacing={3}>
            <FieldSection title={t('admin.forms.field.identity')}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label={t('admin.forms.field.fieldKey')}
                  value={field.fieldKey}
                  fullWidth
                  size="small"
                  disabled
                  InputProps={{ sx: textFieldSx }}
                />
                <TextField
                  label={t('admin.forms.field.controlType')}
                  value={formatControlTypeLabel(field.controlTypeId, controlTypes)}
                  fullWidth
                  size="small"
                  disabled
                  InputProps={{ sx: textFieldSx }}
                />
                <TextField
                  label={t('admin.forms.field.dataType')}
                  value={dataTypeName}
                  fullWidth
                  size="small"
                  disabled
                  InputProps={{ sx: textFieldSx }}
                />
              </Stack>
              {controlReq !== null && (
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '12px', bgcolor: alpha(ADMIN_ACCENT, 0.06), borderColor: alpha(ADMIN_ACCENT, 0.2) }}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    {t(controlReq.hint)}
                  </Typography>
                </Paper>
              )}
            </FieldSection>

            <Divider sx={{ borderStyle: 'dashed' }} />

            <FieldSection title={t('admin.forms.field.basic')}>
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
              <TextField
                label={t('admin.forms.field.displayOrder')}
                value={displayOrder}
                onChange={(e) => { setDisplayOrder(e.target.value); clearError('displayOrder'); }}
                error={Boolean(errors.displayOrder)}
                helperText={errText('displayOrder')}
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
                    control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
                    label={<Typography variant="body2" fontWeight={700}>{t('admin.forms.field.active')}</Typography>}
                  />
                </Stack>
              </Paper>
            </FieldSection>

            {controlReq?.requiresLookup && (
              <>
                <Divider sx={{ borderStyle: 'dashed' }} />
                <FieldSection title={t('admin.forms.field.lookup')}>
                  <FormControl size="small" fullWidth required error={Boolean(errors.lookupTypeId)}>
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
                  {controlReq.showLengthValidation && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField
                        label={t('admin.forms.field.minLength')}
                        value={minLength}
                        onChange={(e) => { setMinLength(e.target.value); clearError('minLength'); clearError('maxLength'); }}
                        error={Boolean(errors.minLength)}
                        helperText={errText('minLength') ?? t('admin.common.optional')}
                        fullWidth
                        size="small"
                        type="number"
                        inputProps={{ min: 0 }}
                        InputProps={{ sx: textFieldSx }}
                      />
                      <TextField
                        label={t('admin.forms.field.maxLength')}
                        value={maxLength}
                        onChange={(e) => { setMaxLength(e.target.value); clearError('maxLength'); }}
                        error={Boolean(errors.maxLength)}
                        helperText={errText('maxLength') ?? t('admin.common.optional')}
                        fullWidth
                        size="small"
                        type="number"
                        inputProps={{ min: 0 }}
                        InputProps={{ sx: textFieldSx }}
                      />
                    </Stack>
                  )}
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
                        {t('admin.forms.field.leaveUnchanged')}
                      </MenuItem>
                      {frequencies.map((item) => (
                        <MenuItem key={item.frequencyId} value={item.frequencyId} sx={{ fontWeight: 600 }}>
                          {loc(item.nameEn, item.nameAr)}
                          {item.hasDiscretePeriods ? ` · ${t('admin.forms.frequency.discrete')}` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75, display: 'block' }}>
                      {field.frequency !== null
                        ? t('admin.forms.frequency.current', { name: loc(field.frequency.nameEn, field.frequency.nameAr) })
                        : t('admin.common.optional')}
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
                      helperText={t('admin.forms.field.periodStartHintReset')}
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
          form="edit-field-form"
          variant="contained"
          disableElevation
          disabled={updateField.isPending}
          sx={{ borderRadius: '12px', fontWeight: 700, textTransform: 'none', px: 4 }}
        >
          {updateField.isPending ? t('admin.common.saving') : t('admin.forms.field.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditFieldDialog;
