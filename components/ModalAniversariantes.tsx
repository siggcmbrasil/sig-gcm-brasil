"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Guarda = {
  id: number;
  nome: string;
  data_nascimento: string | null;
  foto_url: string | null;
};

export default function ModalAniversariantes() {
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    async function carregar() {
      const hoje = new Date().toISOString().split("T")[0];
      const jaMostrou = localStorage.getItem(`aniversario-${hoje}`);

      if (jaMostrou) return;

      const { data } = await supabase
        .from("guardas")
        .select("id, nome, data_nascimento, foto_url");

      const agora = new Date();
      const dia = String(agora.getDate()).padStart(2, "0");
      const mes = String(agora.getMonth() + 1).padStart(2, "0");

      const aniversariantes = (data || []).filter((g) => {
        if (!g.data_nascimento) return false;
        const [, m, d] = g.data_nascimento.split("-");
        return d === dia && m === mes;
      });

      if (aniversariantes.length > 0) {
        setGuardas(aniversariantes);
        setMostrar(true);
      }
    }

    carregar();
  }, []);

  function fechar() {
    const hoje = new Date().toISOString().split("T")[0];
    localStorage.setItem(`aniversario-${hoje}`, "true");
    setMostrar(false);
  }

  if (!mostrar) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4">
      <div className="painel-premium max-w-lg w-full p-8 text-center border border-yellow-500/50">
        <div className="text-6xl mb-4">🎉</div>

        <h1 className="text-3xl font-black text-yellow-400">
          Aniversariante do Dia
        </h1>

        <p className="text-slate-300 mt-2">
          A Guarda Civil Municipal deseja felicidades, saúde e sucesso.
        </p>

        <div className="mt-6 space-y-4">
          {guardas.map((g) => (
            <div key={g.id} className="bg-slate-950/70 rounded-2xl p-4">
              <div className="w-24 h-24 rounded-full mx-auto overflow-hidden border border-yellow-500 bg-slate-800 flex items-center justify-center text-5xl">
                {g.foto_url ? (
                  <img src={g.foto_url} className="w-full h-full object-cover" />
                ) : (
                  "👮"
                )}
              </div>

              <h2 className="text-xl font-black mt-3">{g.nome}</h2>
              <p className="text-yellow-400 font-bold">🎂 Feliz aniversário!</p>
            </div>
          ))}
        </div>

        <button onClick={fechar} className="sig-btn-gold mt-6 w-full">
          Fechar
        </button>
      </div>
    </div>
  );
}