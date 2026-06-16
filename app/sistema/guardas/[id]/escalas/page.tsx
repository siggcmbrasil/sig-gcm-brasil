"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function EscalasGuardaPage() {
  const { id } = useParams();

  const [guarda, setGuarda] = useState<any>(null);
  const [escalas, setEscalas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const { data: guardaData } = await supabase
      .from("guardas")
      .select("*")
      .eq("id", Number(id))
      .single();

    setGuarda(guardaData);

    const { data: escalasData } = await supabase
      .from("escalas")
      .select("*")
      .ilike("guardas", `%${guardaData?.nome}%`)
      .order("data", { ascending: false });

    setEscalas(escalasData || []);
    setCarregando(false);
  }

  if (carregando) {
    return <div className="p-6 text-white">Carregando escalas...</div>;
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
            <div
              key={escala.id}
              className="painel-premium p-4"
            >
              <h2 className="font-black text-lg">
                📅 {escala.data}
              </h2>

              <p className="text-slate-400">
                👥 {escala.guarnicao || "-"}
              </p>

              <p className="text-blue-400">
                Tipo: {escala.tipo || "Ordinária"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}