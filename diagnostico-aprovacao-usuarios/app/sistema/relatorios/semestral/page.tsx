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

export default function RelatorioSemestralPage() {
  const hoje = new Date();
  const ano = hoje.getFullYear();

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24">
      <SigPageHeader
        titulo="Relatório Semestral"
        subtitulo={`Relatório operacional consolidado do semestre de ${ano}.`}
        icone={CalendarDays}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <ResumoCard titulo="Ano" valor={String(ano)} />
        <ResumoCard titulo="Período" valor="6 meses" />
        <ResumoCard titulo="Formato" valor="PDF" />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <SigCard>
          <div className="flex items-center gap-3 mb-4">
            <CalendarDays className="w-8 h-8 text-cyan-400" />

            <h2 className="text-2xl font-black text-white">
              Semestre Atual
            </h2>
          </div>

          <p className="text-slate-400 mb-6">
            Gere automaticamente o relatório completo dos últimos seis meses,
            consolidando dados operacionais e estatísticos.
          </p>

          <Link
            href="/sistema/relatorios/plantao?tipo=semestral"
            className="sig-btn-gold inline-flex"
          >
            Gerar Relatório Semestral
          </Link>
        </SigCard>

        <SigCard>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-cyan-400" />

            <h2 className="text-2xl font-black text-white">
              Conteúdo do relatório
            </h2>
          </div>

          <div className="grid gap-2">
            <Item texto="Ocorrências do semestre" />
            <Item texto="Patrulhamentos" />
            <Item texto="Chamados" />
            <Item texto="Pessoas abordadas" />
            <Item texto="Veículos abordados" />
            <Item texto="Abastecimentos" />
            <Item texto="Estatísticas gerais" />
            <Item texto="Exportação em PDF" />
          </div>
        </SigCard>
      </div>

      <SigCard>
        <h2 className="text-xl font-black text-white flex items-center gap-2 mb-4">
          <BarChart3 className="w-6 h-6 text-cyan-400" />
          Indicadores Semestrais
        </h2>

        <div className="grid md:grid-cols-2 gap-3">
          <Item texto="Comparativo entre meses" />
          <Item texto="Evolução das ocorrências" />
          <Item texto="Bairros com maior demanda" />
          <Item texto="Produtividade operacional" />
          <Item texto="Consumo de combustível" />
          <Item texto="Comparativo com semestre anterior" />
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white flex items-center gap-2 mb-4">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          Regras do relatório semestral
        </h2>

        <div className="grid md:grid-cols-2 gap-3">
          <Regra texto="O relatório deve respeitar o município do usuário logado." />
          <Regra texto="A exportação em PDF deve registrar auditoria." />
          <Regra texto="Dados sensíveis devem aparecer somente para perfis autorizados." />
          <Regra texto="O período semestral deve considerar seis meses consecutivos." />
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