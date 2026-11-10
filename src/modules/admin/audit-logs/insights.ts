import type { SubmissionAuditLog } from '../../../core/types/submissionAuditLog';
import { diffAuditValues } from './diffAuditValues';

export interface DailyPoint {
  date: string;
  count: number;
}

export interface RankPoint {
  id: string;
  count: number;
}

export interface AuditInsights {
  actionCounts: RankPoint[];
  daily: DailyPoint[];
  submissions: RankPoint[];
  actors: RankPoint[];
  fields: RankPoint[];
  valueChangeCount: number;
  submissionCount: number;
  actorCount: number;
}

const DAY_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;
const FILL_LIMIT_DAYS = 62;

const dayKeyFromIso = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDayKey = (key: string): Date | null => {
  const match = DAY_KEY.exec(key);
  if (match === null) return null;
  const yearText = match[1];
  const monthText = match[2];
  const dayText = match[3];
  if (yearText === undefined || monthText === undefined || dayText === undefined) return null;

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
};

const formatDayKey = (date: Date): string => {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Fills quiet days so a week reads as a week. Long spans keep only active days. */
const buildDaily = (counts: Map<string, number>): DailyPoint[] => {
  const keys = [...counts.keys()].sort((a, b) => a.localeCompare(b));
  const firstKey = keys[0];
  const lastKey = keys[keys.length - 1];
  if (firstKey === undefined || lastKey === undefined) return [];

  const first = parseDayKey(firstKey);
  const last = parseDayKey(lastKey);
  if (first === null || last === null) {
    return keys.map((date) => ({ date, count: counts.get(date) ?? 0 }));
  }

  const span = Math.round((last.getTime() - first.getTime()) / 86400000);
  if (span > FILL_LIMIT_DAYS) {
    return keys.map((date) => ({ date, count: counts.get(date) ?? 0 }));
  }

  const points: DailyPoint[] = [];
  const cursor = new Date(first.getTime());
  let guard = 0;
  while (cursor.getTime() <= last.getTime() && guard <= FILL_LIMIT_DAYS) {
    const key = formatDayKey(cursor);
    points.push({ date: key, count: counts.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  return points;
};

const topCounts = (counts: Map<string, number>, limit: number): RankPoint[] =>
  [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([id, count]) => ({ id, count }));

const bump = (counts: Map<string, number>, id: string): void => {
  counts.set(id, (counts.get(id) ?? 0) + 1);
};

/** Aggregates one fetched sample into the numbers and series the dashboard draws. */
export const buildAuditInsights = (items: readonly SubmissionAuditLog[]): AuditInsights => {
  const actions = new Map<string, number>();
  const days = new Map<string, number>();
  const submissions = new Map<string, number>();
  const actors = new Map<string, number>();
  const fields = new Map<string, number>();
  let valueChangeCount = 0;

  for (const item of items) {
    bump(actions, item.actionType);
    bump(submissions, String(item.submissionId));
    bump(actors, String(item.actionByUserId));

    const day = dayKeyFromIso(item.actionAt);
    if (day.length > 0) bump(days, day);

    const diff = diffAuditValues(item.oldValue, item.newValue);
    valueChangeCount += diff.changes.length + diff.hiddenCount;

    const seen = new Set<string>();
    for (const change of diff.changes) {
      if (seen.has(change.fieldKey)) continue;
      seen.add(change.fieldKey);
      bump(fields, change.fieldKey);
    }
  }

  return {
    actionCounts: topCounts(actions, 8),
    daily: buildDaily(days),
    submissions: topCounts(submissions, 5),
    actors: topCounts(actors, 5),
    fields: topCounts(fields, 6),
    valueChangeCount,
    submissionCount: submissions.size,
    actorCount: actors.size,
  };
};
