"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";

export default function EscalasGuardaPage() {
  const { id } = useParams();

  const [guarda, setGuarda] = useState<any>(null);
  const [escalas, setEscalas] = useState<any[]>([]);
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
      .eq("municipio_id", usuarioLogado.municipio_id)
      .eq("id", Number(id))
      .single();

    if (guardaError) {
      alert("Erro ao carregar guarda.");
      setCarregando(false);
      return;
    }

    setGuarda(guardaData);

    const { data: escalasData } = await supabase
      .from("escalas")
      .select("*")
      .eq("municipio_id", usuarioLogado.municipio_id)
      .or(
        `guarda_id.eq.${Number(id)},guardas.ilike.%${guardaData?.nome || ""}%`
      )
      .order("data", { ascending: false });

    setEscalas(escalasData || []);
    setCarregando(false);
  }

  if (carregando) {
    return <div className="p-6 text-white">Carregando escalas...</div>;
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <div className="p-6 text-white">
        <Link
          href={`/sistema/guardas/${id}`}
          className="text-blue-400 font-bold"
        >
          ← Voltar ao Dossiê
        </Link>

        <h1 className="text-3xl font-black mt-4 mb-2">
          📅 Escalas do Guarda
        </h1>

        <p className="text-slate-400 mb-6">
          {guarda?.nome || "Guarda"} • Total: {escalas.length}
        </p>

        {escalas.length === 0 ? (
          <div className="painel-premium p-6 text-slate-400">
            Nenhuma escala encontrada.
          </div>
        ) : (
          <div className="space-y-3">
            {escalas.map((escala) => (
              <div key={escala.id} className="painel-premium p-4">
                <h2 className="font-black text-lg">
                  📅 {escala.data || escala.data_servico || "-"}
                </h2>

                <p className="text-slate-400">
                  👥 {escala.guarnicao || escala.equipe || "-"}
                </p>

                <p className="text-blue-400">
                  Tipo: {escala.tipo || escala.turno || "Ordinária"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtecaoModulo>
  );
}