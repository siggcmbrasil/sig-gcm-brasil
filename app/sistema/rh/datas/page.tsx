"use client";

import Link from "next/link";
import {
  Cake,
  CalendarDays,
} from "lucide-react";

const itens = [
  {
    nome: "Aniversariantes",
    rota: "/sistema/aniversariantes",
    icone: Cake,
  },
  {
    nome: "Datas Comemorativas",
    rota: "/sistema/datas-comemorativas",
    icone: CalendarDays,
  },
];

export default function DatasPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">
        Datas Institucionais
      </h1>

      <div className="grid md:grid-cols-2 gap-4">
        {itens.map((item) => {
          const Icone = item.icone;

          return (
            <Link
              key={item.nome}
              href={item.rota}
              className="painel-premium p-6"
            >
              <Icone className="w-10 h-10 text-blue-400 mb-3" />

              <h2 className="font-bold text-lg">
                {item.nome}
              </h2>
            </Link>
          );
        })}
      </div>
    </div>
  );
}