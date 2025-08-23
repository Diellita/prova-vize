// src/services/solicitacoes.ts
import type { Perfil } from "../types/auth";

/** ===================== TIPOS ===================== */
export type Status = "PENDENTE" | "APROVADO" | "REPROVADO" | "LIQUIDADO";
export type StatusParcelas = "AGUARDANDO_APROVACAO" | "ANTECIPADA" | "PAGA" | "A VENCER";

export interface Solicitacao {
  id: string;
  clienteNome: string;
  contratoCodigo: string;
  parcelaAtual: number;
  vencimento: string; // ISO
  status: Status;
  solicitanteId: string;
}

export interface Parcela {
  numero: number;
  valor: number;
  vencimento: string;     // ISO
  status: StatusParcelas; // <-- padronizado (minúsculo na chave)
}

export interface DetalheContrato {
  contratoCodigo: string;
  clienteNome: string;
  parcelas: Parcela[];
}

/** ===================== MOCKS ===================== */

// Lista de solicitações (sem filtro por cliente na listagem)
export const MOCK_SOLICITACOES: Solicitacao[] = [
  { id:"REQ-001", clienteNome:"João da Silva",   contratoCodigo:"CONTRATO-001", parcelaAtual:5,  vencimento:"2025-08-10", status:"PENDENTE",  solicitanteId:"u1" },
  { id:"REQ-002", clienteNome:"João da Silva",   contratoCodigo:"CONTRATO-001", parcelaAtual:10, vencimento:"2025-12-25", status:"REPROVADO", solicitanteId:"u1" },
  { id:"REQ-003", clienteNome:"João da Silva",   contratoCodigo:"CONTRATO-002", parcelaAtual:3,  vencimento:"2025-10-17", status:"APROVADO",  solicitanteId:"u1" },
  { id:"REQ-004", clienteNome:"Maria Oliveira",  contratoCodigo:"CONTRATO-003", parcelaAtual:4,  vencimento:"2025-08-15", status:"LIQUIDADO", solicitanteId:"u2" },
  { id:"REQ-005", clienteNome:"Maria Oliveira",  contratoCodigo:"CONTRATO-004", parcelaAtual:9,  vencimento:"2025-11-10", status:"PENDENTE",  solicitanteId:"u2" },
  { id:"REQ-006", clienteNome:"Débora Alves",    contratoCodigo:"CONTRATO-005", parcelaAtual:3,  vencimento:"2025-10-12", status:"PENDENTE",  solicitanteId:"u3" },
  { id:"REQ-007", clienteNome:"Bia Sousa",       contratoCodigo:"CONTRATO-006", parcelaAtual:2,  vencimento:"2025-07-10", status:"APROVADO",  solicitanteId:"u4" },
  { id:"REQ-008", clienteNome:"Bia Sousa",       contratoCodigo:"CONTRATO-007", parcelaAtual:4,  vencimento:"2025-09-15", status:"LIQUIDADO", solicitanteId:"u4" },
  { id:"REQ-009", clienteNome:"Bia Sousa",       contratoCodigo:"CONTRATO-008", parcelaAtual:1,  vencimento:"2025-08-10", status:"PENDENTE",  solicitanteId:"u4" },
  { id:"REQ-010", clienteNome:"Bia Sousa",       contratoCodigo:"CONTRATO-009", parcelaAtual:7,  vencimento:"2025-12-10", status:"REPROVADO", solicitanteId:"u4" },
  { id:"REQ-011", clienteNome:"Ibrahin Mohamad", contratoCodigo:"CONTRATO-010", parcelaAtual:12, vencimento:"2025-05-10", status:"LIQUIDADO", solicitanteId:"u5" },
  { id:"REQ-012", clienteNome:"Ibrahin Mohamad", contratoCodigo:"CONTRATO-011", parcelaAtual:4,  vencimento:"2025-12-23", status:"PENDENTE",  solicitanteId:"u5" },
];

// Detalhe das parcelas por contrato (12 parcelas cada, datas mensais e status variados)
export const MOCK_DETALHE: Record<string, DetalheContrato> = {
  "CONTRATO-001": {
    contratoCodigo:"CONTRATO-001",
    clienteNome:"João da Silva",
    parcelas:[
      { numero:1,  valor:1500, vencimento:"2025-03-10", status:"PAGA" },
      { numero:2,  valor:1500, vencimento:"2025-04-10", status:"PAGA" },
      { numero:3,  valor:1500, vencimento:"2025-05-10", status:"PAGA" },
      { numero:4,  valor:1500, vencimento:"2025-06-10", status:"PAGA" },
      { numero:5,  valor:1500, vencimento:"2025-07-10", status:"A VENCER" },    // atual na REQ-001
      { numero:6,  valor:1500, vencimento:"2025-08-10", status:"A VENCER" },
      { numero:7,  valor:1500, vencimento:"2025-09-10", status:"A VENCER" },
      { numero:8,  valor:1500, vencimento:"2025-10-10", status:"A VENCER" },
      { numero:9,  valor:1500, vencimento:"2025-11-10", status:"ANTECIPADA" },
      { numero:10, valor:1500, vencimento:"2025-12-10", status:"ANTECIPADA" },  // próxima da REQ-002 reprovada
      { numero:11, valor:1500, vencimento:"2026-01-10", status:"A VENCER" },
      { numero:12, valor:1500, vencimento:"2026-02-10", status:"A VENCER" },
    ]
  },

  "CONTRATO-002": {
    contratoCodigo:"CONTRATO-002",
    clienteNome:"João da Silva",
    parcelas:[
      { numero:1,  valor:1600, vencimento:"2025-06-10", status:"PAGA" },
      { numero:2,  valor:1600, vencimento:"2025-07-10", status:"PAGA" },
      { numero:3,  valor:1600, vencimento:"2025-08-10", status:"PAGA" }, // aprovado na REQ-003
      { numero:4,  valor:1600, vencimento:"2025-09-10", status:"A VENCER" },
      { numero:5,  valor:1600, vencimento:"2025-10-10", status:"A VENCER" },
      { numero:6,  valor:1600, vencimento:"2025-11-10", status:"A VENCER" },
      { numero:7,  valor:1600, vencimento:"2025-12-10", status:"A VENCER" },
      { numero:8,  valor:1600, vencimento:"2026-01-10", status:"AGUARDANDO_APROVACAO" }, // trava global
      { numero:9,  valor:1600, vencimento:"2026-02-10", status:"ANTECIPADA" },
      { numero:10, valor:1600, vencimento:"2026-03-10", status:"ANTECIPADA" },
      { numero:11, valor:1600, vencimento:"2026-04-10", status:"A VENCER" },
      { numero:12, valor:1600, vencimento:"2026-05-10", status:"A VENCER" },
    ]
  },

  "CONTRATO-003": {
    contratoCodigo:"CONTRATO-003",
    clienteNome:"Maria Oliveira",
    parcelas: Array.from({ length: 12 }, (_, i) => ({
      numero: i + 1,
      valor: 1700,
      vencimento: `2025-${String(i + 1).padStart(2, "0")}-15`,
      status: i < 4 ? "PAGA" : (i === 4 ? "AGUARDANDO_APROVACAO" : "A VENCER"),
    })),
  },

  "CONTRATO-004": {
    contratoCodigo:"CONTRATO-004",
    clienteNome:"Maria Oliveira",
    parcelas: Array.from({ length: 12 }, (_, i) => ({
      numero: i + 1,
      valor: 1800,
      vencimento: `2025-${String(i + 1).padStart(2, "0")}-10`,
      status: i < 8 ? "PAGA" : (i === 9 ? "AGUARDANDO_APROVACAO" : "A VENCER"),
    })),
  },

  "CONTRATO-005": {
    contratoCodigo:"CONTRATO-005",
    clienteNome:"Débora Alves",
    parcelas: Array.from({ length: 12 }, (_, i) => ({
      numero: i + 1,
      valor: 1900,
      vencimento: `2025-${String(i + 1).padStart(2, "0")}-12`,
      status: i < 2 ? "PAGA" : (i === 3 ? "ANTECIPADA" : "A VENCER"),
    })),
  },

  "CONTRATO-006": {
    contratoCodigo:"CONTRATO-006",
    clienteNome:"Bia Sousa",
    parcelas: Array.from({ length: 12 }, (_, i) => ({
      numero: i + 1,
      valor: 2000,
      vencimento: `2025-${String(i + 1).padStart(2, "0")}-10`,
      status: i < 2 ? "PAGA" : (i === 2 ? "ANTECIPADA" : "A VENCER"),
    })),
  },

  "CONTRATO-007": {
    contratoCodigo:"CONTRATO-007",
    clienteNome:"Bia Sousa",
    parcelas: Array.from({ length: 12 }, (_, i) => ({
      numero: i + 1,
      valor: 2100,
      vencimento: `2025-${String(i + 1).padStart(2, "0")}-15`,
      status: i < 4 ? "PAGA" : (i === 4 ? "AGUARDANDO_APROVACAO" : "A VENCER"),
    })),
  },

  "CONTRATO-008": {
    contratoCodigo:"CONTRATO-008",
    clienteNome:"Bia Sousa",
    parcelas: Array.from({ length: 12 }, (_, i) => ({
      numero: i + 1,
      valor: 2200,
      vencimento: `2025-${String(i + 1).padStart(2, "0")}-10`,
      status: i === 0 ? "AGUARDANDO_APROVACAO" : "A VENCER",
    })),
  },

  "CONTRATO-009": {
    contratoCodigo:"CONTRATO-009",
    clienteNome:"Bia Sousa",
    parcelas: Array.from({ length: 12 }, (_, i) => ({
      numero: i + 1,
      valor: 2300,
      vencimento: `2025-${String(i + 1).padStart(2, "0")}-10`,
      status: i < 6 ? "PAGA" : (i === 7 ? "AGUARDANDO_APROVACAO" : "A VENCER"),
    })),
  },

  "CONTRATO-010": {
    contratoCodigo:"CONTRATO-010",
    clienteNome:"Ibrahin Mohamad",
    parcelas: Array.from({ length: 12 }, (_, i) => ({
      numero: i + 1,
      valor: 2400,
      vencimento: `2025-${String(i + 1).padStart(2, "0")}-10`,
      status: i < 12 ? "PAGA" : "A VENCER",
    })),
  },

  "CONTRATO-011": {
    contratoCodigo:"CONTRATO-011",
    clienteNome:"Ibrahin Mohamad",
    parcelas: Array.from({ length: 12 }, (_, i) => ({
      numero: i + 1,
      valor: 2500,
      vencimento: `2025-${String(i + 1).padStart(2, "0")}-23`,
      status: i < 3 ? "PAGA" : (i === 4 ? "AGUARDANDO_APROVACAO" : "A VENCER"),
    })),
  },
};

/** ===================== FUNÇÕES ===================== */

export async function listarSolicitacoes(
  _perfil: Perfil,
  filtros: { status?: Status | "TODOS" }
): Promise<Solicitacao[]> {
  await new Promise((r) => setTimeout(r, 300)); // simula latência
  return MOCK_SOLICITACOES.filter((s) => {
    const byStatus =
      filtros.status && filtros.status !== "TODOS" ? s.status === filtros.status : true;
    return byStatus;
  });
}

export async function obterDetalheContrato(codigo: string): Promise<DetalheContrato> {
  await new Promise((r) => setTimeout(r, 300)); // simula latência
  return MOCK_DETALHE[codigo];
}

/** ===================== HELPERS ===================== */

// Cliente só pode antecipar parcela "A VENCER" com vencimento > 30 dias
export function parcelaElegivel(vencimentoISO: string, statusParcela: StatusParcelas): boolean {
  if (statusParcela !== "A VENCER") return false;
  const hoje = new Date();
  const venc = new Date(vencimentoISO);
  const diffMs = venc.getTime() - hoje.getTime();
  const trintaDiasMs = 30 * 24 * 60 * 60 * 1000;
  return diffMs > trintaDiasMs;
}

// Trava global: se existe ao menos uma parcela em AGUARDANDO_APROVACAO, cliente não solicita outra
export function existeParcelaAguardandoAprovacao(parcelas: Pick<Parcela, "status">[]): boolean {
  return parcelas.some((p) => p.status === "AGUARDANDO_APROVACAO");
}

// Verifica se o usuário tem outra solicitação PENDENTE (opcionalmente ignorando um id atual)
export function temSolicitacaoPendente(usuarioId: string, excetoId?: string): boolean {
  return MOCK_SOLICITACOES.some(
    (s) => s.solicitanteId === usuarioId && s.status === "PENDENTE" && (excetoId ? s.id !== excetoId : true)
  );
}
