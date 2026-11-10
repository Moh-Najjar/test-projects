import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Fade from '@mui/material/Fade';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { alpha, useTheme } from '@mui/material/styles';

import type { SubmissionAuditLog } from '../../../core/types/submissionAuditLog';
import { DialogHeader, KeyBadge, Pill } from '../shared/ui';
import { ADMIN_MONO_FONT } from '../shared/theme/adminTokens';
import type { AuditLogLabels } from './directory';
import { diffAuditValues, prettyStoredValue, type AuditValueChange } from './diffAuditValues';
import { formatAbsolute, formatAction, formatRelative } from './format';
import { EM_DASH, colorForAction, initialsOf, isLocalAddress } from './presentation';

interface AuditDetailDialogProps {
  log: SubmissionAuditLog | null;
  userName: string;
  labels: AuditLogLabels;
  onClose: () => void;
}

interface ChangeGroup {
  fieldKey: string;
  changes: AuditValueChange[];
}

interface LocationParts {
  primary: string;
  secondary: string;
}

const locationOf = (
  change: AuditValueChange,
  labels: AuditLogLabels,
  simpleLabel: string,
  selectionLabel: string,
): LocationParts => {
  if (change.kind === 'simple') return { primary: simpleLabel, secondary: '' };
  if (change.kind === 'selection') return { primary: selectionLabel, secondary: '' };
  const column =
    change.columnKey === null || change.columnKey.length === 0
      ? ''
      : labels.columnLabel(change.fieldKey, change.columnKey);
  const row = change.rowLabel ?? '';
  if (row.length > 0 && column.length > 0 && column !== change.columnKey) {
    return { primary: row, secondary: column };
  }
  if (row.length > 0) return { primary: row, secondary: '' };
  if (column.length > 0) return { primary: column, secondary: '' };
  return { primary: simpleLabel, secondary: '' };
};

const LocationText: React.FC<{ parts: LocationParts }> = ({ parts }) => (
  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
    <Box component="span">{parts.primary}</Box>
    {parts.secondary.length > 0 && (
      <>
        <Box component="span" aria-hidden sx={{ color: 'text.disabled' }}>
          ·
        </Box>
        <Box component="span">{parts.secondary}</Box>
      </>
    )}
  </Stack>
);

const groupChanges = (changes: readonly AuditValueChange[]): ChangeGroup[] => {
  const groups: ChangeGroup[] = [];
  for (const change of changes) {
    const current = groups[groups.length - 1];
    if (current !== undefined && current.fieldKey === change.fieldKey) {
      current.changes.push(change);
    } else {
      groups.push({ fieldKey: change.fieldKey, changes: [change] });
    }
  }
  return groups;
};

const DiffValue: React.FC<{ value: string; tone: 'before' | 'after' }> = ({ value, tone }) => {
  const theme = useTheme();
  const color = tone === 'before' ? theme.palette.error.main : theme.palette.success.main;
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        maxWidth: '100%',
        px: 1,
        py: 0.35,
        borderRadius: '8px',
        fontWeight: tone === 'after' ? 800 : 700,
        fontVariantNumeric: 'tabular-nums',
        color,
        bgcolor: alpha(color, 0.1),
        textDecoration: tone === 'before' && value.length > 0 ? 'line-through' : 'none',
        textDecorationThickness: '1px',
        wordBreak: 'break-word',
      }}>
      {value.length > 0 ? value : EM_DASH}
    </Box>
  );
};

const AuditDetailDialog: React.FC<AuditDetailDialogProps> = ({ log, userName, labels, onClose }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const locale = i18n.language === 'ar' ? 'ar' : 'en';

  const diff = useMemo(() => (log === null ? null : diffAuditValues(log.oldValue, log.newValue)), [log]);
  const rawBefore = useMemo(() => (log === null ? '' : prettyStoredValue(log.oldValue)), [log]);
  const rawAfter = useMemo(() => (log === null ? '' : prettyStoredValue(log.newValue)), [log]);
  const groups = useMemo(() => (diff === null ? [] : groupChanges(diff.changes)), [diff]);

  const fieldCount = diff === null ? 0 : new Set(diff.changes.map((change) => change.fieldKey)).size;
  const changeCount = diff === null ? 0 : diff.changes.length + diff.hiddenCount;
  const actionColor = log === null ? theme.palette.primary.main : colorForAction(log.actionType, 0);

  const ipLabel =
    log === null || log.ipAddress === null || log.ipAddress.length === 0
      ? EM_DASH
      : isLocalAddress(log.ipAddress)
        ? t('auditLogs.detail.local')
        : log.ipAddress;

  return (
    <Dialog
      open={log !== null}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      TransitionComponent={Fade}>
      {log !== null && diff !== null && (
        <>
          <DialogHeader
            tone="cyan"
            avatar={
              <Avatar sx={{ bgcolor: alpha(actionColor, 0.16), color: actionColor, fontWeight: 800 }}>
                {initialsOf(userName)}
              </Avatar>
            }
            title={userName}
            subtitle={`${formatRelative(log.actionAt, locale, t)} · ${formatAbsolute(log.actionAt, locale)}`}
            onClose={onClose}
          />
          <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="flex-start"
              sx={{
                mb: 2,
                p: 1.5,
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '12px',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  flexShrink: 0,
                }}>
                <DescriptionOutlinedIcon fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                  {t('auditLogs.detail.form')}
                </Typography>
                <Typography sx={{ fontWeight: 800, lineHeight: 1.3 }}>{labels.formName}</Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                  <Pill label={formatAction(log.actionType, t)} color={actionColor} dot />
                  <Pill
                    label={`${t('auditLogs.detail.submissionId')} #${String(log.submissionId)}`}
                    color={theme.palette.primary.main}
                    outlined
                    mono
                  />
                  <Pill
                    label={`${t('auditLogs.detail.auditId')} #${String(log.auditId)}`}
                    color={theme.palette.text.secondary}
                    outlined
                    mono
                  />
                  <Pill label={ipLabel} color={theme.palette.text.secondary} outlined />
                </Stack>
              </Box>
            </Stack>

            {log.comment !== null && log.comment.length > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                {`${t('auditLogs.detail.comment')}: ${log.comment}`}
              </Typography>
            )}

            <Typography sx={{ fontWeight: 800 }}>
              {diff.unreadable
                ? t('auditLogs.detail.unreadable')
                : changeCount === 0
                  ? t('auditLogs.detail.noChanges')
                  : t('auditLogs.detail.summary', { count: changeCount, fields: fieldCount })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {t('auditLogs.detail.subtitle')}
            </Typography>

            {groups.length > 0 && (
              <TableContainer
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '16px',
                  overflow: 'hidden',
                }}>
                <Table size="small" aria-label={t('auditLogs.detail.subtitle')}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell sx={{ fontWeight: 800, width: '46%' }}>{t('auditLogs.detail.where')}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{t('auditLogs.detail.before')}</TableCell>
                      <TableCell sx={{ width: 36, p: 0 }} />
                      <TableCell sx={{ fontWeight: 800 }}>{t('auditLogs.detail.after')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {groups.map((group) => (
                      <React.Fragment key={group.fieldKey}>
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            sx={{
                              bgcolor: 'background.default',
                              py: 1,
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                            }}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                              <Typography sx={{ fontWeight: 800 }}>{labels.fieldLabel(group.fieldKey)}</Typography>
                              <KeyBadge>{group.fieldKey}</KeyBadge>
                            </Stack>
                          </TableCell>
                        </TableRow>
                        {group.changes.map((change) => (
                          <TableRow key={change.id} hover>
                            <TableCell sx={{ fontWeight: 600, verticalAlign: 'middle' }}>
                              <LocationText
                                parts={locationOf(
                                  change,
                                  labels,
                                  t('auditLogs.detail.simpleValue'),
                                  t('auditLogs.detail.selection'),
                                )}
                              />
                            </TableCell>
                            <TableCell sx={{ verticalAlign: 'middle' }}>
                              <DiffValue value={change.before} tone="before" />
                            </TableCell>
                            <TableCell sx={{ p: 0, color: 'text.disabled' }}>
                              {i18n.language === 'ar' ? <ArrowBackRoundedIcon sx={{ fontSize: 16, display: 'block', mx: 'auto' }} /> : <ArrowForwardRoundedIcon sx={{ fontSize: 16, display: 'block', mx: 'auto' }} />}
                            </TableCell>
                            <TableCell sx={{ verticalAlign: 'middle' }}>
                              <DiffValue value={change.after} tone="after" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {diff.hiddenCount > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontWeight: 700 }}>
                {t('auditLogs.detail.more', { count: diff.hiddenCount })}
              </Typography>
            )}

            <Stack spacing={1} sx={{ mt: 3 }}>
              <Accordion
                disableGutters
                elevation={0}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 800 }}>{t('auditLogs.detail.rawBefore')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      p: 1.5,
                      maxHeight: 220,
                      overflow: 'auto',
                      borderRadius: '10px',
                      bgcolor: 'background.default',
                      fontFamily: ADMIN_MONO_FONT,
                      fontSize: 12,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                    {rawBefore.length > 0 ? rawBefore : EM_DASH}
                  </Box>
                </AccordionDetails>
              </Accordion>
              <Accordion
                disableGutters
                elevation={0}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 800 }}>{t('auditLogs.detail.rawAfter')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      p: 1.5,
                      maxHeight: 220,
                      overflow: 'auto',
                      borderRadius: '10px',
                      bgcolor: 'background.default',
                      fontFamily: ADMIN_MONO_FONT,
                      fontSize: 12,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                    {rawAfter.length > 0 ? rawAfter : EM_DASH}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Stack>
          </DialogContent>
        </>
      )}
    </Dialog>
  );
};

export default AuditDetailDialog;
