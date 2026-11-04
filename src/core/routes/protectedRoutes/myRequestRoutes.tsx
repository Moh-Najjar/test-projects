import { lazy } from 'react'
import { RouteObject } from 'react-router-dom';
import { RoleProtectedRoute } from '../routeConfig';

const MyRequests = lazy(() => import('../../../modules/my-requests'));
const RequestDetail = lazy(() => import('../../../modules/my-requests/RequestDetail'));
const EditRequest = lazy(() => import('../../../modules/my-requests/EditRequest'));

export const myRequestRoutes: RouteObject[] = [
    {
        path: '/my-requests',
        element: <MyRequests />,
    },
    {
        path: '/my-requests/:submissionId',
        element: <RequestDetail />,
    },
    {
        path: '/my-requests/:submissionId/edit',
        element: (
            <RoleProtectedRoute allowedRoles={['DATA_ENTRY']}>
                <EditRequest />
            </RoleProtectedRoute>
        ),
    },
];
