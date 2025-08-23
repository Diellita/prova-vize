import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  type Solicitacao,         
  listarSolicitacoes,
  obterDetalheContrato,
  temSolicitacaoPendente,  
} from "../services/contratos";
import type { Perfil } from "../types/auth";
import ContractModal from "../components/ContractModal";
import type { Parcela, Status, DetalheContrato } from "../services/contratos";
import {
  parcelaElegivel,
  existeParcelaAguardandoAprovacao,
} from "../services/contratos";




/** ======== ESTILOS (novo tema mais clean) ======== */
const styles = {
// SUBSTITUA em styles.page
page: {
  minHeight: "100vh",
  padding: "4vh 24px",              // ↓ menos espaço vertical
  background: "linear-gradient(180deg, #0f2d56 0%, #124c93 40%, #1561c1 100%)",
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Helvetica Neue", Arial',
  color: "#0b1b2b",
} as React.CSSProperties,

container: {
  maxWidth: "90%",                   // ↑ mais largo
  margin: "0 auto",
} as React.CSSProperties,


  // card base
  card: {
    background: "#ffffff",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.25)",
    boxShadow: "0 12px 36px rgba(0,0,0,.18)",
    overflow: "hidden",
  } as React.CSSProperties,

  // cards com padding
  section: {
    padding: "18px 22px",
  } as React.CSSProperties,

  // header do título
  headerTitle: {
    fontSize: 26,
    fontWeight: 800,
    letterSpacing: 0.2,
    textAlign: "center" as const,
    margin: 0,
  },

  // espaçamentos entre blocos
  spacer16: { height: 16 } as React.CSSProperties,
  spacer20: { height: 20 } as React.CSSProperties,
  spacer28: { height: 28 } as React.CSSProperties,

  // filtros
  filtersRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  } as React.CSSProperties,
  input: {
    flex: 2,
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    background: "#fff",
    outline: "none",
  } as React.CSSProperties,
  select: {
    flex: 1,
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    background: "#fff",
    outline: "none",
  } as React.CSSProperties,
  applyBtn: {
    background: "linear-gradient(90deg, #2563eb, #1e40af)",
    color: "#fff",
    border: "none",
    padding: "12px 18px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
    letterSpacing: 0.2,
    boxShadow: "0 4px 14px rgba(37,99,235,.35)",
    transition: "transform .05s",
  } as React.CSSProperties,

  // Tabela
  tableWrap: {
    overflow: "auto",
  } as React.CSSProperties,
  table: {
    width: "100%",
    borderCollapse: "collapse",
  } as React.CSSProperties,
  th: {
    padding: "12px 14px",
    borderBottom: "1px solid #e5e7eb",
    textAlign: "left" as const,
    fontSize: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    color: "#6b7280",
    background: "#f9fafb",
    position: "sticky" as const,
    top: 0,
    zIndex: 1,
  },
  td: {
    padding: "12px 14px",
    borderBottom: "1px solid #eef2f7",
  } as React.CSSProperties,
  visualizarBtn: {
    background: "#0a66c2",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
    boxShadow: "0 3px 10px rgba(10,102,194,.25)",
  } as React.CSSProperties,

  // layout dos cards (largura e centralização)
blockNarrow: { width: "90%", margin: "0 auto" },   // título
blockFilters: { width: "90%", margin: "0 auto" },  // filtros
blockTable: { width: "100%", minheight: "45rem", margin: "0 auto" },    // tabela


};

/** Badge de status simples */
function StatusBadge({ status }: { status: Status }) {
  const map = {
    PENDENTE: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", label: "Pendente" },
    APROVADO: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0", label: "Aprovado" },
    REPROVADO: { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca", label: "Reprovado" },
    LIQUIDADO: { bg: "#eef2ff", color: "#3730a3", border: "#c7d2fe", label: "Liquidado" },
  }[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: map.bg,
        color: map.color,
        border: `1px solid ${map.border}`,
      }}
    >
      {map.label}
    </span>
  );
}

export default function Lista() {
  // sessão simples sem AuthContext: lê de localStorage uma vez
  const [session] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("session") || "{}");
    } catch {
      return {};
    }
  });

  const perfil: Perfil = String(session?.perfil || "CLIENTE").toUpperCase().trim() as Perfil;
  const usuarioId: string | null = session?.usuarioId ?? null;

  // filtros
  const [filtroUsuario, setFiltroUsuario] = useState<string>("");
  const [filtroStatus, setFiltroStatus] = useState<Status | "TODOS">("TODOS");

  // dados e carregamento
  const [dados, setDados] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);

  // modal
  const [podeAprovar, setPodeAprovar] = useState(false);
  const [open, setOpen] = useState(false);
  const [detalhe, setDetalhe] = useState<any>(null);
  const [statusDaSolicitacao, setStatusDaSolicitacao] = useState<Status>("PENDENTE");

  // carregar lista quando filtros/perfil mudarem
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const res = await listarSolicitacoes(perfil, {
        status: filtroStatus,
      });
      setDados(res);
      setLoading(false);
    }
    fetchData();
  }, [perfil, filtroStatus]);

  // abrir modal com validações do CLIENTE (sem AuthContext)
  const handleVisualizar = async (s: Solicitacao) => {
    if (perfil === "CLIENTE") {
      // 1) cliente só pode abrir contrato do próprio usuário (se tivermos usuarioId salvo)
      if (usuarioId && s.solicitanteId !== usuarioId) {
        alert("Você só pode solicitar antecipação para contratos do seu usuário.");
        return;
      }
      // 2) cliente não pode ter outra solicitação pendente
      if (usuarioId && temSolicitacaoPendente(usuarioId, s.id)) {
        alert("Você já possui outra solicitação PENDENTE. Conclua-a antes de iniciar uma nova.");
        return;
      }
    }

    const det = await obterDetalheContrato(s.contratoCodigo);
    setDetalhe(det);

    // aprovador só pode aprovar/reprovar se a solicitação está PENDENTE
    const allow = perfil === "APROVADOR" && s.status === "PENDENTE";
    setPodeAprovar(allow);


    // necessário para regra do cliente no modal
    setStatusDaSolicitacao(s.status);

    setOpen(true);
  };

return (
  <div style={styles.page}>
    <div style={styles.container}>

      {/* Header fixo com perfil logado */}
      <div
        style={{
          width: "100%",
          padding: "12px 20px",
          marginBottom: "16px",
          display: "flex",
          justifyContent: "end",
          borderRadius: "8px",
        }}
      >

        <div
          style={{
            background: perfil === "APROVADOR" ? "#16a34a" : "#446bbeff",
            color: "#fff",
            padding: "6px 12px",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: 14,
            justifyContent: "center",
          }}
        >
          Perfil Logado: {perfil}
        </div>
      </div>
        {/* HEADER + FILTROS (UM CARD) */}
        <div style={{ ...styles.card, margin: "0 auto", marginTop: "3%", marginBottom: "3%", maxWidth: "95%" }}>
          <div style={{ padding: "24px" }}>
            {/* Título centralizado */}
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: 0.2,
                textAlign: "left",
                margin: 0,
                marginLeft: 20,
                marginBottom: 16,
              }}
            >
              Filtros
            </h1>

            {/* Espaço entre título e filtros */}
            <div style={{ height: 18 }} />

            {/* Linha de filtros */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 1fr auto",
                gap: 16,
                alignItems: "center",
              }}
            >
              <input
                style={{
                  padding: "12px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: 10,
                  background: "#fff",
                  outline: "none",
                  width: "100%",
                }}
                placeholder="Nome Cliente"
                value={filtroUsuario}
                onChange={(e) => setFiltroUsuario(e.target.value)}
              />

              <select
                style={{
                  padding: "12px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: 10,
                  background: "#fff",
                  outline: "none",
                  width: "100%",
                }}
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value as any)}
              >
                <option value="TODOS">Todos os Status</option>
                <option value="PENDENTE">Pendente</option>
                <option value="APROVADO">Aprovado</option>
                <option value="REPROVADO">Reprovado</option>
                <option value="LIQUIDADO">Liquidado</option>
              </select>
            </div>

            {/* Botão aplicar */}
            <div
              style={{
                marginTop: 14,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button type="button" className="btn btn--primary" onClick={() => {}}>
                Aplicar
              </button>
            </div>
          </div>
        </div>

        {/* Espaço antes da tabela */}
        <div style={{ height: 5 }} />

        {/* TABELA */}
        <div style={{ ...styles.card, ...styles.blockTable }}>
          <div style={{ ...styles.section, paddingTop: 12, paddingBottom: 12 }}>
            <div style={styles.tableWrap}>
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: 0.2,
                  textAlign: "center",
                  margin: 0,
                  marginTop: "2%",
                  marginBottom: "4%",
                }}
              >
                Lista de Contratos
              </h1>
              {loading ? (
                <div style={{ padding: 16 }}>Carregando solicitações…</div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Cliente</th>
                      <th style={styles.th}>Contrato</th>
                      <th style={styles.th}>Parcela</th>
                      <th style={styles.th}>Vencimento</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.map((s, idx) => (
                      <tr key={s.id} style={{ background: idx % 2 === 1 ? "#f8fafc" : "#fff" }}>
                        <td style={styles.td}>{s.id}</td>
                        <td style={styles.td}>{s.clienteNome}</td>
                        <td style={styles.td}>{s.contratoCodigo}</td>
                        <td style={styles.td}>{s.parcelaAtual}</td>
                        <td style={styles.td}>{new Date(s.vencimento).toLocaleDateString("pt-BR")}</td>
                        <td style={styles.td}>
                          <StatusBadge status={s.status} />
                        </td>
                        <td style={styles.td}>
                          <button
                            type="button"
                            className="btn btn--ghost"
                            onClick={() => handleVisualizar(s)}
                          >
                            Visualizar
                          </button>
                        </td>
                      </tr>
                    ))}

                    {dados.length === 0 && !loading && (
                      <tr>
                        <td style={styles.td} colSpan={7}>
                          Nenhum registro encontrado com os filtros atuais.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div style={styles.spacer28} />

        {/* MODAL DE DETALHES */}
       <ContractModal
            open={open}
            onClose={() => setOpen(false)}
            contratoCodigo={detalhe?.contratoCodigo || ""}
            clienteNome={detalhe?.clienteNome || ""}
            parcelas={detalhe?.parcelas || []}
            perfil={perfil}                                  
            podeAprovar={podeAprovar}
            statusDaSolicitacao={statusDaSolicitacao}
            />
      </div>
    </div>
  );
}

