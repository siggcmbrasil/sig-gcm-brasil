"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AbastecimentosPage() {
  const [viaturas, setViaturas] = useState<any[]>([]);
  const [abastecimentos, setAbastecimentos] = useState<any[]>([]);

  const [viaturaId, setViaturaId] = useState("");
  const [litros, setLitros] = useState("");
  const [valor, setValor] = useState("");
  const [km, setKm] = useState("");
  const [posto, setPosto] = useState("");
  const [observacao, setObservacao] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    const { data: listaViaturas } = await supabase
      .from("viaturas")
      .select("*")
      .eq("municipio_id", usuario.municipio_id);

    const { data: listaAbastecimentos } = await supabase
      .from("abastecimentos")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("data_abastecimento", { ascending: false });

    setViaturas(listaViaturas || []);
    setAbastecimentos(listaAbastecimentos || []);
  }

  useEffect(() => {
    if (usuario?.municipio_id) carregar();
  }, []);

  async function salvar() {
    const { error } = await supabase
      .from("abastecimentos")
      .insert([
        {
          municipio_id: usuario.municipio_id,
          viatura_id: Number(viaturaId),
          litros: Number(litros),
          valor: Number(valor),
          km: Number(km),
          posto,
          observacao,
          criado_por: usuario.id,
        },
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    carregar();
  }

  return (
    <div className="p-6">
      <div className="painel-premium p-6 mb-6">
        <h1 className="text-3xl font-black">
          Abastecimentos
        </h1>
      </div>

      <div className="painel-premium p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-4">

          <select
            className="input"
            value={viaturaId}
            onChange={(e) => setViaturaId(e.target.value)}
          >
            <option>Selecione</option>

            {viaturas.map((v) => (
              <option key={v.id} value={v.id}>
                {v.prefixo}
              </option>
            ))}
          </select>

          <input
            className="input"
            placeholder="Litros"
            value={litros}
            onChange={(e) => setLitros(e.target.value)}
          />

          <input
            className="input"
            placeholder="Valor"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />

          <input
            className="input"
            placeholder="KM"
            value={km}
            onChange={(e) => setKm(e.target.value)}
          />

          <input
            className="input"
            placeholder="Posto"
            value={posto}
            onChange={(e) => setPosto(e.target.value)}
          />
        </div>

        <textarea
          className="input mt-4"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Observações"
        />

        <button
          onClick={salvar}
          className="sig-btn-gold mt-4"
        >
          Registrar
        </button>
      </div>
    </div>
  );
}