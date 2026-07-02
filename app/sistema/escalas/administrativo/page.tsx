"use client";

import Link from "next/link";
import {
  Building2,
  CalendarDays,
  Clock,
  Plus,
  Settings,
  Users,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigActionCard from "@/components/sig/SigActionCard";

export default function EscalasAdministrativasPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Escalas Administrativas"
        subtitulo="Gestão de expedientes administrativos, horários fixos e escalas personalizadas."
        icone={Building2}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Resumo titulo="Servidores" valor="0" icone={Users} />
        <Resumo titulo="Expedientes" valor="0" icone={Clock} />
        <Resumo titulo="Escalas" valor="0" icone={CalendarDays} />
        <Resumo titulo="Modelos" valor="0" icone={Settings} />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <SigActionCard
          href="/sistema/escalas/administrativo/nova"
          titulo="Nova Escala"
          descricao="Cadastrar expediente administrativo."
          icone={Plus}
        />

        <SigActionCard
          href="/sistema/escalas/modelos"
          titulo="Modelos de Escala"
          descricao="Usar modelos administrativos já configurados."
          icone={Settings}
        />

        <SigActionCard
          href="/sistema/escalas/mapa-efetivo"
          titulo="Mapa de Efetivo"
          descricao="Ver servidores disponíveis, escalados e afastados."
          icone={Users}
        />
      </div>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Escalas Administrativas
        </h2>

        <div className="text-center py-14">
          <Building2 className="w-16 h-16 mx-auto text-slate-600 mb-4" />

          <h3 className="text-xl font-black text-white">
            Nenhuma escala administrativa cadastrada
          </h3>

          <p className="text-slate-400 mt-2 max-w-2xl mx-auto">
            As escalas administrativas servirão para controlar expediente,
            horários fixos, setores, servidores administrativos e escalas
            diferenciadas.
          </p>

          <Link
            href="/sistema/escalas/administrativo/nova"
            className="btn-primary inline-flex items-center gap-2 mt-6"
          >
            <Plus className="w-5 h-5" />
            Cadastrar primeira escala
          </Link>
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Funcionalidades previstas
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          <Item texto="Expediente 08h às 14h" />
          <Item texto="Expediente 08h às 17h" />
          <Item texto="Setor administrativo" />
          <Item texto="Servidor responsável" />
          <Item texto="Controle de folgas" />
          <Item texto="Férias e licenças" />
          <Item texto="Escala semanal" />
          <Item texto="Escala mensal" />
        </div>
      </SigCard>
    </div>
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
      <Icone className="w-7 h-7 text-cyan-400 mb-3" />
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h2 className="text-3xl font-black text-white mt-1">{valor}</h2>
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