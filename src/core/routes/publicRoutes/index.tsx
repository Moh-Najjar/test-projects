import type { RouteObject } from 'react-router-dom';

import { authRoutes } from './authRoutes';

/**
 * Public (unauthenticated) routes.
 *
 * The `*` wildcard catch-all is intentionally NOT included here.
 * Including it would cause every unknown URL to match the public wildcard
 * first (since public routes are registered before authorized routes in the
 * flat useRoutes array), and `PublicRoute` would redirect authenticated users
 * to /home for any unrecognised path — including newly added protected routes.
 *
 * The single `*` wildcard lives in authorizedRoutes and is handled there.
 */
export const publicRoutes: RouteObject[] = [
  ...authRoutes,
];
