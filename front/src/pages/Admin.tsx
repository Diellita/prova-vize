import { useNavigate } from "react-router-dom";
import React from "react";
import {
  getAdminAdvanceRequests,
  approveAdvanceRequests,
  rejectAdvanceRequests,
  getAllContracts, 
  getAllClients,     
} from "../lib/api";
import Swal from "sweetalert2";

type AdvanceRequest = {
  id: number;
  clienteId: number;
  contratoId: number;
  status: string | number; // 0=PENDENTE, 1=APROVADO, 2=REPROVADO ou texto
  notes?: string | null;
  createdAt: string;
  approvedAt?: string | null;
};

type Contract = {
  id: number;
  nome?: string | null;
  codigo?: string | null;
  description?: string | null;
};

function coerceList<T=any>(res: unknown): T[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as T[];
  if (typeof res === "object") {
    const anyRes = res as { value?: unknown; items?: unknown };
    if (Array.isArray(anyRes.value)) return anyRes.value as T[];
    if (Array.isArray(anyRes.items)) return anyRes.items as T[];
  }
  return [];
}


const statusToLabel = (s: any): "PENDENTE" | "APROVADO" | "REPROVADO" | string => {
  const t = String(s ?? "").toUpperCase();
  if (s === 0 || t.includes("PENDENTE") || t.includes("AGUARDANDO")) return "PENDENTE";
  if (s === 1 || t.includes("APROVADO")) return "APROVADO";
  if (s === 2 || t.includes("REPROVADO")) return "REPROVADO";
  return String(s);
};

export default function Admin() {

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


  const [data, setData] = React.useState<AdvanceRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedMap, setSelectedMap] = React.useState<Record<number, boolean>>({});
  const [busy, setBusy] = React.useState<"approve" | "reject" | null>(null);
  const [clientsMap, setClientsMap] = React.useState<Record<number, string>>({});

  // mapa de contratos para exibir NOME em vez de ID
  const [contractsMap, setContractsMap] = React.useState<Record<number, string>>({});

  const selected = React.useMemo(
    () => Object.entries(selectedMap).filter(([, v]) => v).map(([k]) => Number(k)),
    [selectedMap]
  );

  const allPending = React.useMemo(
    () => data.filter((d) => statusToLabel(d.status) === "PENDENTE"),
    [data]
  );
  const allSelected = allPending.length > 0 && selected.length === allPending.length;

async function load() {
  try {
    setLoading(true);
    setError(null);

    // carrega solicitações + contratos + clientes em paralelo
    const [reqRes, contractsRes, clientsRes] = await Promise.allSettled([
      getAdminAdvanceRequests(),
      getAllContracts?.(),
      getAllClients?.(),
    ]);

    // solicitações
    const list = reqRes.status === "fulfilled"
      ? coerceList<AdvanceRequest>(reqRes.value)
      : [];

    const ordered = list.sort((a, b) => {
      const ap = statusToLabel(a.status) === "PENDENTE";
      const bp = statusToLabel(b.status) === "PENDENTE";
      if (ap !== bp) return ap ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setData(ordered);

    // contratos -> mapa id->nome
    if (contractsRes.status === "fulfilled" && contractsRes.value) {
      const arr = coerceList<Contract>(contractsRes.value);
      const map: Record<number, string> = {};
      for (const c of arr) {
        const display = c?.nome || c?.codigo || c?.description || `Contrato #${c?.id}`;
        if (typeof c?.id === "number") map[c.id] = String(display);
      }
      setContractsMap(map);
    }

    // clientes -> mapa id->nome
    if (clientsRes.status === "fulfilled" && clientsRes.value) {
      const arr = coerceList<{ id: number; nome?: string; email?: string }>(clientsRes.value);
      const map: Record<number, string> = {};
      for (const c of arr) {
        const display = c?.nome || c?.email || `Cliente #${c?.id}`;
        if (typeof c?.id === "number") map[c.id] = String(display);
      }
      setClientsMap(map);
    }
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || "Falha ao carregar solicitações.";
    setError(msg);
  } finally {
    setLoading(false);
  }
}

  React.useEffect(() => {
    load();
  }, []);

  function toggle(id: number) {
    const row = data.find((d) => d.id === id);
    if (!row || statusToLabel(row.status) !== "PENDENTE") return;
    setSelectedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedMap({});
    } else {
      const next: Record<number, boolean> = {};
      allPending.forEach((d) => (next[d.id] = true));
      setSelectedMap(next);
    }
  }

    async function confirmAction(kind: "approve" | "reject", count: number) {
      const title = kind === "approve" ? "Aprovar selecionadas?" : "Reprovar selecionadas?";
      const text =
        kind === "approve"
          ? `Você vai aprovar ${count} solicitação(ões). Confirmar?`
          : `Você vai reprovar ${count} solicitação(ões). Confirmar?`;
      const confirmButtonText = kind === "approve" ? "Sim, aprovar" : "Sim, reprovar";

      const res = await Swal.fire({
        title,
        text,
        icon: "question",
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText: "Cancelar",
        reverseButtons: true,
        // 👇 Desliga o estilo padrão e usa Tailwind
        buttonsStyling: false,
        customClass: {
          actions: "flex gap-3 justify-center", // espaçamento entre botões
          confirmButton:
            (kind === "approve"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700") +
            " text-white px-4 py-2 rounded",
          cancelButton: "bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded",
        },
        focusCancel: true,
      });
      return res.isConfirmed;
    }

  async function doApprove() {
    if (!selected.length) return;
    if (!(await confirmAction("approve", selected.length))) return;
    try {
      setBusy("approve");
      await approveAdvanceRequests(selected);
      setSelectedMap({});
      await load();
      await Swal.fire({
        icon: "success",
        title: "Aprovado!",
        text: "Solicitações aprovadas.",
        confirmButtonText: "OK",
        buttonsStyling: false,
        customClass: {
          actions: "flex justify-center",
          confirmButton: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded",
        },
      });
    } catch (e: any) {
       await Swal.fire({
      icon: "error",
      title: "Erro ao aprovar",
      text: e?.response?.data?.message || e?.message || "Tente novamente.",
      confirmButtonText: "OK",
      buttonsStyling: false,
      customClass: {
        actions: "flex justify-center",
        confirmButton: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded",
      },
    });
    } finally {
      setBusy(null);
    }
  }

    async function doReject() {
    if (!selected.length) return;
    if (!(await confirmAction("reject", selected.length))) return;
    try {
      setBusy("reject");
      await rejectAdvanceRequests(selected);
      setSelectedMap({});
      await load();
      await Swal.fire({
        icon: "success",
        title: "Reprovado!",
        text: "Solicitações reprovadas.",
        confirmButtonText: "OK",
        buttonsStyling: false,
        customClass: {
          actions: "flex justify-center",
          confirmButton: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded",
        },
      });
    } catch (e: any) {
      await Swal.fire({
      icon: "warning",
      title: "Reprovação indisponível",
      text:
        e?.response?.data?.message ||
        e?.message ||
        "O backend pode não suportar reprovação ainda.",
      confirmButtonText: "OK",
      buttonsStyling: false,
      customClass: {
        actions: "flex justify-center",
        confirmButton: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded",
      },
    });
    } finally {
      setBusy(null);
    }
  }

  const approveTitle =
    selected.length > 0 ? `Aprovar ${selected.length} selecionada(s)` : "Selecione ao menos 1 (PENDENTE)";
  const rejectTitle =
    selected.length > 0 ? `Reprovar ${selected.length} selecionada(s)` : "Selecione ao menos 1 (PENDENTE)";

  const contratoNome = (id: number) => contractsMap[id] || `#${id}`;
  const clienteNome = (id: number) => clientsMap[id] || `Cliente #${id}`; 

  const statusBadge = (s: any) => {
    const L = statusToLabel(s);
    const cls =
      "px-2 py-1 rounded text-xs " +
      (L === "PENDENTE"
        ? "bg-yellow-100 text-yellow-800"
        : L === "APROVADO"
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800");
    return <span className={cls} title={`Status bruto: ${String(s)}`}>{L}</span>;
  };

  return (
    <div style={{ width: "95%", padding: "12px 20px", marginBottom: "5%" }} className="p-6 mx-auto">
        <div style={{ width: "95%", padding: "12px 20px", marginTop: "2%" }}>
          <span className="bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold select-none">
            Perfil: APROVADOR
          </span>

          {/* Grupo Atualizar / Sair */}
          <div
            style={{ width: "100%", padding: "12px 20px" }}
            className="flex justify-end gap-2 mb-4"
          >
            <button
              onClick={load}
              disabled={loading}
              className="bg-gray-200 text-black px-4 py-2 rounded transition-colors hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Atualizar lista"
            >
              {loading ? "Atualizando..." : "Atualizar"}
            </button>

            <button
              onClick={handleLogout}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Sair do sistema"
            >
              {loading ? "Saindo..." : "Voltar ao login"}
            </button>
          </div>
        </div>

        {/* Grupo Aprovar / Reprovar */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={doApprove}
            disabled={!selected.length || busy !== null}
            className="bg-green-600 text-white px-4 py-2 rounded transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={approveTitle}
          >
            {busy === "approve" ? "Aprovando..." : "Aprovar Selecionadas"}
          </button>

          <button
            onClick={doReject}
            disabled={!selected.length || busy !== null}
            className="bg-red-600 text-white px-4 py-2 rounded transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={rejectTitle}
          >
            {busy === "reject" ? "Reprovando..." : "Reprovar Selecionadas"}
          </button>
        </div>
      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <div className="p-4 border rounded bg-white">
        {loading ? (
          <p>Carregando...</p>
        ) : data.length === 0 ? (
          <p>Nenhuma solicitação encontrada.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2 w-8">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                </th>
                <th className="py-2">ID</th>
                <th className="py-2">Cliente</th>
                <th className="py-2">Contrato</th>
                <th className="py-2">Status</th>
                <th className="py-2">Criado em</th>
                <th className="py-2">Aprovado em</th>
                <th className="py-2">Obs.</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => {
                const isPending = statusToLabel(r.status) === "PENDENTE";
                return (
                  <tr key={r.id} className="border-b">
                    <td className="py-2">
                      <input
                        type="checkbox"
                        checked={!!selectedMap[r.id]}
                        onChange={() => toggle(r.id)}
                        disabled={!isPending}
                        title={isPending ? "Selecionar" : "Somente PENDENTE pode ser selecionada"}
                      />
                    </td>
                    <td className="py-2">{r.id}</td>
                    <td className="py-2">{clienteNome(r.clienteId)}</td>
                    <td className="py-2">{contratoNome(r.contratoId)}</td>
                    <td className="py-2">{statusBadge(r.status)}</td>
                    <td className="py-2">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="py-2">
                      {r.approvedAt ? new Date(r.approvedAt).toLocaleString() : "—"}
                    </td>
                    <td className="py-2">{r.notes || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}




