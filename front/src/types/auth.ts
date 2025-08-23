export type Perfil = "CLIENTE" | "APROVADOR";

export interface AuthState {
  isLoggedIn: boolean;
  perfil: Perfil;
  usuarioId: string | null; // <- adicionamos
}

export interface AuthContextValue extends AuthState {
  // setAuth aceita atualizações parciais do estado
  setAuth: (next: Partial<AuthState>) => void;
}
