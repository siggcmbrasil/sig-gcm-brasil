"use client";

import Link from "next/link";
import {
  Star,
  CalendarDays,
  Plus,
  Users,
  Clock,
  ClipboardList,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigActionCard from "@/components/sig/SigActionCard";
import ProtecaoModulo from "@/components/ProtecaoModulo";

export default function EscalasExtrasPage() {
  return (
    <ProtecaoModulo modulo="escalas_extras">
      <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Escalas Extras"
        subtitulo="Gestão de serviços extraordinários, eventos e convocações."
        icone={Star}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Resumo titulo="Serviços Extras" valor="0" icone={CalendarDays} />
        <Resumo titulo="Convocações" valor="0" icone={Users} />
        <Resumo titulo="Horas Extras" valor="0" icone={Clock} />
        <Resumo titulo="Eventos" valor="0" icone={ClipboardList} />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <SigActionCard
          href="/sistema/escalas/extras/nova"
          titulo="Novo Serviço Extra"
          descricao="Cadastrar um serviço extraordinário."
          icone={Plus}
        />

        <SigActionCard
          href="/sistema/escalas/extras"
          titulo="Histórico"
          descricao="Consultar serviços extras anteriores."
          icone={ClipboardList}
        />

        <SigActionCard
          href="/sistema/escalas/mapa-efetivo"
          titulo="Mapa de Efetivo"
          descricao="Visualizar efetivo disponível."
          icone={Users}
        />
      </div>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Serviços Extraordinários
        </h2>

        <div className="text-center py-14">
          <Star className="w-16 h-16 mx-auto text-slate-600 mb-4" />

          <h3 className="text-xl font-black text-white">
            Nenhum serviço extra cadastrado
          </h3>

          <p className="text-slate-400 mt-2 max-w-2xl mx-auto">
            Cadastre serviços extraordinários, eventos municipais,
            reforço operacional, convocações e jornadas extras.
          </p>

          <Link
            href="/sistema/escalas/extras/nova"
            className="btn-primary inline-flex items-center gap-2 mt-6"
          >
            <Plus className="w-5 h-5" />
            Cadastrar primeiro serviço
          </Link>
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Funcionalidades previstas
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          <Item texto="Eventos municipais" />
          <Item texto="Horas extras" />
          <Item texto="Convocações" />
          <Item texto="Operações especiais" />
          <Item texto="Controle de efetivo" />
          <Item texto="Banco de horas" />
          <Item texto="Histórico completo" />
          <Item texto="Relatórios de serviço extra" />
        </div>
      </SigCard>
          </div>
    </ProtecaoModulo>
  );
}

function Resumo({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: string;
  icone: any;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <Icone className="w-7 h-7 text-yellow-400 mb-3" />
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h2 className="text-3xl font-black text-white mt-1">{valor}</h2>
    </div>
  );
}

function Item({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-slate-200">
      {texto}
    </div>
  );
}