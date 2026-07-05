"use client";

import Link from "next/link";
import {
  Brain,
  Clock,
  FileQuestion,
  PlayCircle,
  Trophy,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function SimuladosPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Simulados"
        subtitulo="Treinamento, provas e preparação para concursos e capacitações."
        icone={FileQuestion}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Resumo titulo="Simulados" valor="0" />
        <Resumo titulo="Questões" valor="0" />
        <Resumo titulo="Acertos" valor="0%" />
        <Resumo titulo="Ranking" valor="--" />
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row gap-5 md:items-center">
          <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Brain className="w-9 h-9 text-cyan-400" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-black">
              Capacitação
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Sistema de Simulados
            </h2>

            <p className="text-slate-400 mt-2 max-w-4xl">
              Área preparada para realização de provas, simulados,
              concursos internos, treinamentos e avaliações.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card
          titulo="Novo Simulado"
          descricao="Criar um novo simulado."
          icone={<PlayCircle className="w-8 h-8 text-green-400" />}
        />

        <Card
          titulo="Questões"
          descricao="Banco de questões."
          icone={<FileQuestion className="w-8 h-8 text-blue-400" />}
        />

        <Card
          titulo="Resultados"
          descricao="Estatísticas e desempenho."
          icone={<BarChart3 className="w-8 h-8 text-yellow-400" />}
        />

        <Card
          titulo="Ranking"
          descricao="Classificação dos participantes."
          icone={<Trophy className="w-8 h-8 text-orange-400" />}
        />
      </div>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Funcionalidades Previstas
        </h2>

        <div className="grid md:grid-cols-2 gap-3">
          <Item texto="Simulado cronometrado" />
          <Item texto="Correção automática" />
          <Item texto="Geração de PDF" />
          <Item texto="Ranking de desempenho" />
          <Item texto="Simulados por categoria" />
          <Item texto="Questões aleatórias" />
          <Item texto="Estatísticas de acertos" />
          <Item texto="Simulados gerados por IA" />
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-cyan-400" />
          Regras do Módulo
        </h2>

        <div className="space-y-3">
          <Regra texto="Registrar tempo de prova." />
          <Regra texto="Salvar histórico de resultados." />
          <Regra texto="Permitir geração de certificados." />
          <Regra texto="Auditar todas as tentativas." />
        </div>
      </SigCard>

      <Link
        href="/sistema/legislacao"
        className="inline-flex items-center justify-center rounded-2xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-600"
      >
        Voltar para SIG Legislação
      </Link>
    </div>
  );
}

function Resumo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <SigCard>
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h2 className="text-4xl font-black text-white mt-2">
        {valor}
      </h2>
    </SigCard>
  );
}

function Card({
  titulo,
  descricao,
  icone,
}: {
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
}) {
  return (
    <SigCard>
      {icone}

      <h3 className="text-lg font-black text-white mt-4">
        {titulo}
      </h3>

      <p className="text-slate-400 text-sm mt-2">
        {descricao}
      </p>
    </SigCard>
  );
}

function Item({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 text-slate-300 font-semibold">
      ✅ {texto}
    </div>
  );
}

function Regra({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl bg-slate-950/70 border border-cyan-500/20 p-4 text-slate-300">
      🛡️ {texto}
    </div>
  );
}