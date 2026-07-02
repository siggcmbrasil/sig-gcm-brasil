"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigButton from "@/components/sig/SigButton";

export default function ProtocolosPage() {
  const [protocolos, setProtocolos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("TODOS");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);

    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
    const municipioId = usuario.municipio_id;

    const [denuncias, ouvidorias, solicitacoes] = await Promise.all([
      supabase
        .from("denuncias_cidadao")
        .select("id, protocolo, tipo, status, criado_em, local")
        .eq("municipio_id", municipioId),

      supabase
        .from("ouvidoria_cidadao")
        .select("id, protocolo, tipo, status, criado_em, assunto")
        .eq("municipio_id", municipioId),

      supabase
        .from("solicitacoes_cidadao")
        .select("id, protocolo, tipo, status, criado_em, local")
        .eq("municipio_id", municipioId),
    ]);

    const lista = [
      ...(denuncias.data || []).map((item) => ({
        ...item,
        origem: "Denúncia",
        descricao: item.local || "Sem local informado",
      })),
      ...(ouvidorias.data || []).map((item) => ({
        ...item,
        origem: "Ouvidoria",
        descricao: item.assunto || "Sem assunto",
      })),
      ...(solicitacoes.data || []).map((item) => ({
        ...item,
        origem: "Solicitação",
        descricao: item.local || "Sem local informado",
      })),
    ].sort(
      (a, b) =>
        new Date(b.criado_em).getTime() -
        new Date(a.criado_em).getTime()
    );

    setProtocolos(lista);
    setCarregando(false);
  }

  const filtrados = useMemo(() => {
    return protocolos.filter((p) => {
      const porStatus = status === "TODOS" || p.status === status;

      const termo = busca.toLowerCase().trim();
      const porBusca =
        !termo ||
        p.protocolo?.toLowerCase().includes(termo) ||
        p.tipo?.toLowerCase().includes(termo) ||
        p.origem?.toLowerCase().includes(termo);

      return porStatus && porBusca;
    });
  }, [protocolos, busca, status]);

  const pendentes = protocolos.filter((p) => p.status === "PENDENTE").length;
  const analise = protocolos.filter((p) => p.status === "EM_ANALISE").length;
  const finalizados = protocolos.filter((p) =>
    ["FINALIZADO", "CONCLUIDA", "CONCLUIDO", "ATENDIDA", "RESPONDIDO"].includes(
      p.status
    )
  ).length;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Protocolos"
        subtitulo="Consulta e acompanhamento de protocolos do cidadão."
        icone={FileText}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card titulo="Protocolos" valor={protocolos.length} icone={<FileText className="w-7 h-7 text-blue-400" />} />
        <Card titulo="Pendentes" valor={pendentes} icone={<Clock className="w-7 h-7 text-yellow-400" />} />
        <Card titulo="Em Análise" valor={analise} icone={<AlertCircle className="w-7 h-7 text-red-400" />} />
        <Card titulo="Finalizados" valor={finalizados} icone={<CheckCircle className="w-7 h-7 text-green-400" />} />
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            className="input flex-1"
            placeholder="Pesquisar por protocolo, tipo ou origem..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="input md:w-60"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="TODOS">Todos</option>
            <option value="PENDENTE">Pendente</option>
            <option value="EM_ANALISE">Em análise</option>
            <option value="ATENDIDA">Atendida</option>
            <option value="RESPONDIDO">Respondido</option>
            <option value="CONCLUIDA">Concluída</option>
            <option value="ARQUIVADO">Arquivado</option>
          </select>

          <SigButton type="gold" onClick={carregar}>
            <Search className="w-4 h-4" />
            Consultar
          </SigButton>
        </div>
      </SigCard>

      <SigCard>
        {carregando ? (
          <p className="text-slate-400">Carregando protocolos...</p>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h2 className="text-xl font-black text-white">
              Nenhum protocolo encontrado
            </h2>
            <p className="text-slate-400 mt-2">
              Os protocolos gerados pelo Portal do Cidadão aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map((p) => (
              <div
                key={`${p.origem}-${p.id}`}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="text-white font-black">
                      {p.protocolo || "Sem protocolo"}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {p.origem} • {p.tipo || "Sem tipo"} • {p.descricao}
                    </p>
                  </div>

                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold text-slate-300">
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SigCard>
    </div>
  );
}

function Card({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: number;
  icone: React.ReactNode;
}) {
  return (
    <div className="painel-premium p-5">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-slate-400 text-sm">{titulo}</p>
          <h2 className="text-3xl font-black text-white">{valor}</h2>
        </div>
        {icone}
      </div>
    </div>
  );
}