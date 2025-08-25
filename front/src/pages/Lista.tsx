import React from "react";
import * as API from "../lib/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getAllContracts, BASE_URL } from "../lib/api";

type AdvanceRequest = {
  id: number;
  clienteId?: number | null;
  contratoId: number;
  status: "PENDENTE" | "APROVADO" | "REPROVADO" | number;
  notes?: string | null;
  createdAt: string;
  approvedAt?: string | null;
};

type Contract = {
  id: number;
  code?: string;
  name?: string;
  ownerId?: number;
  ownerName?: string;
  clienteId?: number;
};

import {
  obterDetalheContrato,
  parcelaElegivel,
  existeParcelaAguardandoAprovacao,
} from "../services/contratos";
import type { DetalheContrato, Parcela, StatusParcelas } from "../services/contratos";

/* ============ estilos ============ */
const styles = {
  page: {
    minHeight: "100vh",
    padding: "4vh 24px",
    background:
      'url("/src/assets/imgs/gestao-imobiliaria.jpg") no-repeat center center / cover',
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Helvetica Neue", Arial',
    color: "#0b1b2b",
  } as React.CSSProperties,
  container: { maxWidth: "90%", margin: "0 auto" } as React.CSSProperties,
  card: {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.25)",
    boxShadow: "0 12px 36px rgba(0,0,0,.18)",
    overflow: "hidden",
  } as React.CSSProperties,
  section: { padding: "18px 22px" } as React.CSSProperties,
  th: {
    padding: "12px 14px",
    borderBottom: "1px solid #e5e7eb",
    textAlign: "left" as const,
    fontSize: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    color: "#6b7280",
    background: "#e6eaee",
    position: "sticky" as const,
    top: 0,
    zIndex: 1,
  },
  td: { padding: "12px 14px", borderBottom: "1px solid #eef2f7" } as React.CSSProperties,
  table: { width: "100%", borderCollapse: "collapse" } as React.CSSProperties,
  tableWrap: { overflow: "auto" } as React.CSSProperties,
};

/* ============ utils ============ */
function coerceList<T = any>(res: unknown): T[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as T[];
  if (typeof res === "object") {
    const anyRes = res as any;
    if (Array.isArray(anyRes.data)) return anyRes.data as T[];
    if (Array.isArray(anyRes.items)) return anyRes.items as T[];
    if (Array.isArray(anyRes.value)) return anyRes.value as T[];
  }
  return [];
}
function fmtDate(s?: string | null) {
  if (!s) return "-";
  try { return new Date(s).toLocaleString("pt-BR"); } catch { return String(s); }
}
function normalizeStatus(s: AdvanceRequest["status"]): "PENDENTE" | "APROVADO" | "REPROVADO" {
  if (typeof s === "string") return s as any;
  if (s === 0) return "PENDENTE";
  if (s === 1) return "APROVADO";
  if (s === 2) return "REPROVADO";
  return "PENDENTE";
}
function badgeFor(status: "PENDENTE" | "APROVADO" | "REPROVADO") {
  return {
    PENDENTE: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", label: "Pendente" },
    APROVADO: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0", label: "Aprovado" },
    REPROVADO: { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca", label: "Reprovado" },
  }[status];
}

/* ============ sessão/JWT ============ */
function readSession(): any {
  try { return JSON.parse(localStorage.getItem("session") || "{}"); } catch { return {}; }
}
function readJwt(): any | null {
  try {
    const t =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      (JSON.parse(localStorage.getItem("session") || "{}")?.token as string) ||
      "";
    const p = t.split(".");
    if (p.length < 2) return null;
    return JSON.parse(atob(p[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch { return null; }
}
type HeaderMap = Record<string, string>;
function authHeaders(): HeaderMap {
  const b =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    (JSON.parse(localStorage.getItem("session") || "{}")?.token as string) ||
    "";
  return b ? { Authorization: `Bearer ${b}` } : {} as HeaderMap;
}
function bestName() {
  const s = readSession();
  const j = readJwt() || {};
  const raw =
    s.nome || s.userName || s.clienteNome || s.name ||
    j.name || j.given_name || j.preferred_username || j.email || "";
  if (!raw) return "";
  if (String(raw).includes("@")) {
    const nick = String(raw).split("@")[0];
    return nick.charAt(0).toUpperCase() + nick.slice(1);
  }
  return String(raw);
}

/* ============ Adapters ============ */
// cliente
async function fetchMyAdvanceRequests(): Promise<AdvanceRequest[]> {
  const anyApi = API as any;
  if (typeof anyApi.getMyAdvanceRequests === "function") {
    return coerceList<AdvanceRequest>(await anyApi.getMyAdvanceRequests());
  }
  if (anyApi.api?.get) {
    const r = await anyApi.api.get("/advance-request");
    return coerceList<AdvanceRequest>(r?.data ?? r);
  }
  const resp = await fetch("/advance-request", {
    credentials: "include",
    headers: { ...authHeaders() },
  });
  if (!resp.ok) throw new Error(await resp.text().catch(() => "Falha ao buscar (cliente)"));
  return coerceList<AdvanceRequest>(await resp.json());
}

// admin
async function fetchAdminAdvanceRequests(): Promise<AdvanceRequest[]> {
  const anyApi = API as any;
  if (typeof anyApi.getAdminAdvanceRequests === "function") {
    return coerceList<AdvanceRequest>(await anyApi.getAdminAdvanceRequests());
  }
  if (anyApi.api?.get) {
    const r = await anyApi.api.get("/advance-request/admin");
    return coerceList<AdvanceRequest>(r?.data ?? r);
  }
  const resp = await fetch("/advance-request/admin", {
    credentials: "include",
    headers: { ...authHeaders() },
  });
  if (!resp.ok) throw new Error(await resp.text().catch(() => "Falha ao buscar (admin)"));
  return coerceList<AdvanceRequest>(await resp.json());
}

// criar — payload { contratoId, parcelaNumero, notes }
async function createAdvance(payload: { contratoId: number; parcelaNumero: number; notes?: string }) {
  const anyApi = API as any;
  if (typeof anyApi.createAdvanceRequest === "function") {
    return anyApi.createAdvanceRequest(payload);
  }
  if (anyApi.api?.post) {
    return anyApi.api.post("/advance-request", payload);
  }
  const resp = await fetch("/advance-request", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (resp.status === 201 || resp.status === 200) return resp.json().catch(() => ({}));
  const txt = await resp.text().catch(() => "");
  throw new Error(txt || `Falha ao criar solicitação (${resp.status}).`);
}

// aprovação em massa (admin) — backend retorna 204
async function approveInBulk(ids: number[]): Promise<void> {
  const anyApi = API as any;
  if (typeof anyApi.approveInBulk === "function") {
    await anyApi.approveInBulk(ids);
    return;
  }
  const resp = await fetch("/advance-request/approve", {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    credentials: "include",
    body: JSON.stringify({ ids }),
  });
  if (resp.status !== 204) {
    const txt = await resp.text().catch(() => "");
    throw new Error(txt || `Falha na aprovação (${resp.status}).`);
  }
}

// todos contratos (para dropdown)
async function fetchAllContracts(): Promise<Contract[]> {
  const anyApi = API as any;
  if (anyApi.api?.get) {
    try {
      const r = await anyApi.api.get("/contracts/all"); // ✅ endpoint novo
      return coerceList<Contract>(r?.data ?? r);
    } catch (err) {
      return [];
    }
  }

  try {
    const resp = await fetch("http://localhost:5275/contracts/all", {
      headers: { ...authHeaders() },
    });
    if (!resp.ok) {
      return [];
    }
    return coerceList<Contract>(await resp.json());
  } catch (err) {
    return [];
  }
}

/* ============ componente ============ */
export default function Lista() {
  const navigate = useNavigate();
  function handleLogout() {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
    } finally {
      navigate("/login", { replace: true });
    }
  }

  const [loading, setLoading] = React.useState(false);

  const [displayName, setDisplayName] = React.useState(bestName());
  const computedPerfil = String(
    readSession()?.perfil || (readJwt()?.role ?? "CLIENTE")
  ).toUpperCase().trim() as "CLIENTE" | "APROVADOR";
  const [perfil] = React.useState<"CLIENTE" | "APROVADOR">(computedPerfil);

  // criação
  const [creating, setCreating] = React.useState(false);
  const [notes, setNotes] = React.useState("");

  // contratos (dropdown Cliente)
const [contracts, setContracts] = React.useState<Contract[]>([]);
const [contractsLoading, setContractsLoading] = React.useState(true);
const [contratoId, setContratoId] = React.useState<number | null>(null);
const [myClientId, setMyClientId] = React.useState<number | null>(null);
// filtro "mostrar apenas meus contratos"
const [onlyMine, setOnlyMine] = React.useState(true);

React.useEffect(() => {
  loadContracts(); // recarrega a lista quando o toggle muda
}, [onlyMine]);


  // detalhe/parcelas
  const [detalhe, setDetalhe] = React.useState<DetalheContrato | null>(null);
  const [parcelasElegiveis, setParcelasElegiveis] = React.useState<Parcela[]>([]);
  const [parcelaNumero, setParcelaNumero] = React.useState<number | "">("");

  // tabela
  const [rows, setRows] = React.useState<AdvanceRequest[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  // filtros visuais
  const [filtroTexto, setFiltroTexto] = React.useState("");
  const [filtroStatus, setFiltroStatus] =
    React.useState<"PENDENTE" | "APROVADO" | "REPROVADO" | "TODOS">("TODOS");

  // ADMIN — seleção para aprovação em massa
  const [adminChecked, setAdminChecked] = React.useState<Record<number, boolean>>({});

  // cache leve
  const contratoCodeCache = React.useRef<Map<number, string>>(new Map());
  const clienteNomeCache = React.useRef<Map<number, string>>(new Map());

  // carrega tabela
  async function loadTable() {
    try {
      setLoading(true);
      setErr(null);
      if (perfil === "APROVADOR") {
        setRows(await fetchAdminAdvanceRequests());
      } else {
        setRows(await fetchMyAdvanceRequests());
      }
    } catch (e: any) {
      setErr(e?.message || "Falha ao carregar solicitações.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  // carrega contratos (usa /contracts/all) e aplica o toggle onlyMine
  async function loadContracts() {
    try {
      setContractsLoading(true);

      // 1) Busca TODOS os contratos do backend
      const all = await fetchAllContracts();

      // 2) Descobre meu clientId (JWT > sessão)
      const j = readJwt() || {};
      const s = readSession() || {};
      const rawId = s.clienteId ?? s.clientId ?? j.clientId ?? j.clienteId ?? null;
      const myId: number | null = rawId != null ? Number(rawId) : null;
      setMyClientId(myId);

      // 3) Filtro LOCAL: se onlyMine=true mostra só meus; se false mostra TODOS
      const filtered = (onlyMine && myId != null)
        ? all.filter((c: any) => Number(c.ownerId ?? c.clienteId) === myId)
        : all;

      setContracts(filtered);

      // 4) Seleciona contrato padrão se o atual não existir na lista filtrada
      if (filtered.length && (contratoId == null || !filtered.some((c: any) => c.id === contratoId))) {
        const nextId = filtered[0].id;
        setContratoId(nextId);
      }

      // 5) Define displayName se ainda vazio
      if (!displayName && filtered.length && filtered[0].ownerName) {
        setDisplayName(filtered[0].ownerName!);
      }
    } catch (err) {
      setContracts([]); // fallback seguro
    } finally {
      setContractsLoading(false);
    }
  }


  React.useEffect(() => {
    if (perfil === "CLIENTE" && contracts.length && contratoId == null) {
      setContratoId(contracts[0].id);
    }
  }, [contracts, contratoId, perfil]);

  React.useEffect(() => {
    loadTable();
    loadContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // aplica filtro "só meus"
  const contractsForDropdown = React.useMemo(() => {
    if (!onlyMine || myClientId == null) return contracts;
    return contracts.filter(c => Number(c.ownerId ?? c.clienteId) === myClientId);
  }, [contracts, onlyMine, myClientId]);

  React.useEffect(() => {
    if (contratoId == null) return;
    const exists = contractsForDropdown.some(c => c.id === contratoId);
    if (!exists && contractsForDropdown.length) {
      setContratoId(contractsForDropdown[0].id);
    }
  }, [onlyMine, contractsForDropdown, contratoId]);

  // carregar detalhe/parcelas ao trocar contrato
  React.useEffect(() => {
    (async () => {
      try {
        setParcelaNumero("");
        setParcelasElegiveis([]);
        setDetalhe(null);

        if (contratoId == null || !Number.isFinite(contratoId)) return;

        const selected = contracts.find(c => c.id === contratoId);
        const codeFromApi = selected?.code;
        const canonical = codeFromApi || `CONTRATO-${String(contratoId).padStart(3, "0")}`;

        contratoCodeCache.current.set(contratoId, canonical);
        if (selected?.ownerName) clienteNomeCache.current.set(contratoId, selected.ownerName);

        const det = await obterDetalheContrato(canonical);
        if (!det || !Array.isArray((det as any).parcelas)) return;

        setDetalhe(det);

        // bloqueio: já existe pendência neste contrato
        if (existeParcelaAguardandoAprovacao(det.parcelas)) {
          setParcelasElegiveis([]);
          setParcelaNumero("");
          return;
        }

        const eleg = det.parcelas.filter((p: Parcela) =>
          parcelaElegivel(p.vencimento, p.status as StatusParcelas)
        );
        setParcelasElegiveis(eleg);
        if (eleg.length) setParcelaNumero(eleg[0].numero);
      } catch {
        setDetalhe(null);
        setParcelasElegiveis([]);
      }
    })();
  }, [contratoId, contracts]);

// helper para manter o botão visível (sem depender de CSS global)
function fireAlert(opts: { icon: "warning" | "error" | "success"; title: string; text: string }) {
  Swal.fire({
    icon: opts.icon,
    title: opts.title,
    text: opts.text,
    confirmButtonText: "OK",
    confirmButtonColor: "#2563eb",
    didOpen: (el) => {
      const btn = el.querySelector<HTMLButtonElement>(".swal2-confirm");
      if (btn) {
        btn.style.color = "#fff";
        btn.style.backgroundColor = "#2563eb";
        btn.style.borderRadius = "8px";
        btn.style.padding = "8px 20px";
      }
    },
  });
}

async function handleCreate() {
  try {
    setCreating(true);
    setErr(null);

    const cid = typeof contratoId === "number" ? contratoId : NaN;
    if (!Number.isFinite(cid)) throw new Error("Informe um contrato válido.");

    if (detalhe) {
      if (existeParcelaAguardandoAprovacao(detalhe.parcelas)) {
        throw new Error("Já existe uma solicitação pendente para este contrato.");
      }
      const n = typeof parcelaNumero === "number" ? parcelaNumero : NaN;
      if (!Number.isFinite(n)) throw new Error("Selecione uma parcela elegível.");
      const notaComParcela = `[PARCELA ${n}] ${notes || ""}`.trim();

      // envia também parcelaNumero
      await createAdvance({ contratoId: cid, notes: notaComParcela, parcelaNumero: n } as any);
    } else {
      await createAdvance({ contratoId: cid, notes: notes || undefined } as any);
    }

    setNotes("");
    await loadTable();

    fireAlert({
      icon: "success",
      title: "Solicitação criada",
      text: "Sua solicitação foi enviada com sucesso.",
    });
  } catch (e: any) {
    // tenta extrair mensagem amigável do backend
    const backendMsg =
      e?.response?.data?.error ||
      e?.message ||
      (typeof e === "string" ? e : "");

    if (
      backendMsg.includes("Já existe solicitação pendente") ||
      backendMsg.includes("aguardando aprovação")
    ) {
      fireAlert({
        icon: "warning",
        title: "Atenção",
        text: "Você já possui uma solicitação pendente para este contrato. Aguarde a aprovação antes de criar uma nova.",
      });
    } else if (backendMsg.includes("403")) {
      fireAlert({
        icon: "error",
        title: "Permissão negada",
        text: "Sem permissão (403). Verifique se o token está válido/ativo.",
      });
    } else if (backendMsg.includes("Selecione uma parcela elegível")) {
      fireAlert({
        icon: "warning",
        title: "Selecione a parcela",
        text: "Escolha uma parcela elegível para continuar.",
      });
    } else {
      fireAlert({
        icon: "error",
        title: "Erro ao criar",
        text: backendMsg || "Falha ao criar solicitação.",
      });
    }

  } finally {
    setCreating(false);
  }
}


  // filtro client-side
  const rowsFiltradas = rows.filter((r) => {
    const sNorm = normalizeStatus(r.status);
    const byStatus = filtroStatus === "TODOS" ? true : sNorm === filtroStatus;
    const byText = !filtroTexto?.trim()
      ? true
      : [
          String(r.id),
          String(r.clienteId ?? ""),
          String(r.contratoId),
          contratoCodeCache.current.get(r.contratoId) || "",
          clienteNomeCache.current.get(r.contratoId) || "",
          r.notes || "",
          sNorm,
        ]
          .join(" ")
          .toLowerCase()
          .includes(filtroTexto.toLowerCase());
    return byStatus && byText;
  });

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Cabeçalho */}
        <div style={{ width: "100%", padding: "12px 20px", marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
          <div style={{ background: perfil === "APROVADOR" ? "#16a34a" : "#446bbe", color: "#fff", padding: "6px 12px", borderRadius: 8, fontWeight: 600 }}>
            {`Perfil Logado: ${perfil}${displayName ? ` (${displayName})` : ""}`}
          </div>

          <div style={{ background: perfil === "APROVADOR" ? "#16a34a" : "#446bbe", color: "#fff", padding: "6px 12px", borderRadius: 8, fontWeight: 600 }}>
            <button
              onClick={handleLogout}
              disabled={loading}
              style={{
                cursor: loading ? "not-allowed" : "pointer",
                color: "#fff",
                border: "none",
                padding: "12px 18px",
                borderRadius: 10,
              }}
              title="Sair do sistema"
            >
              {loading ? "Saindo..." : "Voltar ao login"}
            </button>
          </div>
        </div>

        {/* Nova solicitação (somente CLIENTE) */}
        {perfil === "CLIENTE" && (
          <div style={{ marginLeft: "3%" }}>
            <div style={{ ...styles.card, marginBottom: 16, maxWidth: "97%" }}>
              <div style={{ ...styles.section }}>
                <strong style={{ fontSize: 22, fontWeight: 800 }}>Nova solicitação</strong>

                {/* Toggle "só meus contratos" */}
                <div style={{ marginTop: 8, marginBottom: 8, display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    id="onlyMineToggle"
                    type="checkbox"
                    checked={onlyMine}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setOnlyMine(val);
                    }}
                  />
                  <label htmlFor="onlyMineToggle" style={{ fontSize: 13, color: "#334155" }}>
                    Mostrar apenas meus contratos
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, marginTop: 12 }}>
              {/* Contrato */}
              <div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Contrato</div>
                {contractsLoading ? (
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #d0d7de",
                      background: "#f9fafb",
                    }}
                  >
                    Carregando contratos...
                  </div>
                ) : contracts.length ? (
                  <select
                    value={contratoId ?? ""}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setContratoId(Number.isFinite(v) ? v : null);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #d0d7de",
                    }}
                  >
                    {contracts.map((c) => {
                      const isMine =
                        myClientId != null &&
                        Number(c.ownerId ?? c.clienteId) === myClientId;

                      const label =
                        (c.code || `CONTRATO-${String(c.id).padStart(3, "0")}`) +
                        (c.ownerName
                          ? ` — ${c.ownerName}`
                          : isMine
                          ? " — meu"
                          : ` — cliente #${c.ownerId ?? c.clienteId}`);

                      const shouldDisable = !onlyMine && !isMine;

                      return (
                        <option
                          key={c.id}
                          value={c.id}
                          disabled={shouldDisable}
                          title={
                            shouldDisable
                              ? "Você só pode solicitar antecipação para seus contratos."
                              : "Você pode solicitar para este contrato."
                          }
                        >
                          {label}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #d0d7de",
                      background: "#f9fafb",
                    }}
                  >
                    Nenhum contrato disponível.
                  </div>
                )}
              </div>


                  {/* Parcela elegível (obrigatória) */}
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Parcela elegível</div>
                    {detalhe && existeParcelaAguardandoAprovacao(detalhe.parcelas) ? (
                      <div style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #d0d7de", background: "#fff0f0", color: "#b91c1c" }}>
                        Já existe solicitação pendente para este contrato. Escolha outro contrato.
                      </div>
                    ) : parcelasElegiveis.length ? (
                      <select
                        value={typeof parcelaNumero === "number" ? parcelaNumero : ""}
                        onChange={(e) => setParcelaNumero(Number(e.target.value))}
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid #d0d7de", borderRadius: 8 }}
                      >
                        {parcelasElegiveis.map((p) => (
                          <option key={p.numero} value={p.numero}>
                            Parcela {p.numero} — vence em {new Date(p.vencimento).toLocaleDateString("pt-BR")}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #d0d7de", background: "#f9fafb" }}>
                        {detalhe ? 'Nenhuma parcela elegível (> 30 dias e status "A VENCER").' : "Selecione um contrato para ver parcelas."}
                      </div>
                    )}
                  </div>

                  {/* Observações */}
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Observações (opcional)</div>
                    <input
                      placeholder="Ex.: antecipar parcela selecionada"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d0d7de" }}
                    />
                  </div>

                  {/* Botão */}
                  <div style={{ display: "flex", alignItems: "end", justifyContent: "flex-end" }}>
                    <button
                      onClick={handleCreate}
                      disabled={
                        creating ||
                        contratoId == null ||
                        !detalhe ||
                        existeParcelaAguardandoAprovacao(detalhe.parcelas) ||
                        parcelasElegiveis.length === 0 ||
                        typeof parcelaNumero !== "number"
                      }
                      style={{ padding: "10px 16px", borderRadius: 8, border: 0, background: "#2563eb", color: "#fff", cursor: creating ? "wait" : "pointer" }}
                      title={creating ? "Enviando..." : "Criar"}
                    >
                      {creating ? "Criando..." : "Criar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {err && (
          <div style={{ background: "#fee2e2", color: "#b91c1c", padding: 12, borderRadius: 8, marginBottom: 12 }}>
            {err}
          </div>
        )}

        {/* Filtros da Tabela */}
        <div style={{ ...styles.card, margin: "0 auto", marginTop: "3%", marginBottom: "1%", maxWidth: "95%" }}>
          <div style={{ padding: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 16 }}>Filtros</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr auto", gap: 16, alignItems: "center" }}>
              <input
                placeholder="Buscar por ID, cliente, contrato, status ou observação"
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                style={{ padding: "12px 14px", border: "1px solid #d1d5db", borderRadius: 10, background: "#fff" }}
              />
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value as any)}
                style={{ padding: "12px 14px", border: "1px solid #d1d5db", borderRadius: 10, background: "#fff" }}
              >
                <option value="TODOS">Todos os Status</option>
                <option value="PENDENTE">Pendente</option>
                <option value="APROVADO">Aprovado</option>
                <option value="REPROVADO">Reprovado</option>
              </select>
              <button
                type="button"
                onClick={loadTable}
                disabled={loading}
                style={{
                  background: "linear-gradient(90deg, #2563eb, #1e40af)",
                  color: "#fff",
                  border: "none",
                  padding: "12px 18px",
                  borderRadius: 10,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  letterSpacing: 0.2,
                  boxShadow: "0 4px 14px rgba(37,99,235,.35)",
                }}
                title="Aplicar / Atualizar"
              >
                {loading ? "Atualizando..." : "Aplicar"}
              </button>
            </div>
          </div>
        </div>

      {/* Atualizar */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop:"5%", marginBottom:"1%" }}>
                <button
                  onClick={loadTable}
                  disabled={loading}
                  style={{
                    background: "linear-gradient(90deg, #2563eb, #1e40af)",
                    cursor: loading ? "not-allowed" : "pointer",
                    color: "#fff",
                    border: "none",
                    padding: "12px 18px",
                    borderRadius: 10,
                  }}
                  title="Atualizar lista"
                >
                  {loading ? "Atualizando..." : "Atualizar Tabela"}
                </button>
              </div>

        {/* Tabela */}
        <div style={{ ...styles.card, marginBottom: 24 }}>
          <div style={{ ...styles.section, paddingTop: 12, paddingBottom: 12 }}>
            <div style={styles.tableWrap}>
              <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: "center", margin: 0, marginTop: "2%", marginBottom: "2%" }}>
                Solicitações de Antecipação
              </h2>

              {/* Ações de admin */}
              {perfil === "APROVADOR" && (
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginBottom: 12 }}>
                  <button
                    onClick={async () => {
                      const ids = Object.entries(adminChecked).filter(([,v]) => v).map(([k]) => Number(k));
                      if (!ids.length) return setErr("Selecione ao menos uma solicitação pendente para aprovar.");
                      setErr(null);
                      try {
                        await approveInBulk(ids);
                        setAdminChecked({});
                        await loadTable();
                      } catch (e: any) {
                        setErr(e?.message || "Falha na aprovação em massa.");
                      }
                    }}
                    style={{ padding: "10px 16px", borderRadius: 8, border: 0, background: "#16a34a", color: "#fff", cursor: "pointer", fontWeight: 700 }}
                    title="Aprovar selecionadas"
                  >
                    Aprovar selecionadas
                  </button>
                </div>
              )}

              <table style={styles.table}>
                <thead>
                  <tr>
                    {perfil === "APROVADOR" && <th style={styles.th}>
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          const checked = e.currentTarget.checked;
                          const next: Record<number, boolean> = {};
                          rowsFiltradas.forEach(r => {
                            const s = normalizeStatus(r.status);
                            if (s === "PENDENTE") next[r.id] = checked;
                          });
                          setAdminChecked(next);
                        }}
                        title="Marcar todos pendentes"
                      />
                    </th>}
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Cliente</th>
                    <th style={styles.th}>Contrato</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Criado em</th>
                    <th style={styles.th}>Aprovado em</th>
                    <th style={styles.th}>Obs.</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={perfil === "APROVADOR" ? 8 : 7} style={{ ...styles.td, textAlign: "center" }}>Carregando...</td></tr>
                  ) : rowsFiltradas.length === 0 ? (
                    <tr><td colSpan={perfil === "APROVADOR" ? 8 : 7} style={{ ...styles.td, textAlign: "center" }}>Nenhuma solicitação encontrada.</td></tr>
                  ) : (
                    rowsFiltradas.map((r, idx) => {
                      const sNorm = normalizeStatus(r.status);
                      const badge = badgeFor(sNorm);
                      const contratoCode =
                        contratoCodeCache.current.get(r.contratoId) ||
                        `CONTRATO-${String(r.contratoId).padStart(3, "0")}`;
                      const clienteNome =
                        clienteNomeCache.current.get(r.contratoId) ||
                        contracts.find(c => c.id === r.contratoId)?.ownerName ||
                        (typeof r.clienteId === "number" ? `Cliente #${r.clienteId}` : "-");

                      return (
                        <tr key={r.id} style={{ background: idx % 2 ? "#f8fafc" : "#fff" }}>
                          {perfil === "APROVADOR" && (
                            <td style={styles.td}>
                              <input
                                type="checkbox"
                                disabled={sNorm !== "PENDENTE"}
                                checked={!!adminChecked[r.id]}
                                onChange={(e) =>
                                  setAdminChecked(prev => ({ ...prev, [r.id]: e.currentTarget.checked }))
                                }
                                title={sNorm === "PENDENTE" ? "Selecionar para aprovar" : "Somente pendentes podem ser aprovadas"}
                              />
                            </td>
                          )}
                          <td style={styles.td}>{r.id}</td>
                          <td style={styles.td}>{clienteNome}</td>
                          <td style={styles.td}>{contratoCode}</td>
                          <td style={{ ...styles.td, fontWeight: 700 }}>
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 10px",
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 700,
                              background: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                            }}>
                              {badge.label}
                            </span>
                          </td>
                          <td style={styles.td}>{fmtDate(r.createdAt)}</td>
                          <td style={styles.td}>{fmtDate(r.approvedAt)}</td>
                          <td style={styles.td}>{r.notes || "-"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
     
      </div>
    </div>
  );
}
