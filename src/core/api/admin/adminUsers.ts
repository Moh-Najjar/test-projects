import { adminHttp } from './adminHttp';
import type {
  PaginatedUsers,
  ListUsersParams,
  UserRoleAssignment,
  AdminRole,
  AssignRoleRequest,
  AssignDirectorateRequest,
} from '../../types/admin/adminUsers';

const BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL ?? '';

/**
 * GET /admin/users — paginated list with optional search / isActive filter.
 */
export const listUsersApi = async (params: ListUsersParams): Promise<PaginatedUsers> => {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.search !== undefined && params.search.length > 0) {
    query.append('search', params.search);
  }
  if (params.isActive !== undefined) {
    query.append('isActive', String(params.isActive));
  }
  return adminHttp.get<PaginatedUsers>(`${BASE_URL}/admin/users?${query.toString()}`);
};

/**
 * GET /admin/users/:userId/roles — role assignments for a specific user.
 */
export const getUserRolesApi = async (userId: number): Promise<UserRoleAssignment[]> =>
  adminHttp.get<UserRoleAssignment[]>(`${BASE_URL}/admin/users/${userId}/roles`);

/**
 * POST /admin/users/:userId/roles — assigns a role to a user (idempotent).
 */
export const assignRoleToUserApi = async (userId: number, data: AssignRoleRequest): Promise<void> =>
  adminHttp.post<AssignRoleRequest, void>(`${BASE_URL}/admin/users/${userId}/roles`, data);

/**
 * DELETE /admin/users/:userId/roles/:roleId — removes a role assignment (204).
 */
export const removeRoleFromUserApi = async (userId: number, roleId: number): Promise<void> =>
  adminHttp.delete<void>(`${BASE_URL}/admin/users/${userId}/roles/${roleId}`);

/**
 * PUT /admin/users/:userId/directorate — assigns or unassigns a directorate.
 * Pass { directorateId: null } to unassign.
 */
export const assignDirectorateToUserApi = async (
  userId: number,
  data: AssignDirectorateRequest,
): Promise<void> =>
  adminHttp.put<AssignDirectorateRequest, void>(
    `${BASE_URL}/admin/users/${userId}/directorate`,
    data,
  );

/**
 * GET /admin/roles — all available roles (for dropdown population).
 */
export const getAllRolesApi = async (): Promise<AdminRole[]> =>
  adminHttp.get<AdminRole[]>(`${BASE_URL}/admin/roles`);
