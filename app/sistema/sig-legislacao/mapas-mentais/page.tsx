"use client";

import Link from "next/link";
import {
  Brain,
  FileText,
  Gavel,
  GitBranch,
  Layers3,
  Network,
  Scale,
  ShieldCheck,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

const mapas = [
  {
    titulo: "Estatuto Geral das Guardas Municipais",
    tema: "Lei 13.022/2014",
    descricao: "Organização, competências, princípios e atuação da Guarda.",
    nivel: "Básico",
  },
  {
    titulo: "Código Penal para GCM",
    tema: "Crimes comuns",
    descricao: "Mapa mental com crimes mais recorrentes na atuação municipal.",
    nivel: "Médio",
  },
  {
    titulo: "Código de Trânsito Brasileiro",
    tema: "Fiscalização e infrações",
    descricao: "Resumo visual dos principais pontos do CTB.",
    nivel: "Médio",
  },
  {
    titulo: "Maria da Penha",
    tema: "Proteção à mulher",
    descricao: "Fluxo de atendimento e conceitos essenciais.",
    nivel: "Avançado",
  },
];

export default function MapasMentaisPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Mapas Mentais"
        subtitulo="Resumos visuais para estudar leis, procedimentos e atuação operacional."
        icone={Network}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ResumoCard titulo="Mapas" valor="4" />
        <ResumoCard titulo="Temas" valor="4" />
        <ResumoCard titulo="Favoritos" valor="0" />
        <ResumoCard titulo="Com IA" valor="Em breve" />
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <GitBranch className="w-9 h-9 text-cyan-400" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-black">
              Estudo Visual
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Organize o conteúdo jurídico em blocos fáceis de memorizar
            </h2>

            <p className="text-slate-400 mt-2 max-w-4xl leading-relaxed">
              Área preparada para mapas mentais de leis, procedimentos,
              protocolos, operações e materiais de capacitação da Guarda
              Municipal.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {mapas.map((mapa) => (
          <SigCard key={mapa.titulo}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Network className="w-7 h-7 text-cyan-400" />
              </div>

              <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-300">
                {mapa.nivel}
              </span>
            </div>

            <h3 className="text-lg font-black text-white">
              {mapa.titulo}
            </h3>

            <p className="text-cyan-400 text-xs font-bold mt-2">
              {mapa.tema}
            </p>

            <p className="text-slate-400 text-sm mt-3">
              {mapa.descricao}
            </p>

            <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4">
              <div className="flex items-center justify-center">
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-black text-cyan-300">
                  TEMA CENTRAL
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <Bloco texto="Conceito" />
                <Bloco texto="Base legal" />
                <Bloco texto="Aplicação" />
                <Bloco texto="Exemplo" />
              </div>
            </div>

            <button
              type="button"
              disabled
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-800 px-4 py-3 font-bold text-slate-400 cursor-not-allowed"
            >
              Abrir em breve
            </button>
          </SigCard>
        ))}
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <SigCard>
          <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <Brain className="w-6 h-6 text-cyan-400" />
            Funcionalidades previstas
          </h2>

          <div className="grid md:grid-cols-2 gap-3">
            <Item texto="Criar mapa mental manual" />
            <Item texto="Gerar mapa mental com IA" />
            <Item texto="Exportar em PDF" />
            <Item texto="Favoritos" />
            <Item texto="Mapas por categoria" />
            <Item texto="Modo estudo" />
            <Item texto="Vínculo com flashcards" />
            <Item texto="Material para concursos" />
          </div>
        </SigCard>

        <SigCard>
          <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Regras do módulo
          </h2>

          <div className="grid gap-3">
            <Regra texto="Todo mapa mental deve indicar tema e base legal." />
            <Regra texto="Separar conteúdo de estudo de parecer jurídico oficial." />
            <Regra texto="Identificar conteúdo gerado por IA quando aplicável." />
            <Regra texto="Permitir revisão futura quando a legislação mudar." />
          </div>
        </SigCard>
      </div>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Categorias sugeridas
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          <Categoria icone={<ShieldCheck />} texto="Guarda Municipal" />
          <Categoria icone={<Gavel />} texto="Direito Penal" />
          <Categoria icone={<Scale />} texto="Constitucional" />
          <Categoria icone={<FileText />} texto="CTB" />
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
      <h2 className="text-4xl font-black text-white mt-2">{valor}</h2>
      <p className="text-slate-500 text-xs mt-1">Em estruturação</p>
    </SigCard>
  );
}

function Bloco({ texto }: { texto: string }) {
  return (
    <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-3 text-center text-xs font-bold text-cyan-300">
      {texto}
    </div>
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
    <div className="rounded-2xl bg-slate-950/70 border border-emerald-500/20 p-4 text-slate-300">
      🛡️ {texto}
    </div>
  );
}

function Categoria({
  icone,
  texto,
}: {
  icone: React.ReactNode;
  texto: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-950/70 border border-cyan-500/20 p-4 text-slate-300 font-bold flex items-center gap-3">
      <span className="text-cyan-400 [&>svg]:w-5 [&>svg]:h-5">
        {icone}
      </span>
      {texto}
    </div>
  );
}