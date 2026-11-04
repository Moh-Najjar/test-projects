import React, { useMemo, useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ListAltIcon from '@mui/icons-material/ListAlt';

import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import ConfirmationDialog from '../shared/ConfirmationDialog';
import NoData from '../shared/NoData';
import Breadcrumbs from '../shared/Breadcrumbs';
import HeroBanner from '../shared/HeroBanner';

import type { RequestStatus } from './types';
import { getStatusBadgeStyles, mapApiStatus } from './utils/statusHelpers';
import { exportSubmissionToDocx } from './utils/exportToDocx';
import { SUBMISSION_DETAILS_QUERY_KEY, DROPDOWN_LIST_VALUES_QUERY_KEY, useGetMySubmissions } from '../../core/hooks/useFormApi';
import { getSubmissionDetails, getDropdownListValues } from '../../core/api/form';
import type { GetSubmissionDetailsResponse } from '../../core/types/getSubmissionDetailsResponse';
import type { GetDropdownListValuesResponse } from '../../core/types/getDropdownListValuesResponse';
import type { SubmissionItem } from '../../core/types/getMySubmissionsResponse';
import { useAuth } from '../../core/context/AuthContext';
import { useLocale } from '../../core/hooks/useLocale';
import { useDeviceType } from '../../core/hooks/useDeviceType';

// ─── Constants ───────────────────────────────────────────────────────────────

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25] as const;

/** Formats an ISO date string to a long readable date (e.g. "02 January 2025") */
const formatDate = (iso: string | null, locale: string): string => {
  if (iso === null) return '—';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(locale, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'long', year: 'numeric', hour12: true });
};

/** Column header definitions */
interface TableColumn {
  id: string;
  labelKey: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
}

const TABLE_COLUMNS: readonly TableColumn[] = [
  { id: 'no', labelKey: 'myRequests.table.no', minWidth: 160 },
  { id: 'form', labelKey: 'myRequests.table.form', minWidth: 200 },
  // { id: 'directorate', labelKey: 'myRequests.table.directorate', minWidth: 180 },
  // { id: 'period', labelKey: 'myRequests.table.period', minWidth: 120, align: 'center' },
  { id: 'kpis', labelKey: 'myRequests.table.kpis', minWidth: 70, align: 'center' },
  { id: 'submitted', labelKey: 'myRequests.table.submitted', minWidth: 140 },
  { id: 'lastDate', labelKey: 'myRequests.table.lastDate', minWidth: 140 },
  { id: 'status', labelKey: 'myRequests.table.status', minWidth: 130, align: 'center' },
  { id: 'actions', labelKey: 'myRequests.table.actions', minWidth: 100, align: 'center' },
];

// ─── Skeleton rows shown while API data is loading ───────────────────────────

const TableSkeletonRows: React.FC = () => (
  <>
    {[1, 2, 3, 4, 5].map((i) => (
      <TableRow key={i}>
        {TABLE_COLUMNS.map((col) => (
          <TableCell key={col.id} align={col.align ?? 'left'} sx={{ py: 1.5, px: 2 }}>
            <Skeleton variant="text" height={20} />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </>
);

// ─── Pagination footer ────────────────────────────────────────────────────────

interface PaginationFooterProps {
  totalCount: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  onRefresh: () => void;
  isFetching: boolean;
}

/** "Showing X–Y of Z entries" + numbered page buttons + refresh */
const PaginationFooter: React.FC<PaginationFooterProps> = ({
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onRefresh,
  isFetching,
}) => {
  const { t } = useTranslation();
  const { isAr } = useLocale();
  const theme = useTheme();

  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';

  const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));
  const startEntry = totalCount === 0 ? 0 : page * rowsPerPage + 1;
  const endEntry = Math.min((page + 1) * rowsPerPage, totalCount);

  /** Build an array of page indices with 'ellipsis' markers for large counts */
  const pageNumbers = useMemo((): Array<number | 'ellipsis'> => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i);
    const result: Array<number | 'ellipsis'> = [0];
    if (page > 2) result.push('ellipsis');
    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages - 2, page + 1);
    for (let i = start; i <= end; i++) result.push(i);
    if (page < totalPages - 3) result.push('ellipsis');
    result.push(totalPages - 1);
    return result;
  }, [totalPages, page]);

  const handleRowsChange = (event: SelectChangeEvent<number>): void => {
    onRowsPerPageChange(Number(event.target.value));
  };

  return (
    <Box
      sx={{
        px: isMobile ? '12px' : 3,
        py: isMobile ? '12px' : 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: isMobile ? '12px' : 2,
        bgcolor: 'background.paper',
      }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {/* "Showing X–Y of Z entries" + rows-per-page selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('myRequests.pagination.showing', { start: startEntry, end: endEntry, total: totalCount })}
          </Typography>
          <Select
            value={rowsPerPage}
            onChange={handleRowsChange}
            size="small"
            variant="outlined"
            sx={{
              fontSize: '0.8rem',
              height: 28,
              '.MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
              '.MuiSelect-select': { py: '3px', px: 1.5 },
            }}>
            {ROWS_PER_PAGE_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt} sx={{ fontSize: '0.8rem' }}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* Refresh button */}
        <Tooltip title={t('myRequests.actions.refresh')}>
          <span>
            <IconButton
              onClick={onRefresh}
              disabled={isFetching}
              size="small"
              sx={{
                width: 32, height: 32,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                color: 'text.secondary',
                transition: 'all 0.2s ease',
                '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.06) },
                '& svg': {
                  animation: isFetching ? 'spin 0.8s linear infinite' : 'none',
                  '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
                },
              }}>
              <RefreshIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      {/* Previous / page numbers / next */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
        <IconButton
          size="small"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          sx={{
            width: 32, height: 32,
            border: '1px solid',
            borderColor: page === 0 ? 'divider' : alpha(theme.palette.text.secondary, 0.3),
            borderRadius: 1,
            color: page === 0 ? 'text.disabled' : 'text.secondary',
          }}>
          {isAr ? <ChevronRightIcon sx={{ fontSize: 18 }} /> : <ChevronLeftIcon sx={{ fontSize: 18 }} />}
        </IconButton>

        {pageNumbers.map((item, idx) =>
          item === 'ellipsis' ? (
            <Typography key={`el-${idx}`} variant="body2" sx={{ px: 0.5, color: 'text.disabled' }}>
              …
            </Typography>
          ) : (
            <Box
              key={item}
              component="button"
              onClick={() => onPageChange(item)}
              sx={{
                width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid',
                borderRadius: 1,
                cursor: 'pointer',
                fontWeight: item === page ? 700 : 500,
                fontSize: '0.82rem',
                fontFamily: 'inherit',
                transition: 'all 0.15s ease',
                borderColor: item === page ? 'primary.main' : 'divider',
                bgcolor: item === page ? 'primary.main' : 'background.paper',
                color: item === page ? 'primary.contrastText' : 'text.secondary',
                '&:hover': {
                  borderColor: 'primary.main',
                  color: item === page ? 'primary.contrastText' : 'primary.main',
                },
              }}>
              {item + 1}
            </Box>
          )
        )}

        <IconButton
          size="small"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          sx={{
            width: 32, height: 32,
            border: '1px solid',
            borderColor: page >= totalPages - 1 ? 'divider' : alpha(theme.palette.text.secondary, 0.3),
            borderRadius: 1,
            color: page >= totalPages - 1 ? 'text.disabled' : 'text.secondary',
          }}>
          {isAr ? <ChevronLeftIcon sx={{ fontSize: 18 }} /> : <ChevronRightIcon sx={{ fontSize: 18 }} />}
        </IconButton>
      </Box>

    </Box>
  );
};

// ─── Delete target shape ──────────────────────────────────────────────────────

interface DeleteTarget {
  submissionId: number;
  referenceNumber: string;
}

// ─── Main page ────────────────────────────────────────────────────────────────

/**
 * MyRequests — KPI data submission list page.
 *
 * Fetches the current user's paginated submissions from the API.
 * Pagination is server-side: page/pageSize are passed to the API query.
 */
const MyRequests: React.FC = () => {
  const { t } = useTranslation();
  const { isAr } = useLocale();
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';

  const locale = isAr ? 'ar' : 'en';

  const { userRoles } = useAuth();
  const isRequester = userRoles.includes("DATA_ENTRY");

  // ─── Pagination state (UI is 0-indexed; API is 1-indexed) ──────────────────
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // ─── API query — passes 1-indexed page to the backend ──────────────────────
  const { data, isLoading, isFetching, isError, refetch, isRefetching } = useGetMySubmissions({
    page: page + 1,
    pageSize: rowsPerPage,
  });

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;

  // ─── Delete dialog state ────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // ─── Export loading state: tracks which submissionId is currently exporting ─
  const [exportingId, setExportingId] = useState<number | null>(null);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleViewDetails = (submissionId: number): void => {
    navigate(`/my-requests/${submissionId}`);
  };

  const handleDeleteClick = (item: SubmissionItem): void => {
    setDeleteTarget({ submissionId: item.submissionId, referenceNumber: item.referenceNumber });
  };

  // TODO: call a delete API once available; currently just closes the dialog
  const handleDeleteConfirm = (): void => {
    setDeleteTarget(null);
  };

  const handleAddNew = (): void => {
    navigate('/my-requests/new');
  };

  const handlePageChange = (newPage: number): void => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (rows: number): void => {
    setRowsPerPage(rows);
    setPage(0);
  };

  /**
   * Imperatively fetches submission details and all required dropdown values,
   * then triggers a DOCX download. Uses React Query cache when possible.
   */
  const handleExport = async (submissionId: number): Promise<void> => {
    if (exportingId !== null) return; // Prevent concurrent exports

    setExportingId(submissionId);

    try {
      // Fetch submission details (use cache if available)
      const detail = await queryClient.fetchQuery<GetSubmissionDetailsResponse, Error>({
        queryKey: [SUBMISSION_DETAILS_QUERY_KEY, submissionId],
        queryFn: () => getSubmissionDetails({ submissionId }),
        staleTime: 0,
      });

      // Collect all unique lookupTypeIds from dropdown and multiselect fields
      const lookupTypeIds: number[] = [];
      for (const fv of detail.fieldValues) {
        const controlKey = fv.controlType.controlKey;
        const hasLookup =
          (controlKey === 'DROPDOWN' || controlKey === 'MULTISELECT') &&
          fv.lookupType !== null;

        if (hasLookup && fv.lookupType !== null) {
          const id = fv.lookupType.lookupTypeId;
          if (!lookupTypeIds.includes(id)) {
            lookupTypeIds.push(id);
          }
        }

        // Also check table column lookups
        if (fv.columns !== null) {
          for (const col of fv.columns) {
            if (col.lookupType !== null) {
              const id = col.lookupType.lookupTypeId;
              if (!lookupTypeIds.includes(id)) {
                lookupTypeIds.push(id);
              }
            }
          }
        }
      }

      // Fetch all dropdown options in a single batched request (use cache if available)
      let dropdownData: GetDropdownListValuesResponse = {};
      if (lookupTypeIds.length > 0) {
        const sortedIds = [...lookupTypeIds].sort((a, b) => a - b);
        dropdownData = await queryClient.fetchQuery<GetDropdownListValuesResponse, Error>({
          queryKey: [DROPDOWN_LIST_VALUES_QUERY_KEY, 'multi', ...sortedIds],
          queryFn: () => getDropdownListValues({ lookupTypeIds: sortedIds }),
          staleTime: Infinity,
        });
      }

      await exportSubmissionToDocx(detail, dropdownData, isAr, locale);
    } catch (err) {
      // Log error silently — user sees no feedback since the export failed
      console.error('Export failed:', err);
    } finally {
      setExportingId(null);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Box component="main" sx={{ pb: 8 }}>
      <Container maxWidth="xl">
        <div>

          {/* ── Breadcrumbs ── */}
          <Breadcrumbs />

          {/* ── Hero Banner ── */}
          <HeroBanner
            title={t('myRequests.pageTitle')}
            subtitle={t('myRequests.pageSubtitle')}
            badgeLabel={t('myRequests.tableAriaLabel')}
            BadgeIcon={ListAltIcon}
          />

          {/* ── API error banner ── */}
          {isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {t('common.errorLoading')}
            </Alert>
          )}

          {/* ── Page actions row ── */}
          {isRequester && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                mb: 3,
              }}>
              <Button
                data-tour="new-request-btn"
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddNew}
                sx={{
                  borderRadius: 2.5,
                  px: isMobile ? '16px' : 3,
                  py: isMobile ? '10px' : 1.1,
                  fontWeight: 700,
                  marginBlock: isMobile ? '12px' : 0,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  width: isMobile ? '100%' : 'auto',
                  flexShrink: 0,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
                  '&:hover': {
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}`,
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease',
                }}>
                {t('myRequests.addNewRequest')}
              </Button>
            </Box>
          )}

          {/* ── Requests table ── */}
          <Paper
            data-tour="requests-table"
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
            }}>
            {isMobile && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', p: '12px' }}>
                {(isLoading || isRefetching) && [1, 2, 3].map((row) => (
                  <Skeleton key={row} variant="rounded" height={112} />
                ))}
                {!isLoading && !isRefetching && items.length === 0 && (
                  <NoData message={t('myRequests.noData')} />
                )}
                {!isLoading && !isRefetching && items.map((item) => {
                  const formName = isAr ? item.formNameAr : item.formNameEn;
                  const status = mapApiStatus(item.status);
                  const statusStyle = getStatusBadgeStyles(status, theme);
                  const statusLabelKey = `myRequests.status.${status.toLowerCase()}`;
                  return (
                    <Box
                      key={item.submissionId}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleViewDetails(item.submissionId)}
                      onKeyDown={(event) => { if (event.key === 'Enter') handleViewDetails(item.submissionId); }}
                      sx={{
                        p: '14px',
                        borderRadius: '14px',
                        border: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        cursor: 'pointer',
                      }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
                          {item.referenceNumber}
                        </Typography>
                        <Box
                          component="span"
                          sx={{
                            flexShrink: 0,
                            px: '10px',
                            py: '2px',
                            borderRadius: 10,
                            bgcolor: statusStyle.bg,
                            color: statusStyle.color,
                            fontWeight: 700,
                            fontSize: '0.72rem',
                          }}>
                          {t(statusLabelKey)}
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{formName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {`${t('myRequests.table.kpis')}: ${item.totalKPIs}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                        {formatDate(item.submittedAt ?? item.enteredAt, locale)}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: '8px' }} onClick={(event) => event.stopPropagation()}>
                        <Button variant="outlined" onClick={() => handleViewDetails(item.submissionId)} sx={{ flex: 1, textTransform: 'none' }}>
                          {t('myRequests.actions.view')}
                        </Button>
                        <Button
                          variant="outlined"
                          disabled={exportingId !== null}
                          onClick={() => { void handleExport(item.submissionId); }}
                          sx={{ flex: 1, textTransform: 'none' }}>
                          {t('myRequests.export')}
                        </Button>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
            <TableContainer sx={{ display: isMobile ? 'none' : 'block' }}>
              <Table aria-label={t('myRequests.tableAriaLabel')}>

                {/* Header */}
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.05) }}>
                    {TABLE_COLUMNS.map((col) => (
                      <TableCell
                        key={col.id}
                        align={col.align ?? 'left'}
                        sx={{
                          minWidth: col.minWidth,
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          color: 'text.primary',
                          borderBottom: '1px solid',
                          borderBottomColor: 'divider',
                          whiteSpace: 'nowrap',
                          py: 1.75,
                          px: 2,
                        }}>
                        {t(col.labelKey)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                {/* Body */}
                <TableBody>
                  {isLoading || isRefetching ? (
                    <TableSkeletonRows />
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={TABLE_COLUMNS.length} sx={{ border: 0, py: 0 }}>
                        <NoData message={t('myRequests.noData')} />
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => {
                      const formName = isAr ? item.formNameAr : item.formNameEn;
                      // List API only returns the EN directorate name
                      const status = mapApiStatus(item.status);
                      const statusStyle = getStatusBadgeStyles(status, theme);

                      // Translation key for the status pill
                      const statusLabelKey = `myRequests.status.${status.toLowerCase()}`;

                      return (
                        <TableRow
                          key={item.submissionId}
                          hover
                          sx={{
                            cursor: 'pointer',
                            transition: 'background-color 0.12s ease',
                            '& td': { borderBottom: '1px solid', borderBottomColor: 'divider', py: isMobile ? 3 : 1.5, px: isMobile ? 3 : 2 },
                            '&:last-child td': { borderBottom: 0 },


                          }}
                          onClick={() => handleViewDetails(item.submissionId)}>

                          {/* Reference number */}
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700, color: 'text.secondary', fontFamily: 'monospace' }}>
                              {item.referenceNumber}
                            </Typography>
                          </TableCell>

                          {/* KPI Form — two-line clamp */}
                          <TableCell>
                            <Tooltip title={formName} arrow placement="top-start">
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 500,
                                  maxWidth: 220,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  lineHeight: 1.45,
                                }}>
                                {formName}
                              </Typography>
                            </Tooltip>
                          </TableCell>

                          {/* Directorate */}
                          {/* <TableCell>
                            <Tooltip title={directorate} arrow placement="top-start">
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'text.secondary',
                                  maxWidth: 200,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}>
                                {directorate}
                              </Typography>
                            </Tooltip>
                          </TableCell> */}

                          {/* Period */}
                          {/* <TableCell align="center">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {periodLabel}
                            </Typography>
                          </TableCell> */}

                          {/* KPI count */}
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {item.totalKPIs}
                            </Typography>
                          </TableCell>

                          {/* Entered at (submitted column) */}
                          <TableCell>
                            <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                              {formatDate(item.enteredAt, locale)}
                            </Typography>
                          </TableCell>

                          {/* Last date — submittedAt if available, otherwise enteredAt */}
                          <TableCell>
                            <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                              {formatDate(item.submittedAt ?? item.enteredAt, locale)}
                            </Typography>
                          </TableCell>

                          {/* Status pill */}
                          <TableCell align="center">
                            <Box
                              component="span"
                              sx={{
                                display: 'inline-block',
                                px: 1.75, py: 0.4,
                                borderRadius: 10,
                                bgcolor: statusStyle.bg,
                                color: statusStyle.color,
                                fontWeight: 700,
                                fontSize: '0.72rem',
                                border: `1px solid ${alpha(statusStyle.color, 0.25)}`,
                                whiteSpace: 'nowrap',
                              }}>
                              {t(statusLabelKey)}
                            </Box>
                          </TableCell>

                          {/* Actions — stop row-click propagation */}
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'center' }}>

                              {/* View */}
                              <Tooltip title={t('myRequests.actions.view')} arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewDetails(item.submissionId)}
                                  sx={{
                                    width: 30, height: 30,
                                    border: '1px solid',
                                    borderColor: alpha(theme.palette.info.main, 0.45),
                                    borderRadius: 1.5,
                                    color: 'info.main',
                                    bgcolor: alpha(theme.palette.info.main, 0.05),
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.info.main, 0.12),
                                      borderColor: 'info.main',
                                    },
                                  }}>
                                  <VisibilityOutlinedIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                              </Tooltip>

                              {/* Export DOCX */}
                              <Tooltip title={t('myRequests.export')} arrow>
                                <span>
                                  <IconButton
                                    size="small"
                                    disabled={exportingId !== null}
                                    onClick={() => { void handleExport(item.submissionId); }}
                                    sx={{
                                      width: 30, height: 30,
                                      border: '1px solid',
                                      borderColor: exportingId === item.submissionId
                                        ? alpha(theme.palette.secondary.main, 0.25)
                                        : alpha(theme.palette.secondary.main, 0.45),
                                      borderRadius: 1.5,
                                      color: 'secondary.main',
                                      bgcolor: alpha(theme.palette.secondary.main, 0.05),
                                      '&:hover': {
                                        bgcolor: alpha(theme.palette.secondary.main, 0.12),
                                        borderColor: 'secondary.main',
                                      },
                                      '&.Mui-disabled': { opacity: 0.45 },
                                    }}>
                                    {exportingId === item.submissionId ? (
                                      <CircularProgress size={13} sx={{ color: 'secondary.main' }} />
                                    ) : (
                                      <FileDownloadOutlinedIcon sx={{ fontSize: 15 }} />
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>

                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <PaginationFooter
              totalCount={totalCount}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              onRefresh={() => { void refetch(); }}
              isFetching={isFetching}
            />
          </Paper>

        </div>
      </Container>

      {/* ── Delete confirmation ── */}
      <ConfirmationDialog
        open={deleteTarget !== null}
        title={t('myRequests.delete.title')}
        description={
          deleteTarget !== null
            ? `${t('myRequests.delete.description')} "${deleteTarget.referenceNumber}"?`
            : ''
        }
        confirmText={t('myRequests.delete.confirm')}
        cancelText={t('myRequests.actions.cancel')}
        confirmColor="error"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  );
};

export default MyRequests;
