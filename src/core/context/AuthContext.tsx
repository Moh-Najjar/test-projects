import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { useGraphUserRole } from '../hooks/useGraph';
import { useAuthentication, useRefreshToken } from '../hooks/useAuthentication';
import useTokenSession from '../hooks/useTokenSession';
import type { LoginResponse } from '../types/loginResponse';
import type { RefreshTokenResponse } from '../types/refreshTokenResponse';
import { getJwtExpiryMs } from '../utils/jwtUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

/** localStorage key for the persisted backend auth session. */
export const AUTH_STORAGE_KEY = 'aseza_auth_session';

/**
 * Refresh the backend session this many ms before the AccessToken expires.
 * Fires 1 minute early so the app always holds a valid token.
 */
const BACKEND_REFRESH_BEFORE_EXPIRY_MS = 60_000; // 1 minute

/**
 * Fallback session lifetime used only when the JWT `exp` claim cannot be read
 * (e.g. token is opaque or malformed). Should never be needed in normal operation.
 */
const BACKEND_SESSION_FALLBACK_MS = 60 * 60_000; // 60 minutes

// ─── Persisted data shape ─────────────────────────────────────────────────────

/**
 * What we write to localStorage.
 *
 * We persist the full `LoginResponse` so that user info (name, roles, etc.)
 * survives page reloads without a second /auth/login call. After each
 * /auth/refresh we overwrite only `accessToken` and `refreshToken` inside
 * `loginData`, keeping every other field intact.
 */
interface PersistedAuthData {
  /** Full response from the last successful /auth/login (tokens kept current). */
  loginData: LoginResponse;
  /** Unix timestamp (ms) when the current AccessToken expires. */
  expiresAt: number;
}

/**
 * Computes `expiresAt` from a raw access token.
 *
 * Reads the `exp` claim directly from the JWT so the timer tracks the real
 * server-issued lifetime rather than an assumed constant. Falls back to
 * `BACKEND_SESSION_FALLBACK_MS` when the claim cannot be decoded.
 */
const resolveExpiresAt = (accessToken: string): number => {
  const jwtExpiry = getJwtExpiryMs(accessToken);
  return jwtExpiry ?? Date.now() + BACKEND_SESSION_FALLBACK_MS;
};

/**
 * Reads and validates the stored auth data from localStorage.
 * Returns null if the entry is missing, corrupted, in a legacy format,
 * or already past its expiry.
 */
const loadStoredSession = (): PersistedAuthData | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw === null) return null;

    const parsed = JSON.parse(raw) as Partial<PersistedAuthData>;

    // Reject legacy entries (no expiresAt / no loginData) and expired sessions.
    if (
      typeof parsed.expiresAt !== 'number' ||
      parsed.loginData === undefined ||
      parsed.expiresAt <= Date.now()
    ) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return parsed as PersistedAuthData;
  } catch {
    // Corrupted JSON — discard.
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

// ─── Context shape ────────────────────────────────────────────────────────────

export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  userRoles: string[];
  /**
   * The full backend session (tokens + user info). Populated after a successful
   * /auth/login and kept alive through /auth/refresh cycles. `null` while the
   * session has not yet been established or after logout.
   */
  authSession: LoginResponse | null;
  /** Convenience alias for `authSession` — same reference, never stale. */
  userInfo: LoginResponse | null;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = accounts.length > 0;

  const isLoading = inProgress !== InteractionStatus.None;

  const { data: userRole } = useGraphUserRole();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRoles: string[] = userRole?.value?.map((role: any) => role.displayName as string) ?? [];

  // MSAL access + id tokens, kept fresh by useTokenSession's silent-refresh loop.
  const { accessToken, idToken } = useTokenSession();

  // Backend /auth/login mutation — used only for the initial session.
  const { mutateAsync: loginToBackend } = useAuthentication();

  // Backend /auth/refresh mutation — used for proactive session renewal.
  const { mutateAsync: refreshBackendSession } = useRefreshToken();

  // ─── State: restored from localStorage on mount ──────────────────────────

  const storedSession = loadStoredSession();

  /**
   * Full login data (user info + tokens). Initialised from localStorage so the
   * session and user info survive page reloads without a round-trip to the API.
   */
  const [authSession, setAuthSession] = useState<LoginResponse | null>(
    () => storedSession?.loginData ?? null,
  );

  /**
   * When the AccessToken expires (ms). Drives the proactive-refresh timer.
   * Also restored from localStorage so the timer re-arms correctly after a reload.
   */
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(
    () => storedSession?.expiresAt ?? null,
  );

  // Holds the backend-session refresh timer handle so it can be cancelled.
  const backendRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Helper: persist session atomically ───────────────────────────────────

  /**
   * Saves `loginData` to state and localStorage.
   * `expiresAt` is computed from the JWT `exp` claim of the access token,
   * so the timer always reflects the real server-issued lifetime.
   */
  const persistSession = useCallback((loginData: LoginResponse): void => {
    const expiresAt = resolveExpiresAt(loginData.accessToken);
    const persisted: PersistedAuthData = { loginData, expiresAt };
    setAuthSession(loginData);
    setSessionExpiresAt(expiresAt);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(persisted));
  }, []);

  // ─── Effect 1: Initial backend login ──────────────────────────────────────

  /**
   * When the MSAL token first becomes available and no backend session exists,
   * call /auth/login to obtain the full LoginResponse (tokens + user info) and
   * persist it to localStorage.
   *
   * `authSession` is intentionally excluded from the dependency array: once a
   * session is established we never want this effect to re-run and re-login.
   * The early-return guard keeps the logic correct without a re-run loop.
   */
  useEffect(() => {
    if (accessToken === null || idToken === null || authSession !== null) return;

    loginToBackend({ EntraIdToken: idToken })
      .then((loginResponse: LoginResponse) => {
        // Store the full LoginResponse — user info + tokens — in localStorage.
        // The expiry is read from the JWT so the refresh timer is accurate.
        persistSession(loginResponse);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Backend login failed: ${message}`);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idToken, loginToBackend, persistSession]);
  // authSession intentionally excluded — see comment above.

  // ─── Effect 2: Proactive backend session refresh ───────────────────────────

  /**
   * Arms a timer that fires BACKEND_REFRESH_BEFORE_EXPIRY_MS before the current
   * AccessToken expires. On firing it calls POST /auth/refresh with the stored
   * refreshToken.
   *
   * The response is a RefreshTokenResponse (new accessToken + refreshToken only).
   * We merge those two fields into the existing LoginResponse so user info is
   * preserved, then persist the updated record and re-compute expiresAt from the
   * new JWT — causing this effect to re-run and re-arm for the next cycle.
   *
   * NOTE: This only handles the *backend* session. The MSAL token refresh is
   * managed separately by useTokenSession and is left untouched.
   */
  useEffect(() => {
    // Nothing to schedule yet.
    if (authSession === null || sessionExpiresAt === null) return;

    // Cancel any previously armed timer before re-arming.
    if (backendRefreshTimerRef.current !== null) {
      clearTimeout(backendRefreshTimerRef.current);
      backendRefreshTimerRef.current = null;
    }

    const msUntilRefresh = sessionExpiresAt - Date.now() - BACKEND_REFRESH_BEFORE_EXPIRY_MS;

    // Capture the refreshToken at the time the timer is armed so the closure
    // always uses the token that was valid when the effect last ran.
    const { refreshToken } = authSession;

    const doRefresh = async (): Promise<void> => {
      try {
        const refreshResponse: RefreshTokenResponse = await refreshBackendSession({ refreshToken });

        // Merge the new tokens into the existing LoginResponse.
        // All other fields (userId, username, roles, etc.) remain unchanged.
        const updatedSession: LoginResponse = {
          ...authSession,
          accessToken: refreshResponse.accessToken,
          refreshToken: refreshResponse.refreshToken,
        };

        // Persist the merged record; expiresAt is re-computed from the new JWT.
        persistSession(updatedSession);
      } catch (err: unknown) {
        // Clear the session so the app can recover on the next user action.
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Backend session renewal failed — clearing session: ${msg}`);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setAuthSession(null);
        setSessionExpiresAt(null);
      }
    };

    backendRefreshTimerRef.current = setTimeout(
      doRefresh,
      // Never go negative: if we somehow wake up past the refresh point, fire immediately.
      Math.max(0, msUntilRefresh),
    );

    // Cleanup: cancel the timer if the component unmounts or dependencies change.
    return () => {
      if (backendRefreshTimerRef.current !== null) {
        clearTimeout(backendRefreshTimerRef.current);
        backendRefreshTimerRef.current = null;
      }
    };
  }, [authSession, sessionExpiresAt, refreshBackendSession, persistSession]);

  // ─── Logout ────────────────────────────────────────────────────────────────

  const logout = useCallback((): void => {
    // Cancel any pending refresh timer before wiping the session.
    if (backendRefreshTimerRef.current !== null) {
      clearTimeout(backendRefreshTimerRef.current);
      backendRefreshTimerRef.current = null;
    }

    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthSession(null);
    setSessionExpiresAt(null);

    instance.logoutRedirect().catch((e: unknown) => {
      console.error('Logout failed:', e);
    });
  }, [instance]);

  // `userInfo` is a convenience alias — both always point to the same object.
  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isLoading,
      logout,
      userRoles,
      authSession,
      userInfo: authSession
    }),
    [isAuthenticated, isLoading, logout, userRoles, authSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
