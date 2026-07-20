"use client";

import Link from "next/link";
import {
  Building2,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  FileText,
  FolderKanban,
  Handshake,
  ShieldCheck,
} from "lucide-react";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function ProjetosPage() {
  const projetos = [
    {
      nome: "Patrulha Escolar",
      categoria: "Prevenção",
      status: "PLANEJADO",
      responsavel: "Comando",
    },
    {
      nome: "Guarda Mirim",
      categoria: "Social",
      status: "EM_ANALISE",
      responsavel: "Coordenação",
    },
    {
      nome: "Ronda Comunitária",
      categoria: "Segurança",
      status: "ATIVO",
      responsavel: "Operacional",
    },
  ];

  const total = projetos.length;
  const ativos = projetos.filter((p) => p.status === "ATIVO").length;
  const planejados = projetos.filter((p) => p.status === "PLANEJADO").length;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Projetos Sociais"
        subtitulo="Projetos comunitários, preventivos, institucionais e ações sociais da Guarda Municipal."
        icone={FolderKanban}
      />

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4">
            <Building2 className="w-10 h-10 text-yellow-400" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-bold">
              Portal do Cidadão
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Central de Projetos Sociais
            </h2>

            <p className="text-slate-400 mt-2 max-w-3xl leading-relaxed">
              Área destinada à organização de projetos sociais, educacionais,
              preventivos e comunitários divulgados ao cidadão.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-4 gap-4">
        <ResumoCard
          titulo="Projetos"
          valor={total}
          icone={<ClipboardList className="w-8 h-8 text-yellow-400" />}
        />

        <ResumoCard
          titulo="Ativos"
          valor={ativos}
          icone={<CheckCircle className="w-8 h-8 text-emerald-400" />}
        />

        <ResumoCard
          titulo="Planejados"
          valor={planejados}
          icone={<CalendarDays className="w-8 h-8 text-blue-400" />}
        />

        <ResumoCard
          titulo="Parcerias"
          valor={0}
          icone={<Handshake className="w-8 h-8 text-orange-400" />}
        />
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h3 className="text-xl font-black text-white">
              Projetos Cadastrados
            </h3>

            <p className="text-sm text-slate-400 mt-1">
              Lista inicial dos projetos comunitários e institucionais.
            </p>
          </div>

          <Link
            href="/sistema/portal-cidadao/programas"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-5 py-3 text-sm font-black text-slate-950 hover:bg-yellow-400 transition"
          >
            <FileText className="w-5 h-5" />
            Novo Projeto
          </Link>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-300">
              <tr>
                <th className="p-3 text-left">Projeto</th>
                <th className="p-3 text-left">Categoria</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Responsável</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {projetos.map((item) => (
                <tr key={item.nome} className="text-slate-300">
                  <td className="p-3 font-bold text-white">{item.nome}</td>
                  <td className="p-3">{item.categoria}</td>
                  <td className="p-3">
                    <Status status={item.status} />
                  </td>
                  <td className="p-3">{item.responsavel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SigCard>

      <SigCard>
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-yellow-400" />
          Tipos de Projetos
        </h3>

        <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm text-slate-400">
          <Item texto="Patrulha Escolar" />
          <Item texto="Guarda Mirim" />
          <Item texto="Ronda Comunitária" />
          <Item texto="Educação no Trânsito" />
          <Item texto="Prevenção às Drogas" />
          <Item texto="Segurança nas Escolas" />
          <Item texto="Campanhas Institucionais" />
          <Item texto="Parcerias com Secretarias" />
        </div>
      </SigCard>
    </div>
  );
}

function ResumoCard({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: number;
  icone: React.ReactNode;
}) {
  return (
    <SigCard>
      {icone}

      <h3 className="text-lg font-black text-white mt-3">
        {titulo}
      </h3>

      <p className="text-3xl font-black text-white mt-2">
        {valor}
      </p>
    </SigCard>
  );
}

function Status({ status }: { status: string }) {
  const estilos: Record<string, string> = {
    ATIVO: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    PLANEJADO: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    EM_ANALISE: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black ${
        estilos[status] ||
        "bg-slate-500/20 text-slate-300 border-slate-500/30"
      }`}
    >
      {status}
    </span>
  );
}

function Item({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4">
      ✅ {texto}
    </div>
  );
}