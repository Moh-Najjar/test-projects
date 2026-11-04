import type { ApproveResponse } from '../types/approveResponse';
import type { RejectResponse } from '../types/rejectResponse';
import type { RejectRequest } from '../types/rejectRequest';
import type { LoginResponse } from '../types/loginResponse';
import { AUTH_STORAGE_KEY } from '../context/AuthContext';
import type { ApiHeaders } from '../helpers/http';
import { http } from '../helpers/http';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Reads the backend AccessToken from localStorage at *call time*, not at
 * module-load time. This ensures API calls made after a silent session refresh
 * always carry the current token rather than a stale one captured on import.
 */
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

// Approves a submission by its ID — POST /submissions/{submissionId}/approve
export const approveSubmission = async (
    submissionId: number,
): Promise<ApproveResponse> => {
    return await http.post<Record<string, never>, ApproveResponse>(
        `${BASE_URL}/submissions/${submissionId}/approve`,
        {},
        getAuthHeaders(),
    );
};

// Rejects a submission by its ID with a reason — POST /submissions/{submissionId}/reject
export const rejectSubmission = async (
    params: RejectRequest,
): Promise<RejectResponse> => {
    return await http.post<{ reason: string }, RejectResponse>(
        `${BASE_URL}/submissions/${params.submissionId}/reject`,
        { reason: params.reason },
        getAuthHeaders(),
    );
};
