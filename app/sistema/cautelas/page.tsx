"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CautelasPage() {
  const [armas, setArmas] = useState<any[]>([]);
  const [guardas, setGuardas] = useState<any[]>([]);
  const [cautelas, setCautelas] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [armaId, setArmaId] = useState("");
  const [guardaId, setGuardaId] = useState("");
  const [tipo, setTipo] = useState("RETIRADA");
  const [quantidadeMunicao, setQuantidadeMunicao] = useState("");
  const [observacao, setObservacao] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    const { data: listaArmas } = await supabase
      .from("armamentos")
      .select("id, tipo, marca, modelo, numero_serie, status")
      .eq("municipio_id", usuario.municipio_id)
      .order("id", { ascending: false });

    const { data: listaGuardas } = await supabase
      .from("guardas")
      .select("id, nome, matricula")
      .eq("municipio_id", usuario.municipio_id)
      .order("nome");

    const { data: listaCautelas } = await supabase
      .from("cautelas_armamento")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    setArmas(listaArmas || []);
    setGuardas(listaGuardas || []);
    setCautelas(listaCautelas || []);
  }

  useEffect(() => {
    if (usuario?.municipio_id) carregar();
  }, []);

  async function salvar() {
    if (!armaId || !guardaId) {
      alert("Selecione a arma e o guarda.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("cautelas_armamento").insert([
      {
        municipio_id: usuario.municipio_id,
        criado_por: usuario.id,
        armamento_id: Number(armaId),
        guarda_id: Number(guardaId),
        tipo,
        quantidade_municao: quantidadeMunicao ? Number(quantidadeMunicao) : 0,
        observacao,
      },
    ]);

    if (!error) {
      await supabase
        .from("armamentos")
        .update({
          status: tipo === "RETIRADA" ? "CAUTELADA" : "DISPONIVEL",
        })
        .eq("id", Number(armaId))
        .eq("municipio_id", usuario.municipio_id);
    }

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    setArmaId("");
    setGuardaId("");
    setTipo("RETIRADA");
    setQuantidadeMunicao("");
    setObservacao("");

    carregar();
  }

  function nomeGuarda(id: number) {
    const guarda = guardas.find((g) => Number(g.id) === Number(id));
    return guarda ? `${guarda.nome} - ${guarda.matricula || "S/M"}` : `Guarda #${id}`;
  }

  function nomeArma(id: number) {
    const arma = armas.find((a) => Number(a.id) === Number(id));
    return arma
      ? `${arma.tipo} ${arma.marca || ""} ${arma.modelo || ""} - ${arma.numero_serie || "S/S"}`
      : `Armamento #${id}`;
  }

  return (
    <div className="p-6">
      <div className="painel-premium p-6 mb-6">
        <h1 className="text-3xl font-black">Cautelas de Armamento</h1>
        <p className="text-slate-400 mt-2">
          Controle de retirada e devolução de armas e munições.
        </p>
      </div>

      <div className="painel-premium p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <select
            className="input"
            value={armaId}
            onChange={(e) => setArmaId(e.target.value)}
          >
            <option value="">Selecione o armamento</option>
            {armas.map((arma) => (
              <option key={arma.id} value={arma.id}>
                {arma.tipo} - {arma.marca} {arma.modelo} - {arma.numero_serie}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={guardaId}
            onChange={(e) => setGuardaId(e.target.value)}
          >
            <option value="">Selecione o guarda</option>
            {guardas.map((guarda) => (
              <option key={guarda.id} value={guarda.id}>
                {guarda.nome} - {guarda.matricula || "S/M"}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="RETIRADA">Retirada</option>
            <option value="DEVOLUCAO">Devolução</option>
          </select>

          <input
            className="input"
            placeholder="Quantidade de munições"
            value={quantidadeMunicao}
            onChange={(e) => setQuantidadeMunicao(e.target.value.replace(/\D/g, ""))}
          />
        </div>

        <textarea
          className="input mt-4 min-h-32"
          placeholder="Observações / estado do armamento / munições"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />

        <button onClick={salvar} disabled={salvando} className="sig-btn-gold mt-4">
          {salvando ? "Salvando..." : "Registrar Cautela"}
        </button>
      </div>

      <div className="space-y-4">
        {cautelas.map((item) => (
          <div key={item.id} className="painel-premium p-5">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                {item.tipo}
              </span>

              <span className="bg-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                Munições: {item.quantidade_municao || 0}
              </span>
            </div>

            <h2 className="text-xl font-black">
              {nomeGuarda(item.guarda_id)}
            </h2>

            <p className="text-slate-300 mt-2">
              {nomeArma(item.armamento_id)}
            </p>

            {item.observacao && (
              <p className="text-slate-400 mt-3 whitespace-pre-wrap">
                {item.observacao}
              </p>
            )}

            <p className="text-xs text-slate-500 mt-4">
              {new Date(item.criado_em).toLocaleString("pt-BR")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}