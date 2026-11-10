import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import { alpha, useTheme } from '@mui/material/styles';

import type { SubmissionAuditLog } from '../../../core/types/submissionAuditLog';
import { useDeviceType } from '../../../core/hooks/useDeviceType';
import { EmptyState, IconAction, KeyBadge, LoadingState, Pill, SurfaceCard } from '../shared/ui';
import type { AuditLogLabels } from './directory';
import { diffAuditValues } from './diffAuditValues';
import { formatAbsolute, formatAction, formatRelative } from './format';
import { EM_DASH, colorForAction, initialsOf } from './presentation';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

interface AuditLogTableProps {
  items: SubmissionAuditLog[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  isFetching: boolean;
  userName: (userId: number) => string;
  describeLog: (log: SubmissionAuditLog) => AuditLogLabels;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSelect: (item: SubmissionAuditLog) => void;
}

const AuditLogTable: React.FC<AuditLogTableProps> = ({
  items,
  total,
  page,
  pageSize,
  isLoading,
  isFetching,
  userName,
  describeLog,
  onPageChange,
  onPageSizeChange,
  onSelect,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useDeviceType() === 'mobile';
  const locale = i18n.language === 'ar' ? 'ar' : 'en';

  const rows = useMemo(
    () => items.map((item) => ({ item, diff: diffAuditValues(item.oldValue, item.newValue) })),
    [items],
  );

  const changeLabel = (count: number): string =>
    count === 0 ? t('auditLogs.table.noFieldChanges') : t('auditLogs.table.changeCount', { count });

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <SurfaceCard
      disablePadding
      tone="indigo"
      title={t('auditLogs.table.title')}
      subtitle={t('auditLogs.table.showing', { from, to, total })}>
      {isFetching && !isLoading && <LinearProgress />}

      {isLoading && <LoadingState label={t('auditLogs.loading')} />}

      {!isLoading && rows.length === 0 && (
        <EmptyState
          icon={<HistoryRoundedIcon />}
          title={t('auditLogs.table.empty')}
          description={t('auditLogs.table.emptyHint')}
          compact
        />
      )}

      {!isLoading && rows.length > 0 && isMobile && (
        <Stack spacing={1.25} sx={{ p: 1.5 }}>
          {rows.map(({ item, diff }) => {
            const changeCount = diff.changes.length + diff.hiddenCount;
            const actor = userName(item.actionByUserId);
            const color = colorForAction(item.actionType, 0);
            const formName = describeLog(item).formName;
            return (
              <Box
                key={item.auditId}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onSelect(item);
                }}
                sx={{
                  p: 1.5,
                  borderRadius: '16px',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderInlineStart: `4px solid ${color}`,
                  cursor: 'pointer',
                  bgcolor: 'background.paper',
                }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                      {formatRelative(item.actionAt, locale, t)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatAbsolute(item.actionAt, locale)}
                    </Typography>
                  </Box>
                  <Pill label={formatAction(item.actionType, t)} color={color} dot />
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.25 }}>
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      fontSize: 11,
                      fontWeight: 800,
                      bgcolor: alpha(color, 0.14),
                      color,
                    }}>
                    {initialsOf(actor)}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700 }} noWrap>
                      {actor}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {`${formName} · ${t('auditLogs.table.submission')} #${String(item.submissionId)} · ${changeLabel(changeCount)}`}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}

      {!isLoading && rows.length > 0 && !isMobile && (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table aria-label={t('auditLogs.tableAria')} sx={{ minWidth: 1080 }}>
            <TableHead>
              <TableRow>
                <TableCell>{t('auditLogs.table.when')}</TableCell>
                <TableCell>{t('auditLogs.table.event')}</TableCell>
                <TableCell>{t('auditLogs.table.form')}</TableCell>
                <TableCell>{t('auditLogs.table.user')}</TableCell>
                <TableCell>{t('auditLogs.table.submission')}</TableCell>
                <TableCell>{t('auditLogs.table.changes')}</TableCell>
                <TableCell>{t('auditLogs.table.view')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(({ item, diff }) => {
                const changeCount = diff.changes.length + diff.hiddenCount;
                const fields = [...new Set(diff.changes.map((change) => change.fieldKey))].slice(0, 2);
                const extraFields = new Set(diff.changes.map((change) => change.fieldKey)).size - fields.length;
                const actor = userName(item.actionByUserId);
                const color = colorForAction(item.actionType, 0);
                const formName = describeLog(item).formName;
                return (
                  <TableRow
                    key={item.auditId}
                    hover
                    tabIndex={0}
                    onClick={() => onSelect(item)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') onSelect(item);
                    }}
                    sx={{ cursor: 'pointer' }}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                        {formatRelative(item.actionAt, locale, t)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatAbsolute(item.actionAt, locale)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.6} alignItems="flex-start">
                        <Pill label={formatAction(item.actionType, t)} color={color} dot />
                        <Tooltip title={item.comment ?? ''}>
                          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 240 }}>
                            {item.comment !== null && item.comment.length > 0 ? item.comment : EM_DASH}
                          </Typography>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Tooltip title={formName}>
                        <Typography sx={{ fontWeight: 700 }} noWrap>
                          {formName}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1.25}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            fontSize: 13,
                            fontWeight: 800,
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            color: 'primary.main',
                          }}>
                          {initialsOf(actor)}
                        </Avatar>
                        <Typography sx={{ fontWeight: 700 }}>{actor}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <KeyBadge>{`#${String(item.submissionId)}`}</KeyBadge>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {changeLabel(changeCount)}
                      </Typography>
                      {fields.length > 0 && (
                        <Typography variant="caption" color="text.secondary" component="div">
                          {extraFields > 0 ? `${fields.join(', ')} +${String(extraFields)}` : fields.join(', ')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <IconAction label={t('auditLogs.table.view')} onClick={() => onSelect(item)}>
                        <VisibilityOutlinedIcon />
                      </IconAction>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!isLoading && total > 0 && (
        <TablePagination
          component="div"
          count={total}
          page={page - 1}
          onPageChange={(_event, nextPage) => onPageChange(nextPage + 1)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(event) => onPageSizeChange(Number(event.target.value))}
          rowsPerPageOptions={PAGE_SIZE_OPTIONS}
          labelRowsPerPage={t('auditLogs.table.rows')}
        />
      )}
    </SurfaceCard>
  );
};

export default AuditLogTable;
