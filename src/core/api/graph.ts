import { http } from '../helpers/http';

type GraphUserProfile = {
  id: string;
  displayName: string;
  email: string;
  jobTitle: string;
  department: string;
  companyName: string;
};

const GRAPH_API_BASE_URL = 'https://graph.microsoft.com/v1.0';

export const getUserProfile = async (token: string): Promise<GraphUserProfile> => {
  return http.get<GraphUserProfile>(`${GRAPH_API_BASE_URL}/me`, {
    Authorization: `Bearer ${token}`,
  });
};
export const getUserRole = async (token: string): Promise<any> => {
  return http.get<any>(`${GRAPH_API_BASE_URL}/me/memberOf/microsoft.graph.group`, {
    Authorization: `Bearer ${token}`,
  });
};
