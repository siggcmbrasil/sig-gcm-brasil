"use client";

import Link from "next/link";
import {
  Award,
  Brain,
  CheckCircle,
  ClipboardCheck,
  FileQuestion,
  HelpCircle,
  ListChecks,
  ShieldCheck,
  Timer,
  XCircle,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

const questoes = [
  {
    pergunta:
      "De acordo com a Lei Federal nº 13.022/2014, a Guarda Municipal é instituição de caráter:",
    alternativas: [
      "Civil, uniformizada e armada, conforme previsto em lei.",
      "Militar, subordinada à Polícia Militar.",
      "Judicial, vinculada ao Ministério Público.",
      "Privada, de segurança patrimonial terceirizada.",
    ],
    correta: "A",
    categoria: "Guarda Municipal",
    dificuldade: "Básico",
  },
  {
    pergunta:
      "Qual princípio deve orientar a atuação da Guarda Municipal no contato com o cidadão?",
    alternativas: [
      "Uso progressivo da força e respeito aos direitos fundamentais.",
      "Atuação sem registro quando a ocorrência for simples.",
      "Prioridade exclusiva à proteção de prédios.",
      "Substituição total das polícias estaduais.",
    ],
    correta: "A",
    categoria: "Operacional",
    dificuldade: "Médio",
  },
  {
    pergunta:
      "No atendimento de ocorrência com vítima, uma das primeiras providências recomendadas é:",
    alternativas: [
      "Preservar o local e acionar o apoio necessário.",
      "Liberar todos os envolvidos sem registro.",
      "Retirar objetos do local para facilitar a limpeza.",
      "Divulgar imagens da vítima em redes sociais.",
    ],
    correta: "A",
    categoria: "Procedimento",
    dificuldade: "Básico",
  },
];

export default function QuestoesPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Banco de Questões"
        subtitulo="Questões objetivas para estudo, capacitação e preparação para concursos."
        icone={FileQuestion}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ResumoCard titulo="Questões" valor="3" />
        <ResumoCard titulo="Categorias" valor="3" />
        <ResumoCard titulo="Simulados" valor="0" />
        <ResumoCard titulo="Acertos" valor="0%" />
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <ClipboardCheck className="w-9 h-9 text-cyan-400" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-black">
              Treinamento e Capacitação
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Questões para fixar legislação e prática operacional
            </h2>

            <p className="text-slate-400 mt-2 max-w-4xl leading-relaxed">
              Área preparada para banco de questões, simulados, estatísticas de
              desempenho e geração automática de perguntas pela inteligência
              artificial.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="space-y-4">
        {questoes.map((q, index) => (
          <SigCard key={q.pergunta}>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
              <div>
                <p className="text-cyan-400 text-xs font-black uppercase tracking-widest">
                  Questão {index + 1}
                </p>

                <h3 className="text-xl font-black text-white mt-2">
                  {q.pergunta}
                </h3>
              </div>

              <div className="flex gap-2 flex-wrap">
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-300">
                  {q.categoria}
                </span>

                <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-300">
                  {q.dificuldade}
                </span>
              </div>
            </div>

            <div className="grid gap-3">
              {q.alternativas.map((alt, i) => {
                const letra = ["A", "B", "C", "D"][i];

                return (
                  <div
                    key={alt}
                    className={`rounded-2xl border p-4 text-sm font-semibold ${
                      letra === q.correta
                        ? "border-green-500/30 bg-green-500/10 text-green-300"
                        : "border-slate-800 bg-slate-950/70 text-slate-300"
                    }`}
                  >
                    <span className="font-black mr-2">{letra})</span>
                    {alt}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
              <p className="text-green-300 font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Gabarito: alternativa {q.correta}
              </p>
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
            <Item texto="Cadastrar questões" />
            <Item texto="Gerar questões com IA" />
            <Item texto="Criar simulados" />
            <Item texto="Cronômetro de prova" />
            <Item texto="Ranking de desempenho" />
            <Item texto="Comentários por questão" />
            <Item texto="Filtro por categoria" />
            <Item texto="Estatística de acertos" />
          </div>
        </SigCard>

        <SigCard>
          <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Regras do módulo
          </h2>

          <div className="grid gap-3">
            <Regra texto="Toda questão deve possuir gabarito correto." />
            <Regra texto="Informar categoria, dificuldade e fonte quando possível." />
            <Regra texto="Separar conteúdo de estudo de orientação jurídica oficial." />
            <Regra texto="Identificar questões geradas por IA quando aplicável." />
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
          <Categoria icone={<ListChecks />} texto="CTB" />
          <Categoria icone={<Timer />} texto="Simulados" />
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