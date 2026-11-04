import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAllDirectoratesApi,
  createDirectorateApi,
  getDirectorateFormsApi,
  assignFormToDirectorateApi,
  removeFormFromDirectorateApi,
  getActiveFormsDropdownApi,
} from '../../api/admin/adminDirectorates';
import type {
  AssignFormToDirectorateRequest,
  CreateDirectorateRequest,
} from '../../types/admin/adminDirectorates';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const ADMIN_DIRECTORATES_QUERY_KEY = 'admin-directorates';
export const ADMIN_DIRECTORATE_FORMS_QUERY_KEY = 'admin-directorate-forms';
export const ADMIN_ACTIVE_FORMS_DROPDOWN_QUERY_KEY = 'admin-active-forms-dropdown';

// ─── Queries ──────────────────────────────────────────────────────────────────

/** All directorates with parent info. */
export const useAdminDirectorates = () =>
  useQuery({
    queryKey: [ADMIN_DIRECTORATES_QUERY_KEY],
    queryFn: getAllDirectoratesApi,
  });

/** Form access records for a specific directorate. */
export const useDirectorateForms = (directorateId: number) =>
  useQuery({
    queryKey: [ADMIN_DIRECTORATE_FORMS_QUERY_KEY, directorateId],
    queryFn: () => getDirectorateFormsApi(directorateId),
    enabled: directorateId > 0,
  });

/** Active forms list for the Assign Form dialog — always fetched on open. */
export const useActiveFormsDropdown = () =>
  useQuery({
    queryKey: [ADMIN_ACTIVE_FORMS_DROPDOWN_QUERY_KEY],
    queryFn: getActiveFormsDropdownApi,
    // Override the global 5-minute staleTime so opening the dialog hits the API.
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Creates a directorate and refreshes the organisation list. */
export const useCreateDirectorate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDirectorateRequest) => createDirectorateApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [ADMIN_DIRECTORATES_QUERY_KEY] });
    },
  });
};

/** Assigns a form to a directorate with permissions (upsert). */
export const useAssignFormToDirectorate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      directorateId,
      data,
    }: {
      directorateId: number;
      data: AssignFormToDirectorateRequest;
    }) => assignFormToDirectorateApi(directorateId, data),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [ADMIN_DIRECTORATE_FORMS_QUERY_KEY, variables.directorateId],
      });
    },
  });
};

/** Removes a form access record from a directorate. */
export const useRemoveFormFromDirectorate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ directorateId, formId }: { directorateId: number; formId: number }) =>
      removeFormFromDirectorateApi(directorateId, formId),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [ADMIN_DIRECTORATE_FORMS_QUERY_KEY, variables.directorateId],
      });
    },
  });
};
