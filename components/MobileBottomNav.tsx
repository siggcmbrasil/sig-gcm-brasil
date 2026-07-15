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
    principal: true,
  },
  {
    href: "/sistema/mapa-operacional",
    titulo: "Mapa",
    icone: MapPin,
  },
  {
    href: "/sistema/mobile/mais",
    titulo: "Mais",
    icone: Menu,
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#02060f]/96 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_35px_rgba(0,0,0,.45)] backdrop-blur-2xl md:hidden">
      <div className="mx-auto grid h-[76px] max-w-md grid-cols-5 px-1">
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
              className={`relative flex flex-col items-center justify-center gap-1 text-[10px] font-black transition active:scale-95 ${
                ativo ? "text-cyan-200" : "text-slate-500"
              }`}
            >
              {item.principal ? (
                <span className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#02060f] bg-red-600 text-white shadow-[0_0_28px_rgba(220,38,38,.5)]">
                  <Icone className="h-6 w-6" />
                </span>
              ) : (
                <Icone className="h-5 w-5" />
              )}

              <span className={item.principal ? "-mt-1" : ""}>
                {item.titulo}
              </span>

              {ativo && !item.principal ? (
                <span className="absolute bottom-1 h-1 w-5 rounded-full bg-cyan-300" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
