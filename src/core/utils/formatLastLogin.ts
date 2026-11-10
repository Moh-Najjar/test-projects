/** Formats lastLoginAt for the profile page. Empty when the value is missing. */
export const formatLastLogin = (iso: string | null | undefined, isAr: boolean): string => {
  if (iso === null || iso === undefined || iso.trim().length === 0) {
    return '';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString(isAr ? 'ar-JO' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
