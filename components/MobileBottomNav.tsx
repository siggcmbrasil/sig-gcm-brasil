"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FileText,
  Shield,
  MapPin,
  Menu as MenuIcon,
} from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#02060f]/95 backdrop-blur-xl border-t border-slate-800 px-3 py-2 md:hidden">
      <div className="grid grid-cols-5 text-center">
        <Item href="/sistema/mobile" icon={Home} text="Início" active={pathname === "/sistema/mobile"} />
        <Item href="/sistema/ocorrencias" icon={FileText} text="Ocorrências" active={pathname.includes("/ocorrencias")} />
        <Item href="/sistema/mobile/operacao" icon={Shield} text="Operação" active={pathname.includes("/operacao")} destaque />
        <Item href="/sistema/mobile/gps" icon={MapPin} text="GPS" active={pathname.includes("/gps")} />
        <Item href="/sistema/mobile/mais" icon={MenuIcon} text="Mais" active={pathname.includes("/mais")} />
      </div>
    </nav>
  );
}

function Item({
  href,
  icon: Icon,
  text,
  active,
  destaque,
}: {
  href: string;
  icon: any;
  text: string;
  active?: boolean;
  destaque?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1 py-1 ${
        active ? "text-blue-400" : "text-slate-400"
      }`}
    >
      <span
        className={
          destaque
            ? "w-16 h-16 -mt-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl"
            : ""
        }
      >
        <Icon className={destaque ? "w-8 h-8" : "w-6 h-6"} />
      </span>

      <span className="text-[9px] font-medium">{text}</span>
    </Link>
  );
}