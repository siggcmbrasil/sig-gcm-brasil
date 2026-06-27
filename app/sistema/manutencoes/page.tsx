"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ManutencoesPage() {
  const [viaturas, setViaturas] = useState<any[]>([]);
  const [manutencoes, setManutencoes] = useState<any[]>([]);

  const [viaturaId, setViaturaId] = useState("");
  const [tipo, setTipo] = useState("PREVENTIVA");
  const [status, setStatus] = useState("ABERTA");
  const [valor, setValor] = useState("");
  const [oficina, setOficina] = useState("");
  const [descricao, setDescricao] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    const { data: listaViaturas } = await supabase
      .from("viaturas")
      .select("*")
      .eq("municipio_id", usuario.municipio_id);

    const { data: listaManutencoes } = await supabase
      .from("manutencoes_viaturas")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("id", { ascending: false });

    setViaturas(listaViaturas || []);
    setManutencoes(listaManutencoes || []);
  }

  useEffect(() => {
    if (usuario?.municipio_id) carregar();
  }, []);

  async function salvar() {
    const { error } = await supabase
      .from("manutencoes_viaturas")
      .insert([
        {
          municipio_id: usuario.municipio_id,
          viatura_id: Number(viaturaId),
          tipo,
          status,
          valor: Number(valor || 0),
          oficina,
          descricao,
          criado_por: usuario.id,
        },
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    carregar();

    setViaturaId("");
    setValor("");
    setOficina("");
    setDescricao("");
  }

  return (
    <div className="p-6">
      <div className="painel-premium p-6 mb-6">
        <h1 className="text-3xl font-black">
          Manutenções de Viaturas
        </h1>
      </div>

      <div className="painel-premium p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-4">

          <select
            className="input"
            value={viaturaId}
            onChange={(e) => setViaturaId(e.target.value)}
          >
            <option value="">
              Selecione a Viatura
            </option>

            {viaturas.map((v) => (
              <option key={v.id} value={v.id}>
                {v.prefixo} - {v.placa}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="PREVENTIVA">
              Preventiva
            </option>

            <option value="CORRETIVA">
              Corretiva
            </option>

            <option value="EMERGENCIAL">
              Emergencial
            </option>
          </select>

          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ABERTA">
              Aberta
            </option>

            <option value="EM_ANDAMENTO">
              Em andamento
            </option>

            <option value="FINALIZADA">
              Finalizada
            </option>
          </select>

          <input
            className="input"
            placeholder="Valor"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />

          <input
            className="input"
            placeholder="Oficina"
            value={oficina}
            onChange={(e) => setOficina(e.target.value)}
          />
        </div>

        <textarea
          className="input mt-4 min-h-32"
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <button
          onClick={salvar}
          className="sig-btn-gold mt-4"
        >
          Registrar Manutenção
        </button>
      </div>

      <div className="space-y-4">
        {manutencoes.map((item) => (
          <div
            key={item.id}
            className="painel-premium p-5"
          >
            <h2 className="font-black text-xl">
              {item.tipo}
            </h2>

            <p className="text-yellow-400">
              {item.status}
            </p>

            <p className="mt-2">
              Oficina: {item.oficina || "Não informada"}
            </p>

            <p>
              Valor: R$ {item.valor || 0}
            </p>

            <p className="mt-3 text-slate-300">
              {item.descricao}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}