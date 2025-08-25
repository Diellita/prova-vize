import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Lista from "./pages/Lista";
import Admin from "./pages/Admin";
import { AuthProvider } from "./context/AuthContext";

function getToken() {
  return localStorage.getItem("token");
}
function getRole(): "CLIENTE" | "APROVADOR" | null {
  const r = localStorage.getItem("role");
  return r === "CLIENTE" || r === "APROVADOR" ? r : null;
}

function RequireAuth({
  allowed,
  children,
}: {
  allowed: Array<"CLIENTE" | "APROVADOR">;
  children: React.ReactNode;
}) {
  const token = getToken();
  const role = getRole();
  if (!token || !role) return <Navigate to="/login" replace />;
  if (!allowed.includes(role)) {
    // redireciona para a home do perfil correto
    return <Navigate to={role === "CLIENTE" ? "/lista" : "/admin"} replace />;
  }
  return <>{children}</>;
}

function LoginWithHandler() {
  const navigate = useNavigate();
  return (
    <Login
      onSuccess={(r) => {
        // Login.tsx deve chamar a função de API que já salva token/role/userId
        navigate(r === "CLIENTE" ? "/lista" : "/admin", { replace: true });
      }}
    />
  );
}

function RedirectByRole() {
  const token = getToken();
  const role = getRole();
  if (!token || !role) return <Navigate to="/login" replace />;
  return <Navigate to={role === "APROVADOR" ? "/admin" : "/lista"} replace />;
}

function LoginGuard() {
  const token = getToken();
  const role = getRole();
  if (token && role) {
    return <Navigate to={role === "APROVADOR" ? "/admin" : "/lista"} replace />;
  }
  return <LoginWithHandler />;
}


function Logout() {
  const navigate = useNavigate();
  React.useEffect(() => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
    } finally {
      navigate("/login", { replace: true });
    }
  }, [navigate]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginWithHandler />} />
          <Route
            path="/lista"
            element={
              <RequireAuth allowed={["CLIENTE"]}>
                <Lista />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth allowed={["APROVADOR"]}>
                <Admin />
              </RequireAuth>
            }
          />
          <Route path="/logout" element={<Logout />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}