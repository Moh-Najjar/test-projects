import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
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
  TextField,
  Typography,
  alpha,
  useTheme,
  Fade,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import {
  useAddColumn,
  useUpdateColumn,
  useRemoveColumn,
  useAddRow,
  useUpdateRow,
  useRemoveRow,
} from '../../../../core/hooks/admin/useAdminForms';
import { useAdminControlTypes, useAdminDataTypes, useAdminLookupTypes } from '../../../../core/hooks/admin/useAdminLookups';
import { ADMIN_ACCENT } from '../../shared/theme/adminTokens';
import { ControlKeys } from '../../../../core/enums/control-keys.enum';
import type { AdminFormField, FieldColumn, FieldRow } from '../../../../core/types/admin/adminForms';
import { isLookupRequired, resolveControlType } from './controlFieldRequirements';
import StructureItemEditor, { StructureItemChanges } from './StructureItemEditor';
import { useLocale } from '../../../../core/hooks/useLocale';

interface ManageTableStructureDialogProps {
  formId: number;
  field: AdminFormField;
  onClose: () => void;
}

const textFieldSx = { borderRadius: '12px', fontWeight: 600 };

const ManageTableStructureDialog: React.FC<ManageTableStructureDialogProps> = ({
  formId,
  field,
  onClose,
}) => {
  const theme = useTheme();
  const { t, loc } = useLocale();
  const { data: rawControlTypes } = useAdminControlTypes();
  const { data: rawDataTypes } = useAdminDataTypes();
  const { data: rawLookupTypes } = useAdminLookupTypes();
  const controlTypes = Array.isArray(rawControlTypes) ? rawControlTypes : [];
  const dataTypes = Array.isArray(rawDataTypes) ? rawDataTypes : [];
  const lookupTypes = Array.isArray(rawLookupTypes) ? rawLookupTypes : [];

  const addColumn = useAddColumn();
  const updateColumn = useUpdateColumn();
  const removeColumn = useRemoveColumn();
  const addRow = useAddRow();
  const updateRow = useUpdateRow();
  const removeRow = useRemoveRow();

  /** Id of the column/row currently being edited inline (only one at a time) */
  const [editingColumnId, setEditingColumnId] = useState<number | null>(null);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);

  /** Opens the editor for a column and closes any other open editor */
  const startEditingColumn = (columnId: number): void => {
    setEditingRowId(null);
    updateColumn.reset();
    setEditingColumnId(columnId);
  };

  /** Opens the editor for a row and closes any other open editor */
  const startEditingRow = (rowId: number): void => {
    setEditingColumnId(null);
    updateRow.reset();
    setEditingRowId(rowId);
  };

  /** Closes whichever inline editor is open */
  const cancelEditing = (): void => {
    setEditingColumnId(null);
    setEditingRowId(null);
  };

  /** Saves the changed column properties, then closes the editor on success */
  const handleUpdateColumn = (columnId: number, changes: StructureItemChanges): void => {
    updateColumn.mutate(
      { formId, fieldId: field.fieldId, columnId, data: changes },
      { onSuccess: () => setEditingColumnId(null) },
    );
  };

  /** Saves the changed row properties, then closes the editor on success */
  const handleUpdateRow = (rowId: number, changes: StructureItemChanges): void => {
    updateRow.mutate(
      { formId, fieldId: field.fieldId, rowId, data: changes },
      { onSuccess: () => setEditingRowId(null) },
    );
  };

  const controlType = resolveControlType(field.controlTypeId, controlTypes);
  const isRawTable = controlType?.controlKey === ControlKeys.RawTable;

  const [columnKey, setColumnKey] = useState('');
  const [columnLabelEn, setColumnLabelEn] = useState('');
  const [columnLabelAr, setColumnLabelAr] = useState('');
  const [columnDataTypeId, setColumnDataTypeId] = useState<number | ''>('');
  const [columnControlTypeId, setColumnControlTypeId] = useState<number | ''>('');
  const [columnLookupTypeId, setColumnLookupTypeId] = useState<number | ''>('');
  /** Whether the new column's cells must be filled in (sent as isRequired); required by default */
  const [columnIsRequired, setColumnIsRequired] = useState(true);
  const [columnErrors, setColumnErrors] = useState<Record<string, string>>({});

  const [rowKey, setRowKey] = useState('');
  const [rowLabelEn, setRowLabelEn] = useState('');
  const [rowLabelAr, setRowLabelAr] = useState('');
  /** Whether the new row's cells must be filled in (RAW_TABLE only); required by default */
  const [rowIsRequired, setRowIsRequired] = useState(true);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const columns = field.formFieldColumns;
  const rows = field.formFieldRows;

  const handleAddColumn = (): void => {
    const errs: Record<string, string> = {};
    if (columnKey.trim().length === 0) errs.columnKey = t('admin.common.required');
    if (columnLabelEn.trim().length === 0) errs.columnLabelEn = t('admin.common.required');
    if (columnLabelAr.trim().length === 0) errs.columnLabelAr = t('admin.common.required');
    if (columnDataTypeId === '') errs.columnDataTypeId = t('admin.common.required');
    if (columnControlTypeId === '') errs.columnControlTypeId = t('admin.common.required');
    if (isLookupRequired(columnControlTypeId, controlTypes) && columnLookupTypeId === '') {
      errs.columnLookupTypeId = t('admin.forms.table.lookupColumnRequired');
    }
    setColumnErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const nextOrder = columns.length > 0
      ? Math.max(...columns.map((column) => column.displayOrder)) + 1
      : 1;

    addColumn.mutate(
      {
        formId,
        fieldId: field.fieldId,
        data: {
          columnKey: columnKey.trim().toUpperCase(),
          labelEn: columnLabelEn.trim(),
          labelAr: columnLabelAr.trim(),
          displayOrder: nextOrder,
          dataTypeId: Number(columnDataTypeId),
          controlTypeId: Number(columnControlTypeId),
          // TABLE: required lives on the column. RAW_TABLE: required lives on the row, so omit it here.
          ...(!isRawTable ? { isRequired: columnIsRequired } : {}),
          ...(columnLookupTypeId !== '' ? { lookupTypeId: Number(columnLookupTypeId) } : {}),
        },
      },
      {
        onSuccess: () => {
          setColumnKey('');
          setColumnLabelEn('');
          setColumnLabelAr('');
          setColumnLookupTypeId('');
          // Reset to the default (required) for the next column
          setColumnIsRequired(true);
          setColumnErrors({});
        },
      },
    );
  };

  const handleAddRow = (): void => {
    const errs: Record<string, string> = {};
    if (rowKey.trim().length === 0) errs.rowKey = t('admin.common.required');
    if (rowLabelEn.trim().length === 0) errs.rowLabelEn = t('admin.common.required');
    if (rowLabelAr.trim().length === 0) errs.rowLabelAr = t('admin.common.required');
    setRowErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const nextOrder = rows.length > 0
      ? Math.max(...rows.map((row) => row.displayOrder)) + 1
      : 1;

    addRow.mutate(
      {
        formId,
        fieldId: field.fieldId,
        data: {
          rowKey: rowKey.trim().toUpperCase(),
          labelEn: rowLabelEn.trim(),
          labelAr: rowLabelAr.trim(),
          displayOrder: nextOrder,
          isRequired: rowIsRequired,
          isReadOnly: false,
          isVisible: true,
        },
      },
      {
        onSuccess: () => {
          setRowKey('');
          setRowLabelEn('');
          setRowLabelAr('');
          // Reset to the default (required) for the next row
          setRowIsRequired(true);
          setRowErrors({});
        },
      },
    );
  };

  const columnNeedsLookup = isLookupRequired(columnControlTypeId, controlTypes);

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
        <Typography variant="h6" fontWeight={800}>
          {isRawTable ? t('admin.forms.table.gridTitle') : t('admin.forms.table.columnsTitle')}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ bgcolor: 'action.hover' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, maxHeight: '70vh' }}>
        <Stack spacing={3}>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            {t('admin.forms.fieldLabel', { name: loc(field.labelEn, field.labelAr), key: field.fieldKey })}
          </Typography>

          <Box>
            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}>
              {t('admin.forms.table.columnsCount', { count: columns.length })}
            </Typography>

            <Stack spacing={1.5} sx={{ mb: 2 }}>
              {columns.length > 0 ? (
                columns.map((column: FieldColumn) => (
                  <Paper
                    key={column.columnId}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                    }}
                  >
                    {editingColumnId === column.columnId ? (
                      /* Inline editor: labels + Required (Required only for TABLE columns) */
                      <StructureItemEditor
                        initialLabelEn={column.labelEn}
                        initialLabelAr={column.labelAr}
                        initialIsRequired={column.isRequired}
                        showRequired={!isRawTable}
                        maxLabelLength={200}
                        isSaving={updateColumn.isPending}
                        errorMessage={updateColumn.error instanceof Error ? updateColumn.error.message : null}
                        onSave={(changes) => handleUpdateColumn(column.columnId, changes)}
                        onCancel={cancelEditing}
                      />
                    ) : (
                      <>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>{loc(column.labelEn, column.labelAr)}</Typography>
                          <Typography variant="caption" color="text.secondary" fontFamily="monospace">{column.columnKey}</Typography>
                        </Box>
                        {/* Badge reflects the saved isRequired flag (null is treated as false) */}
                        {!isRawTable && column.isRequired === true && (
                          <Chip label={t('admin.common.required')} size="small" color="error" variant="outlined" sx={{ ml: 'auto', fontWeight: 700 }} />
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', ...(isRawTable || column.isRequired !== true ? { ml: 'auto' } : {}) }}>
                          <IconButton
                            size="small"
                            aria-label={t('admin.forms.table.editColumn')}
                            onClick={() => startEditingColumn(column.columnId)}
                            sx={{ color: 'primary.main' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => removeColumn.mutate({ formId, fieldId: field.fieldId, columnId: column.columnId })}
                            sx={{ color: 'error.light' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </>
                    )}
                  </Paper>
                ))
              ) : (
                <Typography variant="caption" color="text.disabled" fontStyle="italic">
                  {t('admin.forms.table.noColumns')}
                </Typography>
              )}
            </Stack>

            <Paper elevation={0} sx={{ p: 2, borderRadius: '16px', bgcolor: alpha(theme.palette.primary.main, 0.03), border: '1px dashed', borderColor: 'divider' }}>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField label={t('admin.forms.table.columnKey')} value={columnKey} onChange={(e) => { setColumnKey(e.target.value); setColumnErrors((p) => ({ ...p, columnKey: '' })); }} error={Boolean(columnErrors.columnKey)} helperText={columnErrors.columnKey} fullWidth size="small" required InputProps={{ sx: textFieldSx }} />
                  <TextField label={t('admin.forms.field.labelEn')} value={columnLabelEn} onChange={(e) => { setColumnLabelEn(e.target.value); setColumnErrors((p) => ({ ...p, columnLabelEn: '' })); }} error={Boolean(columnErrors.columnLabelEn)} helperText={columnErrors.columnLabelEn} fullWidth size="small" required InputProps={{ sx: textFieldSx }} />
                  <TextField label={t('admin.forms.field.labelAr')} value={columnLabelAr} onChange={(e) => { setColumnLabelAr(e.target.value); setColumnErrors((p) => ({ ...p, columnLabelAr: '' })); }} error={Boolean(columnErrors.columnLabelAr)} helperText={columnErrors.columnLabelAr} fullWidth size="small" required inputProps={{ dir: 'rtl' }} InputProps={{ sx: textFieldSx }} />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControl size="small" fullWidth required error={Boolean(columnErrors.columnDataTypeId)}>
                    <InputLabel>{t('admin.forms.field.dataType')}</InputLabel>
                    <Select value={columnDataTypeId} label={t('admin.forms.field.dataType')} onChange={(e) => { setColumnDataTypeId(e.target.value as number | ''); setColumnErrors((p) => ({ ...p, columnDataTypeId: '' })); }} sx={{ borderRadius: '12px' }}>
                      {dataTypes.map((dt) => <MenuItem key={dt.dataTypeId} value={dt.dataTypeId}>{dt.typeName}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth required error={Boolean(columnErrors.columnControlTypeId)}>
                    <InputLabel>{t('admin.forms.field.controlType')}</InputLabel>
                    <Select value={columnControlTypeId} label={t('admin.forms.field.controlType')} onChange={(e) => { setColumnControlTypeId(e.target.value as number | ''); setColumnErrors((p) => ({ ...p, columnControlTypeId: '', columnLookupTypeId: '' })); setColumnLookupTypeId(''); }} sx={{ borderRadius: '12px' }}>
                      {controlTypes.filter((ct) => ct.controlKey !== ControlKeys.Table && ct.controlKey !== ControlKeys.RawTable && ct.controlKey !== ControlKeys.CalculatedField).map((ct) => (
                        <MenuItem key={ct.controlTypeId} value={ct.controlTypeId}>{ct.controlName}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {columnNeedsLookup && (
                    <FormControl size="small" fullWidth required error={Boolean(columnErrors.columnLookupTypeId)}>
                      <InputLabel>{t('admin.forms.field.lookupType')}</InputLabel>
                      <Select value={columnLookupTypeId} label={t('admin.forms.field.lookupType')} onChange={(e) => { setColumnLookupTypeId(e.target.value as number | ''); setColumnErrors((p) => ({ ...p, columnLookupTypeId: '' })); }} sx={{ borderRadius: '12px' }}>
                        {lookupTypes.map((lt) => <MenuItem key={lt.lookupTypeId} value={lt.lookupTypeId}>{loc(lt.nameEn, lt.nameAr)}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )}
                </Stack>
                {/* TABLE only: controls whether this column's cells are required on the user form */}
                {!isRawTable && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={columnIsRequired}
                        onChange={(e) => setColumnIsRequired(e.target.checked)}
                      />
                    }
                    label={<Typography variant="body2" fontWeight={600}>{t('admin.common.required')}</Typography>}
                    sx={{ alignSelf: 'flex-start', ml: 0 }}
                  />
                )}
                <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddColumn} disabled={addColumn.isPending} sx={{ alignSelf: 'flex-start', borderRadius: '10px', fontWeight: 700, textTransform: 'none' }}>
                  {t('admin.forms.table.addColumn')}
                </Button>
              </Stack>
            </Paper>
          </Box>

          {isRawTable && (
            <Box>
              <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}>
                {t('admin.forms.table.rowsCount', { count: rows.length })}
              </Typography>

              <Stack spacing={1.5} sx={{ mb: 2 }}>
                {rows.length > 0 ? (
                  rows.map((row: FieldRow) => (
                    <Paper key={row.rowId} elevation={0} sx={{ p: 1.5, borderRadius: '12px', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {editingRowId === row.rowId ? (
                        /* Inline editor: labels + Required (rows carry the flag in RAW_TABLE) */
                        <StructureItemEditor
                          initialLabelEn={row.labelEn}
                          initialLabelAr={row.labelAr}
                          initialIsRequired={row.isRequired}
                          showRequired
                          maxLabelLength={300}
                          isSaving={updateRow.isPending}
                          errorMessage={updateRow.error instanceof Error ? updateRow.error.message : null}
                          onSave={(changes) => handleUpdateRow(row.rowId, changes)}
                          onCancel={cancelEditing}
                        />
                      ) : (
                        <>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>{loc(row.labelEn, row.labelAr)}</Typography>
                            <Typography variant="caption" color="text.secondary" fontFamily="monospace">{row.rowKey}</Typography>
                          </Box>
                          {/* Badge reflects the saved row isRequired flag */}
                          {row.isRequired && (
                            <Chip label={t('admin.common.required')} size="small" color="error" variant="outlined" sx={{ ml: 'auto', mr: 1, fontWeight: 700 }} />
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center', ...(row.isRequired ? {} : { ml: 'auto' }) }}>
                            <IconButton size="small" aria-label={t('admin.forms.table.editRow')} onClick={() => startEditingRow(row.rowId)} sx={{ color: 'primary.main' }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => removeRow.mutate({ formId, fieldId: field.fieldId, rowId: row.rowId })} sx={{ color: 'error.light' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </>
                      )}
                    </Paper>
                  ))
                ) : (
                  <Typography variant="caption" color="text.disabled" fontStyle="italic">{t('admin.forms.table.noRows')}</Typography>
                )}
              </Stack>

              <Paper elevation={0} sx={{ p: 2, borderRadius: '16px', bgcolor: alpha(theme.palette.primary.main, 0.03), border: '1px dashed', borderColor: 'divider' }}>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField label={t('admin.forms.table.rowKey')} value={rowKey} onChange={(e) => { setRowKey(e.target.value); setRowErrors((p) => ({ ...p, rowKey: '' })); }} error={Boolean(rowErrors.rowKey)} helperText={rowErrors.rowKey} fullWidth size="small" required InputProps={{ sx: textFieldSx }} />
                    <TextField label={t('admin.forms.field.labelEn')} value={rowLabelEn} onChange={(e) => { setRowLabelEn(e.target.value); setRowErrors((p) => ({ ...p, rowLabelEn: '' })); }} error={Boolean(rowErrors.rowLabelEn)} helperText={rowErrors.rowLabelEn} fullWidth size="small" required InputProps={{ sx: textFieldSx }} />
                    <TextField label={t('admin.forms.field.labelAr')} value={rowLabelAr} onChange={(e) => { setRowLabelAr(e.target.value); setRowErrors((p) => ({ ...p, rowLabelAr: '' })); }} error={Boolean(rowErrors.rowLabelAr)} helperText={rowErrors.rowLabelAr} fullWidth size="small" required inputProps={{ dir: 'rtl' }} InputProps={{ sx: textFieldSx }} />
                  </Stack>
                  {/* RAW_TABLE only: controls whether this row's cells are required on the user form */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={rowIsRequired}
                        onChange={(e) => setRowIsRequired(e.target.checked)}
                      />
                    }
                    label={<Typography variant="body2" fontWeight={600}>{t('admin.common.required')}</Typography>}
                    sx={{ alignSelf: 'flex-start', ml: 0 }}
                  />
                  <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddRow} disabled={addRow.isPending} sx={{ alignSelf: 'flex-start', borderRadius: '10px', fontWeight: 700, textTransform: 'none', color: ADMIN_ACCENT, borderColor: alpha(ADMIN_ACCENT, 0.4) }}>
                    {t('admin.forms.table.addRow')}
                  </Button>
                </Stack>
              </Paper>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="contained" color="inherit" sx={{ borderRadius: '12px', bgcolor: 'action.hover', fontWeight: 700, textTransform: 'none' }}>
          {t('admin.common.done')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManageTableStructureDialog;
