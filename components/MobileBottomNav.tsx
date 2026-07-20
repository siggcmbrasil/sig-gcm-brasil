"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Home, MapPin, Menu, Route } from "lucide-react";

const itens = [
  { href: "/sistema/mobile", titulo: "Início", icone: Home },
  { href: "/sistema/patrulhamento", titulo: "Patrulha", icone: Route },
  { href: "/sistema/ocorrencias/expressa", titulo: "Registrar", icone: FileText, principal: true },
  { href: "/sistema/mapa-operacional", titulo: "Mapa", icone: MapPin },
  { href: "/sistema/mobile/mais", titulo: "Mais", icone: Menu },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-cyan-400/10 bg-[#020817]/96 pb-[env(safe-area-inset-bottom)] shadow-[0_-14px_38px_rgba(0,0,0,.5)] backdrop-blur-2xl md:hidden">
      <div className="mx-auto grid h-[72px] max-w-md grid-cols-5 px-1">
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
              className={`relative flex flex-col items-center justify-center gap-1 text-[9px] font-black transition active:scale-95 ${
                ativo ? "text-cyan-200" : "text-slate-500"
              }`}
            >
              {item.principal ? (
                <span className="-mt-7 flex h-14 w-14 items-center justify-center rounded-[20px] border-[4px] border-[#020817] bg-gradient-to-br from-red-500 to-red-700 text-white shadow-[0_0_28px_rgba(220,38,38,.48)]">
                  <Icone className="h-6 w-6" />
                </span>
              ) : (
                <span className={`flex h-8 w-10 items-center justify-center rounded-xl ${ativo ? "bg-cyan-400/10" : ""}`}>
                  <Icone className="h-5 w-5" />
                </span>
              )}

              <span className={item.principal ? "-mt-1" : ""}>{item.titulo}</span>

              {ativo && !item.principal ? (
                <span className="absolute bottom-1 h-0.5 w-5 rounded-full bg-cyan-300" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
