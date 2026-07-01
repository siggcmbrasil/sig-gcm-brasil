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
      status: "Planejado",
      responsavel: "Comando",
    },
    {
      nome: "Guarda Mirim",
      categoria: "Social",
      status: "Em análise",
      responsavel: "Coordenação",
    },
    {
      nome: "Ronda Comunitária",
      categoria: "Segurança",
      status: "Ativo",
      responsavel: "Operacional",
    },
  ];

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Projetos Institucionais"
        subtitulo="Planejamento, acompanhamento e gestão de projetos da instituição."
        icone={FolderKanban}
      />

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4">
            <Building2 className="w-10 h-10 text-yellow-400" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-bold">
              Gestão Institucional
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Central de Projetos
            </h2>

            <p className="text-slate-400 mt-2 max-w-3xl leading-relaxed">
              Área destinada ao cadastro, planejamento e acompanhamento de
              projetos institucionais, sociais, preventivos e operacionais da
              Guarda Municipal.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <ClipboardList className="w-8 h-8 text-yellow-400 mb-3" />
          <h3 className="text-lg font-black text-white">Projetos</h3>
          <p className="text-2xl font-black text-white mt-2">03</p>
        </SigCard>

        <SigCard>
          <CheckCircle className="w-8 h-8 text-emerald-400 mb-3" />
          <h3 className="text-lg font-black text-white">Ativos</h3>
          <p className="text-2xl font-black text-white mt-2">01</p>
        </SigCard>

        <SigCard>
          <CalendarDays className="w-8 h-8 text-blue-400 mb-3" />
          <h3 className="text-lg font-black text-white">Planejados</h3>
          <p className="text-2xl font-black text-white mt-2">01</p>
        </SigCard>

        <SigCard>
          <Handshake className="w-8 h-8 text-orange-400 mb-3" />
          <h3 className="text-lg font-black text-white">Parcerias</h3>
          <p className="text-2xl font-black text-white mt-2">00</p>
        </SigCard>
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h3 className="text-xl font-black text-white">
              Projetos Cadastrados
            </h3>

            <p className="text-sm text-slate-400 mt-1">
              Lista demonstrativa dos projetos institucionais.
            </p>
          </div>

          <Link
            href="#"
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
              {projetos.map((item, index) => (
                <tr key={index} className="text-slate-300">
                  <td className="p-3">{item.nome}</td>
                  <td className="p-3">{item.categoria}</td>
                  <td className="p-3">{item.status}</td>
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
          <p>• Patrulha Escolar</p>
          <p>• Guarda Mirim</p>
          <p>• Ronda Comunitária</p>
          <p>• Educação no Trânsito</p>
          <p>• Prevenção às Drogas</p>
          <p>• Segurança nas Escolas</p>
          <p>• Campanhas Institucionais</p>
          <p>• Parcerias com Secretarias</p>
        </div>
      </SigCard>
    </div>
  );
}