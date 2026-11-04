import { Suspense, type ReactNode } from 'react';
import { Box, LinearProgress } from '@mui/material';

interface SuspenseWrapperProps {
  children: ReactNode;
}

const SuspenseWrapper = ({ children }: SuspenseWrapperProps) => {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: (theme) => theme.zIndex.modal + 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
      }>
      {children}
    </Suspense>
  );
};

export default SuspenseWrapper;
