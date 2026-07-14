'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { api } from './api-client';
import type { LoginInput, PublicUser, RegisterInput } from './types';

// Token lives in localStorage for now — acceptable for the initial internal
// build, but should move to an httpOnly cookie as part of the Phase 9
// security hardening pass (see roadmap/phase9.md).
const TOKEN_STORAGE_KEY = 'epg_access_token';

interface AuthContextValue {
  user: PublicUser | null;
  token: string | null;
  loading: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    typeof window === 'undefined'
      ? null
      : window.localStorage.getItem(TOKEN_STORAGE_KEY),
  );
  const [user, setUser] = useState<PublicUser | null>(null);
  // Only worth a loading state if we actually have a stored token to verify.
  const [loading, setLoading] = useState(() => Boolean(token));

  useEffect(() => {
    if (!token) return;
    api
      .me(token)
      .then(setUser)
      .catch(() => {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const applyAuthResult = useCallback(
    (accessToken: string, publicUser: PublicUser) => {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      setToken(accessToken);
      setUser(publicUser);
    },
    [],
  );

  const login = useCallback(
    async (data: LoginInput) => {
      const result = await api.login(data);
      applyAuthResult(result.accessToken, result.user);
    },
    [applyAuthResult],
  );

  const register = useCallback(
    async (data: RegisterInput) => {
      const result = await api.register(data);
      applyAuthResult(result.accessToken, result.user);
    },
    [applyAuthResult],
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    setUser(await api.me(token));
  }, [token]);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
