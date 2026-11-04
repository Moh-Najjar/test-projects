import { http } from '../../helpers/http';
import { adminHttp } from './adminHttp';
import type { AdminLoginRequest, AdminLoginData } from '../../types/admin/adminAuth';

const BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL ?? '';

/** Local helper so we can unwrap the ApiResponse envelope for the login endpoint
 *  which uses plain `http` (no Bearer token needed for login itself). */
interface LoginEnvelope {
  data: AdminLoginData;
}

/**
 * POST /auth/login — validates admin credentials and returns a signed JWT.
 * Uses plain `http` (no auth header needed for the login call itself).
 * Unwraps the ApiResponse envelope and returns `AdminLoginData` directly.
 */
export const adminLoginApi = async (data: AdminLoginRequest): Promise<AdminLoginData> => {
  const envelope = await http.post<AdminLoginRequest, LoginEnvelope>(
    `${BASE_URL}/auth/login`,
    data,
  );
  return envelope.data;
};

/**
 * POST /auth/logout — blacklists the current Bearer token (204 No Content).
 * Uses `adminHttp` to inject the token being revoked.
 */
export const adminLogoutApi = async (): Promise<void> =>
  adminHttp.post<Record<string, never>, void>(`${BASE_URL}/auth/logout`, {});
