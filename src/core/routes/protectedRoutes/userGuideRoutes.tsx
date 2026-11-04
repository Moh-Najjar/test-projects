import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const UserGuide = lazy(() => import('../../../modules/user-guide'));

export const userGuideRoutes: RouteObject[] = [
  {
    path: '/user-guide',
    element: <UserGuide />,
  },
];
