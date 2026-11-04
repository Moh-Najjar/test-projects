import React, { useState, useCallback } from 'react';
import Stepper from './Stepper';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Breadcrumbs from '../shared/Breadcrumbs';
import HeroBanner from '../shared/HeroBanner';
import { useTranslation } from 'react-i18next';
import { useTheme, alpha } from '@mui/material/styles';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SpeedIcon from '@mui/icons-material/Speed';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { useDeviceType } from '../../core/hooks/useDeviceType';
import { useAuth } from '../../core/context/AuthContext';

/**
 * NewRequest Module
 * This page provides a structured container for the KPI submission stepper.
 * It includes breadcrumbs, a title header, and a summary/info panel to guide the user.
 */
const NewRequest: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  const { userInfo } = useAuth();
  const { directorateNameAr, directorateNameEn, activePeriodLabel,
    activePeriodLabelAr, kpiFormNameEn, kpiFormNameAr } = userInfo ?? {};

  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';

  // Local state to track progress from the Stepper component
  const [progress, setProgress] = useState({ current: 0, total: 1 });

  // Wrapped in useCallback so the reference is stable across re-renders.
  // Without this, every setProgress call creates a new function reference,
  // which triggers the useEffect in Stepper that depends on onStepChange,
  // which calls setProgress again — causing an infinite update loop.
  const handleStepChange = useCallback((current: number, total: number) => {
    setProgress({ current, total });
  }, []);

  const progressValue = ((progress.current + 1) / progress.total) * 100;

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        pb: 8
      }}
    >
      <Container maxWidth="xl">
        {/* Navigation context */}
        <Breadcrumbs />

        {/* Hero Banner */}
        <HeroBanner
          title={t('newRequest.pageTitle')}
          subtitle={t('newRequest.subtitle')}
          badgeLabel={t('myRequests.addNewRequest')}
          BadgeIcon={AssignmentTurnedInIcon}
        />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: isMobile ? '16px' : 4 }}>
          {/* Main Content Area - Stepper */}
          <Box data-tour="stepper-container" sx={{ flex: 1, minWidth: 0 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: '12px', md: 4 },
                borderRadius: '24px',
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: 'background.paper',
                boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.03)}`
              }}
            >
              <Stepper onStepChange={handleStepChange} />
            </Paper>
          </Box>

          {/* Sidebar - Request Summary & Guidelines */}
          <Box data-tour="progress-sidebar" sx={{ width: { xs: '100%', lg: '350px' }, display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : 3 }}>

            {/* Completion Progress Card */}
            <Paper
              elevation={0}
              sx={{
                p: isMobile ? '16px' : 3,
                borderRadius: '20px',
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: 'background.paper',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <SpeedIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight="bold">
                    {t('newRequest.progress.title', { defaultValue: 'Completion Progress' })}
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight="bold" color="primary">
                  {Math.round(progressValue)}%
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={progressValue}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                  }
                }}
              />

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {t('newRequest.progress.stepInfo', {
                  current: progress.current + 1,
                  total: progress.total,
                  defaultValue: `Step ${progress.current + 1} of ${progress.total}`
                })}
              </Typography>
            </Paper>

            {/* Quick Summary / Status Card */}
            <Paper
              elevation={0}
              sx={{
                p: isMobile ? '16px' : 3,
                borderRadius: '20px',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <AssignmentIcon color="action" />
                <Typography variant="subtitle1" fontWeight="bold">
                  {t('newRequest.summary.title', { defaultValue: 'Request Information' })}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.disabled" display="block" gutterBottom>
                    {t('myRequests.table.form')}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {i18n.language === 'ar' ? kpiFormNameAr : kpiFormNameEn}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.disabled" display="block" gutterBottom>
                    {t('myRequests.table.directorate')}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {i18n.language === 'ar' ? directorateNameAr : directorateNameEn}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.disabled" display="block" gutterBottom>
                    {t('myRequests.table.period')}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {i18n.language === 'ar' ?
                      activePeriodLabelAr ? activePeriodLabelAr : '-'
                      : activePeriodLabel ? activePeriodLabel : '-'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.disabled" display="block" gutterBottom>
                    {t('myRequests.table.status')}
                  </Typography>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '99px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: alpha(theme.palette.info.main, 0.1),
                      color: theme.palette.info.main
                    }}
                  >
                    {t('myRequests.status.draft')}
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* Guidelines Card */}
            <Paper
              elevation={0}
              sx={{
                p: isMobile ? '16px' : 3,
                borderRadius: '20px',
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
                border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <InfoOutlinedIcon color="primary" />
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {t('newRequest.guidelines.title')}
                </Typography>
              </Box>
              <Box component="ul" sx={{ m: 0, pl: 2, '& li': { mb: 1.5, color: 'text.secondary', fontSize: '0.9rem' } }}>
                <li>{t('newRequest.guidelines.item1')}</li>
                <li>{t('newRequest.guidelines.item2')}</li>
                <li>{t('newRequest.guidelines.item4')}</li>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default NewRequest;
