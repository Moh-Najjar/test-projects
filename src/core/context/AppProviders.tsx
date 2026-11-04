import React from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';

import { FetchingContextProvider } from './FetchingContext';
import { DirectionProvider } from './DirectionContext';
import { AdminAuthProvider } from './AdminAuthContext';
import { ThemeContextProvider } from './ThemeContext';
import { msalConfig } from '../config/authConfig';
import { AuthProvider } from './AuthContext';
import { TourProvider } from './TourContext';
import ErrorBoundary from './ErrorBoundary';

// Created once at module level so it is never re-instantiated on re-renders.
const msalInstance = new PublicClientApplication(msalConfig);

const AppProviders: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <ErrorBoundary>
      {/* MsalProvider must be the outermost auth wrapper so useMsal() is
          available to AuthProvider and any hook/component beneath it. */}
      <MsalProvider instance={msalInstance}>
        <ThemeContextProvider>
          <FetchingContextProvider>
            <DirectionProvider>
              <AuthProvider>
                {/* AdminAuthProvider is sibling to AuthProvider so admin sessions
                    are fully decoupled from the MSAL-backed regular user session. */}
                <AdminAuthProvider>
                  {/* TourProvider is placed inside BrowserRouter (in App.tsx)
                      so AppTour can use react-router hooks for navigation. */}
                  <TourProvider>{children}</TourProvider>
                </AdminAuthProvider>
              </AuthProvider>
            </DirectionProvider>
          </FetchingContextProvider>
        </ThemeContextProvider>
      </MsalProvider>
    </ErrorBoundary>
  );
};

export default AppProviders;
