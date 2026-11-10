import React from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { SurfaceCard } from '../shared/ui';
import { ADMIN_TONES } from '../shared/theme/adminTokens';
import { formatAction, formatDayLabel } from './format';
import type { AuditInsights, RankPoint } from './insights';
import { colorForAction, initialsOf } from './presentation';

interface AuditChartsProps {
  insights: AuditInsights | null;
  isLoading: boolean;
  total: number;
  sampleSize: number;
  userName: (userId: string) => string;
}

const EmptyChart: React.FC<{ message: string }> = ({ message }) => (
  <Box sx={{ py: 5, textAlign: 'center' }}>
    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
      {message}
    </Typography>
  </Box>
);

const ActionDonut: React.FC<{ insights: AuditInsights }> = ({ insights }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const total = insights.actionCounts.reduce((sum, item) => sum + item.count, 0);
  const size = 176;
  const stroke = 20;
  const radius = (size - stroke) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let consumed = 0;
  const arcs = insights.actionCounts.map((item, index) => {
    const fraction = total === 0 ? 0 : item.count / total;
    const length = fraction * circumference;
    const arc = {
      ...item,
      color: colorForAction(item.id, index),
      full: fraction >= 0.999,
      dasharray: `${length} ${Math.max(circumference - length, 0)}`,
      dashoffset: -consumed,
    };
    consumed += length;
    return arc;
  });

  if (total === 0) return <EmptyChart message={t('auditLogs.charts.empty')} />;

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
      <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <Box component="svg" viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden>
          <circle cx={center} cy={center} r={radius} fill="none" stroke={theme.palette.divider} strokeWidth={stroke} />
          <g transform={`rotate(-90 ${center} ${center})`}>
            {arcs.map((arc) => (
              <circle
                key={arc.id}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={stroke}
                strokeDasharray={arc.full ? undefined : arc.dasharray}
                strokeDashoffset={arc.full ? undefined : arc.dashoffset}
                strokeLinecap="butt"
              />
            ))}
          </g>
        </Box>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.85rem', lineHeight: 1 }}>{total}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            {t('auditLogs.charts.eventsLabel')}
          </Typography>
        </Box>
      </Box>

      <Stack spacing={1.25} sx={{ width: '100%', minWidth: 0 }}>
        {arcs.map((arc) => {
          const percent = total === 0 ? 0 : Math.round((arc.count / total) * 100);
          return (
            <Stack key={arc.id} direction="row" alignItems="center" spacing={1.25}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: arc.color, flexShrink: 0 }} />
              <Typography sx={{ flex: 1, fontWeight: 700 }} noWrap>
                {formatAction(arc.id, t)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                {`${String(percent)}%`}
              </Typography>
              <Typography sx={{ width: 28, fontWeight: 800, textAlign: 'end' }}>{arc.count}</Typography>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
};

const ActivityChart: React.FC<{ insights: AuditInsights; locale: string }> = ({ insights, locale }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const points = insights.daily;
  if (points.length === 0) return <EmptyChart message={t('auditLogs.charts.empty')} />;

  const max = Math.max(1, ...points.map((point) => point.count));
  const labelStep = points.length <= 8 ? 1 : Math.ceil(points.length / 6);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 0.75,
        height: 228,
        overflowX: 'auto',
        pb: 0.5,
      }}>
      {points.map((point, index) => {
        const showLabel = index % labelStep === 0 || index === points.length - 1;
        const height = point.count === 0 ? 6 : `${String(Math.max(10, Math.round((point.count / max) * 100)))}%`;
        const label = formatDayLabel(point.date, locale);
        return (
          <Box
            key={point.date}
            sx={{ flex: '1 0 34px', maxWidth: 64, minWidth: 34, display: 'flex', flexDirection: 'column' }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 800, textAlign: 'center', minHeight: 18, color: 'text.secondary' }}>
              {points.length <= 14 ? String(point.count) : ''}
            </Typography>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'flex-end',
                borderRadius: '10px',
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                px: 0.4,
                pb: 0.4,
              }}>
              <Tooltip title={t('auditLogs.charts.dayTip', { day: label, count: point.count })} arrow>
                <Box
                  sx={{
                    width: '100%',
                    height,
                    borderRadius: '8px',
                    background:
                      point.count === 0
                        ? alpha(theme.palette.text.primary, 0.1)
                        : ADMIN_TONES.indigo.gradient,
                    transition: 'transform 0.2s ease',
                    '&:hover': { transform: 'translateY(-4px)' },
                  }}
                />
              </Tooltip>
            </Box>
            <Typography
              variant="caption"
              sx={{
                mt: 0.75,
                textAlign: 'center',
                fontWeight: 700,
                visibility: showLabel ? 'visible' : 'hidden',
                color: 'text.secondary',
              }}>
              {label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

interface RankListProps {
  items: RankPoint[];
  tone: string;
  empty: string;
  renderLabel: (id: string) => string;
  showAvatar?: boolean;
}

const RankList: React.FC<RankListProps> = ({ items, tone, empty, renderLabel, showAvatar = false }) => {
  if (items.length === 0) return <EmptyChart message={empty} />;
  const max = Math.max(1, ...items.map((item) => item.count));

  return (
    <Stack spacing={1.5}>
      {items.map((item, index) => {
        const width = Math.max(10, Math.round((item.count / max) * 100));
        const label = renderLabel(item.id);
        return (
          <Stack key={item.id} direction="row" alignItems="center" spacing={1.25}>
            <Typography
              variant="caption"
              sx={{ width: 18, fontWeight: 800, color: 'text.secondary', flexShrink: 0 }}>
              {index + 1}
            </Typography>
            {showAvatar && (
              <Avatar sx={{ width: 28, height: 28, fontSize: 11, fontWeight: 800, bgcolor: alpha(tone, 0.16), color: tone }}>
                {initialsOf(label)}
              </Avatar>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Tooltip title={label}>
                <Typography sx={{ fontWeight: 700, mb: 0.4 }} noWrap>
                  {label}
                </Typography>
              </Tooltip>
              <Box sx={{ height: 7, borderRadius: 99, bgcolor: alpha(tone, 0.12), overflow: 'hidden' }}>
                <Box sx={{ width: `${String(width)}%`, height: '100%', borderRadius: 99, bgcolor: tone }} />
              </Box>
            </Box>
            <Typography sx={{ fontWeight: 800, minWidth: 28, textAlign: 'end' }}>{item.count}</Typography>
          </Stack>
        );
      })}
    </Stack>
  );
};

const AuditCharts: React.FC<AuditChartsProps> = ({ insights, isLoading, total, sampleSize, userName }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const locale = i18n.language === 'ar' ? 'ar' : 'en';
  const shown = Math.min(sampleSize, total);

  if (isLoading || insights === null) {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.35fr' }, gap: 2 }}>
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: '20px' }} />
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: '20px' }} />
      </Box>
    );
  }

  const sampleHint =
    shown < total ? t('auditLogs.charts.sample', { shown, total }) : t('auditLogs.charts.sampleAll');

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 0.9fr) minmax(0, 1.35fr)' }, gap: 2 }}>
        <SurfaceCard tone="indigo" title={t('auditLogs.charts.actions')} subtitle={t('auditLogs.charts.actionsHint')}>
          <ActionDonut insights={insights} />
        </SurfaceCard>
        <SurfaceCard tone="cyan" title={t('auditLogs.charts.activity')} subtitle={sampleHint}>
          <ActivityChart insights={insights} locale={locale} />
        </SurfaceCard>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
        <SurfaceCard
          tone="indigo"
          title={t('auditLogs.charts.submissions')}
          subtitle={t('auditLogs.charts.submissionsHint')}>
          <RankList
            items={insights.submissions}
            tone={theme.palette.primary.main}
            empty={t('auditLogs.charts.empty')}
            renderLabel={(id) => `#${id}`}
          />
        </SurfaceCard>
        <SurfaceCard tone="cyan" title={t('auditLogs.charts.fields')} subtitle={t('auditLogs.charts.fieldsHint')}>
          <RankList
            items={insights.fields}
            tone={ADMIN_TONES.cyan.main}
            empty={t('auditLogs.charts.empty')}
            renderLabel={(id) => id}
          />
        </SurfaceCard>
        <SurfaceCard tone="amber" title={t('auditLogs.charts.actors')} subtitle={t('auditLogs.charts.actorsHint')}>
          <RankList
            items={insights.actors}
            tone={ADMIN_TONES.amber.main}
            empty={t('auditLogs.charts.empty')}
            renderLabel={(id) => userName(id)}
            showAvatar
          />
        </SurfaceCard>
      </Box>
    </Stack>
  );
};

export default AuditCharts;
