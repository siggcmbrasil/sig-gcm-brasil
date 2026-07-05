"use client";

import Link from "next/link";
import {
  Brain,
  BookOpenCheck,
  CheckCircle,
  HelpCircle,
  Layers,
  RotateCcw,
  ShieldCheck,
  Star,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

const flashcards = [
  {
    pergunta: "Qual é a Lei Federal do Estatuto Geral das Guardas Municipais?",
    resposta: "Lei Federal nº 13.022/2014.",
    categoria: "Guarda Municipal",
    dificuldade: "Básico",
  },
  {
    pergunta: "O que é flagrante delito?",
    resposta:
      "É a situação em que a pessoa está cometendo, acabou de cometer ou é perseguida logo após a prática do crime.",
    categoria: "Direito Penal",
    dificuldade: "Médio",
  },
  {
    pergunta: "Qual é a função preventiva da Guarda Municipal?",
    resposta:
      "Atuar na proteção de bens, serviços, instalações municipais e colaborar com a segurança pública local.",
    categoria: "Guarda Municipal",
    dificuldade: "Básico",
  },
  {
    pergunta: "O que significa abordagem com fundada suspeita?",
    resposta:
      "É a abordagem baseada em elementos objetivos que indiquem possível prática de infração ou risco à segurança.",
    categoria: "Operacional",
    dificuldade: "Avançado",
  },
];

export default function FlashcardsPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Flashcards Jurídicos"
        subtitulo="Cards rápidos de pergunta e resposta para estudo da Guarda Municipal."
        icone={Layers}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ResumoCard titulo="Flashcards" valor="4" />
        <ResumoCard titulo="Categorias" valor="4" />
        <ResumoCard titulo="Favoritos" valor="0" />
        <ResumoCard titulo="Revisões" valor="0" />
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <BookOpenCheck className="w-9 h-9 text-cyan-400" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-black">
              Estudo Inteligente
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Revise leis e procedimentos em poucos minutos
            </h2>

            <p className="text-slate-400 mt-2 max-w-4xl leading-relaxed">
              Área preparada para estudo rápido com perguntas, respostas,
              revisões, favoritos e futura geração automática de flashcards com
              inteligência artificial.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {flashcards.map((card) => (
          <SigCard key={card.pergunta}>
            <div className="flex items-center justify-between mb-4">
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-300">
                {card.categoria}
              </span>

              <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-300">
                {card.dificuldade}
              </span>
            </div>

            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 min-h-[140px]">
              <p className="text-slate-400 text-xs font-bold mb-2">
                PERGUNTA
              </p>

              <h3 className="text-white font-black">
                {card.pergunta}
              </h3>
            </div>

            <div className="rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-4 mt-3 min-h-[140px]">
              <p className="text-cyan-400 text-xs font-bold mb-2">
                RESPOSTA
              </p>

              <p className="text-slate-200 text-sm">
                {card.resposta}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <button
                type="button"
                disabled
                className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-slate-400 cursor-not-allowed"
              >
                Errei
              </button>

              <button
                type="button"
                disabled
                className="rounded-xl bg-blue-900/60 px-3 py-2 text-xs font-bold text-blue-300 cursor-not-allowed"
              >
                Revisar
              </button>

              <button
                type="button"
                disabled
                className="rounded-xl bg-green-900/60 px-3 py-2 text-xs font-bold text-green-300 cursor-not-allowed"
              >
                Acertei
              </button>
            </div>
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
            <Item texto="Criar flashcard manual" />
            <Item texto="Gerar flashcards com IA" />
            <Item texto="Revisão espaçada" />
            <Item texto="Favoritos" />
            <Item texto="Histórico de acertos" />
            <Item texto="Modo prova rápida" />
            <Item texto="Categorias por lei" />
            <Item texto="Nível de dificuldade" />
          </div>
        </SigCard>

        <SigCard>
          <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Regras do módulo
          </h2>

          <div className="grid gap-3">
            <Regra texto="Todo flashcard deve ter pergunta e resposta objetiva." />
            <Regra texto="Indicar a fonte legal quando possível." />
            <Regra texto="Separar estudo jurídico de orientação jurídica oficial." />
            <Regra texto="Registrar revisão e evolução do usuário futuramente." />
          </div>
        </SigCard>
      </div>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Categorias sugeridas
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          <Categoria icone={<ShieldCheck />} texto="Guarda Municipal" />
          <Categoria icone={<HelpCircle />} texto="Direito Penal" />
          <Categoria icone={<CheckCircle />} texto="CTB" />
          <Categoria icone={<Star />} texto="Operacional" />
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