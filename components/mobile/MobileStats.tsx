"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  PhoneCall,
  QrCode,
} from "lucide-react";

export default function MobileStats({
  ocorrencias,
  chamados,
  visitas,
  notificacoes,
}: {
  ocorrencias: number;
  chamados: number;
  visitas: number;
  notificacoes: number;
}) {
  const itens = [
    {
      titulo: "Ocorrências",
      valor: ocorrencias,
      icone: AlertTriangle,
      href: "/sistema/ocorrencias",
    },
    {
      titulo: "Chamados",
      valor: chamados,
      icone: PhoneCall,
      href: "/sistema/chamados",
    },
    {
      titulo: "Visitas",
      valor: visitas,
      icone: QrCode,
      href: "/sistema/visitas",
    },
    {
      titulo: "Notificações",
      valor: notificacoes,
      icone: Bell,
      href: "/sistema/notificacoes",
    },
  ];

  return (
    <section className="grid grid-cols-4 gap-2">
      {itens.map((item) => {
        const Icone = item.icone;

        return (
          <Link
            key={item.titulo}
            href={item.href}
            className="flex min-h-22 flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/85 px-2 py-3 text-center shadow-lg transition active:scale-95"
          >
            <Icone className="h-5 w-5 text-cyan-200" />

            <span className="mt-2 text-2xl font-black leading-none text-white">
              {item.valor}
            </span>

            <span className="mt-1 text-[9px] font-black uppercase tracking-wide text-slate-500">
              {item.titulo}
            </span>
          </Link>
        );
      })}
    </section>
  );
}
