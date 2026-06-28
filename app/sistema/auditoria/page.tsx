"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [consultas, setConsultas] = useState<any[]>([]);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    if (!usuario?.municipio_id) return;

    const { data: logsData } = await supabase
      .from("auditoria")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false })
      .limit(500);

    const { data: consultasData } = await supabase
      .from("consultas_operacionais")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false })
      .limit(500);

    setLogs(logsData || []);
    setConsultas(consultasData || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div className="p-6">
      <div className="painel-premium p-6 mb-6">
        <h1 className="text-3xl font-black">
          Auditoria do Sistema
        </h1>

        <p className="text-slate-400 mt-2">
          Registro completo das ações realizadas no SIG-GCM Brasil.
        </p>
      </div>

      <div className="painel-premium p-5 mb-6">
        <h2 className="text-xl font-black mb-4">
          🔎 Consultas Operacionais
        </h2>

        <div className="space-y-3">
          {consultas.length === 0 ? (
            <p className="text-slate-400">
              Nenhuma consulta operacional registrada.
            </p>
          ) : (
            consultas.map((item) => (
              <div
                key={`consulta-${item.id}`}
                className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4"
              >
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="bg-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                    {item.tipo}
                  </span>

                  <span className="bg-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                    CONSULTA OPERACIONAL
                  </span>

                  <span className="bg-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                    {item.resultado || "EM_DESENVOLVIMENTO"}
                  </span>
                </div>

                <p className="font-bold">
                  Consulta: {item.consulta}
                </p>

                <p className="text-slate-300 mt-2">
                  Motivo: {item.motivo}
                </p>

                <p className="text-xs text-slate-500 mt-3">
                  {new Date(item.criado_em).toLocaleString("pt-BR")}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-3">
        {logs.length === 0 ? (
          <p className="text-slate-400">
            Nenhum registro de auditoria encontrado.
          </p>
        ) : (
          logs.map((item) => (
            <div
              key={`log-${item.id}`}
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
          ))
        )}
      </div>
    </div>
  );
}