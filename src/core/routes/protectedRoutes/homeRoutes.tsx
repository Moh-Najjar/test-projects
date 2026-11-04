import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const Home = lazy(() => import('../../../modules/home'));

export const homeRoutes: RouteObject[] = [
  {
    path: '/home',
    element: <Home />,
  },
];