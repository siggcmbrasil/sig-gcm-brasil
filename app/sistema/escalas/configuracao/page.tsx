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
  municipio_id: number;
  nome: string;
  tipo: string;
  horario_inicio: string | null;
  horario_fim: string | null;
  ativo: boolean;
};

type GrupoEscala = {
  id: number;
  modelo_id: number;
  nome: string;
  ordem: number;
};

export default function ConfiguracaoEscalaPage() {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [modelos, setModelos] = useState<ModeloEscala[]>([]);
  const [grupos, setGrupos] = useState<GrupoEscala[]>([]);

  const [municipioId, setMunicipioId] = useState("");
  const [nomeModelo, setNomeModelo] = useState("");
  const [tipo, setTipo] = useState("Plantão");
  const [horarioInicio, setHorarioInicio] = useState("07:00");
  const [horarioFim, setHorarioFim] = useState("07:00");
  const [quantidadeGrupos, setQuantidadeGrupos] = useState("5");

  const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : {};

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {

    if (!usuarioLogado.municipio_id) {
  alert("Município não identificado.");
  return;
}

setMunicipioId(
  String(usuarioLogado.municipio_id)
);

    const { data: municipiosData } = await supabase
      .from("municipios")
      .select("id, nome, estado")
      .eq("ativo", true)
      .order("nome");

    const { data: modelosData } = await supabase
  .from("modelos_escala")
  .select("*")
  .eq("municipio_id", usuarioLogado.municipio_id)
  .order("id", { ascending: false });

    const modelosIds =
  (modelosData || []).map((m) => m.id);

const { data: gruposData } = await supabase
  .from("grupos_escala")
  .select("*")
  .in("modelo_id", modelosIds)
  .order("ordem", { ascending: true });

    setMunicipios(municipiosData || []);
    setModelos((modelosData as ModeloEscala[]) || []);
    setGrupos((gruposData as GrupoEscala[]) || []);
  }

  async function salvarModelo() {
    if (!usuarioLogado.municipio_id || !nomeModelo || !tipo || !quantidadeGrupos) {
      alert("Preencha município, nome, tipo e quantidade de grupos.");
      return;
    }

    const quantidade = Number(quantidadeGrupos);

    if (quantidade < 0 || quantidade > 12) {
      alert("A quantidade de grupos deve ser entre 0 e 12.");
      return;
    }

    const { data: modeloCriado, error } = await supabase
      .from("modelos_escala")
      .insert([
        {
          municipio_id: usuarioLogado.municipio_id,
          nome: nomeModelo,
          tipo,
          horario_inicio: horarioInicio,
          horario_fim: horarioFim,
          ativo: true,
        },
      ])
      .select()
      .single();

    if (error || !modeloCriado) {
      console.error("Erro completo ao criar modelo:", JSON.stringify(error, null, 2));

alert(
  `Erro ao criar modelo de escala:\n${
    error?.message || error?.details || error?.hint || "Erro desconhecido"
  }`
);
      return;
    }

    if (quantidade > 0) {
      const gruposParaCriar = Array.from({ length: quantidade }, (_, index) => ({
        modelo_id: modeloCriado.id,
        nome:
          tipo === "Plantão"
            ? `Plantão ${index + 1}`
            : `${tipo} ${index + 1}`,
        ordem: index + 1,
      }));

      const { error: gruposError } = await supabase
        .from("grupos_escala")
        .insert(gruposParaCriar);

      if (gruposError) {
        console.error(gruposError);
        alert("Modelo criado, mas houve erro ao criar os grupos.");
      }
    }

    alert("Modelo de escala criado com sucesso!");

    setNomeModelo("");
    setTipo("Plantão");
    setHorarioInicio("07:00");
    setHorarioFim("07:00");
    setQuantidadeGrupos("5");

    carregarDados();
  }

  async function renomearGrupo(id: number, nomeAtual: string) {
    const novoNome = prompt("Digite o novo nome do grupo:", nomeAtual);

    if (!novoNome) return;

    const { error } = await supabase
      .from("grupos_escala")
      .update({ nome: novoNome })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao renomear grupo.");
      return;
    }

    carregarDados();
  }

  function nomeMunicipio(id: number) {
    const municipio = municipios.find((m) => m.id === id);
    return municipio ? `${municipio.nome} - ${municipio.estado}` : `ID ${id}`;
  }

  function gruposDoModelo(modeloId: number) {
    return grupos.filter((g) => g.modelo_id === modeloId);
  }

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl font-bold">
          ⚙️ Configuração de Escalas
        </h1>

        <p className="text-slate-400">
          Cada município pode criar seus próprios tipos de escala, nomes e grupos.
        </p>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Novo Modelo de Escala</h2>

          <div className="space-y-4">
           
                       <div>
              <label className="label">Nome da escala</label>
              <input
                className="input"
                value={nomeModelo}
                onChange={(e) => setNomeModelo(e.target.value)}
                placeholder="Ex: Escala Operacional 24/96"
              />
            </div>

            <div>
              <label className="label">Tipo da escala</label>
              <select
                className="input"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option>Plantão</option>
                <option>Administrativo</option>
                <option>Escala Extra</option>
                <option>Evento</option>
                <option>Férias</option>
                <option>Licença</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Horário início</label>
                <input
                  type="time"
                  className="input"
                  value={horarioInicio}
                  onChange={(e) => setHorarioInicio(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Horário fim</label>
                <input
                  type="time"
                  className="input"
                  value={horarioFim}
                  onChange={(e) => setHorarioFim(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label">Quantidade de grupos</label>
              <input
                type="number"
                className="input"
                value={quantidadeGrupos}
                onChange={(e) => setQuantidadeGrupos(e.target.value)}
                placeholder="Ex: 5"
              />
            </div>

            <button
              type="button"
              onClick={salvarModelo}
              className="btn-primary w-full"
            >
              Criar Modelo de Escala
            </button>
          </div>
        </div>

        <div className="card xl:col-span-2">
          <h2 className="text-xl font-bold mb-4">
            Modelos Cadastrados
          </h2>

          {modelos.length === 0 ? (
            <p className="text-slate-400">
              Nenhum modelo de escala cadastrado.
            </p>
          ) : (
            <div className="space-y-4">
              {modelos.map((modelo) => (
                <div
                  key={modelo.id}
                  className="bg-slate-950/40 border border-slate-700 rounded-xl p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-blue-400">
                        {modelo.nome}
                      </h3>

                      <p className="text-slate-300 mt-1">
                        Município: {nomeMunicipio(modelo.municipio_id)}
                      </p>

                      <p className="text-slate-400">
                        Tipo: {modelo.tipo} • Horário:{" "}
                        {modelo.horario_inicio || "--:--"} às{" "}
                        {modelo.horario_fim || "--:--"}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${
                        modelo.ativo
                          ? "bg-green-900/40 text-green-400"
                          : "bg-red-900/40 text-red-400"
                      }`}
                    >
                      {modelo.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="font-bold mb-2">Grupos:</p>

                    {gruposDoModelo(modelo.id).length === 0 ? (
                      <p className="text-slate-500 text-sm">
                        Este modelo não possui grupos.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {gruposDoModelo(modelo.id).map((grupo) => (
                          <button
                            key={grupo.id}
                            type="button"
                            onClick={() =>
                              renomearGrupo(grupo.id, grupo.nome)
                            }
                            className="text-left bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 hover:border-blue-500"
                          >
                            <span className="text-blue-400 font-bold">
                              {grupo.ordem}.
                            </span>{" "}
                            {grupo.nome}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}