/**
 * Cross-module signals for admin session end.
 * Kept out of React so `adminHttp` can notify the auth provider without a cycle.
 */

/** Custom event name dispatched when the admin JWT is no longer valid. */
export const ADMIN_SESSION_EXPIRED_EVENT = 'aseza:admin-session-expired';

/** sessionStorage flag so the login page can explain why the user was redirected. */
export const ADMIN_SESSION_ENDED_KEY = 'aseza_admin_session_ended';

/** Why the local admin session was cleared. */
export type AdminSessionEndReason = 'expired' | 'unauthorized';

export interface AdminSessionExpiredDetail {
  reason: AdminSessionEndReason;
}

/** True when a CustomEvent carries an admin session-end payload. */
export const isAdminSessionExpiredEvent = (
  event: Event,
): event is CustomEvent<AdminSessionExpiredDetail> => {
  if (!(event instanceof CustomEvent)) {
    return false;
  }

  const detail: unknown = event.detail;
  if (typeof detail !== 'object' || detail === null || !('reason' in detail)) {
    return false;
  }

  const reason = detail.reason;
  return reason === 'expired' || reason === 'unauthorized';
};

/** Notifies AdminAuthProvider to drop the local session and return to login. */
export const emitAdminSessionExpired = (reason: AdminSessionEndReason): void => {
  window.dispatchEvent(
    new CustomEvent<AdminSessionExpiredDetail>(ADMIN_SESSION_EXPIRED_EVENT, {
      detail: { reason },
    }),
  );
};

/** Persists the end reason for the login page banner. */
export const markAdminSessionEnded = (reason: AdminSessionEndReason): void => {
  sessionStorage.setItem(ADMIN_SESSION_ENDED_KEY, reason);
};

/** Reads and clears the end reason so the banner shows once. */
export const consumeAdminSessionEndedReason = (): AdminSessionEndReason | null => {
  const reason = sessionStorage.getItem(ADMIN_SESSION_ENDED_KEY);
  if (reason === 'expired' || reason === 'unauthorized') {
    sessionStorage.removeItem(ADMIN_SESSION_ENDED_KEY);
    return reason;
  }
  return null;
};
