"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function MunicoesPage() {
  const [municoes, setMunicoes] = useState<any[]>([]);
  const [calibre, setCalibre] = useState("");
  const [quantidade, setQuantidade] = useState("");

  const usuario =
    JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

  async function carregar() {
    const { data } = await supabase
      .from("municoes")
      .select("*")
      .eq("municipio_id", usuario.municipio_id);

    setMunicoes(data || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar() {
    await supabase.from("municoes").insert([
      {
        municipio_id: usuario.municipio_id,
        calibre,
        quantidade: Number(quantidade),
      },
    ]);

    carregar();
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-black mb-6">
        Controle de Munições
      </h1>

      <div className="painel-premium p-6 mb-6">
        <input
          className="input"
          placeholder="Calibre"
          value={calibre}
          onChange={(e) =>
            setCalibre(e.target.value)
          }
        />

        <input
          className="input mt-3"
          placeholder="Quantidade"
          value={quantidade}
          onChange={(e) =>
            setQuantidade(e.target.value)
          }
        />

        <button
          onClick={salvar}
          className="sig-btn-gold mt-4"
        >
          Salvar
        </button>
      </div>
    </div>
  );
}