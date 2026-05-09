import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { createElement } from 'react';
import { authApi } from '@/lib/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

function loadState(): AuthState {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? (JSON.parse(userStr) as User) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadState);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await authApi.login({ email, password });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setState({ token, user });
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const { token, user } = await authApi.register({ email, password, displayName });
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setState({ token, user });
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setState({ token: null, user: null });
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    isAuthenticated: !!state.token && !!state.user,
  };

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
