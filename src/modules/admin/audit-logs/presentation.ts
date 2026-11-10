import { ADMIN_TONES } from '../shared/theme/adminTokens';

/** Placeholder used wherever the API omitted a value. */
export const EM_DASH = '—';

const ACTION_COLORS: Record<string, string> = {
  Created: ADMIN_TONES.emerald.main,
  Updated: ADMIN_TONES.indigo.main,
  Submitted: ADMIN_TONES.violet.main,
  Approved: ADMIN_TONES.cyan.main,
  Rejected: ADMIN_TONES.rose.main,
  Deleted: ADMIN_TONES.slate.main,
};

const FALLBACK_COLORS = [
  ADMIN_TONES.amber.main,
  ADMIN_TONES.indigo.main,
  ADMIN_TONES.violet.main,
  ADMIN_TONES.cyan.main,
  ADMIN_TONES.slate.main,
] as const;

/** Stable colour for an action name so chips, the donut, and the legend match. */
export const colorForAction = (action: string, index: number): string => {
  const known = ACTION_COLORS[action];
  if (known !== undefined) return known;
  const fallback = FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  return fallback ?? ADMIN_TONES.indigo.main;
};

/** Two-letter initials for avatars. Falls back to "?" when the name is empty. */
export const initialsOf = (name: string): string => {
  const parts = name
    .replace(/^#/u, '')
    .trim()
    .split(/\s+/u)
    .filter((part) => part.length > 0)
    .slice(0, 2);
  const letters = parts.map((part) => part.charAt(0).toUpperCase()).join('');
  return letters.length > 0 ? letters : '?';
};

export const isLocalAddress = (ipAddress: string | null): boolean => {
  if (ipAddress === null) return false;
  const value = ipAddress.trim().toLowerCase();
  return value === '::1' || value === '127.0.0.1' || value === '0:0:0:0:0:0:0:1';
};
