import type { RouteObject } from 'react-router-dom';

import { profileRoutes } from './profileRoutes';
import { homeRoutes } from './homeRoutes';
import { myRequestRoutes } from './myRequestRoutes';
import { newRequestRoutes } from './newRequestRoutes';
import { userGuideRoutes } from './userGuideRoutes';
import { notFoundRoutes } from '../publicRoutes/notFoundRoutes';

export const authorizedRoutes: RouteObject[] = [
  ...homeRoutes,
  ...profileRoutes,
  ...newRequestRoutes,
  ...myRequestRoutes,
  ...userGuideRoutes,
  ...notFoundRoutes,
];
