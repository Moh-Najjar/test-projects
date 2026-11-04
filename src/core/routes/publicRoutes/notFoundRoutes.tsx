import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const NotFound = lazy(() => import('../../../modules/shared/NotFound'));

export const notFoundRoutes: RouteObject[] = [
  {
    path: '*',
    element: <NotFound />,
  },
];