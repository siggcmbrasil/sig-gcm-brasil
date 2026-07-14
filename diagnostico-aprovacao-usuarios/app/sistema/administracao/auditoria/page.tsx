"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Eye,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

type LogAuditoria = {
  id: number;
  municipio_id: number | null;
  guarda_id: number | null;
  usuario_nome: string | null;
  usuario_email: string | null;
  perfil: string | null;
  modulo: string | null;
  acao: string | null;
  descricao: string | null;
  registro_id: string | null;
  tabela: string | null;
  status: string | null;
  ip: string | null;
  dispositivo: string | null;
  detalhes: any;
  criado_em: string;
};

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [busca, setBusca] = useState("");
  const [moduloFiltro, setModuloFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [selecionado, setSelecionado] = useState<LogAuditoria | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregarLogs() {
    setCarregando(true);

    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    let query = supabase
      .from("auditoria")
      .select("*")
      .order("criado_em", { ascending: false })
      .limit(500);

    if (usuario.perfil !== "DESENVOLVEDOR") {
      query = query.eq("municipio_id", usuario.municipio_id);
    }

    if (dataInicio) {
      query = query.gte("criado_em", `${dataInicio}T00:00:00`);
    }

    if (dataFim) {
      query = query.lte("criado_em", `${dataFim}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      alert("Erro ao carregar auditoria.");
      setCarregando(false);
      return;
    }

    setLogs(data || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarLogs();
  }, []);

  const modulos = useMemo(() => {
    return Array.from(
      new Set(logs.map((l) => l.modulo).filter(Boolean))
    ).sort();
  }, [logs]);

  const filtrados = logs.filter((log) => {
    const texto = `
      ${log.usuario_nome || ""}
      ${log.usuario_email || ""}
      ${log.modulo || ""}
      ${log.acao || ""}
      ${log.descricao || ""}
      ${log.status || ""}
      ${log.tabela || ""}
    `.toLowerCase();

    const bateBusca = texto.includes(busca.toLowerCase());

    const bateModulo = moduloFiltro
      ? log.modulo === moduloFiltro
      : true;

    const bateStatus = statusFiltro
      ? (log.status || "SUCESSO") === statusFiltro
      : true;

    return bateBusca && bateModulo && bateStatus;
  });

  const logsHoje = logs.filter((log) => {
    const hoje = new Date().toISOString().slice(0, 10);
    return log.criado_em?.startsWith(hoje);
  }).length;

  const criticos = logs.filter((log) =>
    ["EXCLUIR", "RESTAURAR", "ALTERAR_PERMISSAO", "BACKUP"].some((a) =>
      String(log.acao || "").toUpperCase().includes(a)
    )
  ).length;

  return (
    <ProtecaoModulo modulo="auditoria">
      <div className="p-4 md:p-6 pb-24 space-y-6">
        <SigPageHeader
          titulo="Central de Auditoria"
          subtitulo="Logs, rastreamento e histórico de ações do SIG-GCM Brasil."
          icone={ShieldCheck}
        />

        <div className="grid md:grid-cols-5 gap-4">
          <SigCard>
            <Activity className="w-8 h-8 text-cyan-400 mb-3" />
            <p className="text-slate-400 text-sm">Total</p>
            <h2 className="text-3xl font-black text-white">{logs.length}</h2>
          </SigCard>

          <SigCard>
            <CalendarDays className="w-8 h-8 text-blue-400 mb-3" />
            <p className="text-slate-400 text-sm">Hoje</p>
            <h2 className="text-3xl font-black text-blue-400">{logsHoje}</h2>
          </SigCard>

          <SigCard>
            <p className="text-slate-400 text-sm">Sucesso</p>
            <h2 className="text-3xl font-black text-emerald-400">
              {logs.filter((l) => (l.status || "SUCESSO") === "SUCESSO").length}
            </h2>
          </SigCard>

          <SigCard>
            <p className="text-slate-400 text-sm">Erros</p>
            <h2 className="text-3xl font-black text-red-400">
              {logs.filter((l) => l.status === "ERRO").length}
            </h2>
          </SigCard>

          <SigCard>
            <AlertTriangle className="w-8 h-8 text-yellow-400 mb-3" />
            <p className="text-slate-400 text-sm">Críticos</p>
            <h2 className="text-3xl font-black text-yellow-400">
              {criticos}
            </h2>
          </SigCard>
        </div>

        <SigCard>
          <div className="grid md:grid-cols-6 gap-3">
            <div className="md:col-span-2 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                className="w-full bg-transparent outline-none text-white"
                placeholder="Pesquisar..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            <input
              type="date"
              className="input"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />

            <input
              type="date"
              className="input"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />

            <select
              className="input"
              value={moduloFiltro}
              onChange={(e) => setModuloFiltro(e.target.value)}
            >
              <option value="">Todos os módulos</option>
              {modulos.map((m) => (
                <option key={m || ""} value={m || ""}>
                  {m}
                </option>
              ))}
            </select>

            <select
              className="input"
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
            >
              <option value="">Todos status</option>
              <option value="SUCESSO">SUCESSO</option>
              <option value="ERRO">ERRO</option>
              <option value="ALERTA">ALERTA</option>
            </select>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={carregarLogs} className="sig-btn-gold">
              Aplicar filtros
            </button>

            <button
              onClick={() => {
                setBusca("");
                setModuloFiltro("");
                setStatusFiltro("");
                setDataInicio("");
                setDataFim("");
                setTimeout(carregarLogs, 100);
              }}
              className="btn-secondary"
            >
              Limpar
            </button>
          </div>
        </SigCard>

        <SigCard>
          <h2 className="text-xl font-black text-white mb-4">
            Logs recentes
          </h2>

          {carregando ? (
            <p className="text-slate-400">Carregando auditoria...</p>
          ) : filtrados.length === 0 ? (
            <p className="text-slate-400">Nenhum log encontrado.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-900 text-slate-300">
                  <tr>
                    <th className="text-left p-3">Data</th>
                    <th className="text-left p-3">Usuário</th>
                    <th className="text-left p-3">Módulo</th>
                    <th className="text-left p-3">Ação</th>
                    <th className="text-left p-3">Descrição</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-center p-3">Detalhes</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {filtrados.map((log) => (
                    <tr key={log.id} className="text-slate-300">
                      <td className="p-3 whitespace-nowrap text-slate-400">
                        {new Date(log.criado_em).toLocaleString("pt-BR")}
                      </td>

                      <td className="p-3">
                        <p className="font-bold text-white">
                          {log.usuario_nome || "-"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {log.perfil || "-"}
                        </p>
                      </td>

                      <td className="p-3 text-cyan-400 font-bold">
                        {log.modulo || "-"}
                      </td>

                      <td className="p-3">
                        <span className="rounded-lg bg-yellow-500/10 text-yellow-300 px-2 py-1 text-xs font-black">
                          {log.acao || "-"}
                        </span>
                      </td>

                      <td className="p-3 text-slate-300 max-w-md">
                        {log.descricao || "-"}
                      </td>

                      <td className="p-3">
                        <span className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-bold">
                          {log.status || "SUCESSO"}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelecionado(log)}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-700 hover:bg-blue-800 px-3 py-2 text-xs font-bold text-white"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SigCard>

        {selecionado && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="painel-premium max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-black text-white">
                  Detalhes do Log
                </h2>

                <button
                  onClick={() => setSelecionado(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <Info label="Data" valor={new Date(selecionado.criado_em).toLocaleString("pt-BR")} />
                <Info label="Usuário" valor={selecionado.usuario_nome || "-"} />
                <Info label="Email" valor={selecionado.usuario_email || "-"} />
                <Info label="Perfil" valor={selecionado.perfil || "-"} />
                <Info label="Módulo" valor={selecionado.modulo || "-"} />
                <Info label="Ação" valor={selecionado.acao || "-"} />
                <Info label="Tabela" valor={selecionado.tabela || "-"} />
                <Info label="Registro ID" valor={selecionado.registro_id || "-"} />
                <Info label="Status" valor={selecionado.status || "SUCESSO"} />
                <Info label="IP" valor={selecionado.ip || "-"} />
              </div>

              <div className="mt-4">
                <p className="text-slate-400 text-xs font-bold uppercase">
                  Descrição
                </p>
                <p className="text-white mt-1">{selecionado.descricao || "-"}</p>
              </div>

              <div className="mt-4">
                <p className="text-slate-400 text-xs font-bold uppercase">
                  Dispositivo
                </p>
                <p className="text-slate-300 text-xs break-all mt-1">
                  {selecionado.dispositivo || "-"}
                </p>
              </div>

              <div className="mt-4">
                <p className="text-slate-400 text-xs font-bold uppercase">
                  Detalhes
                </p>

                <pre className="mt-2 rounded-xl bg-slate-950 border border-slate-800 p-4 text-xs text-slate-300 overflow-x-auto">
                  {JSON.stringify(selecionado.detalhes || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtecaoModulo>
  );
}

function Info({
  label,
  valor,
}: {
  label: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
      <p className="text-slate-500 text-xs font-bold uppercase">
        {label}
      </p>
      <p className="text-white font-bold mt-1 break-words">{valor}</p>
    </div>
  );
}