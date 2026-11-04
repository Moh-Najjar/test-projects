import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import type { UserRole } from '../types/roles';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  /** Suspends routing decisions while MSAL is still initialising. */
  isLoading: boolean;
  children: React.ReactNode;
}

interface PublicRouteProps {
  isAuthenticated: boolean;
  /** Suspends routing decisions while MSAL is still initialising. */
  isLoading: boolean;
  children: React.ReactNode;
}

export const ProtectedRoute = ({ isAuthenticated, isLoading, children }: ProtectedRouteProps) => {
  // Defer until MSAL has finished hydrating accounts from storage.
  // Without this guard, isAuthenticated is briefly false on every page load,
  // causing a spurious redirect to /login before the session is confirmed.
  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

interface RoleProtectedRouteProps {
  /** Whitelist of roles that may access this route. */
  allowedRoles: ReadonlyArray<UserRole>;
  children: React.ReactNode;
}

/**
 * Wraps a route element with role-based access control on top of the existing
 * authentication guard. The user must be authenticated (handled by
 * `ProtectedRoute` in the parent) AND hold at least one of `allowedRoles`.
 *
 * Behaviour:
 *   - While MSAL is still initialising (`isLoading`) → renders nothing to
 *     avoid a flash-redirect before roles are known.
 *   - Roles not yet fetched (empty array, still loading from Graph) → renders
 *     nothing; the route becomes visible once the query settles.
 *   - User holds none of the required roles → redirects to /home.
 *   - User holds at least one required role → renders children.
 */
export const RoleProtectedRoute = ({ allowedRoles, children }: RoleProtectedRouteProps) => {
  const { isLoading, userRoles } = useAuth();

  // Defer until MSAL and Graph role query have settled.
  if (isLoading) return null;

  // Still waiting for the Graph roles query to resolve (empty but not yet errored).
  // We treat an empty userRoles array as "not yet loaded" to prevent a premature
  // redirect when the token exchange is in flight.
  if (userRoles.length === 0) return null;

  // User is authenticated but does not hold any of the required roles.
  const hasRequiredRole = allowedRoles.some((role) => userRoles.includes(role));
  if (!hasRequiredRole) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export const PublicRoute = ({ isAuthenticated, isLoading, children }: PublicRouteProps) => {
  // Same deferred check: prevents the login page from flashing and then
  // immediately redirecting an already-authenticated user to /home.
  if (isLoading) return null;

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

// ─── Admin route guards ───────────────────────────────────────────────────────

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Protects admin pages — redirects to /admin/login when no valid admin session
 * is present in localStorage.
 */
export const AdminProtectedRoute = ({ children }: AdminRouteProps) => {
  const { isAdminAuthenticated } = useAdminAuth();

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

/**
 * Wraps admin-only public pages (e.g. /admin/login) — redirects to /admin when
 * an admin session already exists so the user does not see the login form again.
 */
export const AdminPublicRoute = ({ children }: AdminRouteProps) => {
  const { isAdminAuthenticated } = useAdminAuth();

  if (isAdminAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};
