"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Guarda = {
  id: number;
  nome: string;
  data_nascimento: string | null;
  foto_url: string | null;
};

export default function AniversariantesPage() {
  const [guardas, setGuardas] = useState<Guarda[]>([]);

  useEffect(() => {
    carregar();
  }, []);

 async function carregar() {
  const usuario = JSON.parse(
    localStorage.getItem("usuarioLogado") || "{}"
  );

  if (!usuario.municipio_id) {
  alert("Município não identificado.");
  return;
}

  const { data } = await supabase
    .from("guardas")
    .select("id, nome, data_nascimento, foto_url")
    .eq("municipio_id", usuario.municipio_id)
    .order("nome");

  setGuardas(data || []);
}

  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, "0");
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");

  const aniversariantesHoje = guardas.filter((g) => {
    if (!g.data_nascimento) return false;
    const [, m, d] = g.data_nascimento.split("-");
    return d === dia && m === mes;
  });

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-black mb-2">
        🎂 Aniversariantes
      </h1>

      <p className="text-slate-400 mb-6">
        Guardas aniversariantes do dia.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {aniversariantesHoje.length === 0 ? (
          <div className="painel-premium p-6 md:col-span-3">
            Nenhum aniversariante hoje.
          </div>
        ) : (
          aniversariantesHoje.map((g) => (
            <div key={g.id} className="painel-premium p-6 text-center">
              <div className="w-24 h-24 rounded-full mx-auto overflow-hidden border border-yellow-500 bg-slate-800 flex items-center justify-center text-5xl">
                {g.foto_url ? (
                  <img src={g.foto_url} className="w-full h-full object-cover" />
                ) : (
                  "👮"
                )}
              </div>

              <h2 className="text-xl font-black mt-4">
                {g.nome}
              </h2>

              <p className="text-yellow-400 font-bold mt-2">
                🎉 Feliz aniversário!
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}