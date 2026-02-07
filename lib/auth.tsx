import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest, getApiUrl, setAuthToken as setGlobalToken } from "./query-client";
import { fetch } from "expo/fetch";

const AUTH_TOKEN_KEY = "variaq_auth_token";

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (storedToken) {
        setGlobalToken(storedToken);
      }

      const baseUrl = getApiUrl();
      const url = new URL("/api/user", baseUrl);
      const headers: Record<string, string> = {};
      if (storedToken) {
        headers["Authorization"] = `Bearer ${storedToken}`;
      }
      const res = await fetch(url.toString(), {
        credentials: "include",
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        setGlobalToken(null);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    fetchUser().finally(() => setIsLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", {
      username,
      password,
    });
    const data = await res.json();
    if (data.token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
      setGlobalToken(data.token);
    }
    setUser({
      id: data.id,
      username: data.username,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
    });
  };

  const register = async (username: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/register", {
      username,
      password,
    });
    const data = await res.json();
    if (data.token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
      setGlobalToken(data.token);
    }
    setUser({
      id: data.id,
      username: data.username,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
    });
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch {}
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    setGlobalToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, refreshUser }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
