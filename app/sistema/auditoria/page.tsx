"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  FileText,
  Search,
  Shield,
  UserCheck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [consultas, setConsultas] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [moduloFiltro, setModuloFiltro] = useState("");
  const [acaoFiltro, setAcaoFiltro] = useState("");
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);

    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    if (!usuario?.municipio_id) {
      setCarregando(false);
      return;
    }

    const { data: logsData } = await supabase
      .from("auditoria")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false })
      .limit(500);

    const { data: consultasData } = await supabase
      .from("consultas_operacionais")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false })
      .limit(500);

    setLogs(logsData || []);
    setConsultas(consultasData || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const logsFiltrados = logs.filter((item) => {
    const texto = `
      ${item.usuario_nome || ""}
      ${item.descricao || ""}
      ${item.modulo || ""}
      ${item.acao || ""}
    `.toLowerCase();

    return (
      texto.includes(busca.toLowerCase()) &&
      (!moduloFiltro || item.modulo === moduloFiltro) &&
      (!acaoFiltro || item.acao === acaoFiltro)
    );
  });

  const modulos = Array.from(
    new Set(logs.map((l) => l.modulo).filter(Boolean))
  );

  const acoes = Array.from(
    new Set(logs.map((l) => l.acao).filter(Boolean))
  );

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Auditoria do Sistema"
        subtitulo="Registro completo das ações realizadas no SIG-GCM Brasil."
        icone={Shield}
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <ResumoCard titulo="Logs" valor={logs.length} icone={Activity} />
        <ResumoCard titulo="Consultas" valor={consultas.length} icone={Search} />
        <ResumoCard titulo="Módulos" valor={modulos.length} icone={FileText} />
        <ResumoCard
          titulo="Usuários"
          valor={new Set(logs.map((l) => l.usuario_nome).filter(Boolean)).size}
          icone={UserCheck}
        />
      </div>

      <SigCard>
        <div className="grid md:grid-cols-3 gap-3">
          <input
            className="input"
            placeholder="Pesquisar por usuário, descrição, módulo ou ação..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="input"
            value={moduloFiltro}
            onChange={(e) => setModuloFiltro(e.target.value)}
          >
            <option value="">Todos os módulos</option>
            {modulos.map((modulo) => (
              <option key={modulo} value={modulo}>
                {modulo}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={acaoFiltro}
            onChange={(e) => setAcaoFiltro(e.target.value)}
          >
            <option value="">Todas as ações</option>
            {acoes.map((acao) => (
              <option key={acao} value={acao}>
                {acao}
              </option>
            ))}
          </select>
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Consultas Operacionais
        </h2>

        {carregando ? (
          <p className="text-slate-400">Carregando consultas...</p>
        ) : consultas.length === 0 ? (
          <p className="text-slate-400">
            Nenhuma consulta operacional registrada.
          </p>
        ) : (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {consultas.map((item) => (
              <div
                key={`consulta-${item.id}`}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge texto={item.tipo || "TIPO"} cor="yellow" />
                  <Badge texto="CONSULTA OPERACIONAL" cor="blue" />
                  <Badge
                    texto={item.resultado || "EM_DESENVOLVIMENTO"}
                    cor="slate"
                  />
                </div>

                <p className="font-bold text-white">
                  Consulta: {item.consulta}
                </p>

                <p className="text-slate-300 mt-2">
                  Motivo: {item.motivo || "-"}
                </p>

                <p className="text-xs text-slate-500 mt-3">
                  {item.criado_em
                    ? new Date(item.criado_em).toLocaleString("pt-BR")
                    : "-"}
                </p>
              </div>
            ))}
          </div>
        )}
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Registros de Auditoria
        </h2>

        {carregando ? (
          <p className="text-slate-400">Carregando auditoria...</p>
        ) : logsFiltrados.length === 0 ? (
          <p className="text-slate-400">
            Nenhum registro de auditoria encontrado.
          </p>
        ) : (
          <div className="space-y-3">
            {logsFiltrados.map((item) => (
              <div
                key={`log-${item.id}`}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge texto={item.acao || "AÇÃO"} cor="blue" />
                  <Badge texto={item.modulo || "MÓDULO"} cor="yellow" />
                </div>

                <p className="font-bold text-white">
                  {item.usuario_nome || "Usuário não informado"}
                </p>

                <p className="text-slate-300 mt-2">
                  {item.descricao || "-"}
                </p>

                <p className="text-xs text-slate-500 mt-3">
                  {item.criado_em
                    ? new Date(item.criado_em).toLocaleString("pt-BR")
                    : "-"}
                </p>
              </div>
            ))}
          </div>
        )}
      </SigCard>
    </div>
  );
}

function ResumoCard({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: number;
  icone: any;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 min-h-[110px]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">{titulo}</p>
          <h2 className="text-3xl font-black text-white mt-1">
            {valor}
          </h2>
        </div>

        <Icone className="w-7 h-7 text-blue-400" />
      </div>
    </div>
  );
}
function Badge({
  texto,
  cor,
}: {
  texto: string;
  cor: "blue" | "yellow" | "slate";
}) {
  const cores = {
    blue: "bg-blue-700 text-white",
    yellow: "bg-yellow-700 text-white",
    slate: "bg-slate-700 text-white",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${cores[cor]}`}>
      {texto}
    </span>
  );
}