import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const AdminLogin = lazy(() => import('../../../modules/admin/login'));

/** Public admin routes — accessible only when NOT authenticated as admin. */
export const adminAuthRoutes: RouteObject[] = [
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },
];
