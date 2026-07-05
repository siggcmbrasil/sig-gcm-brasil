"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SinoNotificacoes() {
  const [total, setTotal] = useState(0);

  async function carregar() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    if (!usuario?.id || !usuario?.municipio_id) return;

    const { count, error } = await supabase
      .from("notificacoes")
      .select("*", { count: "exact", head: true })
      .eq("municipio_id", usuario.municipio_id)
      .eq("lida", false)
      .or(`usuario_id.eq.${usuario.id},usuario_id.is.null,perfil_destino.eq.${usuario.perfil}`);

    if (!error) setTotal(count || 0);
  }

  useEffect(() => {
    carregar();

    const intervalo = setInterval(carregar, 30000);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <Link
      href="/sistema/notificacoes"
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 hover:border-blue-500"
    >
      <Bell className="w-5 h-5 text-slate-300" />

      {total > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-black text-white">
          {total}
        </span>
      )}
    </Link>
  );
}