"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Home, MapPin, Menu, Shield } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-[#02060f]/95 backdrop-blur-xl md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="grid h-[72px] grid-cols-5 items-center text-center">
        <Item href="/sistema/mobile" icon={Home} text="Início" active={pathname === "/sistema/mobile"} />
        <Item href="/sistema/ocorrencias" icon={FileText} text="Ocorr." active={pathname.includes("/ocorrencias")} />

        <Link href="/sistema/mobile/operacao" className="flex flex-col items-center justify-center gap-1">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#02060f] bg-blue-600 shadow-xl active:scale-95">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <span className="text-[10px] font-bold text-blue-300">Operação</span>
        </Link>

        <Item href="/sistema/mobile/gps" icon={MapPin} text="GPS" active={pathname.includes("/gps")} />
        <Item href="/sistema/mobile/mais" icon={Menu} text="Mais" active={pathname.includes("/mais")} />
      </div>
    </nav>
  );
}

function Item({
  href,
  icon: Icon,
  text,
  active,
}: {
  href: string;
  icon: any;
  text: string;
  active?: boolean;
}) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center gap-1">
      <Icon className={`h-5 w-5 ${active ? "text-blue-400" : "text-slate-500"}`} />
      <span className={`text-[10px] ${active ? "font-bold text-blue-400" : "text-slate-500"}`}>
        {text}
      </span>
    </Link>
  );
}