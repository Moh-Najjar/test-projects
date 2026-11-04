import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const Login = lazy(() => import('../../../modules/auth/Login'));

export const authRoutes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Login />,
  },
];
