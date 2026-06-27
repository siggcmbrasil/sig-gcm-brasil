"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DanosViaturasPage() {
  const [registros, setRegistros] = useState<any[]>([]);
  const [viaturas, setViaturas] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [viaturaId, setViaturaId] = useState("");
  const [tipoProblema, setTipoProblema] = useState("AVARIA");
  const [prioridade, setPrioridade] = useState("NORMAL");
  const [status, setStatus] = useState("ABERTO");
  const [descricao, setDescricao] = useState("");

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

    const { data: listaRegistros } = await supabase
      .from("danos_viaturas")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    setViaturas(listaViaturas || []);
    setRegistros(listaRegistros || []);
  }

  useEffect(() => {
    if (usuario?.municipio_id) carregar();
  }, []);

  async function salvar() {
    if (!viaturaId || !descricao) {
      alert("Selecione a viatura e descreva o problema.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("danos_viaturas").insert([
      {
        municipio_id: usuario.municipio_id,
        criado_por: usuario.id,
        viatura_id: Number(viaturaId),
        tipo_problema: tipoProblema,
        prioridade,
        status,
        descricao,
      },
    ]);

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    setViaturaId("");
    setTipoProblema("AVARIA");
    setPrioridade("NORMAL");
    setStatus("ABERTO");
    setDescricao("");

    carregar();
  }

  return (
    <div className="p-6">
      <div className="painel-premium p-6 mb-6">
        <h1 className="text-3xl font-black">Danos e Problemas em Viaturas</h1>
        <p className="text-slate-400 mt-2">
          Registro rápido de avarias, defeitos e problemas operacionais.
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
                {v.prefixo || "Sem prefixo"} - {v.placa || "Sem placa"}{" "}
                {v.modelo ? `- ${v.modelo}` : ""}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={tipoProblema}
            onChange={(e) => setTipoProblema(e.target.value)}
          >
            <option value="AVARIA">Avaria</option>
            <option value="MANUTENCAO">Manutenção</option>
            <option value="PNEU">Pneu</option>
            <option value="FREIO">Freio</option>
            <option value="MOTOR">Motor</option>
            <option value="ELETRICA">Elétrica</option>
            <option value="GIROFLEX">Giroflex</option>
            <option value="SIRENE">Sirene</option>
            <option value="LIMPEZA">Limpeza</option>
            <option value="OUTRO">Outro</option>
          </select>

          <select
            className="input"
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value)}
          >
            <option value="NORMAL">Normal</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </select>

          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ABERTO">Aberto</option>
            <option value="EM_ANALISE">Em análise</option>
            <option value="EM_MANUTENCAO">Em manutenção</option>
            <option value="RESOLVIDO">Resolvido</option>
          </select>
        </div>

        <textarea
          className="input mt-4 min-h-32"
          placeholder="Descreva o problema encontrado"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <button onClick={salvar} disabled={salvando} className="sig-btn-gold mt-4">
          {salvando ? "Salvando..." : "Registrar Problema"}
        </button>
      </div>

      <div className="space-y-4">
        {registros.map((item) => (
          <div key={item.id} className="painel-premium p-5">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                {item.tipo_problema}
              </span>

              <span className="bg-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                {item.prioridade}
              </span>

              <span className="bg-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                {item.status}
              </span>
            </div>

            <h2 className="text-xl font-black">Viatura #{item.viatura_id}</h2>

            <p className="text-slate-300 mt-3 whitespace-pre-wrap">
              {item.descricao}
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