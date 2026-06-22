"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function OcorrenciasGuardaPage() {
  const { id } = useParams();

  const [guarda, setGuarda] = useState<any>(null);
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : {};

  async function carregar() {
    const { data: guardaData } = await supabase
      .from("guardas")
      .select("*")
      .eq("id", Number(id))
      .eq("municipio_id", usuarioLogado.municipio_id)
      .single();

    setGuarda(guardaData);

    const { data: ocorrenciasData } = await supabase
      .from("ocorrencias")
      .select("*")
      .eq("guarda_responsavel_id", Number(id))
      .order("id", { ascending: false });

    setOcorrencias(ocorrenciasData || []);
    setCarregando(false);
  }

  if (carregando) {
    return <div className="p-6 text-white">Carregando ocorrências...</div>;
  }

  return (
    <div className="p-6 text-white">
      <Link
        href={`/sistema/guardas/${id}`}
        className="text-blue-400 font-bold"
      >
        ← Voltar ao Dossiê
      </Link>

      <h1 className="text-3xl font-black mt-4 mb-2">
        🚨 Ocorrências do Guarda
      </h1>

      <p className="text-slate-400 mb-6">
        {guarda?.nome || "Guarda"} • Total: {ocorrencias.length}
      </p>

      {ocorrencias.length === 0 ? (
        <div className="painel-premium p-6 text-slate-400">
          Nenhuma ocorrência vinculada a este guarda.
        </div>
      ) : (
        <div className="space-y-3">
          {ocorrencias.map((o) => (
            <Link
              key={o.id}
              href={`/sistema/ocorrencias/${o.id}`}
              className="painel-premium p-4 block hover:bg-blue-950/30 transition"
            >
              <h2 className="font-black text-lg">
                🚨 {o.tipo || "Ocorrência"}
              </h2>

              <p className="text-slate-400 text-sm">
                📍 {o.local || "-"}
              </p>

              <p className="text-slate-400 text-sm">
                📅 {o.data || "-"} • ⏰ {o.hora || "--:--"}
              </p>

              <p className="text-blue-400 text-sm font-bold">
                Status: {o.status || "-"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}