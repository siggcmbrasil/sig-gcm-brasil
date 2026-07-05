"use client";

import Link from "next/link";
import {
  AudioLines,
  BookOpen,
  Brain,
  Headphones,
  Mic,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  Volume2,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

const audios = [
  {
    titulo: "Estatuto Geral das Guardas Municipais",
    descricao: "Lei Federal nº 13.022/2014 em formato de áudio.",
    categoria: "Guarda Municipal",
    duracao: "Em breve",
  },
  {
    titulo: "Código de Trânsito Brasileiro",
    descricao: "Artigos importantes para atuação operacional.",
    categoria: "Trânsito",
    duracao: "Em breve",
  },
  {
    titulo: "Código Penal",
    descricao: "Crimes mais recorrentes na rotina da Guarda Municipal.",
    categoria: "Penal",
    duracao: "Em breve",
  },
  {
    titulo: "Maria da Penha",
    descricao: "Orientações legais sobre violência doméstica.",
    categoria: "Proteção",
    duracao: "Em breve",
  },
];

export default function LegislacaoAudioPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Legislação em Áudio"
        subtitulo="Ouça leis, artigos, resumos jurídicos e conteúdos de estudo operacional."
        icone={AudioLines}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ResumoCard titulo="Áudios" valor="0" />
        <ResumoCard titulo="Categorias" valor="4" />
        <ResumoCard titulo="Favoritos" valor="0" />
        <ResumoCard titulo="Em produção" valor="4" />
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Headphones className="w-9 h-9 text-cyan-400" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-black">
              Biblioteca Jurídica Sonora
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Estudo por áudio para plantão, deslocamento e capacitação
            </h2>

            <p className="text-slate-400 mt-2 max-w-4xl leading-relaxed">
              Área preparada para transformar legislações, resumos e conteúdos
              jurídicos em áudio, facilitando o estudo dos guardas municipais
              durante a rotina operacional.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {audios.map((item) => (
          <SigCard key={item.titulo}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Volume2 className="w-7 h-7 text-cyan-400" />
              </div>

              <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-300">
                {item.duracao}
              </span>
            </div>

            <h3 className="text-lg font-black text-white">
              {item.titulo}
            </h3>

            <p className="text-slate-400 text-sm mt-2">
              {item.descricao}
            </p>

            <p className="text-cyan-400 text-xs font-bold mt-3">
              {item.categoria}
            </p>

            <button
              type="button"
              disabled
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-800 px-4 py-3 font-bold text-slate-400 cursor-not-allowed"
            >
              <PlayCircle className="w-5 h-5" />
              Ouvir em breve
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
            <Item texto="Gerar áudio de leis" />
            <Item texto="Resumos narrados pela IA" />
            <Item texto="Playlist por categoria" />
            <Item texto="Favoritos" />
            <Item texto="Histórico de reprodução" />
            <Item texto="Modo offline futuro" />
            <Item texto="Velocidade de reprodução" />
            <Item texto="Marcação de artigo importante" />
          </div>
        </SigCard>

        <SigCard>
          <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Regras do módulo
          </h2>

          <div className="grid gap-3">
            <Regra texto="Usar apenas conteúdo legal autorizado ou de domínio público." />
            <Regra texto="Identificar lei, artigo, fonte e data de atualização." />
            <Regra texto="Separar áudio de estudo de orientação jurídica oficial." />
            <Regra texto="Registrar uso de IA quando o resumo for gerado automaticamente." />
          </div>
        </SigCard>
      </div>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Próximas categorias de áudio
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          <Categoria icone={<BookOpen />} texto="Leis Federais" />
          <Categoria icone={<ShieldCheck />} texto="Guarda Municipal" />
          <Categoria icone={<Mic />} texto="Resumos Narrados" />
          <Categoria icone={<PauseCircle />} texto="Aulas Curtas" />
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