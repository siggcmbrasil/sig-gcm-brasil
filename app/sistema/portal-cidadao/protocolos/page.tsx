"use client";

import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Eye,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigButton from "@/components/sig/SigButton";

export default function ProtocolosPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Protocolos"
        subtitulo="Consulta e acompanhamento de protocolos do cidadão."
        icone={FileText}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card titulo="Protocolos" valor="0" icone={<FileText className="w-7 h-7 text-blue-400" />} />
        <Card titulo="Pendentes" valor="0" icone={<Clock className="w-7 h-7 text-yellow-400" />} />
        <Card titulo="Em Análise" valor="0" icone={<AlertCircle className="w-7 h-7 text-red-400" />} />
        <Card titulo="Finalizados" valor="0" icone={<CheckCircle className="w-7 h-7 text-green-400" />} />
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <input className="input flex-1" placeholder="Pesquisar por número de protocolo..." />

          <select className="input md:w-60">
            <option>Todos</option>
            <option>PENDENTE</option>
            <option>EM_ANALISE</option>
            <option>FINALIZADO</option>
            <option>ARQUIVADO</option>
          </select>

          <SigButton type="gold">
            <Search className="w-4 h-4" />
            Consultar
          </SigButton>

          <SigButton type="blue">
            <Eye className="w-4 h-4" />
            Ver Detalhes
          </SigButton>
        </div>
      </SigCard>

      <SigCard>
        <div className="text-center py-16">
          <FileText className="w-16 h-16 mx-auto text-slate-600 mb-4" />

          <h2 className="text-xl font-black text-white">
            Nenhum protocolo encontrado
          </h2>

          <p className="text-slate-400 mt-2">
            Os protocolos gerados pelo Portal do Cidadão aparecerão aqui.
          </p>
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Tipos de origem
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          <Item texto="Denúncia" />
          <Item texto="Ouvidoria" />
          <Item texto="Solicitação" />
          <Item texto="Contato cidadão" />
          <Item texto="Evento" />
          <Item texto="Serviço público" />
          <Item texto="Protocolo interno" />
          <Item texto="Outros" />
        </div>
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
  valor: string;
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

function Item({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 text-slate-200">
      {texto}
    </div>
  );
}