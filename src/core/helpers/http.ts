import axios, { AxiosError } from 'axios';
import i18n from 'i18next';
import { toast } from 'react-toastify';

// Strict header shape for simplicity and safety
export type ApiHeaders = Record<string, string>;

/** Message thrown (and toasted) for HTTP 401 so callers can detect it reliably. */
export const UNAUTHORIZED_ERROR_MESSAGE = 'Unauthorized. Please log in.';

// Common error normalizer to keep consistent errors across app
const normalizeAxiosError = (error: unknown): Error => {
  // Handle known axios errors with friendly messages
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<{ detail: string }>;
    const status = err.response?.status;
    const serverMsg = err.response?.data?.detail;

    if (status === 400) {
      toast.error(serverMsg);
      return new Error(serverMsg || err.message || 'Request failed.');
    }
    if (status === 401) {
      toast.error(UNAUTHORIZED_ERROR_MESSAGE);
      return new Error(UNAUTHORIZED_ERROR_MESSAGE);
    }
    if (status === 403) {
      toast.error('Forbidden. You do not have access.');
      return new Error('Forbidden. You do not have access.');
    }
    if (status === 404) {
      toast.error('Not found.');
      return new Error('Not found.');
    }
    if (status && status >= 500) {
      toast.error('Server error. Please try again later.');
      return new Error('Server error. Please try again later.');
    }
    if (err.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please try again.');
      return new Error('Request timeout. Please try again.');
    }
    toast.error(serverMsg || err.message || 'Request failed.');
    return new Error(serverMsg || err.message || 'Request failed.');
  }
  // Fallback for non-axios errors
  toast.error(error instanceof Error ? error.message : 'Unknown error');
  return new Error(error instanceof Error ? error.message : 'Unknown error');
};

export const getAcceptLanguage = (): string => {
  return i18n.language === 'ar' ? 'ar' : 'en';
};

// Generic GET and POST helpers with strict typing
export const http = {
  // GET: R is the response body type you expect
  get: async <R>(url: string, headers?: ApiHeaders): Promise<R> => {
    try {
      const response = await axios.get<R>(`${url}`, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Language': getAcceptLanguage(),
          ...(headers ?? {}),
        },
        timeout: 15000,
        validateStatus: (status: number): boolean => status >= 200 && status < 300,
        responseType: 'json',
      });
      return response.data;
    } catch (error) {
      throw normalizeAxiosError(error);
    }
  },

  // POST: T is the request body type; R is the response body type
  post: async <T, R>(url: string, data: T, headers?: ApiHeaders): Promise<R> => {
    try {
      const response = await axios.post<R>(`${url}`, data, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Language': getAcceptLanguage(),
          ...(headers ?? {}),
        },
        timeout: 20000,
        validateStatus: (status: number): boolean => status >= 200 && status < 300,
        responseType: 'json',
      });

      return response.data;
    } catch (error) {
      throw normalizeAxiosError(error);
    }
  },

  // PATCH: T is the partial request body type; R is the response body type
  patch: async <T, R>(url: string, data: T, headers?: ApiHeaders): Promise<R> => {
    try {
      const response = await axios.patch<R>(`${url}`, data, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Language': getAcceptLanguage(),
          ...(headers ?? {}),
        },
        timeout: 20000,
        validateStatus: (status: number): boolean => status >= 200 && status < 300,
        responseType: 'json',
      });
      return response.data;
    } catch (error) {
      throw normalizeAxiosError(error);
    }
  },

  // PUT: T is the full request body type; R is the response body type
  put: async <T, R>(url: string, data: T, headers?: ApiHeaders): Promise<R> => {
    try {
      const response = await axios.put<R>(`${url}`, data, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Language': getAcceptLanguage(),
          ...(headers ?? {}),
        },
        timeout: 20000,
        validateStatus: (status: number): boolean => status >= 200 && status < 300,
        responseType: 'json',
      });
      return response.data;
    } catch (error) {
      throw normalizeAxiosError(error);
    }
  },

  // DELETE: R is the response body type (often void / 204 No Content)
  delete: async <R>(url: string, headers?: ApiHeaders): Promise<R> => {
    try {
      const response = await axios.delete<R>(`${url}`, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Language': getAcceptLanguage(),
          ...(headers ?? {}),
        },
        timeout: 15000,
        // 204 No Content is a valid success code for DELETE operations
        validateStatus: (status: number): boolean =>
          (status >= 200 && status < 300) || status === 204,
        responseType: 'json',
      });
      return response.data;
    } catch (error) {
      throw normalizeAxiosError(error);
    }
  },
};
