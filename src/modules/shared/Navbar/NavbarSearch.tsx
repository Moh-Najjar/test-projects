import React, { useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Search from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { useGetMySubmissions } from '../../../core/hooks/useFormApi';
import type { SubmissionItem } from '../../../core/types/getMySubmissionsResponse';

interface NavbarSearchProps {
  /** Optional extra callback when the user picks a result. */
  onSearchSubmit?: (query: string) => void;
  /** Stretch the field to the parent width. Used by the mobile header. */
  fullWidth?: boolean;
}

interface PageTarget {
  id: string;
  title: string;
  to: string;
  keywords: readonly string[];
}

interface SearchHit {
  id: string;
  group: 'page' | 'request';
  title: string;
  subtitle: string;
  to: string;
}

const SEARCH_PAGE_SIZE = 150;
const MAX_REQUEST_HITS = 6;

/** Reads a text field that the API may omit or send as null. */
const readText = (value: unknown): string | null => (typeof value === 'string' ? value : null);

/** Case-insensitive substring check. Missing fields are treated as non-matches. */
const includesQuery = (value: unknown, query: string): boolean => {
  const text = readText(value);
  if (text === null || text.length === 0) {
    return false;
  }
  return text.toLowerCase().includes(query.toLowerCase());
};

/** Prefer the language-specific label, and fall back when the API omits it. */
const pickLabel = (primary: unknown, fallback: unknown): string => {
  const primaryText = readText(primary);
  if (primaryText !== null && primaryText.trim().length > 0) {
    return primaryText.trim();
  }
  const fallbackText = readText(fallback);
  if (fallbackText !== null && fallbackText.trim().length > 0) {
    return fallbackText.trim();
  }
  return '';
};

/** Maps the API status onto the existing translated status labels. */
const statusLabelKey = (status: unknown): string | null => {
  const text = readText(status);
  if (text === null) {
    return null;
  }
  const map: Record<string, string> = {
    Draft: 'myRequests.status.draft',
    Submitted: 'myRequests.status.submitted',
    Approved: 'myRequests.status.approved',
    Rejected: 'myRequests.status.rejected',
    Returned: 'myRequests.status.returned',
  };
  return map[text] ?? null;
};

const NavbarSearch: React.FC<NavbarSearchProps> = ({ onSearchSubmit, fullWidth = false }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const listId = useId();
  const anchorRef = useRef<HTMLFormElement | null>(null);

  const [query, setQuery] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const trimmedQuery = query.trim();
  const isAr = i18n.language === 'ar';
  // Request search starts at 2 characters so a single letter does not scan the list.
  const canSearchRequests = trimmedQuery.length >= 2;

  const { data, isFetching, isError } = useGetMySubmissions(
    { page: 1, pageSize: SEARCH_PAGE_SIZE },
    { enabled: open && canSearchRequests },
  );

  console.log('data', data);

  const pageTargets = useMemo<readonly PageTarget[]>(
    () => [
      {
        id: 'home',
        title: t('nav.home'),
        to: '/home',
        keywords: ['home', 'الرئيسية', 'الرئيسيه', t('nav.home')],
      },
      {
        id: 'my-requests',
        title: t('nav.my-requests'),
        to: '/my-requests',
        keywords: ['requests', 'my requests', 'طلباتي', 'طلبات', t('nav.my-requests')],
      },
      {
        id: 'new-request',
        title: t('nav.newRequest'),
        to: '/my-requests/new',
        keywords: ['new', 'new request', 'طلب جديد', 'اضافة', 'إضافة', t('nav.newRequest')],
      },
      {
        id: 'user-guide',
        title: t('nav.userGuide'),
        to: '/user-guide',
        keywords: ['guide', 'help', 'user guide', 'دليل', 'مساعدة', t('nav.userGuide')],
      },
    ],
    [t],
  );

  const hits = useMemo<readonly SearchHit[]>(() => {
    const pageHits: SearchHit[] = pageTargets
      .filter((page) => trimmedQuery.length === 0 || page.keywords.some((keyword) => includesQuery(keyword, trimmedQuery)))
      .map((page) => ({
        id: `page-${page.id}`,
        group: 'page',
        title: page.title,
        subtitle: page.to,
        to: page.to,
      }));

    const items: readonly SubmissionItem[] = data?.items ?? [];
    const requestHits: SearchHit[] = canSearchRequests
      ? items
          .filter((item) => {
            const statusKey = statusLabelKey(item.status);
            const statusLabel = statusKey === null ? item.status : t(statusKey);
            const fields = [
              item.referenceNumber,
              item.formNameEn,
              item.formNameAr,
              item.directorateNameEn,
              item.directorateNameAr,
              item.status,
              statusLabel,
            ];
            return fields.some((field) => includesQuery(field, trimmedQuery));
          })
          .slice(0, MAX_REQUEST_HITS)
          .map((item) => {
            const statusKey = statusLabelKey(item.status);
            const statusLabel = statusKey === null ? item.status : t(statusKey);
            const formName = pickLabel(
              isAr ? item.formNameAr : item.formNameEn,
              isAr ? item.formNameEn : item.formNameAr,
            );
            const directorate = pickLabel(
              isAr ? item.directorateNameAr : item.directorateNameEn,
              isAr ? item.directorateNameEn : item.directorateNameAr,
            );
            const subtitle = [readText(item.referenceNumber), directorate, readText(statusLabel)]
              .filter((part): part is string => part !== null && part.trim().length > 0)
              .join(' · ');
            return {
              id: `request-${String(item.submissionId)}`,
              group: 'request' as const,
              title: formName.length > 0 ? formName : subtitle,
              subtitle,
              to: `/my-requests/${String(item.submissionId)}`,
            };
          })
      : [];

    return [...pageHits, ...requestHits];
  }, [canSearchRequests, data?.items, isAr, pageTargets, t, trimmedQuery]);

  const safeActiveIndex = hits.length === 0 ? 0 : Math.min(activeIndex, hits.length - 1);

  const closeAndReset = (): void => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
  };

  const goToHit = (hit: SearchHit): void => {
    if (typeof onSearchSubmit === 'function') {
      onSearchSubmit(trimmedQuery);
    }
    navigate(hit.to);
    closeAndReset();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const picked = hits[safeActiveIndex];
    if (picked === undefined) {
      setOpen(true);
      return;
    }
    goToHit(picked);
  };

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setQuery(event.target.value);
    setActiveIndex(0);
    setOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      if (hits.length === 0) {
        return;
      }
      setActiveIndex((prev) => (prev + 1) % hits.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (hits.length === 0) {
        return;
      }
      setActiveIndex((prev) => (prev - 1 + hits.length) % hits.length);
      return;
    }
    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const pageHits = hits.filter((hit) => hit.group === 'page');
  const requestHits = hits.filter((hit) => hit.group === 'request');
  const showsLatestNote =
    canSearchRequests && data !== undefined && data.totalCount > data.items.length;
  const anchorWidth = anchorRef.current?.clientWidth ?? 300;

  const renderHit = (hit: SearchHit): React.ReactElement => {
    const index = hits.findIndex((item) => item.id === hit.id);
    return (
      <ListItemButton
        key={hit.id}
        selected={index === safeActiveIndex}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => goToHit(hit)}
        sx={{ borderRadius: 1, py: 0.75 }}
      >
        <ListItemText
          primary={hit.title}
          secondary={hit.subtitle}
          slotProps={{
            primary: { sx: { fontWeight: 700, fontSize: '0.9rem' } },
            secondary: { sx: { fontSize: '0.75rem' } },
          }}
        />
      </ListItemButton>
    );
  };

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ flex: fullWidth ? '1 1 auto' : '1 1 560px', width: fullWidth ? '100%' : 'auto', maxWidth: fullWidth ? '100%' : 300 }}>
        <Paper
          component="form"
          ref={anchorRef}
          onSubmit={handleSubmit}
          elevation={0}
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: '8px',
            borderRadius: '3.6px',
            bgcolor: 'background.default',
            height: '40px',
            transition: 'all 0.2s ease-in-out',
            '&:focus-within': {
              borderColor: 'primary.main',
              bgcolor: 'background.paper',
              boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
            },
          }}
        >
          <InputBase
            value={query}
            onChange={handleQueryChange}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={t('nav.searchPlaceholder')}
            inputProps={{
              'aria-label': t('nav.search'),
              'aria-expanded': open,
              'aria-controls': listId,
              'aria-autocomplete': 'list',
              role: 'combobox',
            }}
            sx={{
              flex: 1,
              fontSize: '15px',
              fontWeight: 500,
              textAlign: theme.direction === 'rtl' ? 'right' : 'left',
            }}
          />
          <Box
            sx={{
              width: '0.5px',
              height: '28px',
              bgcolor: theme.palette.primary.main,
              flexShrink: 0,
              opacity: 0.6,
              mx: '11px',
            }}
          />
          <IconButton type="submit" aria-label={t('nav.search')} size="small" sx={{ p: 0.5 }}>
            <Search sx={{ color: theme.palette.primary.main, fontSize: '18px' }} />
          </IconButton>
        </Paper>

        <Popper
          open={open}
          anchorEl={anchorRef.current}
          placement="bottom-start"
          sx={{ zIndex: theme.zIndex.modal, width: Math.max(anchorWidth, 340) }}
          modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
        >
          <Paper
            elevation={3}
            sx={{
              p: 1,
              borderRadius: 2,
              maxHeight: 360,
              overflowY: 'auto',
              bgcolor: 'background.paper',
            }}
          >
            {hits.length === 0 && isFetching ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
                <CircularProgress size={18} />
              </Box>
            ) : hits.length === 0 ? (
              <Typography variant="body2" sx={{ px: 1.5, py: 1, color: 'text.secondary' }}>
                {t('nav.searchNoResults')}
              </Typography>
            ) : (
              <List id={listId} dense disablePadding>
                {pageHits.length > 0 && (
                  <>
                    <Typography variant="caption" sx={{ px: 1.5, py: 0.5, display: 'block', fontWeight: 700 }}>
                      {t('nav.searchPages')}
                    </Typography>
                    {pageHits.map((hit) => renderHit(hit))}
                  </>
                )}

                {canSearchRequests && (
                  <>
                    <Typography variant="caption" sx={{ px: 1.5, pt: 1, pb: 0.5, display: 'block', fontWeight: 700 }}>
                      {t('nav.searchRequests')}
                    </Typography>
                    {isFetching && requestHits.length === 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                        <CircularProgress size={18} />
                      </Box>
                    )}
                    {isError && (
                      <Typography variant="body2" sx={{ px: 1.5, py: 0.5, color: 'error.main' }}>
                        {t('nav.searchRequestsError')}
                      </Typography>
                    )}
                    {!isFetching && !isError && requestHits.length === 0 && (
                      <Typography variant="body2" sx={{ px: 1.5, py: 0.5, color: 'text.secondary' }}>
                        {t('nav.searchNoRequests')}
                      </Typography>
                    )}
                    {requestHits.map((hit) => renderHit(hit))}
                    {showsLatestNote && (
                      <Typography variant="caption" sx={{ px: 1.5, py: 0.5, display: 'block', color: 'text.secondary' }}>
                        {t('nav.searchLatestOnly', { count: SEARCH_PAGE_SIZE })}
                      </Typography>
                    )}
                  </>
                )}

                {!canSearchRequests && trimmedQuery.length > 0 && (
                  <Typography variant="caption" sx={{ px: 1.5, pt: 1, display: 'block', color: 'text.secondary' }}>
                    {t('nav.searchTypeMore')}
                  </Typography>
                )}
              </List>
            )}
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

export default NavbarSearch;
