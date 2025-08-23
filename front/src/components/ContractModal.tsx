// FILE: src/components/ContractModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Parcela, Status } from "../services/contratos";
import type { Perfil } from "../types/auth";
import {
  parcelaElegivel,
  existeParcelaAguardandoAprovacao,
} from "../services/contratos";

interface Props {
  open: boolean;
  onClose: () => void;

  contratoCodigo: string;
  clienteNome: string;
  parcelas: Parcela[];

  perfil: Perfil;
  podeAprovar: boolean;         // vem da Lista (true se aprovador & solicitação PENDENTE)
  statusDaSolicitacao?: Status; // opcional (para exibir/usar se precisar)

  onAprovar?: (parcelas: number[]) => void;
  onReprovar?: (parcelas: number[]) => void;
  onEnviar?: (parcelas: number[]) => void;
}

export default function ContractModal({
  open,
  onClose,
  contratoCodigo,
  clienteNome,
  parcelas,
  perfil,
  podeAprovar,
  statusDaSolicitacao,
  onAprovar,
  onReprovar,
  onEnviar,
}: Props) {
  const [selecionados, setSelecionados] = useState<number[]>([]);

  // --- Normalização do papel ---
  const role = String(perfil || "").toUpperCase().trim();
  const isAprovador = role === "APROVADOR";
  const isCliente = role === "CLIENTE";

  // Aprovador só pode selecionar quando a Lista mandou podeAprovar = true
  const aprovadorPodeSelecionar = isAprovador && podeAprovar;

  // Cliente tem visão de cliente; checkboxes dependem da elegibilidade da PARCELA
  const clientePodeSelecionar = isCliente;

  // Trava global: se existir QUALQUER parcela aguardando aprovação, cliente não pode solicitar outra
  const bloqueadoPorAguardando = useMemo(
    () => existeParcelaAguardandoAprovacao(parcelas),
    [parcelas]
  );

  // Números das parcelas elegíveis para o CLIENTE (status da parcela + >30 dias)
  const elegiveisCliente = useMemo(
    () =>
      parcelas
        .filter((p) => parcelaElegivel(p.vencimento, p.status))
        .map((p) => p.numero),
    [parcelas]
  );

  // Select-all
  const selectAllRef = useRef<HTMLInputElement>(null);
  const totalSelecionavel = aprovadorPodeSelecionar
    ? parcelas.length
    : clientePodeSelecionar
    ? (bloqueadoPorAguardando ? 0 : elegiveisCliente.length)
    : 0;

  const allSelected =
    totalSelecionavel > 0 && selecionados.length === totalSelecionavel;
  const someSelected =
    selecionados.length > 0 && selecionados.length < totalSelecionavel;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  // Limpa seleção ao fechar
  useEffect(() => {
    if (!open) setSelecionados([]);
  }, [open]);

  const toggleSelecionado = (numero: number) => {
    // trava extra para cliente
    if (clientePodeSelecionar && bloqueadoPorAguardando) {
      alert(
        "Já existe uma parcela aguardando aprovação. Conclua essa solicitação antes de criar outra."
      );
      return;
    }
    setSelecionados((prev) =>
      prev.includes(numero)
        ? prev.filter((n) => n !== numero)
        : [...prev, numero]
    );
  };

  const toggleTodos = () => {
    if (clientePodeSelecionar && bloqueadoPorAguardando) {
      alert(
        "Já existe uma parcela aguardando aprovação. Conclua essa solicitação antes de criar outra."
      );
      return;
    }
    if (allSelected) setSelecionados([]);
    else
      setSelecionados(
        aprovadorPodeSelecionar
          ? parcelas.map((p) => p.numero)
          : elegiveisCliente
      );
  };

  const handleEnviarCliente = () => {
    if (!clientePodeSelecionar) return;
    if (bloqueadoPorAguardando) {
      alert(
        "Já existe uma parcela aguardando aprovação. Conclua essa solicitação antes de criar outra."
      );
      return;
    }
    if (selecionados.length === 0) {
      alert(
        "Selecione ao menos uma parcela elegível (> 30 dias e status A VENCER)."
      );
      return;
    }
    onEnviar?.(selecionados);
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "90%",
          height: "80%",
          background: "#fff",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,.35)",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            Detalhes do Contrato {contratoCodigo}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              padding: "12px",
              margin: "10px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              lineHeight: 1,
            }}
            aria-label="Fechar"
            title="Fechar"
          >
            X
          </button>
        </div>

        {/* Aviso de trava para o cliente */}
        {clientePodeSelecionar && bloqueadoPorAguardando && (
          <div
            style={{
              margin: "12px 20px 0",
              padding: "10px 12px",
              borderRadius: 8,
              background: "#fef3c7",
              color: "#92400e",
              border: "1px solid #f59e0b",
              fontWeight: 600,
            }}
          >
            Já existe uma parcela <u>aguardando aprovação</u> para este contrato.
            Conclua essa solicitação antes de criar outra.
          </div>
        )}

        {/* Body */}
        <div style={{ padding: "16px 20px", overflow: "auto" }}>
          <p style={{ marginTop: 0, marginBottom: 12 }}>
            <strong>Cliente:</strong> {clienteNome}
          </p>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {(aprovadorPodeSelecionar || clientePodeSelecionar) && (
                  <th
                    style={{
                      padding: 8,
                      borderBottom: "1px solid #e5e7eb",
                      width: 36,
                    }}
                  >
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allSelected}
                      onChange={(_e) => toggleTodos()}
                      aria-label="Selecionar todos"
                      title={
                        aprovadorPodeSelecionar
                          ? "Selecionar todas as parcelas"
                          : "Selecionar apenas as parcelas elegíveis"
                      }
                    />
                  </th>
                )}
                <th
                  style={{
                    padding: 8,
                    borderBottom: "1px solid #e5e7eb",
                    textAlign: "left",
                  }}
                >
                  Parcela
                </th>
                <th
                  style={{
                    padding: 8,
                    borderBottom: "1px solid #e5e7eb",
                    textAlign: "left",
                  }}
                >
                  Valor
                </th>
                <th
                  style={{
                    padding: 8,
                    borderBottom: "1px solid #e5e7eb",
                    textAlign: "left",
                  }}
                >
                  Vencimento
                </th>
                <th
                  style={{
                    padding: 8,
                    borderBottom: "1px solid #e5e7eb",
                    textAlign: "left",
                  }}
                >
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {parcelas.map((p) => {
                const elegivelCliente =
                  clientePodeSelecionar &&
                  !bloqueadoPorAguardando &&
                  parcelaElegivel(p.vencimento, p.status);

                return (
                  <tr key={p.numero}>
                    {(aprovadorPodeSelecionar || clientePodeSelecionar) && (
                      <td
                        style={{
                          padding: 8,
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {aprovadorPodeSelecionar ? (
                          // APROVADOR: checkbox sempre disponível
                          <input
                            type="checkbox"
                            checked={selecionados.includes(p.numero)}
                            onChange={(_e) => toggleSelecionado(p.numero)}
                            aria-label={`Selecionar parcela ${p.numero}`}
                          />
                        ) : elegivelCliente ? (
                          // CLIENTE: só quando a PARCELA é elegível
                          <input
                            type="checkbox"
                            checked={selecionados.includes(p.numero)}
                            onChange={(_e) => toggleSelecionado(p.numero)}
                            aria-label={`Selecionar parcela ${p.numero}`}
                            title="Parcela elegível (> 30 dias e status A VENCER)"
                          />
                        ) : (
                          // célula vazia quando não elegível
                          <span />
                        )}
                      </td>
                    )}

                    <td
                      style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}
                    >
                      {p.numero}
                    </td>
                    <td
                      style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}
                    >
                      R${" "}
                      {p.valor.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}
                    >
                      {new Date(p.vencimento).toLocaleDateString("pt-BR")}
                    </td>
                    <td
                      style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}
                    >
                      {p.status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            flexShrink: 0,
          }}
        >
          {isCliente && (
            <button
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                padding: "10px 16px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
              }}
              onClick={handleEnviarCliente}
            >
              Antecipar Parcela
            </button>
          )}

          {aprovadorPodeSelecionar && (
            <>
              <button
                style={{
                  background: "#16a34a",
                  color: "#fff",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                onClick={() => onAprovar?.(selecionados)}
              >
                Aprovar
              </button>
              <button
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                onClick={() => onReprovar?.(selecionados)}
              >
                Reprovar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
