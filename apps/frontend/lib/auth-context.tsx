"use client";
/**
 * TenderOS Auth Context
 * Manages user session state across the frontend.
 * Provides login, register, logout, and user profile.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { authApi } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "enterprise" | "sme" | "consultant" | "viewer";
  plan: "free" | "sme" | "enterprise" | "api";
  company_id: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function persistSession(accessToken: string, refreshToken: string, user: User) {
  localStorage.setItem("tenderos_access_token", accessToken);
  localStorage.setItem("tenderos_refresh_token", refreshToken);
  localStorage.setItem("tenderos_user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("tenderos_access_token");
  localStorage.removeItem("tenderos_refresh_token");
  localStorage.removeItem("tenderos_user");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tenderos_user");
      const token = localStorage.getItem("tenderos_access_token");
      if (raw && token) {
        const user: User = JSON.parse(raw);
        setState({ user, isLoading: false, isAuthenticated: true });
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    } catch {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    persistSession(data.access_token, data.refresh_token, data.user);
    setState({ user: data.user, isLoading: false, isAuthenticated: true });
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const { data } = await authApi.register({ email, password, name });
      persistSession(data.access_token, data.refresh_token, data.user);
      setState({ user: data.user, isLoading: false, isAuthenticated: true });
    },
    []
  );

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem("tenderos_refresh_token");
    if (refreshToken) {
      authApi.logout(refreshToken).catch(() => {}); // Best-effort
    }
    clearSession();
    setState({ user: null, isLoading: false, isAuthenticated: false });
    window.location.href = "/login";
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setState((prev) => {
      const updated = { ...prev.user!, ...patch };
      localStorage.setItem("tenderos_user", JSON.stringify(updated));
      return { ...prev, user: updated };
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
