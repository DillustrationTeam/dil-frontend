import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthResponseDto, TokenDto, UserDto } from '@/types/auth.types';

interface AuthState {
  user: UserDto | null;
  roles: string[];
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (response: AuthResponseDto) => void;
  setTokens: (tokens: TokenDto) => void;
  setUser: (user: UserDto, roles: string[]) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      roles: [],
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (response) =>
        set({
          user: response.user,
          roles: response.roles,
          accessToken: response.tokens.accessToken,
          refreshToken: response.tokens.refreshToken,
          isAuthenticated: true,
          isLoading: false,
        }),

      setTokens: (tokens) =>
        set(() => ({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
        })),

      setUser: (user, roles) =>
        set({
          user,
          roles,
          isAuthenticated: true,
        }),

      clearAuth: () =>
        set({
          user: null,
          roles: [],
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'dillustration-auth-storage',
    }
  )
);
