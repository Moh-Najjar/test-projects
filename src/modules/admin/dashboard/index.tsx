import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Skeleton,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import {
  PeopleAltRounded as UsersIcon,
  AccountTreeRounded as DirectoratesIcon,
  GroupsRounded as GroupsIcon,
  DynamicFormRounded as FormsIcon,
  HistoryRounded as AuditIcon,
  AutoStoriesRounded as DocsIcon,
  ArrowForwardRounded as ArrowIcon,
  NorthEastRounded as OpenIcon,
} from '@mui/icons-material';
import AdminLayout from '../shared/AdminLayout';
import { PageHeader, StatCard, SurfaceCard, IconTile } from '../shared/ui';
import type { AdminTone } from '../shared/theme/adminTokens';
import { ADMIN_TONES } from '../shared/theme/adminTokens';
import { useAdminUsers } from '../../../core/hooks/admin/useAdminUsers';
import { useAdminDirectorates } from '../../../core/hooks/admin/useAdminDirectorates';
import { useAdminForms } from '../../../core/hooks/admin/useAdminForms';
import { DOC_SECTIONS } from '../documentation/docContent';

// ─── Navigation cards ─────────────────────────────────────────────────────────

interface DashboardCard {
  labelKey: string;
  descriptionKey: string;
  path: string;
  icon: React.ReactNode;
  tone: AdminTone;
  actionKey: string;
}

const CARDS: DashboardCard[] = [
  {
    labelKey: 'admin.dashboard.cards.users.title',
    descriptionKey: 'admin.dashboard.cards.users.description',
    path: '/admin/users',
    icon: <UsersIcon />,
    tone: 'indigo',
    actionKey: 'admin.dashboard.cards.users.action',
  },
  {
    labelKey: 'admin.dashboard.cards.directorates.title',
    descriptionKey: 'admin.dashboard.cards.directorates.description',
    path: '/admin/directorates',
    icon: <DirectoratesIcon />,
    tone: 'amber',
    actionKey: 'admin.dashboard.cards.directorates.action',
  },
  {
    labelKey: 'admin.dashboard.cards.mappings.title',
    descriptionKey: 'admin.dashboard.cards.mappings.description',
    path: '/admin/group-mappings',
    icon: <GroupsIcon />,
    tone: 'cyan',
    actionKey: 'admin.dashboard.cards.mappings.action',
  },
  {
    labelKey: 'admin.dashboard.cards.forms.title',
    descriptionKey: 'admin.dashboard.cards.forms.description',
    path: '/admin/forms',
    icon: <FormsIcon />,
    tone: 'violet',
    actionKey: 'admin.dashboard.cards.forms.action',
  },
  {
    labelKey: 'admin.dashboard.cards.audit.title',
    descriptionKey: 'admin.dashboard.cards.audit.description',
    path: '/admin/audit-logs',
    icon: <AuditIcon />,
    tone: 'emerald',
    actionKey: 'admin.dashboard.cards.audit.action',
  },
];

const greetingKey = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'admin.dashboard.greeting.morning';
  if (hour < 18) return 'admin.dashboard.greeting.afternoon';
  return 'admin.dashboard.greeting.evening';
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Reuse existing list hooks so the KPI tiles reflect live data without extra APIs.
  const { data: usersData, isLoading: usersLoading } = useAdminUsers({ page: 1, pageSize: 1 });
  const { data: rawDirectorates, isLoading: directoratesLoading } = useAdminDirectorates();
  const { data: rawForms, isLoading: formsLoading } = useAdminForms();

  const directorates = Array.isArray(rawDirectorates) ? rawDirectorates : [];
  const forms = Array.isArray(rawForms) ? rawForms : [];
  const activeForms = forms.filter((form) => form.isActive).length;

  return (
    <AdminLayout>
      <PageHeader
        icon={<OpenIcon />}
        tone="indigo"
        eyebrow={t('admin.dashboard.eyebrow')}
        title={t('admin.dashboard.title', { greeting: t(greetingKey()) })}
        subtitle={t('admin.dashboard.subtitle')}
        actions={
          <Button variant="outlined" startIcon={<DocsIcon />} onClick={() => navigate('/admin/docs')}>
            {t('admin.dashboard.docs')}
          </Button>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard
          label={t('admin.dashboard.stats.users')}
          value={usersLoading ? <Skeleton width={48} /> : (usersData?.total ?? '—')}
          hint={t('admin.dashboard.stats.usersHint')}
          icon={<UsersIcon />}
          tone="indigo"
          index={0}
        />
        <StatCard
          label={t('admin.dashboard.stats.directorates')}
          value={directoratesLoading ? <Skeleton width={48} /> : directorates.length}
          hint={t('admin.dashboard.stats.directoratesHint')}
          icon={<DirectoratesIcon />}
          tone="amber"
          index={1}
        />
        <StatCard
          label={t('admin.dashboard.stats.forms')}
          value={formsLoading ? <Skeleton width={48} /> : forms.length}
          hint={t('admin.dashboard.stats.formsHint', { count: activeForms })}
          icon={<FormsIcon />}
          tone="violet"
          index={2}
        />
        <StatCard
          label={t('admin.dashboard.stats.guides')}
          value={DOC_SECTIONS.length}
          hint={t('admin.dashboard.stats.guidesHint')}
          icon={<DocsIcon />}
          tone="cyan"
          index={3}
        />
      </Box>

      <Grid container spacing={2.5}>
        {CARDS.map((card, index) => {
          const toneColor = ADMIN_TONES[card.tone].main;
          return (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={card.path}>
              <Card
                sx={{
                  height: '100%',
                  animation: `adminDashIn 0.45s ease-out ${index * 0.07}s both`,
                  '@keyframes adminDashIn': {
                    '0%': { opacity: 0, transform: 'translateY(14px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                  },
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    borderColor: alpha(toneColor, 0.45),
                    boxShadow: `0 22px 40px -24px ${alpha(toneColor, 0.7)}`,
                    '& .dash-arrow': { transform: 'translateX(4px)', color: toneColor },
                  },
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                }}
              >
                <CardActionArea onClick={() => navigate(card.path)} sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
                      <IconTile icon={card.icon} tone={card.tone} size={52} variant="solid" />
                      <Typography
                        variant="caption"
                        sx={{
                          px: 1.25,
                          py: 0.4,
                          borderRadius: '999px',
                          bgcolor: alpha(toneColor, 0.1),
                          color: toneColor,
                          fontWeight: 800,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {t('admin.common.module')}
                      </Typography>
                    </Stack>
                    <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>
                      {t(card.labelKey)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 64, fontWeight: 500 }}>
                      {t(card.descriptionKey)}
                    </Typography>
                    <Stack direction="row" alignItems="center" gap={0.75} className="dash-arrow">
                      <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
                        {t(card.actionKey)}
                      </Typography>
                      <ArrowIcon className="dash-arrow" sx={{ fontSize: 18, transition: 'transform 0.2s ease, color 0.2s ease' }} />
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <SurfaceCard
        sx={{ mt: 3 }}
        icon={<DocsIcon />}
        tone="cyan"
        title={t('admin.dashboard.help.title')}
        subtitle={t('admin.dashboard.help.subtitle')}
        actions={
          <Button component={RouterLink} to="/admin/docs" variant="contained" endIcon={<ArrowIcon />}>
            {t('admin.dashboard.help.action')}
          </Button>
        }
      >
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          {t('admin.dashboard.help.body')}
        </Typography>
      </SurfaceCard>
    </AdminLayout>
  );
};

export default AdminDashboard;
