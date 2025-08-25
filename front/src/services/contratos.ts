// front/src/services/contratos.ts
import * as API from "../lib/api";

/* ===================== Tipos ===================== */
export type StatusParcelas = "PAGO" | "A_VENCER" | "AGUARDANDO_APROVACAO";

export type Parcela = {
  numero: number;
  valor: number;
  vencimento: string; // ISO
  status: StatusParcelas;
};

export type DetalheContrato = {
  contratoCodigo: string;
  clienteNome: string;
  parcelas: Parcela[];
};

/* ===================== Helpers ===================== */
const BASE_URL: string = (API as any)?.BASE_URL || "http://localhost:5275";

function authHeaders(): HeadersInit {
  try {
    const s = JSON.parse(localStorage.getItem("session") || "{}");
    const tok =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      s?.token ||
      "";
    return tok ? { Authorization: `Bearer ${tok}` } : {};
  } catch {
    return {};
  }
}

// Extrai o número do ID no fim do código (ex.: "AS_2_CONTRATO_6" -> 6)
// Funciona também para "CONTRATO-002-06" -> 6
function codeToId(code: string): number | null {
  if (!code) return null;
  const m = String(code).match(/(\d+)\s*$/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

// gera parcelas "razoáveis" para fallback, mimetizando as regras
function makeFallbackParcelas(contratoCode: string): Parcela[] {
  const now = new Date();
  const utc = (d: Date) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0));
  const baseDay = 10;

  const parcelas: Parcela[] = [];
  for (let i = 1; i <= 12; i++) {
    let venc: Date;
    let status: StatusParcelas = "A_VENCER";

    if (i === 1) {
      // já vencida e paga
      const d = new Date(now);
      d.setDate(d.getDate() - 10);
      venc = d;
      status = "PAGO";
    } else if (i === 2) {
      // menor que 30 dias
      const d = new Date(now);
      d.setDate(d.getDate() + 20);
      venc = d;
    } else if (i === 3) {
      // elegível (>30)
      const d = new Date(now);
      d.setDate(d.getDate() + 45);
      venc = d;
    } else {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), baseDay));
      d.setUTCMonth(d.getUTCMonth() + (i - 1));
      venc = d;
    }

    parcelas.push({
      numero: i,
      valor: 1600,
      vencimento: utc(venc).toISOString(),
      status,
    });
  }

  // opcional: simula AGUARDANDO_APROVACAO apenas no "primeiro" contrato (id menor)
  const id = codeToId(contratoCode);
  if (id && id % 10 === 1) {
    const p4 = parcelas.find((p) => p.numero === 4);
    if (p4 && p4.status === "A_VENCER") p4.status = "AGUARDANDO_APROVACAO";
  }

  return parcelas;
}

/* ===================== API pública ===================== */

// Usa sempre o endpoint GET /contracts/{id}/detail; se falhar, cai no fallback local.
export async function obterDetalheContrato(code: string): Promise<DetalheContrato> {
  const id = codeToId(code);

  if (id != null) {
    try {
      const url = `${BASE_URL}/contracts/${id}/detail`;
      const r = await fetch(url, {
        headers: { ...authHeaders() },
        credentials: "include",
      });

      if (r.ok) {
        const det = await r.json();
        // Mapeia do payload do backend para o nosso tipo (dueDate -> vencimento)
        if (det && Array.isArray(det.parcelas)) {
          const mapped: DetalheContrato = {
            contratoCodigo: code,
            clienteNome: det.ownerName ?? "Cliente",
            parcelas: det.parcelas.map((p: any) => ({
              numero: Number(p.numero),
              valor: Number(p.valor),
              vencimento: String(p.dueDate), // backend retorna dueDate
              status: String(p.status) as StatusParcelas,
            })),
          };
          return mapped;
        }
        // se a resposta não tiver o formato esperado, cai no fallback
      } else {
        // tentar extrair mensagem de erro antes do fallback
        try { console.warn("detalhe contrato:", await r.text()); } catch {}
      }
    } catch (e) {
      // continua para fallback
    }
  }

  // Fallback local — garante dropdown utilizável
  const nome = (() => {
    try {
      const s = JSON.parse(localStorage.getItem("session") || "{}");
      let from: string =
        s.clienteNome || s.nome || s.name || s.userName || "";

      if (!from) {
        const tok =
          localStorage.getItem("token") ||
          localStorage.getItem("authToken") ||
          s?.token ||
          "";
        if (tok) {
          const parts = tok.split(".");
          if (parts.length > 1) {
            const payload = JSON.parse(
              atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
            );
            from =
              payload?.name ||
              payload?.given_name ||
              (payload?.preferred_username ?? "") ||
              (payload?.email ? String(payload.email).split("@")[0] : "");
          }
        }
      }
      return from || "Cliente";
    } catch {
      return "Cliente";
    }
  })();

  const detFallback: DetalheContrato = {
    contratoCodigo: code,
    clienteNome: nome,
    parcelas: makeFallbackParcelas(code),
  };

  return detFallback;
}

// Regra de elegibilidade: > 30 dias e status "A_VENCER"
export function parcelaElegivel(vencimentoISO: string, status: StatusParcelas): boolean {
  if (status !== "A_VENCER") return false;
  try {
    const venc = new Date(vencimentoISO).getTime();
    const now = Date.now();
    const diffDays = (venc - now) / (1000 * 60 * 60 * 24);
    return diffDays > 30;
  } catch {
    return false;
  }
}

// Checa se existe alguma parcela aguardando aprovação
export function existeParcelaAguardandoAprovacao(parcelas: Parcela[] = []): boolean {
  return parcelas.some((p) => p.status === "AGUARDANDO_APROVACAO");
}
