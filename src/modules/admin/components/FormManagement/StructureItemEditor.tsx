import React, { useState } from 'react';
import {
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useLocale } from '../../../../core/hooks/useLocale';

/** Properties of a column/row that can be edited in place (matches UpdateColumnRequest / UpdateRowRequest). */
export interface StructureItemChanges {
  labelEn?: string;
  labelAr?: string;
  isRequired?: boolean;
}

interface StructureItemEditorProps {
  /** Current saved English label */
  initialLabelEn: string;
  /** Current saved Arabic label (empty string when the API returned null) */
  initialLabelAr: string;
  /** Current saved required flag (null is treated as false) */
  initialIsRequired: boolean | null;
  /** Show the Required checkbox (TABLE columns and RAW_TABLE rows only) */
  showRequired: boolean;
  /** Maximum label length enforced by the API (200 for columns, 300 for rows) */
  maxLabelLength: number;
  /** True while the PATCH request is in flight */
  isSaving: boolean;
  /** Error message from the last failed save, if any */
  errorMessage: string | null;
  /** Called with ONLY the properties that changed (the API rejects an empty body) */
  onSave: (changes: StructureItemChanges) => void;
  onCancel: () => void;
}

const textFieldSx = { borderRadius: '12px', fontWeight: 600 };

/**
 * Inline editor for an existing column or row.
 * Edits the English/Arabic labels and (optionally) the required flag, and
 * reports only the changed properties back to the parent.
 */
const StructureItemEditor: React.FC<StructureItemEditorProps> = ({
  initialLabelEn,
  initialLabelAr,
  initialIsRequired,
  showRequired,
  maxLabelLength,
  isSaving,
  errorMessage,
  onSave,
  onCancel,
}) => {
  const { t } = useLocale();
  const [labelEn, setLabelEn] = useState(initialLabelEn);
  const [labelAr, setLabelAr] = useState(initialLabelAr);
  const [isRequired, setIsRequired] = useState(initialIsRequired === true);

  // Trimmed values are what the API stores, so compare against those
  const trimmedEn = labelEn.trim();
  const trimmedAr = labelAr.trim();

  /** Per-field validation messages (empty string = valid) */
  const errorEn = trimmedEn.length === 0
    ? t('admin.common.required')
    : trimmedEn.length > maxLabelLength ? t('admin.common.maxChars', { count: maxLabelLength }) : '';
  const errorAr = trimmedAr.length === 0
    ? t('admin.common.required')
    : trimmedAr.length > maxLabelLength ? t('admin.common.maxChars', { count: maxLabelLength }) : '';

  /** Build the partial body from only the values that differ from the saved ones */
  const buildChanges = (): StructureItemChanges => {
    const changes: StructureItemChanges = {};
    if (trimmedEn !== initialLabelEn.trim()) changes.labelEn = trimmedEn;
    if (trimmedAr !== initialLabelAr.trim()) changes.labelAr = trimmedAr;
    if (showRequired && isRequired !== (initialIsRequired === true)) {
      changes.isRequired = isRequired;
    }
    return changes;
  };

  const changes = buildChanges();
  const hasChanges = Object.keys(changes).length > 0;
  const hasErrors = errorEn !== '' || errorAr !== '';

  const handleSave = (): void => {
    // Guard: never send an empty or invalid body
    if (!hasChanges || hasErrors) return;
    onSave(changes);
  };

  return (
    <Stack spacing={1.5} sx={{ width: '100%' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label={t('admin.forms.field.labelEn')}
          value={labelEn}
          onChange={(e) => setLabelEn(e.target.value)}
          error={errorEn !== ''}
          helperText={errorEn}
          fullWidth
          size="small"
          required
          InputProps={{ sx: textFieldSx }}
        />
        <TextField
          label={t('admin.forms.field.labelAr')}
          value={labelAr}
          onChange={(e) => setLabelAr(e.target.value)}
          error={errorAr !== ''}
          helperText={errorAr}
          fullWidth
          size="small"
          required
          inputProps={{ dir: 'rtl' }}
          InputProps={{ sx: textFieldSx }}
        />
      </Stack>

      {showRequired && (
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
            />
          }
          label={<Typography variant="body2" fontWeight={600}>{t('admin.common.required')}</Typography>}
          sx={{ alignSelf: 'flex-start', ml: 0 }}
        />
      )}

      {/* Server-side error from the last save attempt */}
      {errorMessage !== null && (
        <Typography variant="caption" color="error">
          {errorMessage}
        </Typography>
      )}

      <Stack direction="row" spacing={1}>
        <Button
          variant="contained"
          size="small"
          onClick={handleSave}
          disabled={isSaving || !hasChanges || hasErrors}
          sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none' }}
        >
          {t('admin.common.save')}
        </Button>
        <Button
          variant="text"
          size="small"
          onClick={onCancel}
          disabled={isSaving}
          sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none' }}
        >
          {t('admin.common.cancel')}
        </Button>
      </Stack>
    </Stack>
  );
};

export default StructureItemEditor;
