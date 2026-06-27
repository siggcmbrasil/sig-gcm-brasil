"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PatrimonioPage() {
  const [itens, setItens] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("EQUIPAMENTO");
  const [patrimonio, setPatrimonio] = useState("");
  const [status, setStatus] = useState("OPERACIONAL");
  const [local, setLocal] = useState("");
  const [observacao, setObservacao] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    const { data } = await supabase
      .from("patrimonios")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    setItens(data || []);
  }

  useEffect(() => {
    if (usuario?.municipio_id) carregar();
  }, []);

  async function salvar() {
    if (!nome || !categoria) {
      alert("Preencha nome e categoria.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("patrimonios").insert([
      {
        municipio_id: usuario.municipio_id,
        criado_por: usuario.id,
        nome,
        categoria,
        numero_patrimonio: patrimonio,
        status,
        local,
        observacao,
      },
    ]);

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    setNome("");
    setCategoria("EQUIPAMENTO");
    setPatrimonio("");
    setStatus("OPERACIONAL");
    setLocal("");
    setObservacao("");

    carregar();
  }

  return (
    <div className="p-6">
      <div className="painel-premium p-6 mb-6">
        <h1 className="text-3xl font-black">Patrimônio e Equipamentos</h1>
        <p className="text-slate-400 mt-2">
          Controle de equipamentos, móveis, eletrônicos e bens da unidade.
        </p>
      </div>

      <div className="painel-premium p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <input
            className="input"
            placeholder="Nome do item"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <select
            className="input"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="EQUIPAMENTO">Equipamento</option>
            <option value="CELULAR">Celular</option>
            <option value="COMPUTADOR">Computador</option>
            <option value="IMPRESSORA">Impressora</option>
            <option value="TV">TV</option>
            <option value="RADIO">Rádio</option>
            <option value="MOBILIARIO">Mobiliário</option>
            <option value="COZINHA">Cozinha</option>
            <option value="AR_CONDICIONADO">Ar-condicionado</option>
            <option value="OUTRO">Outro</option>
          </select>

          <input
            className="input"
            placeholder="Número de patrimônio"
            value={patrimonio}
            onChange={(e) => setPatrimonio(e.target.value)}
          />

          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="OPERACIONAL">Operacional</option>
            <option value="DANIFICADO">Danificado</option>
            <option value="EM_MANUTENCAO">Em manutenção</option>
            <option value="BAIXADO">Baixado</option>
            <option value="EXTRAVIADO">Extraviado</option>
          </select>

          <input
            className="input"
            placeholder="Local onde está"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
          />
        </div>

        <textarea
          className="input mt-4 min-h-32"
          placeholder="Observações / estado de conservação"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />

        <button onClick={salvar} disabled={salvando} className="sig-btn-gold mt-4">
          {salvando ? "Salvando..." : "Cadastrar Item"}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {itens.map((item) => (
          <div key={item.id} className="painel-premium p-5">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                {item.categoria}
              </span>

              <span className="bg-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                {item.status}
              </span>
            </div>

            <h2 className="text-xl font-black">{item.nome}</h2>

            <p className="text-yellow-400 mt-1">
              Patrimônio: {item.numero_patrimonio || "Não informado"}
            </p>

            <p className="text-slate-400 mt-2">
              Local: {item.local || "Não informado"}
            </p>

            {item.observacao && (
              <p className="text-slate-300 mt-3 whitespace-pre-wrap">
                {item.observacao}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}