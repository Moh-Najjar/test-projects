import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createExternalGroupRoleMappingApi,
  getExternalGroupRoleMappingsApi,
} from '../../api/admin/adminExternalGroupRoleMappings';
import type { CreateExternalGroupRoleMappingRequest } from '../../types/admin/adminExternalGroupRoleMappings';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const ADMIN_EXTERNAL_GROUP_ROLE_MAPPINGS_QUERY_KEY = 'admin-external-group-role-mappings';

// ─── Queries ──────────────────────────────────────────────────────────────────

/** All Azure group → role mappings. */
export const useAdminExternalGroupRoleMappings = () =>
  useQuery({
    queryKey: [ADMIN_EXTERNAL_GROUP_ROLE_MAPPINGS_QUERY_KEY],
    queryFn: getExternalGroupRoleMappingsApi,
    // retry: false only skips the immediate "try again" loop after a failure.
    // These extra flags stop React Query from issuing a brand-new GET on remount,
    // window focus (e.g. opening DevTools), or reconnect.
    retry: false,
    retryOnMount: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Creates a mapping and refreshes the mappings list. */
export const useCreateExternalGroupRoleMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExternalGroupRoleMappingRequest) => createExternalGroupRoleMappingApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [ADMIN_EXTERNAL_GROUP_ROLE_MAPPINGS_QUERY_KEY] });
    },
  });
};
