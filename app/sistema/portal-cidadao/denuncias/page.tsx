"use client";

import {
  MessageSquareWarning,
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigButton from "@/components/sig/SigButton";

export default function DenunciasPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Denúncias"
        subtitulo="Recebimento e acompanhamento de denúncias da população."
        icone={MessageSquareWarning}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          titulo="Total"
          valor="0"
          icone={<MessageSquareWarning className="w-7 h-7 text-red-400" />}
        />

        <Card
          titulo="Pendentes"
          valor="0"
          icone={<Clock className="w-7 h-7 text-yellow-400" />}
        />

        <Card
          titulo="Em Atendimento"
          valor="0"
          icone={<AlertTriangle className="w-7 h-7 text-blue-400" />}
        />

        <Card
          titulo="Concluídas"
          valor="0"
          icone={<CheckCircle className="w-7 h-7 text-green-400" />}
        />
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            className="input flex-1"
            placeholder="Pesquisar denúncia..."
          />

          <select className="input md:w-60">
            <option>Todas</option>
            <option>PENDENTE</option>
            <option>EM_ATENDIMENTO</option>
            <option>CONCLUIDA</option>
            <option>ARQUIVADA</option>
          </select>

          <SigButton type="gold">
            <Search className="w-4 h-4" />
            Consultar
          </SigButton>

          <SigButton type="blue">
            <Plus className="w-4 h-4" />
            Nova Denúncia
          </SigButton>
        </div>
      </SigCard>

      <SigCard>
        <div className="text-center py-16">
          <MessageSquareWarning className="w-16 h-16 mx-auto text-slate-600 mb-4" />

          <h2 className="text-xl font-black text-white">
            Nenhuma denúncia cadastrada
          </h2>

          <p className="text-slate-400 mt-2">
            As denúncias recebidas pelo Portal do Cidadão aparecerão aqui.
          </p>
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Funcionalidades previstas
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          <Item texto="Denúncia anônima" />
          <Item texto="Envio de fotos" />
          <Item texto="Envio de vídeos" />
          <Item texto="Geolocalização automática" />
          <Item texto="Classificação por prioridade" />
          <Item texto="Protocolo automático" />
          <Item texto="Acompanhamento pelo cidadão" />
          <Item texto="Encaminhamento para guarnição" />
          <Item texto="Notificações em tempo real" />
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