import React, { createContext, useContext, useMemo, useState } from "react";
import type { AuthContextValue, AuthState } from "../types/auth";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoggedIn: !!localStorage.getItem("token"),
    perfil: (localStorage.getItem("role") as AuthState["perfil"]) || "CLIENTE",
    usuarioId: localStorage.getItem("userId"),
  });

  const setAuth = (next: Partial<AuthState>) =>
    setState((prev) => ({ ...prev, ...next }));

  const value = useMemo<AuthContextValue>(() => ({ ...state, setAuth }), [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}