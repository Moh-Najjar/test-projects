import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Lightbulb as TipIcon,
  WarningAmber as WarningIcon,
  InfoOutlined as InfoIcon,
  Link as LinkIcon,
  ArrowForward as ArrowIcon,
  MenuBook as DocsIcon,
  SupportAgent as SupportIcon,
  SearchOff as NoResultsIcon,
} from '@mui/icons-material';
import AdminLayout from '../shared/AdminLayout';
import {
  ADMIN_ACCENT,
  ADMIN_GOLD,
  ADMIN_INK,
  resolveAdminCategoryColor,
} from '../shared/theme/adminTokens';
import { EmptyState } from '../shared/ui';
import { useLocale } from '../../../core/hooks/useLocale';
import type { CategoryColor } from '../../../core/constants/theme';
import {
  getDocSections,
  sectionSearchText,
  type CalloutBlock,
  type CalloutTone,
  type DocBlock,
  type DocSection,
  type ExampleBlock,
  type FaqBlock,
  type ListBlock,
  type StepsBlock,
  type TableBlock,
} from './docContent';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Height of the sticky AdminLayout header, used to offset scroll positions. */
const HEADER_OFFSET_PX = 96;

const SECTION_DOM_PREFIX = 'doc-section-';

const sectionDomId = (id: string): string => `${SECTION_DOM_PREFIX}${id}`;

interface CalloutStyle {
  color: CategoryColor;
  icon: React.ReactNode;
}

const CALLOUT_STYLES: Record<CalloutTone, CalloutStyle> = {
  tip: { color: 'teal', icon: <TipIcon fontSize="small" /> },
  warning: { color: 'amber', icon: <WarningIcon fontSize="small" /> },
  info: { color: 'navy', icon: <InfoIcon fontSize="small" /> },
};

// ─── Inline text (**bold** and `code`) ────────────────────────────────────────

const INLINE_TOKEN_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`)/g;

const InlineText: React.FC<{ text: string }> = ({ text }) => {
  const theme = useTheme();
  // Split keeps the captured markers so each one can be rendered with its own style.
  const parts = text.split(INLINE_TOKEN_PATTERN).filter((part) => part.length > 0);

  return (
    <>
      {parts.map((part, index) => {
        // Bold segment
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Box component="strong" key={index} sx={{ fontWeight: 800, color: 'text.primary' }}>
              {part.slice(2, -2)}
            </Box>
          );
        }
        // Inline code segment
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <Box
              component="code"
              key={index}
              sx={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                fontSize: '0.85em',
                fontWeight: 700,
                px: 0.75,
                py: 0.25,
                borderRadius: '6px',
                bgcolor: alpha(theme.palette.primary.main, 0.07),
                color: theme.palette.primary.main,
              }}
            >
              {part.slice(1, -1)}
            </Box>
          );
        }
        // Plain text segment
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
};

// ─── Block renderers ──────────────────────────────────────────────────────────

const BlockTitle: React.FC<{ title: string | undefined }> = ({ title }) => {
  if (title === undefined || title.length === 0) return null;
  return (
    <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ mb: 1.5, fontSize: 15 }}>
      {title}
    </Typography>
  );
};

const StepsView: React.FC<{ block: StepsBlock; color: string }> = ({ block, color }) => (
  <Box>
    <BlockTitle title={block.title} />
    <Stack component="ol" spacing={0} sx={{ listStyle: 'none', p: 0, m: 0 }}>
      {block.steps.map((step, index) => {
        const isLast = index === block.steps.length - 1;
        return (
          <Stack component="li" direction="row" gap={2} key={`${step.title}-${index}`}>
            {/* Numbered marker with a connector line down to the next step */}
            <Stack alignItems="center" sx={{ flexShrink: 0 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: alpha(color, 0.12),
                  color,
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                {index + 1}
              </Box>
              {!isLast && <Box sx={{ width: 2, flex: 1, minHeight: 12, bgcolor: alpha(color, 0.15), my: 0.5 }} />}
            </Stack>
            <Box sx={{ pb: isLast ? 0 : 2, pt: 0.25 }}>
              <Typography variant="body2" fontWeight={800} color="text.primary">
                {step.title}
              </Typography>
              {step.detail !== undefined && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.7 }}>
                  <InlineText text={step.detail} />
                </Typography>
              )}
            </Box>
          </Stack>
        );
      })}
    </Stack>
  </Box>
);

const ListView: React.FC<{ block: ListBlock; color: string }> = ({ block, color }) => (
  <Box>
    <BlockTitle title={block.title} />
    <Stack component="ul" spacing={1.25} sx={{ listStyle: 'none', p: 0, m: 0 }}>
      {block.items.map((item, index) => (
        <Stack component="li" direction="row" gap={1.5} key={`${item.term ?? ''}-${index}`}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color, mt: 1.1, flexShrink: 0 }} />
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {item.term !== undefined && (
              <Box component="span" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {`${item.term}: `}
              </Box>
            )}
            <InlineText text={item.text} />
          </Typography>
        </Stack>
      ))}
    </Stack>
  </Box>
);

const CalloutView: React.FC<{ block: CalloutBlock }> = ({ block }) => {
  const theme = useTheme();
  const style = CALLOUT_STYLES[block.tone];
  const color = resolveAdminCategoryColor(style.color, theme.palette.mode);
  return (
    <Box
      role="note"
      sx={{
        display: 'flex',
        gap: 1.5,
        p: 2,
        borderRadius: '14px',
        bgcolor: alpha(color, theme.palette.mode === 'dark' ? 0.1 : 0.06),
        borderInlineStart: '4px solid',
        borderColor: color,
      }}
    >
      <Box sx={{ color, mt: 0.25, display: 'flex' }}>{style.icon}</Box>
      <Box>
        <Typography variant="body2" fontWeight={800} sx={{ color, mb: 0.25 }}>
          {block.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          <InlineText text={block.text} />
        </Typography>
      </Box>
    </Box>
  );
};

const TableView: React.FC<{ block: TableBlock }> = ({ block }) => {
  const theme = useTheme();
  return (
    <Box>
      <BlockTitle title={block.title} />
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ borderRadius: '14px', border: '1px solid', borderColor: 'divider' }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
              {block.columns.map((column, index) => (
                <TableCell
                  key={`${column}-${index}`}
                  sx={{ fontWeight: 800, fontSize: 11, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5 }}
                >
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {block.rows.map((row, rowIndex) => (
              <TableRow key={`row-${rowIndex}`} hover>
                {row.map((cell, cellIndex) => (
                  <TableCell
                    key={`cell-${rowIndex}-${cellIndex}`}
                    sx={{
                      py: 1.25,
                      fontSize: 13,
                      // First column acts as the row header.
                      fontWeight: cellIndex === 0 ? 800 : 500,
                      color: cellIndex === 0 ? 'text.primary' : 'text.secondary',
                      whiteSpace: cellIndex === 0 ? 'nowrap' : 'normal',
                    }}
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const ExampleView: React.FC<{ block: ExampleBlock }> = ({ block }) => (
  <Box>
    <BlockTitle title={block.title} />
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 2,
        borderRadius: '14px',
            bgcolor: ADMIN_INK,
        color: '#EDE6D6',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: 13,
        lineHeight: 1.8,
        overflowX: 'auto',
        direction: 'ltr',
      }}
    >
      {block.code}
    </Box>
    {block.caption !== undefined && (
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontWeight: 600 }}>
        <InlineText text={block.caption} />
      </Typography>
    )}
  </Box>
);

interface FaqViewProps {
  block: FaqBlock;
  query: string;
}

const FaqView: React.FC<FaqViewProps> = ({ block, query }) => {
  const theme = useTheme();
  const isSearching = query.length > 0;

  // While searching, show only matching questions (or all of them if the match was on the section title).
  const visibleItems = useMemo(() => {
    if (!isSearching) return block.items;
    const matches = block.items.filter((item) =>
      `${item.question} ${item.answer}`.toLowerCase().includes(query),
    );
    return matches.length > 0 ? matches : block.items;
  }, [block.items, isSearching, query]);

  return (
    <Stack spacing={1.25}>
      {visibleItems.map((item) => (
        <Accordion
          // Re-mount when search toggles so matching answers open automatically.
          key={`${item.question}-${String(isSearching)}`}
          defaultExpanded={isSearching}
          disableGutters
          elevation={0}
          sx={{
            borderRadius: '14px !important',
            border: '1px solid',
            borderColor: 'divider',
            '&:before': { display: 'none' },
            '&.Mui-expanded': { borderColor: alpha(ADMIN_ACCENT, 0.4) },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
            <Typography variant="body2" fontWeight={800} color="text.primary">
              {item.question}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 2, pt: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              <InlineText text={item.answer} />
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  );
};

interface BlockViewProps {
  block: DocBlock;
  color: string;
  query: string;
}

const BlockView: React.FC<BlockViewProps> = ({ block, color, query }) => {
  switch (block.kind) {
    case 'paragraph':
      return (
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, fontSize: 15 }}>
          <InlineText text={block.text} />
        </Typography>
      );
    case 'steps':
      return <StepsView block={block} color={color} />;
    case 'list':
      return <ListView block={block} color={color} />;
    case 'callout':
      return <CalloutView block={block} />;
    case 'table':
      return <TableView block={block} />;
    case 'example':
      return <ExampleView block={block} />;
    case 'faq':
      return <FaqView block={block} query={query} />;
    default: {
      // Exhaustiveness check: a new block kind must be rendered above.
      const unreachable: never = block;
      return <>{String(unreachable)}</>;
    }
  }
};

// ─── Section card ─────────────────────────────────────────────────────────────

interface SectionViewProps {
  section: DocSection;
  query: string;
  onCopyLink: (id: string) => void;
  copied: boolean;
}

const SectionView: React.FC<SectionViewProps> = ({ section, query, onCopyLink, copied }) => {
  const theme = useTheme();
  const { t } = useLocale();
  const navigate = useNavigate();
  const sectionColor = resolveAdminCategoryColor(section.color, theme.palette.mode);

  return (
    <Paper
      component="section"
      id={sectionDomId(section.id)}
      data-section-id={section.id}
      aria-labelledby={`${sectionDomId(section.id)}-title`}
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: '24px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        scrollMarginTop: `${HEADER_OFFSET_PX}px`,
      }}
    >
      {/* Section header */}
      <Stack direction="row" alignItems="flex-start" gap={2} sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '14px',
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(sectionColor, 0.1),
            color: sectionColor,
            flexShrink: 0,
          }}
        >
          {section.icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" gap={0.5}>
            <Typography
              id={`${sectionDomId(section.id)}-title`}
              variant="h5"
              fontWeight={900}
              color="text.primary"
              sx={{ letterSpacing: -0.5 }}
            >
              {section.title}
            </Typography>
            <Tooltip title={copied ? t('admin.docs.linkCopied') : t('admin.docs.copyLink')}>
              <IconButton size="small" onClick={() => onCopyLink(section.id)} aria-label={t('admin.docs.copyLinkAria', { title: section.title })}>
                <LinkIcon sx={{ fontSize: 18, color: copied ? ADMIN_ACCENT : 'text.disabled' }} />
              </IconButton>
            </Tooltip>
          </Stack>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            {section.summary}
          </Typography>
        </Box>
        {section.related !== undefined && (
          <Button
            size="small"
            variant="outlined"
            endIcon={<ArrowIcon sx={{ fontSize: 16 }} />}
            onClick={() => {
              // `related` is checked above; re-read it here to keep the type narrowed.
              if (section.related !== undefined) navigate(section.related.path);
            }}
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              borderRadius: '10px',
              fontWeight: 700,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              borderColor: alpha(sectionColor, 0.4),
              color: sectionColor,
              flexShrink: 0,
            }}
          >
            {section.related.label}
          </Button>
        )}
      </Stack>

      {/* Section body */}
      <Stack spacing={3}>
        {section.blocks.map((block, index) => (
          <BlockView key={`${section.id}-${block.kind}-${index}`} block={block} color={sectionColor} query={query} />
        ))}
      </Stack>
    </Paper>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const AdminDocumentation: React.FC = () => {
  const theme = useTheme();
  const { t, isAr } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Article body follows the header language switcher.
  const sections = useMemo(() => getDocSections(isAr), [isAr]);

  const [searchInput, setSearchInput] = useState('');
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Normalised query used for matching.
  const query = searchInput.trim().toLowerCase();

  // Rebuild the index when the language changes so search matches the visible text.
  const searchIndex = useMemo(
    () => sections.map((section) => ({ section, text: sectionSearchText(section) })),
    [sections],
  );

  // Sections that match every word of the query.
  const visibleSections = useMemo(() => {
    if (query.length === 0) return sections;
    const words = query.split(/\s+/).filter((word) => word.length > 0);
    return searchIndex
      .filter((entry) => words.every((word) => entry.text.includes(word)))
      .map((entry) => entry.section);
  }, [query, searchIndex, sections]);

  /** Smoothly scrolls the given section into view. */
  const scrollToSection = useCallback((id: string, smooth: boolean): void => {
    const element = document.getElementById(sectionDomId(id));
    if (element === null) return;
    element.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    setActiveId(id);
  }, []);

  /** Table-of-contents click: scroll and keep the URL hash shareable. */
  const handleJump = (id: string): void => {
    scrollToSection(id, true);
    navigate({ hash: `#${id}` }, { replace: true });
  };

  /** Copies an absolute deep link for a section to the clipboard. */
  const handleCopyLink = (id: string): void => {
    const url = `${window.location.origin}${location.pathname}#${id}`;
    // Clipboard API is unavailable on insecure origins; fail quietly in that case.
    if (navigator.clipboard === undefined) return;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedId(id);
        window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000);
      })
      .catch(() => {
        setCopiedId(null);
      });
  };

  // Scroll to the section named in the URL hash on first load (e.g. /admin/docs#users).
  useEffect(() => {
    const hashId = location.hash.replace('#', '');
    if (hashId.length === 0) return;
    if (!sections.some((section) => section.id === hashId)) return;
    // Wait one frame so the sections are laid out before scrolling.
    const frame = window.requestAnimationFrame(() => scrollToSection(hashId, false));
    return () => window.cancelAnimationFrame(frame);
    // Only run on mount; later hash changes come from our own navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll-spy: highlight the section currently near the top of the viewport.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the visible entry closest to the top.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const first = visible[0];
        if (first === undefined) return;
        const id = first.target.getAttribute('data-section-id');
        if (id !== null) setActiveId(id);
      },
      { rootMargin: `-${HEADER_OFFSET_PX}px 0px -60% 0px`, threshold: 0 },
    );

    visibleSections.forEach((section) => {
      const element = document.getElementById(sectionDomId(section.id));
      if (element !== null) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [visibleSections]);

  // Keyboard shortcut: press "/" anywhere on the page to focus the search box.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== '/') return;
      const target = event.target;
      // Don't hijack "/" while the user is typing in a field.
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AdminLayout>
      <Box sx={{ maxWidth: 1200 }}>
        {/* ── Hero + search ── */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            mb: 4,
            borderRadius: '28px',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            background: ADMIN_INK,
            border: `1px solid ${alpha('#FFFFFF', theme.palette.mode === 'dark' ? 0.08 : 0.18)}`,
            boxShadow: `0 24px 48px -24px ${alpha(ADMIN_INK, 0.55)}`,
          }}
        >
          {/* Decorative icon */}
          <DocsIcon
            aria-hidden
            sx={{
              position: 'absolute',
              insetInlineEnd: -20,
              bottom: -30,
              fontSize: 220,
              opacity: 0.08,
            }}
          />
          <Chip
            label={t('admin.docs.badge')}
            size="small"
            sx={{ bgcolor: alpha(ADMIN_GOLD, 0.22), color: ADMIN_GOLD, fontWeight: 800, fontSize: 10, letterSpacing: 1, mb: 2 }}
          />
          <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: -1, mb: 1 }}>
            {t('admin.docs.title')}
          </Typography>
          <Typography sx={{ opacity: 0.85, fontWeight: 500, mb: 3, maxWidth: 620, fontSize: 16 }}>
            {t('admin.docs.subtitle')}
          </Typography>

          <TextField
            inputRef={searchInputRef}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('admin.docs.search')}
            size="medium"
            fullWidth
            inputProps={{ 'aria-label': 'Search documentation' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment:
                searchInput.length > 0 ? (
                  <InputAdornment position="end">
                    <IconButton size="small" aria-label={t('admin.common.clearSearch')} onClick={() => setSearchInput('')}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : (
                  <InputAdornment position="end">
                    <Box
                      component="kbd"
                      sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: 'divider',
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'text.secondary',
                        fontFamily: 'inherit',
                      }}
                    >
                      /
                    </Box>
                  </InputAdornment>
                ),
              sx: {
                bgcolor: 'background.paper',
                borderRadius: '14px',
                maxWidth: 620,
                '& fieldset': { border: 'none' },
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              },
            }}
          />
        </Paper>

        {/* ── Body: table of contents + sections ── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '240px minmax(0, 1fr)' },
            gap: 4,
            alignItems: 'start',
          }}
        >
          {/* Table of contents (desktop only) */}
          <Box
            component="nav"
            aria-label={t('admin.docs.sectionsAria')}
            sx={{ display: { xs: 'none', md: 'block' }, position: 'sticky', top: 0 }}
          >
            <Typography
              variant="caption"
              fontWeight={800}
              color="text.secondary"
              sx={{ letterSpacing: 1, textTransform: 'uppercase', px: 1.5, display: 'block', mb: 1 }}
            >
              {t('admin.docs.onThisPage')}
            </Typography>
            <List dense disablePadding>
              {visibleSections.map((section) => {
                const isActive = section.id === activeId;
                const sectionColor = resolveAdminCategoryColor(section.color, theme.palette.mode);
                return (
                  <ListItemButton
                    key={section.id}
                    onClick={() => handleJump(section.id)}
                    selected={isActive}
                    aria-current={isActive ? 'location' : undefined}
                    sx={{
                      borderRadius: '10px',
                      mb: 0.25,
                      py: 0.75,
                      borderInlineStart: '3px solid',
                      borderColor: isActive ? sectionColor : 'transparent',
                      '&.Mui-selected': { bgcolor: alpha(sectionColor, 0.08) },
                      '&.Mui-selected:hover': { bgcolor: alpha(sectionColor, 0.12) },
                    }}
                  >
                    <ListItemText
                      primary={section.title}
                      primaryTypographyProps={{
                        fontSize: 13,
                        fontWeight: isActive ? 800 : 600,
                        color: isActive ? 'text.primary' : 'text.secondary',
                        noWrap: true,
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>

          {/* Sections */}
          <Stack spacing={3} sx={{ minWidth: 0 }}>
            {query.length > 0 && (
              <Typography variant="body2" color="text.secondary" fontWeight={700}>
                {t('admin.docs.matchCount', { count: visibleSections.length, query: searchInput.trim() })}
              </Typography>
            )}

            {visibleSections.length === 0 ? (
              <EmptyState
                icon={<NoResultsIcon />}
                title={t('admin.docs.noResults')}
                description={t('admin.docs.noResultsHint')}
                action={
                  <Button onClick={() => setSearchInput('')} variant="outlined">
                    {t('admin.common.clearSearch')}
                  </Button>
                }
              />
            ) : (
              visibleSections.map((section) => (
                <SectionView
                  key={section.id}
                  section={section}
                  query={query}
                  onCopyLink={handleCopyLink}
                  copied={copiedId === section.id}
                />
              ))
            )}

            {/* Support footer */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '24px',
                bgcolor: alpha(theme.palette.primary.main, 0.03),
                border: '1px dashed',
                borderColor: alpha(theme.palette.primary.main, 0.15),
              }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '14px',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: alpha(ADMIN_ACCENT, 0.12),
                    color: ADMIN_ACCENT,
                    flexShrink: 0,
                  }}
                >
                  <SupportIcon />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={800} color="text.primary">
                    {t('admin.docs.stuckTitle')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.docs.stuckBody')}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  disableElevation
                  onClick={() => navigate('/admin')}
                  sx={{ borderRadius: '12px', fontWeight: 700, textTransform: 'none', px: 3 }}
                >
                  {t('admin.docs.backToDashboard')}
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Box>
    </AdminLayout>
  );
};

export default AdminDocumentation;
