import type { TFunction } from 'i18next';

/** Absolute timestamp in the active language. Invalid dates become an em dash. */
export const formatAbsolute = (iso: string, locale: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/** Short relative label. Falls back to the absolute time after 30 days. */
export const formatRelative = (iso: string, locale: string, t: TFunction): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return t('auditLogs.relative.now');
  if (minutes < 60) return t('auditLogs.relative.minutes', { count: minutes });

  const hours = Math.round(minutes / 60);
  if (hours < 24) return t('auditLogs.relative.hours', { count: hours });

  const days = Math.round(hours / 24);
  if (days < 30) return t('auditLogs.relative.days', { count: days });

  return formatAbsolute(iso, locale);
};

/** `yyyy-mm-dd` key → "9 Nov" in the active locale. */
export const formatDayLabel = (dayKey: string, locale: string): string => {
  const date = new Date(`${dayKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dayKey;
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(date);
};

/** Translated action name. Unknown API values are shown as sent. */
export const formatAction = (action: string, t: TFunction): string =>
  t(`auditLogs.actions.${action}`, { defaultValue: action });

/** Calendar date from a filter input, shown on the active-filter chips. */
export const formatFilterDate = (dayKey: string, locale: string): string => {
  const date = new Date(`${dayKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dayKey;
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};
