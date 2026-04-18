import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { routeTree } from './routeTree.gen';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from './lib/auth';
import './styles/globals.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const router = createRouter({
  routeTree: routeTree as never,
  context: {
    auth: undefined!,
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const { initialize, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    initialize().then(() => setIsInitialized(true));
  }, [initialize]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B35] border-t-transparent" />
      </div>
    );
  }

  return <RouterProvider router={router} context={{ auth: { isAuthenticated, user } }} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1E293B',
              color: '#fff',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#22C55E',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
