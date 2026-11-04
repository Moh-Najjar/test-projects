/**
 * Azure AD group → portal role mapping.
 * POST /admin/external-group-role-mappings and GET /admin/external-group-role-mappings.
 */

/** Nested role snapshot returned with a mapping, when the API includes it. */
export interface MappingRole {
  roleId: number;
  roleKey: string;
  roleName: string;
  description: string | null;
  isActive: boolean;
}

/** Nested directorate snapshot returned with a mapping, when the API includes it. */
export interface MappingDirectorate {
  directorateId: number;
  directorateKey: string;
  nameEn: string;
  nameAr: string;
  isActive: boolean;
}

/** A persisted mapping of an Azure group to a portal role and directorate. */
export interface ExternalGroupRoleMapping {
  mappingId: number;
  groupObjectId: string;
  groupKey: string;
  groupNameEn: string;
  groupNameAr: string;
  roleId: number;
  directorateId: number;
  isActive: boolean;
  createdAt: string;
  /** Present when the list/create payload embeds the assigned role. */
  role?: MappingRole;
  /** Present when the list/create payload embeds the assigned directorate. */
  directorate?: MappingDirectorate;
}

/** Body for POST /admin/external-group-role-mappings. */
export interface CreateExternalGroupRoleMappingRequest {
  groupObjectId: string;
  groupKey: string;
  groupNameEn: string;
  groupNameAr: string;
  roleId: number;
  isActive: boolean;
  directorateId: number;
}
