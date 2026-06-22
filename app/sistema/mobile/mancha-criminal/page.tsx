"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Ocorrencia = {
  id: number;
  tipo: string | null;
  local: string | null;
  latitude: string | null;
  longitude: string | null;
  data: string | null;
};

export default function ManchaCriminalPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregarOcorrencias() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("id, tipo, local, latitude, longitude, data")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("id", { ascending: false })
      .limit(100);

    if (error) {
      console.error(error);
      alert("Erro ao carregar dados da mancha criminal.");
      setCarregando(false);
      return;
    }

    setOcorrencias(data || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarOcorrencias();
  }, []);

  return (
    <main className="min-h-screen bg-[#02060f] text-white p-5 pb-24">
      <Link
        href="/sistema/mobile"
        className="inline-block mb-5 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl"
      >
        ← Voltar
      </Link>

      <h1 className="text-3xl font-black mb-2">
        🔥 Mancha Criminal
      </h1>

      <p className="text-slate-400 mb-6">
        Locais com maior concentração de ocorrências.
      </p>

      {carregando ? (
        <p className="text-slate-400">Carregando...</p>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <p className="text-slate-400 text-xs">Pontos mapeados</p>
              <h2 className="text-3xl font-black">{ocorrencias.length}</h2>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <p className="text-slate-400 text-xs">Últimos registros</p>
              <h2 className="text-3xl font-black">100</h2>
            </div>
          </section>

          <section className="space-y-3">
            {ocorrencias.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4"
              >
                <h2 className="font-black">
                  {item.tipo || "Ocorrência"}
                </h2>

                <p className="text-slate-400 text-sm mt-1">
                  {item.local || "Local não informado"}
                </p>

                <p className="text-blue-400 text-xs mt-2">
                  {item.latitude}, {item.longitude}
                </p>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}