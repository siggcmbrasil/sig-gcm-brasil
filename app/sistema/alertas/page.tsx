"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    if (!usuario?.municipio_id) {
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("alertas_operacionais")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .eq("ativo", true)
      .order("criado_em", { ascending: false });

    setCarregando(false);

    if (error) {
      console.error(error);
      alert("Erro ao carregar alertas.");
      return;
    }

    setAlertas(data || []);
  }

  async function resolverAlerta(id: number) {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    const { error } = await supabase
      .from("alertas_operacionais")
      .update({ ativo: false })
      .eq("id", id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      alert(error.message);
      return;
    }

    carregar();
  }

  function corNivel(nivel: string) {
    if (nivel === "ALTO") return "text-red-400 border-red-500/30 bg-red-500/10";
    if (nivel === "MEDIO") return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10";
    return "text-cyan-400 border-cyan-500/30 bg-cyan-500/10";
  }

  const altos = alertas.filter((a) => a.nivel === "ALTO").length;
  const medios = alertas.filter((a) => a.nivel === "MEDIO").length;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Alertas Operacionais"
        subtitulo="Monitoramento de situações críticas e eventos relevantes."
        icone={Activity}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SigCard>
          <ShieldAlert className="w-8 h-8 text-red-400 mb-3" />
          <p className="text-slate-400 text-sm">Alertas ativos</p>
          <h2 className="text-4xl font-black text-white mt-2">{alertas.length}</h2>
        </SigCard>

        <SigCard>
          <AlertTriangle className="w-8 h-8 text-red-400 mb-3" />
          <p className="text-slate-400 text-sm">Nível alto</p>
          <h2 className="text-4xl font-black text-red-400 mt-2">{altos}</h2>
        </SigCard>

        <SigCard>
          <Activity className="w-8 h-8 text-yellow-400 mb-3" />
          <p className="text-slate-400 text-sm">Nível médio</p>
          <h2 className="text-4xl font-black text-yellow-400 mt-2">{medios}</h2>
        </SigCard>
      </div>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-5">
          Lista de Alertas
        </h2>

        {carregando ? (
          <p className="text-slate-400">Carregando alertas...</p>
        ) : alertas.length === 0 ? (
          <div className="text-center py-16">
            <Activity className="w-16 h-16 mx-auto text-cyan-400 mb-4" />

            <h2 className="text-2xl font-black text-white">
              Nenhum alerta ativo
            </h2>

            <p className="text-slate-400 mt-2">
              Os alertas automáticos aparecerão aqui após a análise de ocorrências.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alertas.map((alerta) => (
              <div
                key={alerta.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <span
                      className={`inline-block rounded-full border px-3 py-1 text-xs font-black ${corNivel(
                        alerta.nivel
                      )}`}
                    >
                      {alerta.nivel || "MEDIO"}
                    </span>

                    <h3 className="text-xl font-black text-white mt-3">
                      {alerta.titulo}
                    </h3>

                    <p className="text-slate-400 mt-2">
                      {alerta.mensagem}
                    </p>

                    <p className="text-xs text-slate-500 mt-3">
                      Origem: {alerta.origem || "-"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => resolverAlerta(alerta.id)}
                    className="btn-secondary inline-flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Resolver
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SigCard>
    </div>
  );
}