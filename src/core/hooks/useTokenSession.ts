import { useState, useEffect, useCallback, useRef } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import type { AuthenticationResult } from "@azure/msal-browser";
import { loginRequest } from "../config/authConfig";

// ─── Constants ───────────────────────────────────────────────────────────────

/** Silently re-acquire the access token this many ms before it expires. */
const REFRESH_BEFORE_EXPIRY_MS = 60_000; // 1 minute

/** Show the session-expiry warning banner this many ms before expiry. */
const SESSION_WARNING_THRESHOLD_MS = 5 * 60_000; // 5 minutes

// ─── Return type ─────────────────────────────────────────────────────────────

export interface TokenSession {
  /** Current valid access token, or null while acquiring. */
  accessToken: string | null;
  /** Current valid ID token, or null while acquiring. */
  idToken: string | null;
  /** Exact Date when the current access token expires. */
  expiresOn: Date | null;
  /** True when the token is within SESSION_WARNING_THRESHOLD_MS of expiry. */
  sessionWarning: boolean;
  /** Set when token acquisition fails for a non-interaction reason. */
  tokenError: string | null;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Manages the full access-token lifecycle using MSAL:
 *
 * 1. **Silent acquisition** – `acquireTokenSilent` transparently uses the
 *    `refresh_token` from the cache when the `access_token` has expired.
 *
 * 2. **Interaction fallback** – when MSAL throws `InteractionRequiredAuthError`
 *    (refresh_token itself expired, MFA required, admin consent needed, etc.)
 *    the hook calls `acquireTokenRedirect` to send the user back to the IdP.
 *
 * 3. **Proactive refresh** – a timer fires `REFRESH_BEFORE_EXPIRY_MS` before
 *    `expiresOn` and silently fetches a fresh token, then re-arms itself for
 *    the new token's expiry window.
 *
 * 4. **Session warning** – a second timer fires `SESSION_WARNING_THRESHOLD_MS`
 *    before expiry and sets `sessionWarning = true` so the UI can show a
 *    banner. It is cleared after every successful background refresh.
 */
const useTokenSession = (): TokenSession => {
  const { instance, accounts } = useMsal();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);

  const [expiresOn, setExpiresOn] = useState<Date | null>(null);
  const [sessionWarning, setSessionWarning] = useState<boolean>(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Cancel both pending timers; safe to call when they are already null. */
  const clearTimers = useCallback((): void => {
    if (refreshTimerRef.current !== null) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    if (warningTimerRef.current !== null) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    /**
     * Attempts a silent token acquisition first.
     * Falls back to a redirect interaction when MSAL determines that user
     * involvement is required (most commonly: expired refresh_token).
     */
    const acquireToken = async (): Promise<AuthenticationResult | null> => {
      if (accounts.length === 0) return null;

      try {
        return await instance.acquireTokenSilent({
          scopes: loginRequest.scopes,
          account: accounts[0],
        });
      } catch (err: unknown) {
        if (err instanceof InteractionRequiredAuthError) {
          // refresh_token expired or IdP requires re-authentication
          console.warn(
            "useTokenSession: interaction required – redirecting to sign-in.",
            err
          );
          await instance.acquireTokenRedirect({
            ...loginRequest,
            account: accounts[0],
          });
          return null;
        }
        throw err;
      }
    };

    /**
     * Arms two timers derived from the token's `expiresOn`:
     * - Warning timer  → sets sessionWarning = true
     * - Refresh timer  → silently fetches a new token and re-schedules itself
     *
     * Defined inside `useEffect` so the refresh timer can call `scheduleRefresh`
     * recursively without circular `useCallback` dependencies.
     */
    const scheduleRefresh = (tokenExpiresOn: Date): void => {
      clearTimers();

      const msUntilExpiry = tokenExpiresOn.getTime() - Date.now();

      // Warning: fires SESSION_WARNING_THRESHOLD_MS before expiry
      warningTimerRef.current = setTimeout(
        () => setSessionWarning(true),
        Math.max(0, msUntilExpiry - SESSION_WARNING_THRESHOLD_MS)
      );

      // Proactive refresh: fires REFRESH_BEFORE_EXPIRY_MS before expiry
      const msUntilRefresh = msUntilExpiry - REFRESH_BEFORE_EXPIRY_MS;
      if (msUntilRefresh > 0) {
        refreshTimerRef.current = setTimeout(async () => {
          try {
            const result = await acquireToken();
            if (result !== null) {
              setAccessToken(result.accessToken);
              setIdToken(result.idToken);
            setSessionWarning(false); // reset warning after a successful refresh

              if (result.expiresOn !== null) {
                setExpiresOn(result.expiresOn);
                scheduleRefresh(result.expiresOn); // re-arm for the new token's expiry
              }
            }
          } catch (err: unknown) {
            console.error("useTokenSession: background refresh failed.", err);
          }
        }, msUntilRefresh);
      }
    };

    /** Runs once on mount (and on account changes): acquires the first token. */
    const init = async (): Promise<void> => {
      try {
        const result = await acquireToken();
        if (result !== null) {
          setAccessToken(result.accessToken);
          setIdToken(result.idToken);
          if (result.expiresOn !== null) {
            setExpiresOn(result.expiresOn);
            scheduleRefresh(result.expiresOn);
          }
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Token acquisition failed";
        console.error("useTokenSession: init failed.", err);
        setTokenError(message);
      }
    };

    init();

    // Cleanup: cancel timers when the hook unmounts or accounts/instance change
    return clearTimers;
  }, [instance, accounts, clearTimers]);

  return { accessToken, idToken, expiresOn, sessionWarning, tokenError };
};

export default useTokenSession;
