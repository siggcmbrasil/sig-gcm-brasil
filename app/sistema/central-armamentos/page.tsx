"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Archive,
  ClipboardList,
  FileText,
  PackageCheck,
  Wrench,
  Crosshair,
  ScrollText,
} from "lucide-react";

const modulos = [
  {
    titulo: "Armaria",
    descricao: "Controle geral da armaria, registros, guarda e movimentação.",
    href: "/sistema/armamentos/armaria",
    icon: ShieldCheck,
  },
  {
    titulo: "Cadastro",
    descricao: "Cadastro de armamentos, acessórios e itens controlados.",
    href: "/sistema/armamentos/cadastro",
    icon: ClipboardList,
  },
  {
    titulo: "Cautelas",
    descricao: "Entrega, devolução e responsabilidade por armamentos.",
    href: "/sistema/armamentos/cautelas",
    icon: PackageCheck,
  },
  {
    titulo: "Documentos",
    descricao: "Registros, certificados, autorizações e arquivos vinculados.",
    href: "/sistema/armamentos/documentos",
    icon: FileText,
  },
  {
    titulo: "Inventário",
    descricao: "Conferência de estoque, patrimônio, quantidade e situação.",
    href: "/sistema/armamentos/inventario",
    icon: Archive,
  },
  {
    titulo: "Manutenção",
    descricao: "Controle de revisão, manutenção, baixa e inspeções.",
    href: "/sistema/armamentos/manutencao",
    icon: Wrench,
  },
  {
    titulo: "Munições",
    descricao: "Controle de munições por calibre, lote, quantidade e validade.",
    href: "/sistema/armamentos/municoes",
    icon: Crosshair,
  },
  {
    titulo: "Relatórios",
    descricao: "Relatórios operacionais, cautelas, inventário e auditoria.",
    href: "/sistema/armamentos/relatorios",
    icon: ScrollText,
  },
];

export default function CentralArmamentosPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <p className="text-sm text-slate-400 font-semibold">
          Controle Restrito
        </p>

        <h1 className="text-2xl md:text-3xl font-black text-white">
          Central de Armamentos
        </h1>

        <p className="text-slate-400 mt-2">
          Gestão integrada de armaria, cautelas, munições, inventário,
          manutenção, documentos e relatórios operacionais.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {modulos.map((modulo) => {
          const Icon = modulo.icon;

          return (
            <Link
              key={modulo.href}
              href={modulo.href}
              className="painel-premium p-5 hover:border-amber-500/60 hover:bg-slate-900 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
                <Icon className="text-amber-400" size={26} />
              </div>

              <h2 className="text-lg font-black text-white">
                {modulo.titulo}
              </h2>

              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                {modulo.descricao}
              </p>

              <p className="text-xs text-amber-400 font-bold mt-4">
                Acessar módulo →
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}