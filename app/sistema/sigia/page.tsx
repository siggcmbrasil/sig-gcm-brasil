"use client";

import {
  BookOpen,
  Bot,
  Brain,
  CreditCard,
  FileClock,
  FileText,
  Gavel,
  Search,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import SIGIAChat from "@/components/sigia/SIGIAChat";
import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";
import SigCard from "@/components/sig/SigCard";

const modulos = [
  {
    titulo: "IA Operacional",
    href: "/sistema/ia",
    descricao: "Apoio em ocorrências, patrulhamento e rotina de plantão.",
    icone: ShieldCheck,
  },
  {
    titulo: "IA Jurídica",
    href: "/sistema/ia-juridica",
    descricao: "Consulta legislação, artigos e fundamentos jurídicos.",
    icone: Gavel,
  },
  {
    titulo: "IA Legislativa",
    href: "/sistema/legislacao/ia",
    descricao: "Apoio inteligente para leis, normas e atos municipais.",
    icone: Scale,
  },
  {
    titulo: "Biblioteca Inteligente",
    href: "/sistema/sigia/biblioteca",
    descricao: "Consulta PDFs, POPs, manuais e materiais internos.",
    icone: BookOpen,
  },
  {
    titulo: "Busca Inteligente",
    href: "/sistema/busca",
    descricao: "Pesquisa unificada em ocorrências, pessoas, veículos e documentos.",
    icone: Search,
  },
  {
    titulo: "Relatórios Inteligentes",
    href: "/sistema/sigia/relatorios",
    descricao: "Geração de resumos e documentos operacionais com IA.",
    icone: FileText,
  },
  {
    titulo: "Créditos IA",
    href: "/sistema/ia-creditos",
    descricao: "Controle de saldo e consumo das inteligências artificiais.",
    icone: CreditCard,
  },
  {
    titulo: "Histórico IA",
    href: "/sistema/auditoria",
    descricao: "Auditoria das consultas e interações realizadas com IA.",
    icone: FileClock,
  },
];

export default function SIGIAPage() {
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="SIGIA"
        descricao="Central oficial de inteligência artificial do SIG-GCM Brasil."
        icone={Bot}
      />

      <SigCard>
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Brain className="w-9 h-9 text-cyan-400" />
          </div>

          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-bold">
              Inteligência Artificial
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Central SIGIA
            </h2>

            <p className="text-slate-400 mt-2 max-w-3xl leading-relaxed">
              O SIGIA concentra todas as funções de inteligência artificial:
              apoio operacional, jurídico, legislativo, busca inteligente,
              biblioteca, relatórios, créditos e histórico de uso.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Resumo titulo="Módulos IA" valor="8" icone={Sparkles} cor="cyan" />
        <Resumo titulo="Operacional" valor="Ativo" icone={ShieldCheck} cor="green" />
        <Resumo titulo="Jurídico" valor="Ativo" icone={Gavel} cor="yellow" />
        <Resumo titulo="Auditoria" valor="Logs" icone={FileClock} cor="blue" />
      </div>

      <div>
        <h2 className="text-xl font-black text-white mb-1">
          Módulos Inteligentes
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Acesse as ferramentas de IA disponíveis no SIG-GCM Brasil.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {modulos.map((modulo) => (
            <SigCentralCard
              key={modulo.href}
              titulo={modulo.titulo}
              descricao={modulo.descricao}
              href={modulo.href}
              icone={modulo.icone}
            />
          ))}
        </div>
      </div>

      <SigCard>
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-bold">
            Assistente Central
          </p>

          <h2 className="text-2xl font-black text-white">
            Chat SIGIA
          </h2>

          <p className="text-slate-400 text-sm mt-1">
            Converse com a inteligência central do sistema para apoio rápido.
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 overflow-hidden">
          <SIGIAChat />
        </div>
      </SigCard>
    </section>
  );
}

function Resumo({
  titulo,
  valor,
  icone: Icone,
  cor,
}: {
  titulo: string;
  valor: string;
  icone: any;
  cor: "cyan" | "green" | "yellow" | "blue";
}) {
  const cores = {
    cyan: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    green: "text-green-400 border-green-500/30 bg-green-500/10",
    yellow: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    blue: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  };

  return (
    <SigCard>
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${cores[cor]}`}
        >
          <Icone size={24} />
        </div>

        <div>
          <p className="text-slate-400 text-sm">{titulo}</p>
          <h3 className="text-xl font-black text-white">{valor}</h3>
        </div>
      </div>
    </SigCard>
  );
}