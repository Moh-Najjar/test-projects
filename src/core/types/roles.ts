/**
 * All possible user roles in the RBAC system.
 *
 * Each value matches the `displayName` of the corresponding Azure AD
 * group returned by Microsoft Graph.
 *
 * Extend this union as new roles are onboarded by the backend.
 */
export type UserRole = 'DATA_ENTRY' | 'APPROVER';
