import React from 'react';
import {
  Box,
  Button,
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
  useTheme,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ADMIN_ACCENT } from '../../shared/theme/adminTokens';
import type { ControlType, DataType } from '../../../../core/types/admin/adminLookups';
import type { CalculationConfigDraft, CalculationInputDraft } from './calculationConfig.utils';
import { createCalculationInputDraft } from './calculationConfig.utils';
import { useLocale } from '../../../../core/hooks/useLocale';

interface CalculationConfigFieldsProps {
  config: CalculationConfigDraft;
  errors: Record<string, string>;
  dataTypes: DataType[];
  controlTypes: ControlType[];
  onChange: (nextConfig: CalculationConfigDraft) => void;
  onClearError: (field: string) => void;
}

const textFieldSx = { borderRadius: '12px', fontWeight: 600 };

const CalculationConfigFields: React.FC<CalculationConfigFieldsProps> = ({
  config,
  errors,
  dataTypes,
  controlTypes,
  onChange,
  onClearError,
}) => {
  const theme = useTheme();
  const { t } = useLocale();

  const errText = (field: string): string | undefined => {
    const key = errors[field];
    return key !== undefined && key !== '' ? t(key) : undefined;
  };

  const updateConfig = (partial: Partial<CalculationConfigDraft>): void => {
    onChange({ ...config, ...partial });
  };

  const updateInput = (clientId: string, partial: Partial<CalculationInputDraft>): void => {
    updateConfig({
      inputs: config.inputs.map((input) =>
        input.clientId === clientId ? { ...input, ...partial } : input,
      ),
    });
  };

  const addInput = (): void => {
    const nextIndex = config.inputs.length;
    const nextToken = String.fromCharCode(65 + nextIndex);
    const defaultDataTypeId = config.resultDataTypeId;
    const defaultControlTypeId = config.resultControlTypeId;

    updateConfig({
      inputs: [
        ...config.inputs,
        createCalculationInputDraft(
          nextToken,
          `VALUE_${nextToken}`,
          `Value ${nextToken}`,
          `القيمة ${nextToken}`,
          defaultDataTypeId,
          defaultControlTypeId,
          `input-${Date.now()}-${nextIndex}`,
        ),
      ],
    });
  };

  const removeInput = (clientId: string): void => {
    if (config.inputs.length <= 1) {
      return;
    }
    updateConfig({
      inputs: config.inputs.filter((input) => input.clientId !== clientId),
    });
  };

  return (
    <Stack spacing={2.5}>
      <TextField
        label={t('admin.forms.calc.formula')}
        value={config.formulaExpression}
        onChange={(e) => {
          updateConfig({ formulaExpression: e.target.value });
          onClearError('formulaExpression');
        }}
        error={Boolean(errors.formulaExpression)}
        helperText={errText('formulaExpression') ?? t('admin.forms.calc.formulaHint')}
        fullWidth
        size="small"
        required
        InputProps={{ sx: textFieldSx }}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label={t('admin.forms.calc.displayEn')}
          value={config.displayFormulaEn}
          onChange={(e) => updateConfig({ displayFormulaEn: e.target.value })}
          helperText={t('admin.forms.calc.displayHint')}
          fullWidth
          size="small"
          InputProps={{ sx: textFieldSx }}
        />
        <TextField
          label={t('admin.forms.calc.displayAr')}
          value={config.displayFormulaAr}
          onChange={(e) => updateConfig({ displayFormulaAr: e.target.value })}
          helperText={t('admin.common.optional')}
          fullWidth
          size="small"
          inputProps={{ dir: 'rtl' }}
          InputProps={{ sx: textFieldSx }}
        />
      </Stack>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
        {t('admin.forms.calc.resultOutput')}
      </Typography>

      <TextField
        label={t('admin.forms.calc.resultKey')}
        value={config.resultColumnKey}
        onChange={(e) => {
          updateConfig({ resultColumnKey: e.target.value });
          onClearError('resultColumnKey');
        }}
        error={Boolean(errors.resultColumnKey)}
        helperText={errText('resultColumnKey') ?? t('admin.forms.calc.resultKeyHint')}
        fullWidth
        size="small"
        required
        InputProps={{ sx: textFieldSx }}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label={t('admin.forms.calc.resultLabelEn')}
          value={config.resultLabelEn}
          onChange={(e) => {
            updateConfig({ resultLabelEn: e.target.value });
            onClearError('resultLabelEn');
          }}
          error={Boolean(errors.resultLabelEn)}
          helperText={errText('resultLabelEn')}
          fullWidth
          size="small"
          required
          InputProps={{ sx: textFieldSx }}
        />
        <TextField
          label={t('admin.forms.calc.resultLabelAr')}
          value={config.resultLabelAr}
          onChange={(e) => {
            updateConfig({ resultLabelAr: e.target.value });
            onClearError('resultLabelAr');
          }}
          error={Boolean(errors.resultLabelAr)}
          helperText={errText('resultLabelAr')}
          fullWidth
          size="small"
          required
          inputProps={{ dir: 'rtl' }}
          InputProps={{ sx: textFieldSx }}
        />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <FormControl size="small" fullWidth required error={Boolean(errors.resultDataTypeId)}>
          <InputLabel>{t('admin.forms.calc.resultDataType')}</InputLabel>
          <Select
            value={config.resultDataTypeId}
            label={t('admin.forms.calc.resultDataType')}
            onChange={(e) => {
              updateConfig({ resultDataTypeId: e.target.value as number | '' });
              onClearError('resultDataTypeId');
            }}
            sx={{ borderRadius: '12px' }}
          >
            {dataTypes.map((dataType) => (
              <MenuItem key={dataType.dataTypeId} value={dataType.dataTypeId} sx={{ fontWeight: 600 }}>
                {dataType.typeName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth required error={Boolean(errors.resultControlTypeId)}>
          <InputLabel>{t('admin.forms.calc.resultControlType')}</InputLabel>
          <Select
            value={config.resultControlTypeId}
            label={t('admin.forms.calc.resultControlType')}
            onChange={(e) => {
              updateConfig({ resultControlTypeId: e.target.value as number | '' });
              onClearError('resultControlTypeId');
            }}
            sx={{ borderRadius: '12px' }}
          >
            {controlTypes.map((controlType) => (
              <MenuItem key={controlType.controlTypeId} value={controlType.controlTypeId} sx={{ fontWeight: 600 }}>
                {controlType.controlName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label={t('admin.forms.calc.resultPrecision')}
          value={config.resultPrecision}
          onChange={(e) => {
            updateConfig({ resultPrecision: e.target.value });
            onClearError('resultPrecision');
          }}
          error={Boolean(errors.resultPrecision)}
          helperText={errText('resultPrecision') ?? t('admin.forms.calc.precisionHint')}
          fullWidth
          size="small"
          required
          type="number"
          inputProps={{ min: 0 }}
          InputProps={{ sx: textFieldSx }}
        />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label={t('admin.forms.calc.buttonEn')}
          value={config.buttonLabelEn}
          onChange={(e) => {
            updateConfig({ buttonLabelEn: e.target.value });
            onClearError('buttonLabelEn');
          }}
          error={Boolean(errors.buttonLabelEn)}
          helperText={errText('buttonLabelEn')}
          fullWidth
          size="small"
          required
          InputProps={{ sx: textFieldSx }}
        />
        <TextField
          label={t('admin.forms.calc.buttonAr')}
          value={config.buttonLabelAr}
          onChange={(e) => {
            updateConfig({ buttonLabelAr: e.target.value });
            onClearError('buttonLabelAr');
          }}
          error={Boolean(errors.buttonLabelAr)}
          helperText={errText('buttonLabelAr')}
          fullWidth
          size="small"
          required
          inputProps={{ dir: 'rtl' }}
          InputProps={{ sx: textFieldSx }}
        />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label={t('admin.forms.calc.helpEn')}
          value={config.helpTextEn}
          onChange={(e) => updateConfig({ helpTextEn: e.target.value })}
          helperText={t('admin.common.optional')}
          fullWidth
          size="small"
          multiline
          rows={2}
          InputProps={{ sx: { borderRadius: '12px' } }}
        />
        <TextField
          label={t('admin.forms.calc.helpAr')}
          value={config.helpTextAr}
          onChange={(e) => updateConfig({ helpTextAr: e.target.value })}
          helperText={t('admin.common.optional')}
          fullWidth
          size="small"
          multiline
          rows={2}
          inputProps={{ dir: 'rtl' }}
          InputProps={{ sx: { borderRadius: '12px' } }}
        />
      </Stack>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
          {t('admin.forms.calc.inputs', { count: config.inputs.length })}
        </Typography>
        <Button
          size="small"
          variant="text"
          startIcon={<AddIcon />}
          onClick={addInput}
          sx={{ fontSize: 11, fontWeight: 800, color: ADMIN_ACCENT }}
        >
          {t('admin.forms.calc.addInput')}
        </Button>
      </Stack>

      {errors.calculationInputs !== undefined && errors.calculationInputs !== '' && (
        <Typography variant="caption" color="error">
          {t(errors.calculationInputs)}
        </Typography>
      )}

      <Stack spacing={1.5}>
        {config.inputs.map((input, index) => {
          const errorPrefix = `calculationInputs.${index}`;
          return (
            <Paper
              key={input.clientId}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: alpha(theme.palette.primary.main, 0.02),
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Typography variant="caption" fontWeight={800} color="text.secondary">
                  {t('admin.forms.calc.inputN', { n: index + 1 })}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => removeInput(input.clientId)}
                  disabled={config.inputs.length <= 1}
                  sx={{ color: 'error.light' }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>

              <Stack spacing={1.5}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label={t('admin.forms.calc.token')}
                    value={input.inputToken}
                    onChange={(e) => {
                      updateInput(input.clientId, { inputToken: e.target.value });
                      onClearError(`${errorPrefix}.inputToken`);
                    }}
                    error={Boolean(errors[`${errorPrefix}.inputToken`])}
                    helperText={errText(`${errorPrefix}.inputToken`) ?? t('admin.forms.calc.tokenHint')}
                    fullWidth
                    size="small"
                    required
                    InputProps={{ sx: textFieldSx }}
                  />
                  <TextField
                    label={t('admin.forms.calc.columnKey')}
                    value={input.columnKey}
                    onChange={(e) => {
                      updateInput(input.clientId, { columnKey: e.target.value });
                      onClearError(`${errorPrefix}.columnKey`);
                    }}
                    error={Boolean(errors[`${errorPrefix}.columnKey`])}
                    helperText={errText(`${errorPrefix}.columnKey`)}
                    fullWidth
                    size="small"
                    required
                    InputProps={{ sx: textFieldSx }}
                  />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label={t('admin.forms.field.labelEn')}
                    value={input.labelEn}
                    onChange={(e) => {
                      updateInput(input.clientId, { labelEn: e.target.value });
                      onClearError(`${errorPrefix}.labelEn`);
                    }}
                    error={Boolean(errors[`${errorPrefix}.labelEn`])}
                    helperText={errText(`${errorPrefix}.labelEn`)}
                    fullWidth
                    size="small"
                    required
                    InputProps={{ sx: textFieldSx }}
                  />
                  <TextField
                    label={t('admin.forms.field.labelAr')}
                    value={input.labelAr}
                    onChange={(e) => {
                      updateInput(input.clientId, { labelAr: e.target.value });
                      onClearError(`${errorPrefix}.labelAr`);
                    }}
                    error={Boolean(errors[`${errorPrefix}.labelAr`])}
                    helperText={errText(`${errorPrefix}.labelAr`)}
                    fullWidth
                    size="small"
                    required
                    inputProps={{ dir: 'rtl' }}
                    InputProps={{ sx: textFieldSx }}
                  />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                  <FormControl size="small" fullWidth required error={Boolean(errors[`${errorPrefix}.dataTypeId`])}>
                    <InputLabel>{t('admin.forms.field.dataType')}</InputLabel>
                    <Select
                      value={input.dataTypeId}
                      label={t('admin.forms.field.dataType')}
                      onChange={(e) => {
                        updateInput(input.clientId, { dataTypeId: e.target.value as number | '' });
                        onClearError(`${errorPrefix}.dataTypeId`);
                      }}
                      sx={{ borderRadius: '12px' }}
                    >
                      {dataTypes.map((dataType) => (
                        <MenuItem key={dataType.dataTypeId} value={dataType.dataTypeId} sx={{ fontWeight: 600 }}>
                          {dataType.typeName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth required error={Boolean(errors[`${errorPrefix}.controlTypeId`])}>
                    <InputLabel>{t('admin.forms.field.controlType')}</InputLabel>
                    <Select
                      value={input.controlTypeId}
                      label={t('admin.forms.field.controlType')}
                      onChange={(e) => {
                        updateInput(input.clientId, { controlTypeId: e.target.value as number | '' });
                        onClearError(`${errorPrefix}.controlTypeId`);
                      }}
                      sx={{ borderRadius: '12px' }}
                    >
                      {controlTypes.map((controlType) => (
                        <MenuItem key={controlType.controlTypeId} value={controlType.controlTypeId} sx={{ fontWeight: 600 }}>
                          {controlType.controlName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box sx={{ minWidth: 140 }}>
                    <FormControlLabel
                      control={(
                        <Switch
                          checked={input.isRequired}
                          onChange={(e) => updateInput(input.clientId, { isRequired: e.target.checked })}
                          size="small"
                        />
                      )}
                      label={<Typography variant="caption" fontWeight={700}>{t('admin.common.required')}</Typography>}
                    />
                  </Box>
                </Stack>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Stack>
  );
};

export default CalculationConfigFields;
