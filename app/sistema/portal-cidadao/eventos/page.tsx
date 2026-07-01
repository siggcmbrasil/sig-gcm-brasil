"use client";

import {
  CalendarDays,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigButton from "@/components/sig/SigButton";

export default function EventosPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Eventos"
        subtitulo="Agenda de eventos, ações comunitárias e atividades públicas."
        icone={CalendarDays}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card titulo="Eventos" valor="0" icone={<CalendarDays className="w-7 h-7 text-blue-400" />} />
        <Card titulo="Agendados" valor="0" icone={<Clock className="w-7 h-7 text-yellow-400" />} />
        <Card titulo="Em andamento" valor="0" icone={<AlertCircle className="w-7 h-7 text-red-400" />} />
        <Card titulo="Finalizados" valor="0" icone={<CheckCircle className="w-7 h-7 text-green-400" />} />
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <input className="input flex-1" placeholder="Pesquisar evento..." />

          <select className="input md:w-60">
            <option>Todos</option>
            <option>AGENDADO</option>
            <option>EM_ANDAMENTO</option>
            <option>FINALIZADO</option>
            <option>CANCELADO</option>
          </select>

          <SigButton type="gold">
            <Search className="w-4 h-4" />
            Consultar
          </SigButton>

          <SigButton type="blue">
            <Plus className="w-4 h-4" />
            Novo Evento
          </SigButton>
        </div>
      </SigCard>

      <SigCard>
        <div className="text-center py-16">
          <CalendarDays className="w-16 h-16 mx-auto text-slate-600 mb-4" />

          <h2 className="text-xl font-black text-white">
            Nenhum evento cadastrado
          </h2>

          <p className="text-slate-400 mt-2">
            Os eventos cadastrados para o cidadão aparecerão aqui.
          </p>
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Tipos de eventos
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          <Item texto="Palestra educativa" />
          <Item texto="Ação comunitária" />
          <Item texto="Campanha preventiva" />
          <Item texto="Educação no trânsito" />
          <Item texto="Ronda escolar" />
          <Item texto="Evento público" />
          <Item texto="Reunião comunitária" />
          <Item texto="Outras atividades" />
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