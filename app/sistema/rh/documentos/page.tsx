"use client";

import Link from "next/link";
import {
  Award,
  BookOpenCheck,
  BriefcaseMedical,
  CalendarDays,
  FileText,
  FolderOpen,
  GraduationCap,
  History,
  IdCard,
  ShieldAlert,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

const documentos = [
  {
    titulo: "Documentos do Guarda",
    descricao: "RG, CPF, CNH, certificados e documentos pessoais.",
    href: "/sistema/documentos-guardas",
    icone: IdCard,
    cor: "text-cyan-400",
  },
  {
    titulo: "Cursos",
    descricao: "Certificados, capacitações e formações profissionais.",
    href: "/sistema/cursos",
    icone: GraduationCap,
    cor: "text-blue-400",
  },
  {
    titulo: "Atestados",
    descricao: "Documentos médicos, afastamentos e justificativas.",
    href: "/sistema/atestados",
    icone: BriefcaseMedical,
    cor: "text-emerald-400",
  },
  {
    titulo: "Férias e Licenças",
    descricao: "Controle documental de férias, licenças e afastamentos.",
    href: "/sistema/ferias-licencas",
    icone: CalendarDays,
    cor: "text-yellow-400",
  },
  {
    titulo: "Gestão Funcional",
    descricao: "Elogios, advertências, avaliações e condecorações.",
    href: "/sistema/rh/gestao-funcional",
    icone: Award,
    cor: "text-orange-400",
  },
  {
    titulo: "Histórico Funcional",
    descricao: "Consulta completa da vida funcional do servidor.",
    href: "/sistema/rh/historico",
    icone: History,
    cor: "text-purple-400",
  },
  {
    titulo: "Dossiê do Guarda",
    descricao: "Resumo completo com registros, documentos e histórico.",
    href: "/sistema/guardas",
    icone: FolderOpen,
    cor: "text-pink-400",
  },
  {
    titulo: "Relatórios de RH",
    descricao: "Relatórios funcionais, frequência e documentos.",
    href: "/sistema/rh/estatisticas",
    icone: BookOpenCheck,
    cor: "text-red-400",
  },
];

export default function RHDocumentosPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Central de Documentos"
        subtitulo="Acesso rápido aos documentos, registros funcionais e vida profissional dos servidores."
        icone={FileText}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ResumoCard titulo="Documentos" valor="0" />
        <ResumoCard titulo="Cursos" valor="0" />
        <ResumoCard titulo="Atestados" valor="0" />
        <ResumoCard titulo="Pendências" valor="0" />
      </div>

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-3xl bg-cyan-500/10 border border-cyan-500/30 p-4">
            <FileText className="w-10 h-10 text-cyan-400" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-black">
              Recursos Humanos
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Documentos e Vida Funcional
            </h2>

            <p className="text-slate-400 mt-2 max-w-4xl leading-relaxed">
              Central preparada para organizar documentos pessoais,
              certificados, atestados, férias, licenças, histórico funcional,
              elogios, advertências e relatórios de RH.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {documentos.map((doc) => {
          const Icone = doc.icone;

          return (
            <Link key={doc.href} href={doc.href}>
              <SigCard className="h-full hover:border-cyan-500/40 hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                <Icone className={`w-11 h-11 ${doc.cor} mb-4`} />

                <h2 className="text-xl font-black text-white">
                  {doc.titulo}
                </h2>

                <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                  {doc.descricao}
                </p>
              </SigCard>
            </Link>
          );
        })}
      </div>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Funcionalidades previstas
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          <Item texto="Upload de documentos funcionais" />
          <Item texto="Controle de validade da CNH" />
          <Item texto="Certificados e cursos vencendo" />
          <Item texto="PDF do dossiê funcional" />
          <Item texto="Histórico completo do servidor" />
          <Item texto="Controle de afastamentos" />
          <Item texto="Consulta rápida por guarda" />
          <Item texto="Exportação de documentos" />
          <Item texto="Integração com auditoria" />
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white flex items-center gap-2 mb-4">
          <ShieldAlert className="w-6 h-6 text-yellow-400" />
          Regras de segurança
        </h2>

        <div className="grid md:grid-cols-2 gap-3">
          <Regra texto="Documentos devem ser separados por município." />
          <Regra texto="Acesso somente para perfis autorizados." />
          <Regra texto="Uploads devem ter limite de tamanho e tipo de arquivo." />
          <Regra texto="Toda visualização sensível deve ser auditada." />
          <Regra texto="Dados pessoais devem seguir padrão LGPD." />
          <Regra texto="Exportações devem registrar usuário, data e finalidade." />
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
      <p className="text-slate-500 text-xs mt-1">
        Em organização
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
    <div className="rounded-2xl bg-slate-950/70 border border-yellow-500/20 p-4 text-slate-300">
      🛡️ {texto}
    </div>
  );
}