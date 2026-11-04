import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';

import AppProviders from './core/context/AppProviders';
import Navbar from './modules/shared/Navbar';
import Footer from './modules/shared/Footer';
import AppRoutes from './core/routes';
import AppTour from './modules/shared/AppTour';

import './App.css';
import Container from './modules/shared/Container';

/**
 * Conditionally renders the regular Navbar + Container + Footer shell.
 * Admin routes (/admin/*) supply their own full-page layout so the
 * regular Navbar and container max-width must not appear.
 */
const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  // Sign-in screens paint their own full-viewport layout.
  const isLoginRoute = location.pathname === '/' || location.pathname === '/login';

  if (isAdminRoute || isLoginRoute) {
    return <>{children}</>;
  }

  return (
    // Column layout keeps the footer pinned to the bottom when page content is short.
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box sx={{ flex: '1 0 auto' }}>
        <Container>
          <Navbar />
          {children}
        </Container>
      </Box>
      {/* Rendered outside Container so it spans the full viewport width. */}
      <Footer />
    </Box>
  );
};

/**
 * Root component.
 *
 * The Container wrapper has been removed so that:
 *  - The Login page can occupy the full viewport width with its split layout.
 *  - Each page / the Navbar manages its own max-width constraints.
 *  - Admin pages render with their own full-page layout (no regular Navbar).
 */
function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        {/* AppTour uses react-router hooks so it must live inside BrowserRouter. */}
        <AppTour />
        <AppShell>
          <AppRoutes />
        </AppShell>
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
