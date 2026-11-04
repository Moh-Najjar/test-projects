import { RefreshTokenResponse } from '../types/refreshTokenResponse';
import { RefreshTokenRequest } from '../types/refreshTokenRequest';
import type { LoginResponse } from '../types/loginResponse';
import type { LoginRequest } from '../types/loginRequest';
import { loginApi, refreshTokenApi } from '../api/auth';
import { useMutation } from '@tanstack/react-query';

export const useAuthentication = () => {
  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: (variables: LoginRequest): Promise<LoginResponse> =>
      loginApi(variables),
  });
};

export const useRefreshToken = () => {
  return useMutation<RefreshTokenResponse, Error, RefreshTokenRequest>({
    mutationFn: (variables: RefreshTokenRequest): Promise<RefreshTokenResponse> =>
      refreshTokenApi(variables),
  });
};