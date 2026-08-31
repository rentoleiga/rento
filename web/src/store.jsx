import { createContext, useContext, useCallback, useState } from "react";
import { api, getToken, setToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(() => !getToken());

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setReady(true);
      return;
    }
    try {
      const { user } = await api.get("/api/auth/me");
      setUser(user);
    } catch {
      setToken("");
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post("/api/auth/login", { email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await api.post("/api/auth/register", payload);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setToken("");
    setUser(null);
  }, []);

  const loginGoogle = useCallback(async (token) => {
    setToken(token);
    await refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, setUser, refresh, login, register, loginGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}