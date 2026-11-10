import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const AdminDashboard = lazy(() => import('../../../modules/admin/dashboard'));
const UserManagement = lazy(() => import('../../../modules/admin/components/UserManagement'));
const DirectorateManagement = lazy(
  () => import('../../../modules/admin/components/DirectorateManagement'),
);
const GroupRoleMappingManagement = lazy(
  () => import('../../../modules/admin/components/GroupRoleMappingManagement'),
);
const FormManagement = lazy(() => import('../../../modules/admin/components/FormManagement'));
const FormDetail = lazy(
  () => import('../../../modules/admin/components/FormManagement/FormDetail'),
);
const AdminDocumentation = lazy(() => import('../../../modules/admin/documentation'));
const AuditLogsPage = lazy(() => import('../../../modules/admin/audit-logs'));

/** Protected admin routes — accessible only when authenticated as admin. */
export const adminProtectedRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: <AdminDashboard />,
  },
  {
    path: '/admin/users',
    element: <UserManagement />,
  },
  {
    path: '/admin/directorates',
    element: <DirectorateManagement />,
  },
  {
    path: '/admin/group-mappings',
    element: <GroupRoleMappingManagement />,
  },
  {
    path: '/admin/forms',
    element: <FormManagement />,
  },
  {
    path: '/admin/forms/:formId',
    element: <FormDetail />,
  },
  {
    path: '/admin/audit-logs',
    element: <AuditLogsPage />,
  },
  {
    path: '/admin/docs',
    element: <AdminDocumentation />,
  },
];
