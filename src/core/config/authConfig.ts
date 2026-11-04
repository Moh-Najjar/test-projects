import type { Configuration, PopupRequest } from '@azure/msal-browser';

// Vite exposes only VITE_-prefixed variables via import.meta.env
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_CLIENT_ID ?? '',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID ?? ''}`,
    redirectUri: import.meta.env.VITE_REDIRECT_URI ?? '/',
  },
  cache: {
    // sessionStorage is safer than localStorage for auth tokens
    cacheLocation: 'sessionStorage',
  },
};

// Scopes requested during interactive login
export const loginRequest: PopupRequest = {
  scopes: ['User.Read', 'openid', 'profile'],
};

// Scopes required when calling a protected API
export const protectedApiRequest: PopupRequest = {
  scopes: ['https://graph.microsoft.com/User.Read'],
};
