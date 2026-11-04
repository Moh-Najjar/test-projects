import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { adminLoginApi, adminLogoutApi } from '../api/admin/adminAuth';
import { ADMIN_SESSION_KEY } from '../api/admin/adminHttp';
import {
  ADMIN_SESSION_EXPIRED_EVENT,
  isAdminSessionExpiredEvent,
  markAdminSessionEnded,
  type AdminSessionEndReason,
} from '../api/admin/adminSessionEvents';
import type { AdminSession } from '../types/admin/adminAuth';
import { getJwtExpiryMs } from '../utils/jwtUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Fallback session lifetime when the JWT `exp` claim cannot be decoded.
 * Should never be needed in normal operation.
 */
const ADMIN_SESSION_FALLBACK_MS = 60 * 60_000; // 60 minutes

/** Browsers cap `setTimeout` near 24.8 days; clamp so a long JWT still schedules. */
const MAX_TIMEOUT_MS = 2_147_483_647;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolves expiry timestamp from the JWT access token.
 * Falls back to ADMIN_SESSION_FALLBACK_MS if the claim is unreadable.
 */
const resolveExpiresAt = (accessToken: string): number => {
  const jwtExpiry = getJwtExpiryMs(accessToken);
  return jwtExpiry ?? Date.now() + ADMIN_SESSION_FALLBACK_MS;
};

/**
 * Reads the persisted admin session from localStorage.
 * Returns null if missing, expired, or corrupted.
 */
const loadStoredAdminSession = (): AdminSession | null => {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (raw === null) return null;

    const parsed = JSON.parse(raw) as Partial<AdminSession>;

    if (
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.expiresAt !== 'number' ||
      parsed.expiresAt <= Date.now()
    ) {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }

    return parsed as AdminSession;
  } catch {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    return null;
  }
};

// ─── Context shape ────────────────────────────────────────────────────────────

export interface AdminAuthContextValue {
  /** True when a valid (non-expired) admin session exists in localStorage. */
  isAdminAuthenticated: boolean;
  /** The raw JWT token, or null if not authenticated. */
  adminToken: string | null;
  /** True while the login mutation is in flight. */
  isAdminLoginPending: boolean;
  /** Error message from the last failed login attempt, or null. */
  adminLoginError: string | null;
  /**
   * Calls POST /auth/login with email + password.
   * Saves the token to localStorage on success.
   * Throws on failure (caller can catch for form error display).
   */
  adminLogin: (email: string, password: string) => Promise<void>;
  /**
   * Calls POST /auth/logout to blacklist the token, then clears localStorage.
   * Route guards will redirect to /admin/login once isAdminAuthenticated is false.
   */
  adminLogout: () => void;
}

interface AdminAuthProviderProps {
  children: React.ReactNode;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAdminAuth = (): AdminAuthContextValue => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(
    loadStoredAdminSession,
  );
  const [isAdminLoginPending, setIsAdminLoginPending] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  /** Latest session for timers and event handlers that must not close over stale state. */
  const adminSessionRef = useRef<AdminSession | null>(adminSession);
  adminSessionRef.current = adminSession;

  // ─── Login ────────────────────────────────────────────────────────────────

  const adminLogin = useCallback(async (email: string, password: string): Promise<void> => {
    setIsAdminLoginPending(true);
    setAdminLoginError(null);

    try {
      const response = await adminLoginApi({ email, password });
      /* adminLoginApi already unwraps the ApiResponse envelope */
      const { accessToken } = response;
      const expiresAt = resolveExpiresAt(accessToken);
      const session: AdminSession = { accessToken, expiresAt };

      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      setAdminSession(session);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setAdminLoginError(message);
      throw err;
    } finally {
      setIsAdminLoginPending(false);
    }
  }, []);

  // ─── Local session clear ──────────────────────────────────────────────────

  /**
   * Drops the persisted JWT and React state.
   * Used by user logout, JWT expiry, 401s, and other-tab logout.
   */
  const clearAdminSession = useCallback((): void => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    adminSessionRef.current = null;
    setAdminSession(null);
    setAdminLoginError(null);
  }, []);

  /**
   * Ends the session without calling the logout API (the token is already dead).
   * The login page reads the stored reason and shows a one-time banner.
   */
  const endAdminSession = useCallback((reason: AdminSessionEndReason): void => {
    if (adminSessionRef.current === null) {
      return;
    }
    markAdminSessionEnded(reason);
    clearAdminSession();
  }, [clearAdminSession]);

  // ─── Logout ───────────────────────────────────────────────────────────────

  const adminLogout = useCallback((): void => {
    // Best-effort server-side token blacklist; ignore errors so the UI still clears.
    adminLogoutApi().catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Admin logout API call failed: ${msg}`);
    });

    clearAdminSession();
  }, [clearAdminSession]);

  // ─── Auto-logout when the JWT expires ─────────────────────────────────────

  /**
   * Arms a timeout for `expiresAt`. Admin has no refresh token, so expiry
   * is the session end. Route guards send the user back to /admin/login.
   */
  useEffect(() => {
    if (adminSession === null) {
      return undefined;
    }

    let timeoutId = 0;

    const scheduleExpiryCheck = (): void => {
      const msUntilExpiry = adminSession.expiresAt - Date.now();

      if (msUntilExpiry <= 0) {
        endAdminSession('expired');
        return;
      }

      // Re-arm if the JWT outlives the browser timeout cap.
      timeoutId = window.setTimeout(() => {
        scheduleExpiryCheck();
      }, Math.min(msUntilExpiry, MAX_TIMEOUT_MS));
    };

    scheduleExpiryCheck();

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [adminSession, endAdminSession]);

  /**
   * After sleep / backgrounding, `setTimeout` can fire late. Recheck expiry
   * when the tab is visible again so a stale JWT cannot linger.
   */
  useEffect(() => {
    const recheckExpiry = (): void => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      const session = adminSessionRef.current;
      if (session !== null && session.expiresAt <= Date.now()) {
        endAdminSession('expired');
      }
    };

    document.addEventListener('visibilitychange', recheckExpiry);
    window.addEventListener('focus', recheckExpiry);

    return () => {
      document.removeEventListener('visibilitychange', recheckExpiry);
      window.removeEventListener('focus', recheckExpiry);
    };
  }, [endAdminSession]);

  /**
   * 401s from adminHttp (revoked or already-expired token) arrive here.
   */
  useEffect(() => {
    const onSessionExpired = (event: Event): void => {
      if (!isAdminSessionExpiredEvent(event)) {
        return;
      }
      endAdminSession(event.detail.reason);
    };

    window.addEventListener(ADMIN_SESSION_EXPIRED_EVENT, onSessionExpired);

    return () => {
      window.removeEventListener(ADMIN_SESSION_EXPIRED_EVENT, onSessionExpired);
    };
  }, [endAdminSession]);

  /**
   * Keep other admin tabs in sync when this tab logs out or expires.
   */
  useEffect(() => {
    const onStorage = (event: StorageEvent): void => {
      if (event.key !== ADMIN_SESSION_KEY) {
        return;
      }
      if (event.newValue === null) {
        adminSessionRef.current = null;
        setAdminSession(null);
      }
    };

    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // ─── Derived values ───────────────────────────────────────────────────────

  const isAdminAuthenticated = adminSession !== null;
  const adminToken = adminSession?.accessToken ?? null;

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      isAdminAuthenticated,
      adminToken,
      isAdminLoginPending,
      adminLoginError,
      adminLogin,
      adminLogout,
    }),
    [isAdminAuthenticated, adminToken, isAdminLoginPending, adminLoginError, adminLogin, adminLogout],
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
};
