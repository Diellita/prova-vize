// front/src/pages/Login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../lib/api";

type Props = {
  onSuccess: (role: "CLIENTE" | "APROVADOR") => void;
};

export default function Login({ onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

const handleLogin = async () => {
  setError(null);
  try {
    const data = await login(email, password); 

    localStorage.setItem("role", data.role);

    if (data.role === "APROVADOR") {
      onSuccess("APROVADOR");
      navigate("/admin");
    } else {
      onSuccess("CLIENTE");
      navigate("/lista");
    }
  } catch (e: any) {
    setError(e?.response?.data?.message || e?.message || "Erro no login");
  }
};


  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundImage: "url('/src/assets/imgs/gestao-imobiliaria.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  };

  const cardStyle: React.CSSProperties = {
    width: 380,
    maxWidth: "100%",
    background: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    padding: 24,
    fontFamily: "Inter, system-ui, Arial, sans-serif",
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    marginBottom: 16,
    fontSize: 24,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    marginBottom: 12,
    border: "1px solid #d0d7de",
    borderRadius: 8,
    fontSize: 14,
  };

  const btnStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    background: "#111827",
    color: "#fff",
    border: 0,
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer",
  };

  const errorStyle: React.CSSProperties = {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "8px 10px",
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 13,
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>Login</h2>

        {error && <div style={errorStyle}>{error}</div>}

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />
        <button onClick={handleLogin} style={btnStyle}>
          Acessar
        </button>
      </div>
    </div>
  );
}
