import React from 'react';
import { useTranslation } from 'react-i18next';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import type { SelectChangeEvent } from '@mui/material/Select';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

import { AUDIT_ACTION_TYPES } from '../../../core/types/submissionAuditLog';
import { SurfaceCard } from '../shared/ui';
import type { LookupOption } from './directory';
import type { AuditFilterDraft, AuditFilterFieldIssues } from './filters';
import { formatAction } from './format';

interface AuditFiltersProps {
  value: AuditFilterDraft;
  issues: AuditFilterFieldIssues;
  forms: readonly LookupOption[];
  users: readonly LookupOption[];
  formsLoading: boolean;
  usersLoading: boolean;
  isFetching: boolean;
  onChange: (next: AuditFilterDraft, applyNow?: boolean) => void;
  onApply: () => void;
  onReset: () => void;
}

const AuditFilters: React.FC<AuditFiltersProps> = ({
  value,
  issues,
  forms,
  users,
  formsLoading,
  usersLoading,
  isFetching,
  onChange,
  onApply,
  onReset,
}) => {
  const { t } = useTranslation();

  const selectedForm = forms.find((option) => option.id === value.formId) ?? null;
  const selectedUser = users.find((option) => option.id === value.actionByUserId) ?? null;

  const handleAction = (event: SelectChangeEvent<string>): void => {
    onChange({ ...value, actionType: event.target.value }, true);
  };

  return (
    <SurfaceCard
      tone="cyan"
      title={t('auditLogs.filters.title')}
      subtitle={t('auditLogs.filters.subtitle')}>
      <Box
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          onApply();
        }}
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, minmax(0, 1fr))' },
          gap: 1.5,
          alignItems: 'start',
        }}>
        <TextField
          label={t('auditLogs.filters.submissionId')}
          value={value.submissionId}
          onChange={(event) => onChange({ ...value, submissionId: event.target.value })}
          error={issues.submissionId !== null}
          helperText={issues.submissionId !== null ? t('auditLogs.filters.invalidNumber') : undefined}
          size="small"
          fullWidth
          slotProps={{ htmlInput: { inputMode: 'numeric' } }}
        />
        <Autocomplete
          options={forms}
          value={selectedForm}
          loading={formsLoading}
          onChange={(_event, option) => onChange({ ...value, formId: option === null ? '' : option.id }, true)}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, current) => option.id === current.id}
          noOptionsText={t('auditLogs.filters.noOptions')}
          renderInput={(params) => <TextField {...params} label={t('auditLogs.filters.formId')} size="small" />}
        />
        <Autocomplete
          options={users}
          value={selectedUser}
          loading={usersLoading}
          onChange={(_event, option) => onChange({ ...value, actionByUserId: option === null ? '' : option.id }, true)}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, current) => option.id === current.id}
          noOptionsText={t('auditLogs.filters.noOptions')}
          renderInput={(params) => <TextField {...params} label={t('auditLogs.filters.userId')} size="small" />}
        />
        <FormControl size="small" fullWidth>
          <InputLabel id="audit-action-label">{t('auditLogs.filters.actionType')}</InputLabel>
          <Select
            labelId="audit-action-label"
            label={t('auditLogs.filters.actionType')}
            value={value.actionType}
            onChange={handleAction}>
            <MenuItem value="">{t('auditLogs.filters.allActions')}</MenuItem>
            {AUDIT_ACTION_TYPES.map((action) => (
              <MenuItem key={action} value={action}>
                {formatAction(action, t)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label={t('auditLogs.filters.from')}
          type="date"
          value={value.from}
          onChange={(event) => onChange({ ...value, from: event.target.value })}
          size="small"
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label={t('auditLogs.filters.to')}
          type="date"
          value={value.to}
          onChange={(event) => onChange({ ...value, to: event.target.value })}
          error={issues.range !== null}
          helperText={issues.range !== null ? t('auditLogs.filters.invalidRange') : undefined}
          size="small"
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Stack
          direction="row"
          spacing={1}
          sx={{ gridColumn: { xs: '1 / -1', lg: 'span 2' }, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={isFetching}
            startIcon={<SearchRoundedIcon />}
            sx={{ fontWeight: 700 }}>
            {t('auditLogs.filters.apply')}
          </Button>
          <Button type="button" variant="outlined" startIcon={<RestartAltIcon />} onClick={onReset} sx={{ fontWeight: 700 }}>
            {t('auditLogs.filters.reset')}
          </Button>
        </Stack>
      </Box>
    </SurfaceCard>
  );
};

export default AuditFilters;
