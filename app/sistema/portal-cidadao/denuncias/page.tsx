"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MessageSquareWarning,
  PlusCircle,
  RefreshCw,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigStatusBadge from "@/components/sig/SigStatusBadge";

export default function DenunciasCidadaoPage() {
  const [denuncias, setDenuncias] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDenuncias();
  }, []);

  async function carregarDenuncias() {
    setCarregando(true);

    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    const { data, error } = await supabase
      .from("denuncias_cidadao")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    if (!error) {
      setDenuncias(data || []);
    }

    setCarregando(false);
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
     <SigPageHeader
  titulo="Denúncias do Cidadão"
  subtitulo="Registro e acompanhamento das denúncias enviadas pela população."
  icone={MessageSquareWarning}
/>

<Link
  href="/sistema/portal-cidadao/denuncias/nova"
  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 font-bold text-white hover:bg-emerald-500"
>
  <PlusCircle size={18} />
  Nova Denúncia
</Link>

      <SigCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-white">
            Denúncias registradas
          </h2>

          <button
            onClick={carregarDenuncias}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>

        {carregando ? (
          <p className="text-slate-400">Carregando denúncias...</p>
        ) : denuncias.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-center text-slate-400">
  Nenhuma denúncia registrada ainda.
</div>
        ) : (
          <div className="space-y-3">
            {denuncias.map((d) => (
              <div
                key={d.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="text-white font-black">
                      {d.protocolo || "Sem protocolo"}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {d.tipo || "Tipo não informado"} •{" "}
                      {d.local || "Local não informado"}
                    </p>
                  </div>

                  <SigStatusBadge status={d.status || "PENDENTE"} />
                </div>

                <p className="text-slate-300 mt-3 line-clamp-2">
                  {d.relato}
                </p>
              </div>
            ))}
          </div>
        )}
      </SigCard>
    </div>
  );
}