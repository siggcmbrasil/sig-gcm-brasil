"use client";

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
    },
    {
      titulo: "Chamados",
      valor: chamados,
      icone: PhoneCall,
    },
    {
      titulo: "Visitas",
      valor: visitas,
      icone: QrCode,
    },
    {
      titulo: "Notificações",
      valor: notificacoes,
      icone: Bell,
    },
  ];

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
      <h2 className="text-base font-black text-white">
        Resumo operacional
      </h2>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {itens.map((item) => {
          const Icone = item.icone;

          return (
            <div
              key={item.titulo}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <Icone className="h-5 w-5 text-cyan-300" />
                <span className="text-2xl font-black text-white">
                  {item.valor}
                </span>
              </div>

              <p className="mt-2 text-xs font-bold text-slate-500">
                {item.titulo}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
