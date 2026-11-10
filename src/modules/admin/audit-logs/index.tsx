import React, { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import HistoryIcon from '@mui/icons-material/History';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import DifferenceOutlinedIcon from '@mui/icons-material/DifferenceOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import TopicOutlinedIcon from '@mui/icons-material/TopicOutlined';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import RefreshIcon from '@mui/icons-material/Refresh';
import { alpha, useTheme } from '@mui/material/styles';

import {
  AUDIT_LOGS_QUERY_KEY,
  AUDIT_LOG_CHART_SAMPLE_SIZE,
  useSubmissionAuditLogs,
} from '../../../core/hooks/useAuditLogs';
import type { SubmissionAuditLog } from '../../../core/types/submissionAuditLog';
import AdminLayout from '../shared/AdminLayout';
import { ErrorState, PageHeader, StatCard } from '../shared/ui';
import AuditCharts from './AuditCharts';
import AuditDetailDialog from './AuditDetailDrawer';
import AuditFilters from './AuditFilters';
import AuditLogTable from './AuditLogTable';
import { EMPTY_AUDIT_LABELS, useAuditLookups } from './directory';
import { formatAction, formatFilterDate } from './format';
import {
  EMPTY_AUDIT_FILTERS,
  EMPTY_FILTER_ISSUES,
  filtersAreValid,
  normalizeFilters,
  toAuditQuery,
  validateFilters,
  type AuditFilterDraft,
} from './filters';
import { buildAuditInsights } from './insights';

const DEFAULT_PAGE_SIZE = 20;

const AuditLogsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const locale = i18n.language === 'ar' ? 'ar' : 'en';
  const { forms, users, formName, userName, describeLog, formsLoading, usersLoading } = useAuditLookups();

  const [draft, setDraft] = useState<AuditFilterDraft>(EMPTY_AUDIT_FILTERS);
  const [applied, setApplied] = useState<AuditFilterDraft>(EMPTY_AUDIT_FILTERS);
  const [issues, setIssues] = useState(EMPTY_FILTER_ISSUES);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<SubmissionAuditLog | null>(null);
  const [showInsights, setShowInsights] = useState(true);

  const tableQuery = useMemo(() => toAuditQuery(applied, page, pageSize), [applied, page, pageSize]);
  const chartQuery = useMemo(() => toAuditQuery(applied, 1, AUDIT_LOG_CHART_SAMPLE_SIZE), [applied]);

  const table = useSubmissionAuditLogs(tableQuery);
  const charts = useSubmissionAuditLogs(chartQuery);

  const insights = useMemo(
    () => (charts.data === undefined ? null : buildAuditInsights(charts.data.items)),
    [charts.data],
  );

  const total = table.data?.total ?? 0;
  const items = table.data?.items ?? [];

  const commitFilters = (next: AuditFilterDraft): boolean => {
    const nextIssues = validateFilters(next);
    setIssues(nextIssues);
    if (!filtersAreValid(nextIssues)) return false;
    setApplied(normalizeFilters(next));
    setPage(1);
    return true;
  };

  const handleFilterChange = (next: AuditFilterDraft, applyNow = false): void => {
    setDraft(next);
    if (applyNow) commitFilters(next);
  };

  const applyFilters = (): void => {
    commitFilters(draft);
  };

  const resetFilters = (): void => {
    setDraft(EMPTY_AUDIT_FILTERS);
    setApplied(EMPTY_AUDIT_FILTERS);
    setIssues(EMPTY_FILTER_ISSUES);
    setPage(1);
  };

  const clearFilter = (key: keyof AuditFilterDraft): void => {
    const next = normalizeFilters({ ...applied, [key]: '' });
    setDraft(next);
    setApplied(next);
    setIssues(EMPTY_FILTER_ISSUES);
    setPage(1);
  };

  const refresh = (): void => {
    void queryClient.invalidateQueries({ queryKey: [AUDIT_LOGS_QUERY_KEY] });
  };

  const chips: Array<{ key: keyof AuditFilterDraft; label: string }> = [];
  if (applied.submissionId.length > 0) {
    chips.push({
      key: 'submissionId',
      label: `${t('auditLogs.filters.submissionId')} #${applied.submissionId}`,
    });
  }
  if (applied.formId.length > 0) chips.push({ key: 'formId', label: formName(applied.formId) });
  if (applied.actionByUserId.length > 0) {
    chips.push({ key: 'actionByUserId', label: userName(applied.actionByUserId) });
  }
  if (applied.actionType.length > 0) chips.push({ key: 'actionType', label: formatAction(applied.actionType, t) });
  if (applied.from.length > 0) {
    chips.push({ key: 'from', label: `${t('auditLogs.filters.from')}: ${formatFilterDate(applied.from, locale)}` });
  }
  if (applied.to.length > 0) {
    chips.push({ key: 'to', label: `${t('auditLogs.filters.to')}: ${formatFilterDate(applied.to, locale)}` });
  }

  const statValue = (loading: boolean, value: number): React.ReactNode =>
    loading ? <Skeleton width={56} /> : value;

  return (
    <AdminLayout>
      <PageHeader
        icon={<HistoryIcon />}
        tone="cyan"
        eyebrow={t('auditLogs.badge')}
        title={t('auditLogs.title')}
        subtitle={t('auditLogs.subtitle')}
        meta={
          <Chip
            size="small"
            label={table.isLoading ? '…' : t('auditLogs.stats.count', { count: total })}
            sx={{ fontWeight: 800, bgcolor: alpha(theme.palette.secondary.main, 0.12), color: 'secondary.main' }}
          />
        }
        actions={
          <Button
            variant="outlined"
            onClick={refresh}
            disabled={table.isFetching}
            startIcon={table.isFetching ? <CircularProgress size={16} /> : <RefreshIcon />}>
            {t('admin.common.refresh')}
          </Button>
        }
      />

      <Stack spacing={2.5}>
        {table.isError && (
          <ErrorState title={t('auditLogs.error')} onRetry={refresh} />
        )}

        <AuditFilters
          value={draft}
          issues={issues}
          forms={forms}
          users={users}
          formsLoading={formsLoading}
          usersLoading={usersLoading}
          isFetching={table.isFetching}
          onChange={handleFilterChange}
          onApply={applyFilters}
          onReset={resetFilters}
        />

        {chips.length > 0 && (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              {t('auditLogs.filters.active')}
            </Typography>
            {chips.map((chip) => (
              <Chip key={chip.key} label={chip.label} onDelete={() => clearFilter(chip.key)} />
            ))}
          </Stack>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, minmax(0, 1fr))' },
            gap: 2,
          }}>
          <StatCard
            label={t('auditLogs.stats.total')}
            value={statValue(table.isLoading, total)}
            hint={t('auditLogs.stats.totalHint')}
            icon={<ReceiptLongOutlinedIcon />}
            tone="indigo"
            index={0}
          />
          <StatCard
            label={t('auditLogs.stats.submissions')}
            value={statValue(charts.isLoading, insights?.submissionCount ?? 0)}
            hint={t('auditLogs.stats.submissionsHint')}
            icon={<TopicOutlinedIcon />}
            tone="cyan"
            index={1}
          />
          <StatCard
            label={t('auditLogs.stats.actors')}
            value={statValue(charts.isLoading, insights?.actorCount ?? 0)}
            hint={t('auditLogs.stats.actorsHint')}
            icon={<GroupsOutlinedIcon />}
            tone="amber"
            index={2}
          />
          <StatCard
            label={t('auditLogs.stats.changes')}
            value={statValue(charts.isLoading, insights?.valueChangeCount ?? 0)}
            hint={t('auditLogs.stats.changesHint')}
            icon={<DifferenceOutlinedIcon />}
            tone="violet"
            index={3}
          />
        </Box>

        {(charts.isLoading || total > 0) && (
          <Box>
            <Button
              size="small"
              onClick={() => setShowInsights((open) => !open)}
              endIcon={showInsights ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
              sx={{ mb: 1.5, fontWeight: 800 }}>
              {showInsights ? t('auditLogs.insights.hide') : t('auditLogs.insights.show')}
            </Button>
            <Collapse in={showInsights} unmountOnExit={false}>
              <Box sx={{ opacity: charts.isFetching && !charts.isLoading ? 0.65 : 1, transition: 'opacity 0.2s ease' }}>
                <AuditCharts
                  insights={insights}
                  isLoading={charts.isLoading && insights === null}
                  total={charts.data?.total ?? total}
                  sampleSize={charts.data?.items.length ?? 0}
                  userName={userName}
                />
              </Box>
            </Collapse>
          </Box>
        )}

        <AuditLogTable
          items={items}
          total={total}
          page={page}
          pageSize={pageSize}
          isLoading={table.isLoading}
          isFetching={table.isFetching}
          onPageChange={setPage}
          onPageSizeChange={(next) => {
            setPageSize(next);
            setPage(1);
          }}
          onSelect={setSelected}
          userName={userName}
          describeLog={describeLog}
        />
      </Stack>

      <AuditDetailDialog
        log={selected}
        userName={selected === null ? '' : userName(selected.actionByUserId)}
        labels={selected === null ? EMPTY_AUDIT_LABELS : describeLog(selected)}
        onClose={() => setSelected(null)}
      />
    </AdminLayout>
  );
};

export default AuditLogsPage;
