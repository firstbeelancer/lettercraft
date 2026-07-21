import React, { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken, type ApiUser } from "@/lib/api";

type AuthState = {
  user: ApiUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  signOut: async () => {},
  refresh: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user } = await api.me();
      setUser(user);
    } catch (err: any) {
      // токен битый — выкидываем
      if (err?.status === 401 || err?.status === 403) {
        setToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const signOut = async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
