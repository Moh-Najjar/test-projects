import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { RoleProtectedRoute } from '../routeConfig';

const NewRequest = lazy(() => import('../../../modules/new-request'));

export const newRequestRoutes: RouteObject[] = [
    {
        path: '/my-requests/new',
        element: (
            <RoleProtectedRoute allowedRoles={['DATA_ENTRY']}>
                <NewRequest />
            </RoleProtectedRoute>
        ),
    },
];
