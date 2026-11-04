// ─── Query params ─────────────────────────────────────────────────────────────

/** Query parameters for GET /admin/users. */
export interface ListUsersParams {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
}

// ─── Roles ────────────────────────────────────────────────────────────────────

/** A system role as returned by GET /admin/roles. */
export interface AdminRole {
  roleId: number;
  roleKey: string;
  roleName: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

// ─── Directorates (nested) ────────────────────────────────────────────────────

/** Nested directorate info embedded inside an AdminUser record. */
export interface UserDirectorate {
  directorateId: number;
  directorateKey: string;
  nameEn: string;
  nameAr: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * A single user record from GET /admin/users.
 * Roles are NOT included in the list — fetch them separately via
 * GET /admin/users/:userId/roles and use `UserRoleAssignment` below.
 */
export interface AdminUser {
  userId: number;
  externalObjectId: string | null;
  username: string;
  fullNameEn: string;
  fullNameAr: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  /** Flat FK — present even when the nested `directorate` object is null. */
  directorateId: number | null;
  /** Nested directorate — populated when the user belongs to one. */
  directorate: UserDirectorate | null;
}

/**
 * Paginated response from GET /admin/users.
 * Note: the page of records lives in `items`, NOT `data`.
 */
export interface PaginatedUsers {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── User Roles ───────────────────────────────────────────────────────────────

/** A single role assignment from GET /admin/users/:userId/roles. */
export interface UserRoleAssignment {
  userRoleId: number;
  userId: number;
  roleId: number;
  assignedAt: string;
  /** Full role object nested inside the assignment. */
  role: AdminRole;
}

/** Body for POST /admin/users/:userId/roles. */
export interface AssignRoleRequest {
  roleId: number;
}

/** Minimal response from POST /admin/users/:userId/roles (no nested role). */
export interface AssignRoleResponse {
  userRoleId: number;
  userId: number;
  roleId: number;
  assignedAt: string;
}

// ─── User Directorate ─────────────────────────────────────────────────────────

/** Body for PUT /admin/users/:userId/directorate. */
export interface AssignDirectorateRequest {
  directorateId: number | null;
}
