import { adminHttp } from './adminHttp';
import type {
  CreateExternalGroupRoleMappingRequest,
  ExternalGroupRoleMapping,
} from '../../types/admin/adminExternalGroupRoleMappings';

const BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL ?? '';

/**
 * GET /admin/external-group-role-mappings — all Azure group → role mappings.
 */
export const getExternalGroupRoleMappingsApi = async (): Promise<ExternalGroupRoleMapping[]> =>
  adminHttp.get<ExternalGroupRoleMapping[]>(`${BASE_URL}/admin/external-group-role-mappings`);

/**
 * POST /admin/external-group-role-mappings — maps an Azure AD group to a portal role.
 */
export const createExternalGroupRoleMappingApi = async (
  data: CreateExternalGroupRoleMappingRequest,
): Promise<ExternalGroupRoleMapping> =>
  adminHttp.post<CreateExternalGroupRoleMappingRequest, ExternalGroupRoleMapping>(
    `${BASE_URL}/admin/external-group-role-mappings`,
    data,
  );
