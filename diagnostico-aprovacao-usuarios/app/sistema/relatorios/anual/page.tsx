"use client";

import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  FileText,
  ShieldCheck,
} from "lucide-react";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function RelatorioAnualPage() {
  const ano = new Date().getFullYear();

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24">
      <SigPageHeader
        titulo="Relatório Anual"
        subtitulo={`Relatório operacional consolidado do ano de ${ano}.`}
        icone={FileText}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <ResumoCard titulo="Ano" valor={String(ano)} />
        <ResumoCard titulo="Período" valor="12 meses" />
        <ResumoCard titulo="Formato" valor="PDF" />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <SigCard>
          <div className="flex items-center gap-3 mb-4">
            <CalendarDays className="w-8 h-8 text-cyan-400" />

            <h2 className="text-2xl font-black text-white">
              Ano Atual
            </h2>
          </div>

          <p className="text-slate-400 mb-6">
            Gere automaticamente o relatório completo de {ano}, consolidando
            dados operacionais, estatísticos e administrativos.
          </p>

          <Link
            href="/sistema/relatorios/plantao?tipo=anual"
            className="sig-btn-gold inline-flex"
          >
            Gerar Relatório Anual
          </Link>
        </SigCard>

        <SigCard>
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-8 h-8 text-cyan-400" />

            <h2 className="text-2xl font-black text-white">
              Conteúdo do relatório
            </h2>
          </div>

          <div className="grid gap-2">
            <Item texto="Ocorrências do ano" />
            <Item texto="Patrulhamentos do ano" />
            <Item texto="Chamados do ano" />
            <Item texto="Pessoas abordadas" />
            <Item texto="Veículos abordados" />
            <Item texto="Estatísticas gerais" />
            <Item texto="Exportação em PDF" />
          </div>
        </SigCard>
      </div>

      <SigCard>
        <h2 className="text-xl font-black text-white flex items-center gap-2 mb-4">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          Regras do relatório anual
        </h2>

        <div className="grid md:grid-cols-2 gap-3">
          <Regra texto="O relatório deve respeitar o município do usuário logado." />
          <Regra texto="A exportação em PDF deve registrar auditoria." />
          <Regra texto="Dados sensíveis devem aparecer somente para perfis autorizados." />
          <Regra texto="O período anual deve considerar 01/01 até 31/12 do ano selecionado." />
        </div>
      </SigCard>
    </div>
  );
}

function ResumoCard({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <SigCard>
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h2 className="text-3xl font-black text-white mt-2">
        {valor}
      </h2>
    </SigCard>
  );
}

function Item({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3 text-slate-300">
      ✅ {texto}
    </div>
  );
}

function Regra({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl bg-slate-950/70 border border-emerald-500/20 p-4 text-slate-300">
      🛡️ {texto}
    </div>
  );
}