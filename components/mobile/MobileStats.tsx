"use client";

import Link from "next/link";
import { AlertTriangle, Bell, PhoneCall, QrCode } from "lucide-react";

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
    { titulo: "Ocorrências", valor: ocorrencias, icone: AlertTriangle, href: "/sistema/ocorrencias" },
    { titulo: "Chamados", valor: chamados, icone: PhoneCall, href: "/sistema/chamados" },
    { titulo: "Visitas", valor: visitas, icone: QrCode, href: "/sistema/visitas" },
    { titulo: "Avisos", valor: notificacoes, icone: Bell, href: "/sistema/notificacoes" },
  ];

  return (
    <section className="grid grid-cols-4 gap-2">
      {itens.map((item) => {
        const Icone = item.icone;
        return (
          <Link
            key={item.titulo}
            href={item.href}
            className="flex min-h-[72px] flex-col items-center justify-center rounded-[18px] border border-white/10 bg-[#071225]/90 px-1.5 py-2 text-center shadow-lg active:scale-95"
          >
            <div className="flex items-center gap-1.5">
              <Icone className="h-3.5 w-3.5 text-cyan-200" />
              <span className="text-xl font-black leading-none text-white">{item.valor}</span>
            </div>
            <span className="mt-2 max-w-full truncate text-[8px] font-black uppercase tracking-wide text-slate-500">
              {item.titulo}
            </span>
          </Link>
        );
      })}
    </section>
  );
}
