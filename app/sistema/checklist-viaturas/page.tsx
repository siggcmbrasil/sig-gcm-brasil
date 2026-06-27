"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ChecklistViaturasPage() {
  const [viaturas, setViaturas] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [viaturaId, setViaturaId] = useState("");
  const [km, setKm] = useState("");
  const [combustivel, setCombustivel] = useState("CHEIO");
  const [status, setStatus] = useState("APROVADA");
  const [observacao, setObservacao] = useState("");

  const [itens, setItens] = useState({
    pneus: true,
    freios: true,
    farois: true,
    sirene: true,
    giroflex: true,
    oleo: true,
    agua: true,
    documentos: true,
    limpeza: true,
    equipamentos: true,
  });

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    const { data: listaViaturas } = await supabase
      .from("viaturas")
      .select("id, prefixo, placa, modelo")
      .eq("municipio_id", usuario.municipio_id)
      .order("prefixo");

    const { data: listaChecklists } = await supabase
      .from("checklists_viaturas")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    setViaturas(listaViaturas || []);
    setChecklists(listaChecklists || []);
  }

  useEffect(() => {
    if (usuario?.municipio_id) carregar();
  }, []);

  function alterarItem(nome: keyof typeof itens) {
    setItens((atual) => ({
      ...atual,
      [nome]: !atual[nome],
    }));
  }

  async function salvar() {
    if (!viaturaId) {
      alert("Selecione a viatura.");
      return;
    }

    setSalvando(true);

    const possuiProblema = Object.values(itens).some((valor) => valor === false);

    const { error } = await supabase.from("checklists_viaturas").insert([
      {
        municipio_id: usuario.municipio_id,
        criado_por: usuario.id,
        viatura_id: Number(viaturaId),
        km: km || null,
        combustivel,
        status: possuiProblema ? "COM_RESTRICAO" : status,
        itens,
        observacao,
      },
    ]);

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    setViaturaId("");
    setKm("");
    setCombustivel("CHEIO");
    setStatus("APROVADA");
    setObservacao("");
    setItens({
      pneus: true,
      freios: true,
      farois: true,
      sirene: true,
      giroflex: true,
      oleo: true,
      agua: true,
      documentos: true,
      limpeza: true,
      equipamentos: true,
    });

    carregar();
  }

  return (
    <div className="p-6">
      <div className="painel-premium p-6 mb-6">
        <h1 className="text-3xl font-black">Checklist de Viaturas</h1>
        <p className="text-slate-400 mt-2">
          Conferência rápida da viatura antes ou após o serviço.
        </p>
      </div>

      <div className="painel-premium p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <select
            className="input"
            value={viaturaId}
            onChange={(e) => setViaturaId(e.target.value)}
          >
            <option value="">Selecione a viatura</option>
            {viaturas.map((v) => (
              <option key={v.id} value={v.id}>
                {v.prefixo || "Sem prefixo"} - {v.placa || "Sem placa"}
              </option>
            ))}
          </select>

          <input
            className="input"
            placeholder="Quilometragem"
            value={km}
            onChange={(e) => setKm(e.target.value.replace(/\D/g, ""))}
          />

          <select
            className="input"
            value={combustivel}
            onChange={(e) => setCombustivel(e.target.value)}
          >
            <option value="CHEIO">Cheio</option>
            <option value="3/4">3/4</option>
            <option value="1/2">1/2</option>
            <option value="1/4">1/4</option>
            <option value="RESERVA">Reserva</option>
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-3 mt-6">
          {Object.entries(itens).map(([chave, valor]) => (
            <button
              key={chave}
              type="button"
              onClick={() => alterarItem(chave as keyof typeof itens)}
              className={`rounded-xl p-4 text-left font-bold border ${
                valor
                  ? "bg-green-900/40 border-green-600 text-green-300"
                  : "bg-red-900/40 border-red-600 text-red-300"
              }`}
            >
              {valor ? "✅" : "⚠️"} {chave.toUpperCase()}
            </button>
          ))}
        </div>

        <textarea
          className="input mt-4 min-h-32"
          placeholder="Observações / problemas encontrados"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />

        <button onClick={salvar} disabled={salvando} className="sig-btn-gold mt-4">
          {salvando ? "Salvando..." : "Salvar Checklist"}
        </button>
      </div>

      <div className="space-y-4">
        {checklists.map((item) => (
          <div key={item.id} className="painel-premium p-5">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                Viatura #{item.viatura_id}
              </span>

              <span className="bg-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                {item.status}
              </span>

              <span className="bg-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                KM: {item.km || "N/I"}
              </span>
            </div>

            <p className="text-slate-300 whitespace-pre-wrap">
              {item.observacao || "Sem observações."}
            </p>

            <p className="text-xs text-slate-500 mt-4">
              {new Date(item.criado_em).toLocaleString("pt-BR")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}