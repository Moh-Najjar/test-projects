import type { SubmitFormRequest, UpdateSubmissionRequest } from '../types/submitFormRequest';
import type { GetDropdownListValuesResponse } from '../types/getDropdownListValuesResponse';
import type { GetDropdownListValuesRequest } from '../types/getDropdownListValuesRequest';
import type { GetSubmissionDetailsResponse } from '../types/getSubmissionDetailsResponse';
import type { GetSubmissionDetailsRequest } from '../types/getSubmissionDetailsRequest';
import type { GetMySubmissionsResponse } from '../types/getMySubmissionsResponse';
import type { GetMySubmissionsRequest } from '../types/getMySubmissionsRequest';
import type { SubmitFormResponse } from '../types/submitFormResponse';
import type { LoginResponse } from '../types/loginResponse';
import { AUTH_STORAGE_KEY } from '../context/AuthContext';
import type { FormField } from '../types/FormField';
import type { ApiHeaders } from '../helpers/http';
import { http } from '../helpers/http';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;


const getAuthHeaders = (): ApiHeaders => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);

    if (raw === null) return { Authorization: 'Bearer ' };

    // Stored as PersistedAuthData: { loginData: LoginResponse, expiresAt: number }
    const parsed = JSON.parse(raw) as { loginData?: LoginResponse };

    const token = parsed.loginData?.accessToken ?? '';
    return { Authorization: `Bearer ${token}` };
  } catch {
    return { Authorization: 'Bearer ' };
  }
};

export const getFormFields = async (): Promise<FormField[]> => {
  return await http.get<FormField[]>(`${BASE_URL}/form-fields`, getAuthHeaders());
};

export const getDropdownListValues = async (
  lookupTypeIds: GetDropdownListValuesRequest,
): Promise<GetDropdownListValuesResponse> => {
  return await http.post<GetDropdownListValuesRequest, GetDropdownListValuesResponse>(
    `${BASE_URL}/lookup-values/batch`,
    lookupTypeIds,
    getAuthHeaders(),
  );
};

export const submitForm = async (data: SubmitFormRequest): Promise<SubmitFormResponse> => {
  return await http.post<SubmitFormRequest, SubmitFormResponse>(
    `${BASE_URL}/submissions/create-with-data`,
    data,
    getAuthHeaders(),
  );
};

export const getMySubmissions = async (
  params: GetMySubmissionsRequest,
): Promise<GetMySubmissionsResponse> => {
  // Build query string from the request params
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  }).toString();

  return await http.get<GetMySubmissionsResponse>(
    `${BASE_URL}/submissions?${query}`,
    getAuthHeaders(),
  );
};

export const getSubmissionDetails = async (
  params: GetSubmissionDetailsRequest,
): Promise<GetSubmissionDetailsResponse> => {
  return await http.get<GetSubmissionDetailsResponse>(
    `${BASE_URL}/submissions/${params.submissionId}/detail`,
    getAuthHeaders(),
  );
};

// Updates an existing submission - PUT /submissions/{submissionId}
export const updateSubmission = async (
  params: UpdateSubmissionRequest,
): Promise<SubmitFormResponse> => {
  return await http.put<SubmitFormRequest, SubmitFormResponse>(
    `${BASE_URL}/submissions/${params.submissionId}`,
    params.data,
    getAuthHeaders(),
  );
};

