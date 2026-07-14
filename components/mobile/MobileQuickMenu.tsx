"use client";

import Link from "next/link";
import {
  Bell,
  Car,
  Map,
  QrCode,
} from "lucide-react";

const itens = [
  {
    href: "/sistema/chamados",
    titulo: "Chamados",
    icone: Bell,
  },
  {
    href: "/sistema/patrulhamento",
    titulo: "Patrulha",
    icone: Car,
  },
  {
    href: "/sistema/visitas/ler-qrcode",
    titulo: "QR Code",
    icone: QrCode,
  },
  {
    href: "/sistema/mapa-operacional",
    titulo: "Mapa",
    icone: Map,
  },
];

export default function MobileQuickMenu() {
  return (
    <section className="grid grid-cols-2 gap-3">
      {itens.map((item) => {
        const Icone = item.icone;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="min-h-24 rounded-3xl border border-slate-800 bg-slate-900 p-4"
          >
            <Icone className="h-7 w-7 text-cyan-300" />
            <p className="mt-3 font-black text-white">
              {item.titulo}
            </p>
          </Link>
        );
      })}
    </section>
  );
}
