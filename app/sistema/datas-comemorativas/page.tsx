"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DatasComemorativasPage() {
  const [datas, setDatas] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("CAMPANHA");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [visibilidade, setVisibilidade] = useState("INTERNA");
  const [descricao, setDescricao] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    const { data, error } = await supabase
      .from("datas_comemorativas")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("data_inicio", { ascending: true });

    if (error) {
      alert("Erro ao carregar datas.");
      return;
    }

    setDatas(data || []);
  }

  useEffect(() => {
    if (usuario?.municipio_id) carregar();
  }, []);

  async function salvar() {
    if (!titulo || !dataInicio) {
      alert("Preencha título e data inicial.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("datas_comemorativas").insert([
      {
        municipio_id: usuario.municipio_id,
        criado_por: usuario.id,
        titulo,
        categoria,
        data_inicio: dataInicio,
        data_fim: dataFim || null,
        visibilidade,
        descricao,
        ativo: true,
      },
    ]);

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    setTitulo("");
    setCategoria("CAMPANHA");
    setDataInicio("");
    setDataFim("");
    setVisibilidade("INTERNA");
    setDescricao("");

    carregar();
  }

  return (
    <div className="p-6">
      <div className="painel-premium p-6 mb-6">
        <h1 className="text-3xl font-black">Datas Comemorativas e Campanhas</h1>
        <p className="text-slate-400 mt-2">
          Controle de campanhas, aniversários, feriados e datas institucionais.
        </p>
      </div>

      <div className="painel-premium p-6 mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <input
            className="input"
            placeholder="Título"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />

          <select
            className="input"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="CAMPANHA">Campanha</option>
            <option value="ANIVERSARIO">Aniversário</option>
            <option value="FERIADO">Feriado</option>
            <option value="EVENTO">Evento</option>
            <option value="DATA_CIVICA">Data Cívica</option>
            <option value="INSTITUCIONAL">Institucional</option>
            <option value="OUTRO">Outro</option>
          </select>

          <select
            className="input"
            value={visibilidade}
            onChange={(e) => setVisibilidade(e.target.value)}
          >
            <option value="INTERNA">Interna</option>
            <option value="PUBLICA">Portal Cidadão</option>
            <option value="AMBAS">Interna e Pública</option>
          </select>

          <input
            className="input"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />

          <input
            className="input"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>

        <textarea
          className="input mt-4 min-h-32"
          placeholder="Descrição / mensagem da campanha"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <button onClick={salvar} disabled={salvando} className="sig-btn-gold mt-4">
          {salvando ? "Salvando..." : "Cadastrar Data"}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {datas.map((item) => (
          <div key={item.id} className="painel-premium p-5">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                {item.categoria}
              </span>

              <span className="bg-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                {item.visibilidade}
              </span>
            </div>

            <h2 className="text-xl font-black">{item.titulo}</h2>

            <p className="text-slate-400 mt-2">
              {item.data_inicio
                ? new Date(item.data_inicio).toLocaleDateString("pt-BR")
                : "Sem data"}
              {item.data_fim
                ? ` até ${new Date(item.data_fim).toLocaleDateString("pt-BR")}`
                : ""}
            </p>

            {item.descricao && (
              <p className="text-slate-300 mt-3 whitespace-pre-wrap">
                {item.descricao}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}