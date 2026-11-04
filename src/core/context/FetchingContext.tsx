import { createContext, useContext, useState, type ReactNode, useCallback, useMemo } from 'react';
import { Box, LinearProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import i18n from '../../i18n';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';

/**
 * Interface for the Fetching Context value.
 *
 * `isLoading` is true whenever any react-query mutation OR a manual
 * startLoading() call OR an MSAL interaction is in progress.
 *
 * `isFetching` is true whenever any react-query background query is running.
 *
 * `startLoading` / `stopLoading` remain available for non-react-query async
 * work (e.g. direct fetch calls, MSAL token refresh side-effects).
 */
export interface FetchingContextType {
  isLoading: boolean;
  isFetching: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  setError: (message: string) => void;
  setSuccess: (message: string) => void;
}

/**
 * Create the Fetching Context with an undefined default value.
 */
const FetchingContext = createContext<FetchingContextType | undefined>(undefined);

/**
 * FetchingContextProvider component to wrap the application and provide loading/error/success states.
 */
export const FetchingContextProvider = ({ children }: { children: ReactNode }) => {
  const theme = useTheme();

  // Manual loading counter — for non-react-query async work
  const [loadingCount, setLoadingCount] = useState(0);

  // Automatically reflect react-query network activity.
  // useIsMutating() returns the number of mutations currently in flight
  // (e.g. form submission). useIsFetching() returns the number of queries
  // currently fetching (initial loads, background re-fetches, etc.).
  const mutatingCount = useIsMutating();
  const fetchingCount = useIsFetching();

  // MSAL interaction state (login / token-refresh flows)
  const { inProgress } = useMsal();

  // isLoading: blocks the UI with overlay + progress bar
  const isLoading =
    loadingCount > 0 ||
    mutatingCount > 0 ||
    inProgress !== InteractionStatus.None;

  // isFetching: soft indicator for background query activity
  const isFetching = fetchingCount > 0;

  // Memoized functions to prevent unnecessary re-renders in consuming components
  const startLoading = useCallback(() => {
    setLoadingCount((prev) => prev + 1); // to track multiple loading states
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingCount((prev) => Math.max(0, prev - 1)); // to track multiple loading states
  }, []);

  const setError = useCallback((message: string) => {
    // Decrement manual count in case caller used startLoading() before the error
    setLoadingCount((prev) => Math.max(0, prev - 1));
    toast.error(message);
  }, []);

  const setSuccess = useCallback((message: string) => {
    toast.success(message);
  }, []);

  // Memoized context value object to prevent re-renders when only functions are used
  const value = useMemo(
    () => ({
      isLoading,
      isFetching,
      startLoading,
      stopLoading,
      setError,
      setSuccess,
    }),
    [isLoading, isFetching, startLoading, stopLoading, setError, setSuccess]
  );

  return (
    <FetchingContext.Provider value={value}>
      {isLoading && (
        <Box
          sx={{
            position: 'fixed',
            height: '100vh',
            width: '100%',
            zIndex: (theme) => theme.zIndex.modal + 1,
            backdropFilter: 'blur(2px)',
          }}>
          <LinearProgress
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              width: '100%',
              height: '3px',
            }}
            color="primary"
          />
        </Box>
      )}

      {children}
      <ToastContainer
        position={i18n.language === 'ar' ? 'top-right' : 'top-left'}
        autoClose={8000}
        hideProgressBar={false}
        newestOnTop={i18n.language === 'ar'}
        closeOnClick
        rtl={i18n.language === 'ar'}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme.palette.mode}
      />
    </FetchingContext.Provider>
  );
};

/**
 * Custom hook to use the Fetching Context.
 */
export const useFetching = () => {
  const context = useContext(FetchingContext);
  if (!context) {
    throw new Error('useFetching must be used within FetchingContextProvider');
  }
  return context;
};
