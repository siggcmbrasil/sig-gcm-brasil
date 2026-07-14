"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Home,
  MapPin,
  Menu,
  Route,
} from "lucide-react";

const itens = [
  {
    href: "/sistema/mobile",
    titulo: "Início",
    icone: Home,
  },
  {
    href: "/sistema/patrulhamento",
    titulo: "Patrulha",
    icone: Route,
  },
  {
    href: "/sistema/ocorrencias/expressa",
    titulo: "Ocorrência",
    icone: FileText,
  },
  {
    href: "/sistema/mapa-operacional",
    titulo: "Mapa",
    icone: MapPin,
  },
  {
    href: "/sistema",
    titulo: "Mais",
    icone: Menu,
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-[#02060f]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid h-[72px] max-w-md grid-cols-5">
        {itens.map((item) => {
          const ativo =
            item.href === "/sistema/mobile"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          const Icone = item.icone;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-black ${
                ativo ? "text-cyan-300" : "text-slate-500"
              }`}
            >
              <Icone className="h-5 w-5" />
              {item.titulo}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
