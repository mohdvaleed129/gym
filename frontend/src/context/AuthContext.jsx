import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem("bf_admin");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("bf_token");
    if (!token) { setLoading(false); return; }
    api.get("/auth/me")
      .then((res) => {
        setAdmin(res.data.admin);
        localStorage.setItem("bf_admin", JSON.stringify(res.data.admin));
      })
      .catch(() => {
        localStorage.removeItem("bf_token");
        localStorage.removeItem("bf_admin");
        setAdmin(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("bf_token", res.data.token);
    localStorage.setItem("bf_admin", JSON.stringify(res.data.admin));
    setAdmin(res.data.admin);
    return res.data.admin;
  }

  function logout() {
    api.post("/auth/logout").catch(() => {});
    localStorage.removeItem("bf_token");
    localStorage.removeItem("bf_admin");
    setAdmin(null);
  }

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
