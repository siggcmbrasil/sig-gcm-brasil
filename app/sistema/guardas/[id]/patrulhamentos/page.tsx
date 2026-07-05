"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";

export default function PatrulhamentosGuardaPage() {
  const { id } = useParams();

  const [registros, setRegistros] = useState<any[]>([]);
  const [guarda, setGuarda] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  const usuarioLogado =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    if (!usuarioLogado?.municipio_id || !id) {
      setCarregando(false);
      return;
    }

    const { data: guardaData, error: guardaError } = await supabase
      .from("guardas")
      .select("*")
      .eq("id", Number(id))
      .eq("municipio_id", usuarioLogado.municipio_id)
      .single();

    if (guardaError) {
      alert("Erro ao carregar guarda.");
      setCarregando(false);
      return;
    }

    setGuarda(guardaData);

    const { data: gpsData } = await supabase
      .from("localizacoes_tempo_real")
      .select("*")
      .eq("municipio_id", usuarioLogado.municipio_id)
      .eq("nome", guardaData?.nome)
      .order("atualizado_em", { ascending: false });

    setRegistros(gpsData || []);
    setCarregando(false);
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <div className="p-6 text-white">
        <h1 className="text-3xl font-black mb-2">
          📍 Patrulhamentos
        </h1>

        <p className="text-slate-400 mb-6">
          {guarda?.nome || "Guarda"}
        </p>

        <div className="painel-premium p-6">
          {carregando ? (
            <p className="text-slate-400">
              Carregando patrulhamentos...
            </p>
          ) : registros.length === 0 ? (
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
                    🕒{" "}
                    {item.atualizado_em
                      ? new Date(item.atualizado_em).toLocaleString("pt-BR")
                      : "-"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtecaoModulo>
  );
}