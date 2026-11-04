import { type RouteObject, useRoutes, useLocation } from 'react-router-dom';
import { publicRoutes } from './publicLayout';
import { authorizedRoutes } from './authorizedLayout';
import { adminAuthRoutes, adminProtectedRoutes } from './adminRoutes';
import { ProtectedRoute, PublicRoute, AdminProtectedRoute, AdminPublicRoute } from './routeConfig';
import SuspenseWrapper from '../../modules/shared/SuspenseWrapper';
import PageTransition from '../../modules/shared/PageTransition';
import AdminThemeProvider from '../../modules/admin/shared/theme/AdminThemeProvider';
import { useAuth } from '../context/AuthContext';

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  const routes = [
    // ── Regular public routes (login, root) ──────────────────────────────────
    ...publicRoutes.map((route: RouteObject) => ({
      ...route,
      element: (
        <PublicRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
          {route.element}
        </PublicRoute>
      ),
    })),
    // ── Regular protected routes (home, profile, requests …) ─────────────────
    ...authorizedRoutes.map((route: RouteObject) => ({
      ...route,
      element: (
        <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
          {route.element}
        </ProtectedRoute>
      ),
    })),
    // ── Admin public routes (/admin/login) ───────────────────────────────────
    ...adminAuthRoutes.map((route: RouteObject) => ({
      ...route,
      element: (
        <AdminPublicRoute>
          {/* Admin screens use their own design system, independent of the public site. */}
          <AdminThemeProvider>{route.element}</AdminThemeProvider>
        </AdminPublicRoute>
      ),
    })),
    // ── Admin protected routes (/admin, /admin/users …) ───────────────────────
    ...adminProtectedRoutes.map((route: RouteObject) => ({
      ...route,
      element: (
        <AdminProtectedRoute>
          <AdminThemeProvider>{route.element}</AdminThemeProvider>
        </AdminProtectedRoute>
      ),
    })),
  ];

  const element = useRoutes(routes);

  return (
    <SuspenseWrapper>
      {element !== null ? (
        <PageTransition key={location.pathname}>{element}</PageTransition>
      ) : null}
    </SuspenseWrapper>
  );
};

export default AppRoutes;
