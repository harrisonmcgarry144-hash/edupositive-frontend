import { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../lib/api";
import { useRouter } from "next/router";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("ep_token");
    if (token) {
      authApi.me()
        .then(data => setUser(data))
        .catch(() => { localStorage.removeItem("ep_token"); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem("ep_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (email, password, username, fullName) => {
    const data = await authApi.register({ email, password, username, fullName });
    localStorage.setItem("ep_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("ep_token");
    setUser(null);
    router.push("/");
  };

  const updateUser = (updates) => setUser(u => ({ ...u, ...updates }));

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
