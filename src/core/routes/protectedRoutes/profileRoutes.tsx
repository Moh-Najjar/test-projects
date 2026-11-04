import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const Profile = lazy(() => import('../../../modules/profile'));

export const profileRoutes: RouteObject[] = [
  {
    path: '/profile',
    element: <Profile />,
  },
];