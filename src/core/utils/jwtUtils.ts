/**
 * Lightweight JWT utility — decodes the payload WITHOUT verifying the signature.
 * Only use this to read non-sensitive claims (e.g. `exp`) on the client side;
 * signature verification always happens server-side.
 */

/** Subset of standard JWT payload claims we care about. */
interface JwtPayload {
  /** Expiration time in seconds since Unix epoch (standard claim). */
  exp?: number;
  [key: string]: unknown;
}

/**
 * Decodes the base64url payload of a JWT and returns the `exp` claim
 * converted to milliseconds, matching `Date.now()` / `setTimeout` conventions.
 *
 * Returns `null` when the token is malformed, the payload cannot be parsed,
 * or the `exp` claim is absent.
 *
 * @param token - Raw JWT string (three dot-separated base64url segments).
 */
export const getJwtExpiryMs = (token: string): number | null => {
  try {
    const parts = token.split('.');

    // A valid JWT always has exactly three segments: header.payload.signature
    if (parts.length !== 3) return null;

    const payloadSegment = parts[1];

    // Base64url → standard base64 (replace URL-safe chars, add padding)
    const base64 = payloadSegment
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(
        payloadSegment.length + ((4 - (payloadSegment.length % 4)) % 4),
        '=',
      );

    const decoded = atob(base64);
    const parsed = JSON.parse(decoded) as JwtPayload;

    if (typeof parsed.exp !== 'number') return null;

    // JWT `exp` is in whole seconds; convert to ms for the browser APIs.
    return parsed.exp * 1000;
  } catch {
    // Malformed base64 or JSON — treat as unreadable token.
    return null;
  }
};
