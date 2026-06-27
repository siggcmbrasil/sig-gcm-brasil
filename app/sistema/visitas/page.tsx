"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function VisitasPage() {
  const [visitas, setVisitas] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [tipo, setTipo] = useState("GUARDA_ESCOLA");
  const [local, setLocal] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [participantes, setParticipantes] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataVisita, setDataVisita] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    const { data } = await supabase
      .from("visitas")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("data_visita", { ascending: false });

    setVisitas(data || []);
  }

  useEffect(() => {
    if (usuario?.municipio_id) carregar();
  }, []);

  async function salvar() {
    if (!local || !dataVisita) {
      alert("Informe local e data.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase
      .from("visitas")
      .insert([
        {
          municipio_id: usuario.municipio_id,
          criado_por: usuario.id,
          tipo,
          local,
          responsavel,
          participantes,
          descricao,
          data_visita: dataVisita,
        },
      ]);

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    setLocal("");
    setResponsavel("");
    setParticipantes("");
    setDescricao("");
    setDataVisita("");

    carregar();
  }

  return (
    <div className="p-6">
      <div className="painel-premium p-6 mb-6">
        <h1 className="text-3xl font-black">
          Visitas e Ações Preventivas
        </h1>
      </div>

      <div className="painel-premium p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-4">

          <select
            className="input"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="GUARDA_ESCOLA">Guarda na Escola</option>
            <option value="COMUNIDADE">Comunidade</option>
            <option value="FEIRA_LIVRE">Feira Livre</option>
            <option value="COMERCIO">Comércio</option>
            <option value="INSTITUCIONAL">Institucional</option>
            <option value="PATRULHA_PREVENTIVA">Patrulha Preventiva</option>
            <option value="PROJETO_SOCIAL">Projeto Social</option>
            <option value="FISCALIZACAO">Fiscalização</option>
            <option value="OUTRO">Outro</option>
          </select>

          <input
            className="input"
            placeholder="Local"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
          />

          <input
            className="input"
            placeholder="Responsável"
            value={responsavel}
            onChange={(e) => setResponsavel(e.target.value)}
          />

          <input
            className="input"
            placeholder="Participantes"
            value={participantes}
            onChange={(e) => setParticipantes(e.target.value)}
          />

          <input
            type="datetime-local"
            className="input"
            value={dataVisita}
            onChange={(e) => setDataVisita(e.target.value)}
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
          {salvando ? "Salvando..." : "Registrar Visita"}
        </button>
      </div>

      <div className="space-y-4">
        {visitas.map((item) => (
          <div
            key={item.id}
            className="painel-premium p-5"
          >
            <h2 className="font-black text-xl">
              {item.tipo}
            </h2>

            <p className="text-yellow-400">
              {item.local}
            </p>

            <p className="text-slate-300 mt-3">
              {item.descricao}
            </p>

            <p className="text-xs text-slate-500 mt-3">
              {new Date(item.data_visita).toLocaleString("pt-BR")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}