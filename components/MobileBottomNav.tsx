"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FileText,
  Shield,
  MapPin,
  Menu,
} from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="
      fixed
      bottom-0
      left-0
      right-0
      z-50
      border-t
      border-slate-800
      bg-[#02060f]/98
      backdrop-blur-xl
      md:hidden
      pb-[env(safe-area-inset-bottom)]
      shadow-2xl
    "
    >
      <div className="relative flex h-16 items-center justify-around">

        <Item
          href="/sistema/mobile"
          icon={Home}
          text="Início"
          active={pathname === "/sistema/mobile"}
        />

        <Item
          href="/sistema/ocorrencias"
          icon={FileText}
          text="Ocorr."
          active={pathname.includes("/ocorrencias")}
        />

        <Link
          href="/sistema/mobile/operacao"
          className="
            absolute
            -top-7
            left-1/2
            -translate-x-1/2
          "
        >
          <div
            className="
              h-16
              w-16
              rounded-full
              bg-blue-600
              flex
              items-center
              justify-center
              shadow-2xl
              border-4
              border-[#02060f]
              active:scale-95
            "
          >
            <Shield className="h-8 w-8 text-white" />
          </div>
        </Link>

        <Item
          href="/sistema/mobile/gps"
          icon={MapPin}
          text="GPS"
          active={pathname.includes("/gps")}
        />

        <Item
          href="/sistema/mobile/mais"
          icon={Menu}
          text="Mais"
          active={pathname.includes("/mais")}
        />

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
    <Link
      href={href}
      className="
        flex
        flex-col
        items-center
        justify-center
        gap-1
        w-16
      "
    >
      <Icon
        className={`h-6 w-6 ${
          active ? "text-blue-400" : "text-slate-500"
        }`}
      />

      <span
        className={`text-[10px] ${
          active
            ? "text-blue-400 font-bold"
            : "text-slate-500"
        }`}
      >
        {text}
      </span>
    </Link>
  );
}