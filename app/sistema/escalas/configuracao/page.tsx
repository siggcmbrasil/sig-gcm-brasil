"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Municipio = {
  id: number;
  nome: string;
  estado: string;
};

type ModeloEscala = {
  id: number;
  nome: string;
};

type Guarnicao = {
  id: number;
  nome: string;
};

type ConfigEscala = {
  id: number;
  municipio_id: number;
  modelo_escala_id: number;
  data_base: string;
  guarnicao_base_id: number;
  ordem_guarnicoes: number[];
  ativo: boolean;
};

export default function ConfiguracaoEscalaPage() {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [modelos, setModelos] = useState<ModeloEscala[]>([]);
  const [guarnicoes, setGuarnicoes] = useState<Guarnicao[]>([]);
  const [configs, setConfigs] = useState<ConfigEscala[]>([]);

  const [municipioId, setMunicipioId] = useState("");
  const [modeloId, setModeloId] = useState("");
  const [dataBase, setDataBase] = useState("");
  const [guarnicaoBaseId, setGuarnicaoBaseId] = useState("");
  const [ordemGuarnicoes, setOrdemGuarnicoes] = useState<number[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const { data: municipiosData } = await supabase
      .from("municipios")
      .select("id, nome, estado")
      .eq("ativo", true)
      .order("nome");

    const { data: modelosData } = await supabase
      .from("escala_modelos")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome");

    const { data: guarnicoesData } = await supabase
      .from("guarnicoes")
      .select("id, nome")
      .eq("ativa", true)
      .order("id");

    const { data: configsData } = await supabase
      .from("escala_operacional_config")
      .select("*")
      .order("id", { ascending: false });

    setMunicipios(municipiosData || []);
    setModelos(modelosData || []);
    setGuarnicoes(guarnicoesData || []);
    setConfigs((configsData as ConfigEscala[]) || []);
  }

  function alternarGuarnicao(id: number) {
    if (ordemGuarnicoes.includes(id)) {
      setOrdemGuarnicoes(ordemGuarnicoes.filter((item) => item !== id));
      return;
    }

    setOrdemGuarnicoes([...ordemGuarnicoes, id]);
  }

  async function salvarConfiguracao() {
    if (
      !municipioId ||
      !modeloId ||
      !dataBase ||
      !guarnicaoBaseId ||
      ordemGuarnicoes.length === 0
    ) {
      alert("Preencha todos os campos.");
      return;
    }

    const { error } = await supabase.from("escala_operacional_config").insert([
      {
        municipio_id: Number(municipioId),
        modelo_escala_id: Number(modeloId),
        data_base: dataBase,
        guarnicao_base_id: Number(guarnicaoBaseId),
        ordem_guarnicoes: ordemGuarnicoes,
        ativo: true,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Erro ao salvar configuração.");
      return;
    }

    alert("Configuração salva com sucesso!");

    setMunicipioId("");
    setModeloId("");
    setDataBase("");
    setGuarnicaoBaseId("");
    setOrdemGuarnicoes([]);

    carregarDados();
  }

  function nomeMunicipio(id: number) {
    const item = municipios.find((m) => m.id === id);
    return item ? `${item.nome} - ${item.estado}` : `ID ${id}`;
  }

  function nomeModelo(id: number) {
    return modelos.find((m) => m.id === id)?.nome || `ID ${id}`;
  }

  function nomeGuarnicao(id: number) {
    return guarnicoes.find((g) => g.id === id)?.nome || `ID ${id}`;
  }

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl font-bold">
          ⚙️ Configuração da Escala Automática
        </h1>

        <p className="text-slate-400">
          Configure o rodízio de guarnições por município e modelo de escala.
        </p>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Nova Configuração</h2>

          <div className="space-y-4">
            <div>
              <label className="label">Município</label>
              <select
                className="input"
                value={municipioId}
                onChange={(e) => setMunicipioId(e.target.value)}
              >
                <option value="">Selecione</option>
                {municipios.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome} - {m.estado}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Modelo de escala</label>
              <select
                className="input"
                value={modeloId}
                onChange={(e) => setModeloId(e.target.value)}
              >
                <option value="">Selecione</option>
                {modelos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Data base</label>
              <input
                type="date"
                className="input"
                value={dataBase}
                onChange={(e) => setDataBase(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Guarnição da data base</label>
              <select
                className="input"
                value={guarnicaoBaseId}
                onChange={(e) => setGuarnicaoBaseId(e.target.value)}
              >
                <option value="">Selecione</option>
                {guarnicoes.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Ordem do rodízio</label>

              <div className="space-y-2">
                {guarnicoes.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => alternarGuarnicao(g.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border ${
                      ordemGuarnicoes.includes(g.id)
                        ? "bg-blue-700 border-blue-500"
                        : "bg-slate-900 border-slate-700"
                    }`}
                  >
                    {ordemGuarnicoes.includes(g.id)
                      ? `${ordemGuarnicoes.indexOf(g.id) + 1}. ${g.nome}`
                      : g.nome}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={salvarConfiguracao}
              className="btn-primary w-full"
            >
              Salvar Configuração
            </button>
          </div>
        </div>

        <div className="card xl:col-span-2">
          <h2 className="text-xl font-bold mb-4">
            Configurações Cadastradas
          </h2>

          {configs.length === 0 ? (
            <p className="text-slate-400">
              Nenhuma configuração cadastrada.
            </p>
          ) : (
            <div className="space-y-4">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className="bg-slate-950/40 border border-slate-700 rounded-xl p-4"
                >
                  <h3 className="text-xl font-bold text-blue-400">
                    {nomeMunicipio(config.municipio_id)}
                  </h3>

                  <p className="text-slate-300 mt-2">
                    📅 Modelo: {nomeModelo(config.modelo_escala_id)}
                  </p>

                  <p className="text-slate-300">
                    🗓️ Data base: {config.data_base}
                  </p>

                  <p className="text-slate-300">
                    👮 Guarnição base: {nomeGuarnicao(config.guarnicao_base_id)}
                  </p>

                  <p className="text-slate-400 mt-3">
                    Ordem:{" "}
                    {config.ordem_guarnicoes
                      .map((id) => nomeGuarnicao(id))
                      .join(" → ")}
                  </p>

                  <p className="text-sm mt-2 text-green-400">
                    {config.ativo ? "Ativa" : "Inativa"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}