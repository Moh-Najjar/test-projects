import type { ChipProps } from '@mui/material/Chip';
import type { Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import type { TFunction } from 'i18next';

import type { RequestStatus } from '../types';

/** Maps the API's Pascal-case status strings to the app's RequestStatus union */
export const mapApiStatus = (apiStatus: string): RequestStatus => {
  const statusMap: Record<string, RequestStatus> = {
    Draft:     'DRAFT',
    Submitted: 'SUBMITTED',
    Approved:  'APPROVED',
    Rejected:  'REJECTED',
    Returned:  'RETURNED',
  };
  return statusMap[apiStatus] ?? 'DRAFT';
};

/** Maps each RequestStatus to its MUI Chip color */
const STATUS_COLOR_MAP: Record<RequestStatus, ChipProps['color']> = {
  DRAFT: 'default',
  SUBMITTED: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  RETURNED: 'info',
};

/**
 * Returns the label and color props needed to render a status Chip.
 * Centralizing this logic ensures consistent styling across all components.
 */
export const getStatusChipProps = (
  status: RequestStatus,
  t: TFunction,
): Pick<ChipProps, 'label' | 'color'> => {
  const labelKeyMap: Record<RequestStatus, string> = {
    DRAFT: 'myRequests.status.draft',
    SUBMITTED: 'myRequests.status.submitted',
    APPROVED: 'myRequests.status.approved',
    REJECTED: 'myRequests.status.rejected',
    RETURNED: 'myRequests.status.returned',
  };

  return {
    label: t(labelKeyMap[status]),
    color: STATUS_COLOR_MAP[status],
  };
};

/** Theme-aware soft pill styles for status badges in tables and lists. */
export const getStatusBadgeStyles = (
  status: RequestStatus,
  theme: Theme,
): { bg: string; color: string } => {
  const colorByStatus: Record<RequestStatus, string> = {
    DRAFT: theme.palette.text.secondary,
    SUBMITTED: theme.palette.primary.main,
    APPROVED: theme.palette.success.main,
    REJECTED: theme.palette.error.main,
    RETURNED: theme.palette.warning.main,
  };

  const color = colorByStatus[status];
  const bgAlpha = theme.palette.mode === 'dark' ? 0.18 : 0.1;

  return {
    bg: alpha(color, bgAlpha),
    color,
  };
};
