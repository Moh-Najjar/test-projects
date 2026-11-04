import { http, UNAUTHORIZED_ERROR_MESSAGE } from '../../helpers/http';
import type { ApiHeaders } from '../../helpers/http';
import { emitAdminSessionExpired } from './adminSessionEvents';

/** localStorage key where the admin JWT session is stored. */
export const ADMIN_SESSION_KEY = 'aseza_admin_session';

/** Minimal shape we need from localStorage for the token. */
interface StoredAdminSession {
  accessToken: string;
  expiresAt: number;
}

/**
 * Standard envelope that wraps EVERY successful admin API response.
 * The interceptor (transform.interceptor.ts) always adds these fields.
 * 204 No-Content responses have no body — callers typed as `void` handle that.
 */
interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * Reads the admin JWT from localStorage and returns Authorization header.
 * Returns an empty object if no valid session is found (guards handle redirects).
 */
const getAdminAuthHeaders = (): ApiHeaders => {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (raw === null) return {};

    const parsed = JSON.parse(raw) as Partial<StoredAdminSession>;
    if (typeof parsed.accessToken !== 'string' || parsed.accessToken.length === 0) return {};

    return { Authorization: `Bearer ${parsed.accessToken}` };
  } catch {
    return {};
  }
};

/**
 * Runs an admin request and ends the local session when the server rejects the JWT.
 * Login uses plain `http`, so a bad password never hits this path.
 */
const withAdminSessionGuard = async <R>(request: () => Promise<R>): Promise<R> => {
  try {
    return await request();
  } catch (error: unknown) {
    if (error instanceof Error && error.message === UNAUTHORIZED_ERROR_MESSAGE) {
      emitAdminSessionExpired('unauthorized');
    }
    throw error;
  }
};

/**
 * Thin wrapper around the shared `http` helper that:
 *   1. Automatically injects the admin JWT as a Bearer token.
 *   2. Unwraps the backend's ApiResponse envelope so callers receive the
 *      inner `data` field directly — no need to access `.data` manually.
 *
 * For 204 No-Content responses the envelope is absent; callers type those
 * endpoints as `void` and the returned `undefined` is compatible.
 */
export const adminHttp = {
  get: async <R>(url: string, extraHeaders?: ApiHeaders): Promise<R> =>
    withAdminSessionGuard(async () => {
      const envelope = await http.get<ApiResponse<R>>(url, {
        ...getAdminAuthHeaders(),
        ...(extraHeaders ?? {}),
      });
      return envelope.data;
    }),

  post: async <T, R>(url: string, data: T, extraHeaders?: ApiHeaders): Promise<R> =>
    withAdminSessionGuard(async () => {
      const envelope = await http.post<T, ApiResponse<R>>(url, data, {
        ...getAdminAuthHeaders(),
        ...(extraHeaders ?? {}),
      });
      return envelope.data;
    }),

  patch: async <T, R>(url: string, data: T, extraHeaders?: ApiHeaders): Promise<R> =>
    withAdminSessionGuard(async () => {
      const envelope = await http.patch<T, ApiResponse<R>>(url, data, {
        ...getAdminAuthHeaders(),
        ...(extraHeaders ?? {}),
      });
      return envelope.data;
    }),

  put: async <T, R>(url: string, data: T, extraHeaders?: ApiHeaders): Promise<R> =>
    withAdminSessionGuard(async () => {
      const envelope = await http.put<T, ApiResponse<R>>(url, data, {
        ...getAdminAuthHeaders(),
        ...(extraHeaders ?? {}),
      });
      return envelope.data;
    }),

  /** For 204 No-Content the envelope is absent; `.data` returns undefined (≡ void). */
  delete: async <R>(url: string, extraHeaders?: ApiHeaders): Promise<R> =>
    withAdminSessionGuard(async () => {
      const envelope = await http.delete<ApiResponse<R>>(url, {
        ...getAdminAuthHeaders(),
        ...(extraHeaders ?? {}),
      });
      return envelope.data;
    }),
};
