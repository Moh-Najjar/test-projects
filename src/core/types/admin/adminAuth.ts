/** Credentials sent to POST /auth/login for admin portal. */
export interface AdminLoginRequest {
  email: string;
  password: string;
}

/**
 * Payload returned inside the ApiResponse envelope from POST /auth/login.
 * adminHttp unwraps the envelope automatically, so callers receive this directly.
 */
export interface AdminLoginData {
  accessToken: string;
}

/** What we persist in localStorage under ADMIN_SESSION_KEY. */
export interface AdminSession {
  /** JWT bearer token for all admin API calls. */
  accessToken: string;
  /** Unix timestamp (ms) when the token expires. */
  expiresAt: number;
}
