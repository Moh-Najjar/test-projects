import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./i18n";

import "./index.css";
import App from "./App";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

// `getElementById` can return null; validate to avoid unsafe non-null assertions.
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Root element with id "root" was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  </StrictMode>
);

// Remove splash screen after the app is rendered
const splashScreen = document.getElementById("splash-screen");
if (splashScreen) {
  // Give it a small delay so it's visible even on fast loads
  splashScreen.classList.add("fade-out");
  // Completely remove from DOM after fade out transition (0.5s)
  setTimeout(() => {
    splashScreen.remove();
  }, 500);
}
