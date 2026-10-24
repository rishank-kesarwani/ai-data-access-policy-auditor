'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';
import { UserSession } from './types';

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isAuthenticated: boolean;
  isPublicMode: boolean;
  isLoading: boolean;
  login: (password: string, email?: string) => Promise<void>;
  logout: () => void;
  refreshStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isPublicMode: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  refreshStatus: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isPublicMode, setIsPublicMode] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshStatus = async () => {
    try {
      const status = await api.getAuthStatus();
      setIsPublicMode(Boolean(status?.publicAccessEnabled));
    } catch {
      // Fallback
      setIsPublicMode(true);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        await refreshStatus();
        const savedToken = localStorage.getItem('secops_token');
        const savedUser = localStorage.getItem('secops_user');

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.error('Failed to restore auth session', e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (password: string, email?: string) => {
    const data = await api.login(password, email);
    if (data?.accessToken) {
      setToken(data.accessToken);
      setUser(data.user);
      localStorage.setItem('secops_token', data.accessToken);
      localStorage.setItem('secops_user', JSON.stringify(data.user));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('secops_token');
    localStorage.removeItem('secops_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isPublicMode,
        isLoading,
        login,
        logout,
        refreshStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
