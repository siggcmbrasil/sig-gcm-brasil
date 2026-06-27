"use client";

import Link from "next/link";
import {
  Award,
  TriangleAlert,
  BadgeCheck,
  ClipboardCheck,
  Medal,
} from "lucide-react";

const itens = [
  {
    nome: "Elogios",
    rota: "/sistema/elogios",
    icone: Award,
  },
  {
    nome: "Advertências",
    rota: "/sistema/advertencias",
    icone: TriangleAlert,
  },
  {
    nome: "Promoções",
    rota: "/sistema/promocoes",
    icone: BadgeCheck,
  },
  {
    nome: "Avaliações",
    rota: "/sistema/avaliacoes",
    icone: ClipboardCheck,
  },
  {
    nome: "Condecorações",
    rota: "/sistema/condecoracoes",
    icone: Medal,
  },
];

export default function GestaoFuncionalPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">
        Gestão Funcional
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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