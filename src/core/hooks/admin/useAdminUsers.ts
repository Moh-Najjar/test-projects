import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listUsersApi,
  getUserRolesApi,
  getAllRolesApi,
  assignRoleToUserApi,
  removeRoleFromUserApi,
  assignDirectorateToUserApi,
} from '../../api/admin/adminUsers';
import type {
  ListUsersParams,
  AssignRoleRequest,
  AssignDirectorateRequest,
} from '../../types/admin/adminUsers';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const ADMIN_USERS_QUERY_KEY = 'admin-users';
export const ADMIN_USER_ROLES_QUERY_KEY = 'admin-user-roles';
export const ADMIN_ALL_ROLES_QUERY_KEY = 'admin-all-roles';

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Paginated list of users with optional search / isActive filter. */
export const useAdminUsers = (params: ListUsersParams) =>
  useQuery({
    queryKey: [ADMIN_USERS_QUERY_KEY, params],
    queryFn: () => listUsersApi(params),
  });

/** Role assignments for a specific user. */
export const useAdminUserRoles = (userId: number) =>
  useQuery({
    queryKey: [ADMIN_USER_ROLES_QUERY_KEY, userId],
    queryFn: () => getUserRolesApi(userId),
    enabled: userId > 0,
  });

/** All available roles in the system (for dropdowns). */
export const useAdminAllRoles = () =>
  useQuery({
    queryKey: [ADMIN_ALL_ROLES_QUERY_KEY],
    queryFn: getAllRolesApi,
    staleTime: 1000 * 60 * 10, // roles rarely change — cache for 10 minutes
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Assigns a role to a user; invalidates the user list and that user's roles. */
export const useAssignRoleToUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: AssignRoleRequest }) =>
      assignRoleToUserApi(userId, data),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_QUERY_KEY] });
      void queryClient.invalidateQueries({
        queryKey: [ADMIN_USER_ROLES_QUERY_KEY, variables.userId],
      });
    },
  });
};

/** Removes a role from a user; invalidates the user list and that user's roles. */
export const useRemoveRoleFromUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
      removeRoleFromUserApi(userId, roleId),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_QUERY_KEY] });
      void queryClient.invalidateQueries({
        queryKey: [ADMIN_USER_ROLES_QUERY_KEY, variables.userId],
      });
    },
  });
};

/** Assigns or unassigns a directorate from a user. */
export const useAssignDirectorateToUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: number;
      data: AssignDirectorateRequest;
    }) => assignDirectorateToUserApi(userId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_QUERY_KEY] });
    },
  });
};
