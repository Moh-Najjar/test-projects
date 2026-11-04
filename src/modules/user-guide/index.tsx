import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import { alpha, useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

import LoginIcon from '@mui/icons-material/LockOpen';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import StepsIcon from '@mui/icons-material/AccountTree';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TourIcon from '@mui/icons-material/EmojiObjects';

import HeroBanner from '../shared/HeroBanner';
import { useTour } from '../../core/context/TourContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GuideStep {
  stepNumber: number;
  icon: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
  tipKeys: [string, string, string];
  color: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const UserGuide: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { startTour } = useTour();

  // Guide steps reference i18n keys; colors come from the MUI theme.
  const guideSteps: GuideStep[] = useMemo(
    () => [
      {
        stepNumber: 1,
        icon: <LoginIcon />,
        titleKey: 'userGuide.steps.login.title',
        descriptionKey: 'userGuide.steps.login.description',
        tipKeys: [
          'userGuide.steps.login.tip1',
          'userGuide.steps.login.tip2',
          'userGuide.steps.login.tip3',
        ],
        color: theme.palette.primary.main,
      },
      {
        stepNumber: 2,
        icon: <DashboardIcon />,
        titleKey: 'userGuide.steps.home.title',
        descriptionKey: 'userGuide.steps.home.description',
        tipKeys: [
          'userGuide.steps.home.tip1',
          'userGuide.steps.home.tip2',
          'userGuide.steps.home.tip3',
        ],
        color: theme.palette.info.main,
      },
      {
        stepNumber: 3,
        icon: <ListAltIcon />,
        titleKey: 'userGuide.steps.requests.title',
        descriptionKey: 'userGuide.steps.requests.description',
        tipKeys: [
          'userGuide.steps.requests.tip1',
          'userGuide.steps.requests.tip2',
          'userGuide.steps.requests.tip3',
        ],
        color: theme.palette.warning.main,
      },
      {
        stepNumber: 4,
        icon: <AddCircleOutlineIcon />,
        titleKey: 'userGuide.steps.newRequest.title',
        descriptionKey: 'userGuide.steps.newRequest.description',
        tipKeys: [
          'userGuide.steps.newRequest.tip1',
          'userGuide.steps.newRequest.tip2',
          'userGuide.steps.newRequest.tip3',
        ],
        color: theme.palette.success.main,
      },
      {
        stepNumber: 5,
        icon: <StepsIcon />,
        titleKey: 'userGuide.steps.fillSteps.title',
        descriptionKey: 'userGuide.steps.fillSteps.description',
        tipKeys: [
          'userGuide.steps.fillSteps.tip1',
          'userGuide.steps.fillSteps.tip2',
          'userGuide.steps.fillSteps.tip3',
        ],
        color: theme.palette.secondary.main,
      },
      {
        stepNumber: 6,
        icon: <SendIcon />,
        titleKey: 'userGuide.steps.submit.title',
        descriptionKey: 'userGuide.steps.submit.description',
        tipKeys: [
          'userGuide.steps.submit.tip1',
          'userGuide.steps.submit.tip2',
          'userGuide.steps.submit.tip3',
        ],
        color: theme.palette.error.main,
      },
    ],
    // Re-compute only when theme colors change (language changes are handled by t()).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      theme.palette.primary.main,
      theme.palette.info.main,
      theme.palette.warning.main,
      theme.palette.success.main,
      theme.palette.secondary.main,
      theme.palette.error.main,
    ]
  );

  return (
    <Box component="main" sx={{ minHeight: '100vh', pb: 8 }}>
      <Container maxWidth="lg">

        {/* ── Hero Banner ── */}
        <HeroBanner
          title={t('userGuide.hero.title')}
          subtitle={t('userGuide.hero.subtitle')}
          badgeLabel={t('userGuide.hero.badge')}
          BadgeIcon={CheckCircleIcon}
        />

        {/* ── Interactive Tour Prompt ── */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: '16px', md: 3 },
            mb: { xs: '16px', md: 4 },
            borderRadius: '20px',
            border: `1.5px dashed ${alpha(theme.palette.primary.main, 0.4)}`,
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '14px',
                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                color: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
              <TourIcon />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} color="primary">
                {t('userGuide.tour.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('userGuide.tour.subtitle')}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<TourIcon />}
            onClick={startTour}
            sx={{
              borderRadius: '10px',
              fontWeight: 700,
              textTransform: 'none',
              whiteSpace: 'normal',
              width: { xs: '100%', sm: 'auto' },
              px: 3,
            }}>
            {t('userGuide.tour.startBtn')}
          </Button>
        </Paper>

        {/* ── Step-by-step Guide Cards ── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {guideSteps.map((item) => (
            <Paper
              key={item.stepNumber}
              elevation={0}
              sx={{
                p: { xs: '16px', md: 3 },
                borderRadius: '20px',
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: 'background.paper',
                transition: 'box-shadow 0.2s',
                '&:hover': {
                  boxShadow: `0 4px 20px ${alpha(item.color, 0.1)}`,
                },
              }}>

              {/* Card header: icon + step chip + title + description */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '14px',
                    backgroundColor: alpha(item.color, 0.1),
                    color: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '1.4rem',
                  }}>
                  {item.icon}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                    <Chip
                      label={t('userGuide.step.label', { number: item.stepNumber })}
                      size="small"
                      sx={{
                        bgcolor: alpha(item.color, 0.12),
                        color: item.color,
                        fontWeight: 700,
                        fontSize: '0.72rem',
                      }}
                    />
                    <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                      {t(item.titleKey)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {t(item.descriptionKey)}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Tips list */}
              <Box>
                <Typography
                  variant="caption"
                  color="text.disabled"
                  fontWeight={600}
                  sx={{ mb: 1, display: 'block' }}>
                  {t('userGuide.tips.title')}
                </Typography>
                <Box
                  component="ul"
                  sx={{ m: 0, pl: 2.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {item.tipKeys.map((key) => (
                    <Box
                      key={key}
                      component="li"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.875rem',
                        lineHeight: 1.6,
                        '&::marker': { color: item.color },
                      }}>
                      {t(key)}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>

        {/* ── Bottom CTA ── */}
        <Paper
          elevation={0}
          sx={{
            mt: 4,
            p: 4,
            borderRadius: '20px',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.light, 0.04)})`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            textAlign: 'center',
          }}>
          <CheckCircleIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            {t('userGuide.cta.title')}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, maxWidth: 520, mx: 'auto' }}>
            {t('userGuide.cta.subtitle')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<TourIcon />}
            onClick={startTour}
            size="large"
            sx={{
              borderRadius: '10px',
              fontWeight: 700,
              textTransform: 'none',
              px: 4,
            }}>
            {t('userGuide.cta.btn')}
          </Button>
        </Paper>

      </Container>
    </Box>
  );
};

export default UserGuide;
