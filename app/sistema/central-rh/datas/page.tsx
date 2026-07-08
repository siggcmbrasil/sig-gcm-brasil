"use client";

import Link from "next/link";
import {
  Cake,
  CalendarDays,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

const itens = [
  {
    nome: "Aniversariantes",
    rota: "/sistema/aniversariantes",
    icone: Cake,
    descricao: "Aniversários dos guardas e servidores.",
  },
  {
    nome: "Datas Comemorativas",
    rota: "/sistema/datas-comemorativas",
    icone: CalendarDays,
    descricao: "Calendário de campanhas e datas institucionais.",
  },
];

export default function DatasPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Datas Institucionais"
        subtitulo="Aniversários, campanhas e datas comemorativas."
        icone={CalendarDays}
      />

      <div className="grid md:grid-cols-2 gap-4">
        {itens.map((item) => {
          const Icone = item.icone;

          return (
            <Link key={item.nome} href={item.rota}>
              <SigCard className="hover:border-cyan-500/40 hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                <Icone className="w-10 h-10 text-cyan-400 mb-4" />

                <h2 className="text-xl font-black text-white">
                  {item.nome}
                </h2>

                <p className="text-sm text-slate-400 mt-2">
                  {item.descricao}
                </p>
              </SigCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}