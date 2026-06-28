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
  const [locais, setLocais] = useState<any[]>([]);
  const [localId, setLocalId] = useState("");

  const [guarnicoes, setGuarnicoes] = useState<any[]>([]);
  const [guarnicaoId, setGuarnicaoId] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    const { data } = await supabase
  .from("visitas")
  .select(`*,guarnicoes (nome)`)
  .eq("municipio_id", usuario.municipio_id)
  .order("data_visita", { ascending: false });

    setVisitas(data || []);
  }

  useEffect(() => {
  if (usuario?.municipio_id) {
    carregar();
    carregarLocais();
    carregarGuarnicoes();
  }
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
  guarnicao_id: guarnicaoId ? Number(guarnicaoId) : null,
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
    setGuarnicaoId("");
    setLocalId("");

    carregar();
  }

async function carregarGuarnicoes() {
  const { data } = await supabase
    .from("guarnicoes")
    .select("id,nome")
    .eq("municipio_id", usuario.municipio_id)
    .eq("ativa", true)
    .order("nome");

  setGuarnicoes(data || []);
}

  async function carregarLocais() {
  const { data } = await supabase
    .from("locais")
    .select("id,nome,tipo")
    .eq("municipio_id", usuario.municipio_id)
    .eq("ativo", true)
    .order("nome");

  setLocais(data || []);
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

          <select
  className="input"
  value={guarnicaoId}
  onChange={(e) => setGuarnicaoId(e.target.value)}
>
  <option value="">Selecione a Guarnição</option>

  {guarnicoes.map((g) => (
    <option key={g.id} value={g.id}>
      {g.nome}
    </option>
  ))}
</select>

          <select
  className="input"
  value={localId}
  onChange={(e) => {
    const id = e.target.value;

    setLocalId(id);

    const localSelecionado = locais.find(
      (l) => String(l.id) === id
    );

    setLocal(localSelecionado?.nome || "");
  }}
>
  <option value="">
    Selecione um local
  </option>

  {locais.map((item) => (
    <option
      key={item.id}
      value={item.id}
    >
      {item.nome}
      {item.tipo ? ` - ${item.tipo.replaceAll("_", " ")}` : ""}
    </option>
  ))}
</select>

<input
  className="input mt-3"
  placeholder="Ou digite outro local"
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

<p className="text-3xl">
  {item.tipo === "GUARDA_ESCOLA" && "🏫"}
  {item.tipo === "COMUNIDADE" && "🏘️"}
  {item.tipo === "COMERCIO" && "🏪"}
  {item.tipo === "PATRULHA_PREVENTIVA" && "🚔"}
  {item.tipo === "PROJETO_SOCIAL" && "🤝"}
  {item.tipo === "FISCALIZACAO" && "📋"}
</p>

            <h2 className="font-black text-xl">
              {item.tipo}
            </h2>

            {item.guarnicoes?.nome && (
            <p className="text-blue-400 text-sm">
            🚔 {item.guarnicoes.nome}
            </p>
            )}

            <p className="text-yellow-400">
              {item.local}
            </p>

            {item.responsavel && (
            <p className="text-slate-400 text-sm">
            👤 {item.responsavel}
            </p>
            )}

            {item.participantes && (
            <p className="text-slate-400 text-sm mt-1">
            👥 {item.participantes}
            </p>
            )}

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