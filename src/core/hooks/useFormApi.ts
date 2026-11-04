import { getDropdownListValues, getFormFields, getMySubmissions, getSubmissionDetails, submitForm, updateSubmission } from "../api/form";
import type { GetSubmissionDetailsResponse } from "../types/getSubmissionDetailsResponse";
import { GetDropdownListValuesResponse } from "../types/getDropdownListValuesResponse";
import type { GetMySubmissionsResponse } from "../types/getMySubmissionsResponse";
import type { GetMySubmissionsRequest } from "../types/getMySubmissionsRequest";
import { SubmitFormResponse } from "../types/submitFormResponse";
import { SubmitFormRequest, UpdateSubmissionRequest } from "../types/submitFormRequest";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { FormField } from "../types/FormField";
import { useAuth } from "../context/AuthContext";

export const DROPDOWN_LIST_VALUES_QUERY_KEY = 'dropdown-list-values';
const SUBMIT_FORM_MUTATION_KEY = ['submit-form'];
export const FORM_FIELDS_QUERY_KEY = 'form-fields';
export const MY_SUBMISSIONS_QUERY_KEY = 'my-submissions';
export const SUBMISSION_DETAILS_QUERY_KEY = 'submission-details';

export const useFormFields = () => {
    const { authSession } = useAuth();

    return useQuery<FormField[], Error>({
        queryKey: [FORM_FIELDS_QUERY_KEY],
        queryFn: async (): Promise<FormField[]> => {
            return await getFormFields();
        },
        enabled: authSession !== null,
        retry: 1,
        staleTime: 0,       // always stale → refetch on every mount
        gcTime: 0,          // do not keep old data in cache between navigations
    });
};

export const useDropdownOptions = (lookupTypeId: number | undefined) => {
    return useQuery<GetDropdownListValuesResponse, Error>({
        queryKey: [DROPDOWN_LIST_VALUES_QUERY_KEY, lookupTypeId],
        queryFn: async (): Promise<GetDropdownListValuesResponse> => {
            if (lookupTypeId === undefined) return {};
            return await getDropdownListValues({ lookupTypeIds: [lookupTypeId] });
        },
        enabled: lookupTypeId !== undefined,
        staleTime: Infinity,
        retry: 1,
    });
};

export const useMultiDropdownOptions = (lookupTypeIds: number[]) => {
    // Sorted copy for a stable, order-independent query key
    const sortedIds = [...lookupTypeIds].sort((a, b) => a - b);

    return useQuery<GetDropdownListValuesResponse, Error>({
        queryKey: [DROPDOWN_LIST_VALUES_QUERY_KEY, 'multi', ...sortedIds],
        queryFn: async (): Promise<GetDropdownListValuesResponse> => {
            if (sortedIds.length === 0) return {};
            return await getDropdownListValues({ lookupTypeIds: sortedIds });
        },
        enabled: sortedIds.length > 0,
        staleTime: Infinity,
        retry: 1,
    });
};

export const useSubmitForm = () => {
    return useMutation<SubmitFormResponse, Error, SubmitFormRequest>({
        mutationKey: SUBMIT_FORM_MUTATION_KEY,
        mutationFn: async (data: SubmitFormRequest): Promise<SubmitFormResponse> => {
            return await submitForm(data);
        },
        retry: 0,
    });
};

export const useUpdateSubmission = () => {
    return useMutation<SubmitFormResponse, Error, UpdateSubmissionRequest>({
        mutationFn: async (params: UpdateSubmissionRequest): Promise<SubmitFormResponse> => {
            return await updateSubmission(params);
        },
        retry: 0,
    });
};

export const useGetSubmissionDetails = (submissionId: number | undefined) => {
    const { authSession } = useAuth();

    return useQuery<GetSubmissionDetailsResponse, Error>({
        queryKey: [SUBMISSION_DETAILS_QUERY_KEY, submissionId],
        queryFn: async (): Promise<GetSubmissionDetailsResponse> => {
            if (submissionId === undefined) throw new Error('submissionId is required');
            return await getSubmissionDetails({ submissionId });
        },
        enabled: authSession !== null && submissionId !== undefined,
        retry: 1,
        staleTime: 0, 
        gcTime: 0,
    });
};

interface UseGetMySubmissionsOptions {
    /** When false, the request list is not fetched. Defaults to true. */
    enabled?: boolean;
}

export const useGetMySubmissions = (
    params: GetMySubmissionsRequest,
    options?: UseGetMySubmissionsOptions,
) => {
    const { authSession } = useAuth();
    const extraEnabled = options?.enabled ?? true;

    return useQuery<GetMySubmissionsResponse, Error>({
        queryKey: [MY_SUBMISSIONS_QUERY_KEY, params.page, params.pageSize],
        queryFn: async (): Promise<GetMySubmissionsResponse> => {
            return await getMySubmissions(params);
        },
        enabled: authSession !== null && extraEnabled,
        retry: 1,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
};