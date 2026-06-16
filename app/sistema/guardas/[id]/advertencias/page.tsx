"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ElogiosPage() {
  const { id } = useParams();

  const [autoridade, setAutoridade] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [elogios, setElogios] = useState<any[]>([]);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const { data } = await supabase
      .from("advertencias_guardas")
      .select("*")
      .eq("guarda_id", Number(id))
      .order("id", { ascending: false });

    setElogios(data || []);
  }

  async function salvar() {
    const { error } = await supabase
      .from("advertencias_guardas")
      .insert({
        guarda_id: Number(id),
        autoridade,
        descricao,
        data,
      });

    if (error) {
      alert("Erro ao salvar.");
      return;
    }

    setAutoridade("");
    setDescricao("");
    setData("");

    carregar();
  }

  async function excluir(itemId: number) {
    await supabase
      .from("advertencias_guardas")
      .delete()
      .eq("id", itemId);

    carregar();
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-black mb-6">
        ⚠️ Advertências
      </h1>

      <div className="painel-premium p-6 mb-6">
        <div className="grid gap-4">
          <input
            className="input"
            placeholder="Autoridade"
            value={autoridade}
            onChange={(e) => setAutoridade(e.target.value)}
          />

          <input
            type="date"
            className="input"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />

          <textarea
            className="input h-28"
            placeholder="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />

          <button
            onClick={salvar}
            className="btn-primary"
          >
            Salvar Elogio
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {elogios.map((item) => (
          <div
            key={item.id}
            className="painel-premium p-4"
          >
            <h3 className="font-black">
              🏆 {item.autoridade}
            </h3>

            <p>{item.descricao}</p>

            <button
              onClick={() => excluir(item.id)}
              className="mt-3 bg-red-700 px-3 py-2 rounded-lg"
            >
              Excluir
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}