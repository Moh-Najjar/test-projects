import { approveSubmission, rejectSubmission } from '../api/request';
import type { ApproveResponse } from '../types/approveResponse';
import type { RejectResponse } from '../types/rejectResponse';
import type { RejectRequest } from '../types/rejectRequest';
import { useMutation } from '@tanstack/react-query';

const APPROVE_SUBMISSION_MUTATION_KEY = ['approve-submission'];
const REJECT_SUBMISSION_MUTATION_KEY = ['reject-submission'];

// Sends an approve action for a given submission ID
export const useApproveSubmission = () => {
    return useMutation<ApproveResponse, Error, number>({
        mutationKey: APPROVE_SUBMISSION_MUTATION_KEY,
        mutationFn: async (submissionId: number): Promise<ApproveResponse> => {
            return await approveSubmission(submissionId);
        },
        retry: 1,
    });
};

// Sends a reject action for a given submission ID with a mandatory reason
export const useRejectSubmission = () => {
    return useMutation<RejectResponse, Error, RejectRequest>({
        mutationKey: REJECT_SUBMISSION_MUTATION_KEY,
        mutationFn: async (params: RejectRequest): Promise<RejectResponse> => {
            return await rejectSubmission(params);
        },
        retry: 1,
    });
};
