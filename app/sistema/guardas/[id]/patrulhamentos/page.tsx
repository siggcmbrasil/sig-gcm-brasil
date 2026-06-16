"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PatrulhamentosGuardaPage() {
  const { id } = useParams();
  const [registros, setRegistros] = useState<any[]>([]);
  const [guarda, setGuarda] = useState<any>(null);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const { data: guardaData } = await supabase
      .from("guardas")
      .select("*")
      .eq("id", id)
      .single();

    setGuarda(guardaData);

    const { data: gpsData } = await supabase
      .from("localizacoes_tempo_real")
      .select("*")
      .eq("nome", guardaData?.nome)
      .order("atualizado_em", { ascending: false });

    setRegistros(gpsData || []);
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-black mb-2">
        📍 Patrulhamentos
      </h1>

      <p className="text-slate-400 mb-6">
        {guarda?.nome || "Guarda"}
      </p>

      <div className="painel-premium p-6">
        {registros.length === 0 ? (
          <p className="text-slate-400">
            Nenhum patrulhamento GPS registrado.
          </p>
        ) : (
          <div className="space-y-3">
            {registros.map((item) => (
              <div
                key={item.id}
                className="border border-slate-700 rounded-xl p-4"
              >
                <p className="font-bold">
                  {item.status === "A_PE"
                    ? "🚶 Patrulhamento a pé"
                    : item.status === "MOTO"
                    ? "🏍️ Patrulhamento de moto"
                    : "🚓 Patrulhamento de viatura"}
                </p>

                <p className="text-slate-400 text-sm">
                  📍 {item.latitude}, {item.longitude}
                </p>

                {item.observacao && (
                  <p className="text-slate-300 text-sm mt-1">
                    📝 {item.observacao}
                  </p>
                )}

                <p className="text-xs text-blue-400 mt-2">
                  🕒 {new Date(item.atualizado_em).toLocaleString("pt-BR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}