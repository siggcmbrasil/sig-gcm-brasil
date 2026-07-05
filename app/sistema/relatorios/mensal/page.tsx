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

export default function RelatorioMensalPage() {
  const hoje = new Date();

  const mes = hoje.toLocaleString("pt-BR", {
    month: "long",
  });

  const ano = hoje.getFullYear();

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24">
      <SigPageHeader
        titulo="Relatório Mensal"
        subtitulo={`Relatório operacional consolidado de ${mes} de ${ano}.`}
        icone={CalendarDays}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <ResumoCard titulo="Mês" valor={mes} />
        <ResumoCard titulo="Ano" valor={String(ano)} />
        <ResumoCard titulo="Formato" valor="PDF" />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <SigCard>
          <div className="flex items-center gap-3 mb-4">
            <CalendarDays className="w-8 h-8 text-cyan-400" />

            <h2 className="text-2xl font-black text-white">
              Mês Atual
            </h2>
          </div>

          <p className="text-slate-400 mb-6">
            Gere automaticamente o relatório completo do mês atual,
            consolidando dados operacionais e estatísticos.
          </p>

          <Link
            href="/sistema/relatorios/plantao?tipo=mensal"
            className="sig-btn-gold inline-flex"
          >
            Gerar Relatório Mensal
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
            <Item texto="Ocorrências do mês" />
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
          Indicadores do Mês
        </h2>

        <div className="grid md:grid-cols-2 gap-3">
          <Item texto="Gráfico de ocorrências por dia" />
          <Item texto="Bairros com mais atendimentos" />
          <Item texto="Guardas mais ativos" />
          <Item texto="Viaturas mais utilizadas" />
          <Item texto="Consumo de combustível" />
          <Item texto="Comparativo com o mês anterior" />
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white flex items-center gap-2 mb-4">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          Regras do relatório mensal
        </h2>

        <div className="grid md:grid-cols-2 gap-3">
          <Regra texto="O relatório deve respeitar o município do usuário logado." />
          <Regra texto="A exportação em PDF deve registrar auditoria." />
          <Regra texto="Dados sensíveis devem aparecer somente para perfis autorizados." />
          <Regra texto="O período mensal deve considerar o primeiro e o último dia do mês." />
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
      <h2 className="text-3xl font-black text-white mt-2 capitalize">
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