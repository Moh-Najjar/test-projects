import { useQuery } from '@tanstack/react-query';
import { getUserRole } from '../api/graph';
import useTokenSession from './useTokenSession';

const GRAPH_QUERY_KEY = 'graph';

export const useGraphUserRole = () => {
  const { accessToken } = useTokenSession();

  return useQuery<any, Error>({
    queryKey: [GRAPH_QUERY_KEY, 'group'],
    queryFn: async (): Promise<any> => {
      if (accessToken === null) {
        throw new Error('No access token available');
      }
      return getUserRole(accessToken);
    },
    enabled: accessToken !== null,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
