import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import HeroBanner from '../shared/HeroBanner';
import { useAuth } from '../../core/context/AuthContext';
import { useGetMySubmissions } from '../../core/hooks/useFormApi';
import { useDeviceType } from '../../core/hooks/useDeviceType';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SubmissionStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'returned';

// ---------------------------------------------------------------------------
// Module-level constants (stable across renders)
// ---------------------------------------------------------------------------

const STATUS_COLOR: Record<SubmissionStatus, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  draft: 'default',
  submitted: 'warning',
  approved: 'success',
  rejected: 'error',
  returned: 'info',
};

const COLUMN_KEYS: readonly string[] = [
  'home.recent.requestNo',
  'home.recent.form',
  'home.recent.period',
  'home.recent.status',
  'home.recent.submitted',
];

/** Maps the API's Pascal-case status to the home page's SubmissionStatus union */
const toSubmissionStatus = (apiStatus: string): SubmissionStatus => {
  const map: Record<string, SubmissionStatus> = {
    Draft: 'draft',
    Submitted: 'submitted',
    Approved: 'approved',
    Rejected: 'rejected',
    Returned: 'returned',
  };
  return map[apiStatus] ?? 'draft';
};

/** Formats an ISO date string to a short readable date (e.g. "15 Mar 2026") */
const formatDate = (iso: string | null, locale: string): string => {
  if (iso === null) return '—';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(locale, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric', hour12: true });
};

// ---------------------------------------------------------------------------
// Skeleton rows shown while the API is loading
// ---------------------------------------------------------------------------

const RecentRowSkeleton: React.FC = () => (
  <>
    {[1, 2, 3].map((i) => (
      <Box key={i}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr',
            gap: 1,
            px: 1,
            py: 1.5,
          }}>
          {[1, 2, 3, 4, 5].map((j) => (
            <Skeleton key={j} variant="text" height={20} />
          ))}
        </Box>
        {i < 3 && <Divider />}
      </Box>
    ))}
  </>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Home: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { userInfo, userRoles } = useAuth();

  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  
  const isAr = i18n.language === 'ar';
  const locale = isAr ? 'ar' : 'en';

  const isApprover = userRoles.includes("APPROVER");

  // Fetch the 5 most recent submissions for the home page summary table
  const { data, isLoading, isError } = useGetMySubmissions({ page: 1, pageSize: 5 });

  const recentItems = data?.items ?? [];
  // The API still returns a status breakdown. Home only shows the overall total.
  const totalCount = data?.counters.total ?? 0;

  // Resolve greeting name from the backend session (bilingual).
  const userName: string | null =
    userInfo !== null
      ? (isAr ? userInfo?.fullNameAr : userInfo?.fullNameEn) ?? null
      : null;

  const greeting =
    typeof userName === 'string' && userName.trim().length > 0
      ? t('home.greeting', { name: userName })
      : t('home.greetingGeneric');

  const handleNewRequest = (): void => {
    navigate('/my-requests/new');
  };

  const handleMyRequests = (): void => {
    navigate('/my-requests');
  };

  return (
    <Box component="main" sx={{ minHeight: '100vh', pb: 8 }}>
      <Container maxWidth="xl">

        {/* ---------------------------------------------------------------- */}
        {/* Hero Banner                                                       */}
        {/* ---------------------------------------------------------------- */}
        <HeroBanner
          title={greeting}
          subtitle={t('home.subtitle')}
          badgeLabel={t('login.tagline')}
          BadgeIcon={HomeWorkIcon}
        />

        {/* ---------------------------------------------------------------- */}
        {/* Total requests — one full-width summary, no status breakdown     */}
        {/* ---------------------------------------------------------------- */}
        <Paper
          data-tour="home-stats"
          elevation={0}
          sx={{
            marginBlock: { xs: '16px', md: 4 },
            p: { xs: '16px', md: 3 },
            borderRadius: { xs: '16px', md: '20px' },
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: 'background.paper',
            backgroundImage: `linear-gradient(${theme.direction === 'rtl' ? 'to left' : 'to right'}, ${alpha(theme.palette.primary.main, 0.08)}, transparent 46%)`,
            display: 'flex',
            alignItems: 'center',
            gap: { xs: '12px', md: 2.5 },
            minWidth: 0,
          }}>
          <Box
            sx={{
              width: { xs: 44, md: 52 },
              height: { xs: 44, md: 52 },
              borderRadius: '14px',
              backgroundColor: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
            <AssignmentIcon fontSize={isMobile ? 'small' : 'medium'} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ fontSize: { xs: '0.95rem', md: '1.05rem' }, overflowWrap: 'anywhere' }}>
              {t('home.stats.total')}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: 'block', mt: '4px', lineHeight: 1.5, overflowWrap: 'anywhere' }}>
              {t('home.stats.totalDesc')}
            </Typography>
          </Box>

          {isLoading ? (
            <Skeleton variant="text" width={56} height={48} sx={{ flexShrink: 0 }} />
          ) : (
            <Typography
              variant="h3"
              fontWeight={800}
              lineHeight={1}
              sx={{
                color: isError ? 'text.disabled' : 'primary.main',
                fontSize: { xs: '1.75rem', md: '2.25rem' },
                flexShrink: 0,
                fontVariantNumeric: 'tabular-nums',
              }}>
              {isError ? '—' : totalCount}
            </Typography>
          )}
        </Paper>

        {/* ---------------------------------------------------------------- */}
        {/* Quick Actions + Recent Submissions                                */}
        {/* ---------------------------------------------------------------- */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            gap: { xs: '16px', md: 4 },
          }}>

          {/* Quick Actions ------------------------------------------------ */}
          <Box data-tour="home-quick-actions" sx={{ width: { xs: '100%', lg: '340px' }, flexShrink: 0 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: '16px', md: 3 },
                borderRadius: { xs: '16px', md: '20px' },
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: 'background.paper',
                height: '100%',
              }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.5 }}>
                {t('home.quickActions.title')}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                {/* New Request */}
                {!isApprover && (
                  <Box
                    role="button"
                    tabIndex={0}
                    onClick={handleNewRequest}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleNewRequest(); }}
                    sx={{
                      p: { xs: '14px', md: 2.5 },
                      borderRadius: '16px',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      outline: 'none',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        borderColor: theme.palette.primary.main,
                      },
                      '&:focus-visible': {
                        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.3)}`,
                      },
                    }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '10px',
                          backgroundColor: alpha(theme.palette.primary.main, 0.12),
                          color: theme.palette.primary.main,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <AddCircleOutlineIcon fontSize="small" />
                      </Box>
                      <Typography variant="subtitle2" fontWeight={700} color="primary">
                        {t('home.quickActions.newRequest')}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.5 }}>
                      {t('home.quickActions.newRequestDesc')}
                    </Typography>
                  </Box>
                )}


                {/* View Requests */}
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={handleMyRequests}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleMyRequests(); }}
                  sx={{
                    p: { xs: '14px', md: 2.5 },
                    borderRadius: '16px',
                    border: `1px solid ${theme.palette.divider}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.1),
                      borderColor: theme.palette.text.secondary,
                    },
                    '&:focus-visible': {
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.text.primary, 0.15)}`,
                    },
                  }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        backgroundColor: alpha(theme.palette.text.primary, 0.06),
                        color: theme.palette.text.secondary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <ListAltIcon fontSize="small" />
                    </Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {t('home.quickActions.viewRequests')}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.5 }}>
                    {t('home.quickActions.viewRequestsDesc')}
                  </Typography>
                </Box>

              </Box>
            </Paper>
          </Box>

          {/* Recent Submissions ------------------------------------------- */}
          <Box data-tour="home-recent" sx={{ flex: 1, minWidth: 0 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: '16px', md: 3 },
                borderRadius: { xs: '16px', md: '20px' },
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: 'background.paper',
              }}>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  mb: 2.5,
                }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {t('home.recent.title')}
                </Typography>
                <Button
                  size="small"
                  endIcon={isAr ? <ArrowBackIcon sx={{ fontSize: '0.9rem' }} /> : <ArrowForwardIcon sx={{ fontSize: '0.9rem' }} />}
                  onClick={handleMyRequests}
                  sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
                  {t('home.recent.viewAll')}
                </Button>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Column headers — the phone layout uses cards instead of this grid. */}
              {!isMobile && (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr',
                    gap: 1,
                    px: 1,
                    mb: 1,
                  }}>
                  {COLUMN_KEYS.map((key) => (
                    <Typography
                      key={key}
                      variant="caption"
                      color="text.disabled"
                      fontWeight={600}
                      noWrap>
                      {t(key)}
                    </Typography>
                  ))}
                </Box>
              )}

              {/* API error state */}
              {isError && !isLoading && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {t('common.errorLoading')}
                </Alert>
              )}

              {/* Loading skeleton */}
              {isLoading && (isMobile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[1, 2, 3].map((row) => (
                    <Skeleton key={row} variant="rounded" height={72} />
                  ))}
                </Box>
              ) : (
                <RecentRowSkeleton />
              ))}

              {/* Empty state */}
              {!isLoading && !isError && recentItems.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                  {t('home.recent.empty')}
                </Typography>
              )}

              {/* Rows from API */}
              {!isLoading && !isError && recentItems.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {recentItems.map((item, index) => {
                    const status = toSubmissionStatus(item.status);
                    const formName = isAr ? item.formNameAr : item.formNameEn;
                    const periodLabel = new Date(item.reportingDate).toLocaleDateString(locale, {
                      month: 'short',
                      year: 'numeric',
                    });

                    return (
                      <Box key={item.submissionId}>
                        <Box
                          role="button"
                          tabIndex={0}
                          onClick={handleMyRequests}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleMyRequests(); }}
                          sx={{
                            display: isMobile ? 'flex' : 'grid',
                            flexDirection: 'column',
                            gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr',
                            gap: isMobile ? '6px' : 1,
                            px: isMobile ? '12px' : 1,
                            py: isMobile ? '12px' : 1.5,
                            mb: isMobile ? '8px' : 0,
                            borderRadius: '12px',
                            border: isMobile ? `1px solid ${theme.palette.divider}` : 'none',
                            cursor: 'pointer',
                            outline: 'none',
                            minWidth: 0,
                            transition: 'background 0.15s',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.action.hover, 0.1),
                            },
                            '&:focus-visible': {
                              boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)}`,
                            },
                          }}>

                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{ color: 'primary.main', overflowWrap: 'anywhere', minWidth: 0 }}>
                              {item.referenceNumber}
                            </Typography>
                            {isMobile && (
                              <Chip
                                label={t(`myRequests.status.${status}`)}
                                color={STATUS_COLOR[status]}
                                size="small"
                                sx={{ fontSize: '0.7rem', height: 22, fontWeight: 600, flexShrink: 0 }}
                              />
                            )}
                          </Box>

                          <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }} noWrap={!isMobile}>
                            {formName}
                          </Typography>

                          {!isMobile && (
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {periodLabel}
                            </Typography>
                          )}

                          {!isMobile && (
                            <Chip
                              label={t(`myRequests.status.${status}`)}
                              color={STATUS_COLOR[status]}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 22, fontWeight: 600 }}
                            />
                          )}

                          {isMobile ? (
                            <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                              {`${periodLabel} · ${formatDate(item.enteredAt, locale)}`}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {formatDate(item.enteredAt, locale)}
                            </Typography>
                          )}

                        </Box>
                        {!isMobile && index < recentItems.length - 1 && <Divider />}
                      </Box>
                    );
                  })}
                </Box>
              )}

            </Paper>
          </Box>
        </Box>

      </Container>
    </Box>
  );
};

export default Home;
