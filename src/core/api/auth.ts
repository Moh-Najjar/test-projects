import { http } from '../helpers/http';
import type { LoginRequest } from '../types/loginRequest';
import type { LoginResponse } from '../types/loginResponse';
import { RefreshTokenRequest } from '../types/refreshTokenRequest';
import { RefreshTokenResponse } from '../types/refreshTokenResponse';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const loginApi = async (data: LoginRequest): Promise<LoginResponse> => {
  return await http.post<LoginRequest, LoginResponse>(`${BASE_URL}/auth/login`, data);
};


export const refreshTokenApi = async (data: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
  return await http.post<RefreshTokenRequest, RefreshTokenResponse>(`${BASE_URL}/auth/refresh`, data);
};