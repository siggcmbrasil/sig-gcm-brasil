"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

type ModeloEscala = {
  id: number;
  nome: string;
  descricao: string | null;
  tipo: string;
  horas_trabalho: number;
  horas_descanso: number;
  hora_inicio: string;
  hora_fim: string;
  permite_permuta: boolean;
  ativo: boolean;
};

export default function ModelosEscalaPage() {
  const [modelos, setModelos] = useState<ModeloEscala[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("RODIZIO_GUARNICAO");
  const [horasTrabalho, setHorasTrabalho] = useState("24");
  const [horasDescanso, setHorasDescanso] = useState("96");
  const [horaInicio, setHoraInicio] = useState("07:00");
  const [horaFim, setHoraFim] = useState("07:00");
  const [permitePermuta, setPermitePermuta] = useState(true);

  const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : {};

  useEffect(() => {
    carregarModelos();
  }, []);

  async function carregarModelos() {

if (!usuarioLogado.municipio_id) {
  alert("Município não identificado.");
  return;
}
    setCarregando(true);

    const { data, error } = await supabase
  .from("escala_modelos")
  .select("*")
  .eq("municipio_id", usuarioLogado.municipio_id)
  .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar modelos de escala.");
      setCarregando(false);
      return;
    }

    setModelos(data || []);
    setCarregando(false);
  }

  async function salvarModelo() {
    if (!usuarioLogado?.id || !usuarioLogado?.municipio_id) {
  alert("Sessão inválida.");
  return;
}
    if (!nome.trim()) {
      alert("Informe o nome do modelo.");
      return;
    }

    if (nome.length > 100) {
  alert("Nome muito grande.");
  return;
}

if (descricao.length > 1000) {
  alert("Descrição muito grande.");
  return;
}

    const { error } = await supabase.from("escala_modelos").insert([
  {
    municipio_id: usuarioLogado.municipio_id,
    nome,
    descricao,
    tipo,
    horas_trabalho: Number(horasTrabalho),
    horas_descanso: Number(horasDescanso),
    hora_inicio: horaInicio,
    hora_fim: horaFim,
    permite_permuta: permitePermuta,
    ativo: true,
  },
]);

    if (error) {
      console.error(error);
      alert("Erro ao salvar modelo.");
      return;
    }

   await registrarAuditoria({
  modulo: "Escalas",
  acao: "CRIAR_MODELO",
  descricao: `Cadastrou o modelo de escala ${nome}.`,
  detalhes: {
    nome,
    tipo,
    horas_trabalho: Number(horasTrabalho),
    horas_descanso: Number(horasDescanso),
    hora_inicio: horaInicio,
    hora_fim: horaFim,
    permite_permuta: permitePermuta,
  },
});

    alert("Modelo de escala cadastrado com sucesso!");

    setNome("");
    setDescricao("");
    setTipo("RODIZIO_GUARNICAO");
    setHorasTrabalho("24");
    setHorasDescanso("96");
    setHoraInicio("07:00");
    setHoraFim("07:00");
    setPermitePermuta(true);

    carregarModelos();
  }

  async function alternarAtivo(modelo: ModeloEscala) {
    const { error } = await supabase
      .from("escala_modelos")
      .update({ ativo: !modelo.ativo })
.eq("id", modelo.id)
.eq("municipio_id", usuarioLogado.municipio_id);

    if (error) {
      console.error(error);
      alert("Erro ao atualizar modelo.");
      return;
    }

    await registrarAuditoria({
  modulo: "Escalas",
  acao: "ALTERAR_STATUS_MODELO",
  descricao: `${!modelo.ativo ? "Ativou" : "Inativou"} o modelo de escala ${modelo.nome}.`,
  detalhes: {
    modelo_id: modelo.id,
    nome: modelo.nome,
    novo_status: !modelo.ativo,
  },
});

    carregarModelos();
  }

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl font-bold">Modelos de Escala</h1>
        <p className="text-slate-400">
          Configure diferentes modelos de trabalho para cada município.
        </p>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Novo Modelo
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">Nome do modelo</label>
              <input
                className="input"
                placeholder="Ex: Plantão 24/96"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Descrição</label>
              <textarea
                className="input h-24 resize-none"
                placeholder="Descreva como funciona a escala..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Tipo</label>
              <select
                className="input"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="RODIZIO_GUARNICAO">Rodízio por guarnição</option>
                <option value="RODIZIO_GUARDA">Rodízio por guarda</option>
                <option value="EXPEDIENTE">Expediente administrativo</option>
                <option value="EVENTO">Evento</option>
                <option value="EXTRA">Plantão extra</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Horas trabalho</label>
                <input
                  type="number"
                  className="input"
                  value={horasTrabalho}
                  onChange={(e) => setHorasTrabalho(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Horas descanso</label>
                <input
                  type="number"
                  className="input"
                  value={horasDescanso}
                  onChange={(e) => setHorasDescanso(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Hora início</label>
                <input
                  type="time"
                  className="input"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Hora fim</label>
                <input
                  type="time"
                  className="input"
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                />
              </div>
            </div>

            <label className="flex items-center gap-3 text-slate-300">
              <input
                type="checkbox"
                checked={permitePermuta}
                onChange={(e) => setPermitePermuta(e.target.checked)}
              />
              Permite permuta
            </label>

            <button
              type="button"
              onClick={salvarModelo}
              className="btn-primary w-full text-lg"
            >
              Cadastrar Modelo
            </button>
          </div>
        </div>

        <div className="card xl:col-span-2">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Modelos Cadastrados
          </h2>

          {carregando ? (
            <p className="text-slate-400">Carregando modelos...</p>
          ) : modelos.length === 0 ? (
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
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-blue-400">
                        {modelo.nome}
                      </h3>

                      <p className="text-slate-400 text-sm mt-1">
                        {modelo.descricao || "Sem descrição"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => alternarAtivo(modelo)}
                      className={`px-4 py-2 rounded-lg font-semibold ${
                        modelo.ativo
                          ? "bg-green-700 hover:bg-green-800"
                          : "bg-slate-700 hover:bg-slate-800"
                      }`}
                    >
                      {modelo.ativo ? "Ativo" : "Inativo"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    <Info titulo="Tipo" valor={modelo.tipo} />
                    <Info titulo="Trabalho" valor={`${modelo.horas_trabalho}h`} />
                    <Info titulo="Descanso" valor={`${modelo.horas_descanso}h`} />
                    <Info
                      titulo="Horário"
                      valor={`${modelo.hora_inicio} às ${modelo.hora_fim}`}
                    />
                  </div>

                  <p className="text-sm mt-3 text-slate-400">
                    Permuta: {modelo.permite_permuta ? "Permitida" : "Não permitida"}
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

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3">
      <p className="text-xs text-slate-400">{titulo}</p>
      <p className="font-bold">{valor}</p>
    </div>
  );
}