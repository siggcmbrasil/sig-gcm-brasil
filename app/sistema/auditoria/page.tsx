"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<any[]>([]);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    const { data } = await supabase
      .from("auditoria")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false })
      .limit(500);

    setLogs(data || []);
  }

  useEffect(() => {
    if (usuario?.municipio_id) {
      carregar();
    }
  }, []);

  return (
    <div className="p-6">
      <div className="painel-premium p-6 mb-6">
        <h1 className="text-3xl font-black">
          Auditoria do Sistema
        </h1>

        <p className="text-slate-400 mt-2">
          Registro completo das ações realizadas.
        </p>
      </div>

      <div className="space-y-3">
        {logs.map((item) => (
          <div
            key={item.id}
            className="painel-premium p-4"
          >
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="bg-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                {item.acao}
              </span>

              <span className="bg-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                {item.modulo}
              </span>
            </div>

            <p className="font-bold">
              {item.usuario_nome}
            </p>

            <p className="text-slate-300 mt-2">
              {item.descricao}
            </p>

            <p className="text-xs text-slate-500 mt-3">
              {new Date(item.criado_em).toLocaleString("pt-BR")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}