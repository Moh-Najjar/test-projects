import { adminHttp } from './adminHttp';
import type {
  AdminDirectorate,
  DirectorateFormAccess,
  AssignFormToDirectorateRequest,
  CreateDirectorateRequest,
} from '../../types/admin/adminDirectorates';
import type { AdminForm } from '../../types/admin/adminForms';

const BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL ?? '';

/**
 * GET /admin/directorates — all directorates.
 */
export const getAllDirectoratesApi = async (): Promise<AdminDirectorate[]> =>
  adminHttp.get<AdminDirectorate[]>(`${BASE_URL}/admin/directorates`);

/**
 * POST /admin/directorates — creates a new directorate.
 */
export const createDirectorateApi = async (data: CreateDirectorateRequest): Promise<AdminDirectorate> =>
  adminHttp.post<CreateDirectorateRequest, AdminDirectorate>(`${BASE_URL}/admin/directorates`, data);

/**
 * GET /admin/directorates/:id/forms — form access records for a directorate.
 */
export const getDirectorateFormsApi = async (directorateId: number): Promise<DirectorateFormAccess[]> =>
  adminHttp.get<DirectorateFormAccess[]>(`${BASE_URL}/admin/directorates/${directorateId}/forms`);

/**
 * POST /admin/directorates/:id/forms — assigns a form to a directorate with permissions.
 */
export const assignFormToDirectorateApi = async (
  directorateId: number,
  data: AssignFormToDirectorateRequest,
): Promise<void> =>
  adminHttp.post<AssignFormToDirectorateRequest, void>(
    `${BASE_URL}/admin/directorates/${directorateId}/forms`,
    data,
  );

/**
 * DELETE /admin/directorates/:id/forms/:formId — removes a form access record (204).
 */
export const removeFormFromDirectorateApi = async (
  directorateId: number,
  formId: number,
): Promise<void> =>
  adminHttp.delete<void>(`${BASE_URL}/admin/directorates/${directorateId}/forms/${formId}`);

/**
 * GET /admin/forms — all active forms (used for dropdown population in directorates).
 * Returns full AdminForm objects; use formId / nameEn / nameAr for display.
 */
export const getActiveFormsDropdownApi = async (): Promise<AdminForm[]> =>
  adminHttp.get<AdminForm[]>(`${BASE_URL}/admin/forms`);
