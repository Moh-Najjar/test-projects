/** A directorate record from GET /admin/directorates. */
export interface AdminDirectorate {
  directorateId: number;
  directorateKey: string;
  nameEn: string;
  nameAr: string;
  isActive: boolean;
  createdAt: string;
}

/** Body for POST /admin/directorates — creates a new organisational unit. */
export interface CreateDirectorateRequest {
  directorateKey: string;
  nameEn: string;
  nameAr: string;
  isActive: boolean;
}

/**
 * Minimal form shape nested inside DirectorateFormAccess.
 * Defined locally (not imported from adminForms) to avoid a circular dependency.
 */
interface AccessForm {
  formId: number;
  formKey: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  isActive: boolean;
  version: number;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string | null;
  directorateId: number | null;
  frequencyId: number | null;
  createdByUserId: number | null;
  updatedByUserId: number | null;
}

/**
 * A form-access record from GET /admin/directorates/:id/forms.
 * The nested `form` object contains the form's details.
 */
export interface DirectorateFormAccess {
  accessId: number;
  directorateId: number;
  formId: number;
  canView: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  grantedAt: string;
  /** Full form details — present when returned by the GET endpoint. */
  form?: AccessForm;
}

/** Body for POST /admin/directorates/:id/forms — assign a form to a directorate. */
export interface AssignFormToDirectorateRequest {
  formId: number;
  canView: boolean;
  canSubmit: boolean;
  canApprove: boolean;
}
