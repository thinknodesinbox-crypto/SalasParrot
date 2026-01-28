import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, setAccessToken, setRefreshToken, clearTokens, getAccessToken } from './api';
import type { User, LoginRequest, SignupRequest, AuthResponse } from './types';

interface SignupResult {
  skip_payment: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<SignupResult>;
  googleLogin: (credential: string) => Promise<SignupResult>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      login: async (data: LoginRequest) => {
        try {
          const response = await api.post<AuthResponse>('/auth/login', data);
          const { user, tokens } = response.data;

          setAccessToken(tokens.access_token);
          setRefreshToken(tokens.refresh_token);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Extract error message from API response
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as { response?: { data?: { detail?: string } } };
            const detail = axiosError.response?.data?.detail;
            if (detail) {
              throw new Error(detail);
            }
          }
          throw error;
        }
      },

      signup: async (data: SignupRequest) => {
        try {
          const response = await api.post<AuthResponse>('/auth/register', data);
          const { user, tokens, skip_payment } = response.data;

          setAccessToken(tokens.access_token);
          setRefreshToken(tokens.refresh_token);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });

          return { skip_payment: skip_payment ?? false };
        } catch (error) {
          // Extract error message from API response
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as { response?: { data?: { detail?: string } } };
            const detail = axiosError.response?.data?.detail;
            if (detail) {
              throw new Error(detail);
            }
          }
          throw error;
        }
      },

      googleLogin: async (credential: string) => {
        try {
          const response = await api.post<AuthResponse>('/auth/google', { credential });
          const { user, tokens, skip_payment } = response.data;

          setAccessToken(tokens.access_token);
          setRefreshToken(tokens.refresh_token);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });

          return { skip_payment: skip_payment ?? false };
        } catch (error) {
          // Extract error message from API response
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as { response?: { data?: { detail?: string } } };
            const detail = axiosError.response?.data?.detail;
            if (detail) {
              throw new Error(detail);
            }
          }
          throw error;
        }
      },

      logout: () => {
        clearTokens();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      fetchUser: async () => {
        try {
          const response = await api.get<User>('/auth/me');
          set({
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },

      initialize: async () => {
        const token = getAccessToken();
        if (token) {
          await get().fetchUser();
        } else {
          set({ isLoading: false, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// Hook to check if user is authenticated (for route guards)
export const useAuth = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  return { user, isAuthenticated, isLoading, logout };
};

// Hook to require authentication (redirects if not authenticated)
export const useRequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  return { isAuthenticated, isLoading };
};
