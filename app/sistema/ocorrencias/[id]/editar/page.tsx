"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EditarOcorrencia() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [carregando, setCarregando] = useState(true);

  const [tipo, setTipo] = useState("");
  const [status, setStatus] = useState("");
  const [bairro, setBairro] = useState("");
  const [local, setLocal] = useState("");
  const [numero, setNumero] = useState("");
  const [envolvidos, setEnvolvidos] = useState("");
  const [descricao, setDescricao] = useState("");

  async function carregarOcorrencia() {
    const { data, error } = await supabase
      .from("ocorrencias")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      alert("Erro ao carregar ocorrência.");
      setCarregando(false);
      return;
    }

    setTipo(data.tipo || "");
    setStatus(data.status || "Aberta");
    setBairro(data.bairro || "");
    setLocal(data.local || "");
    setNumero(data.numero || "");
    setEnvolvidos(data.envolvidos || "");
    setDescricao(data.descricao || "");

    setCarregando(false);
  }

  async function atualizarOcorrencia() {
    if (!tipo || !local || !descricao) {
      alert("Preencha tipo, local e descrição.");
      return;
    }

    const { error } = await supabase
      .from("ocorrencias")
      .update({
        tipo,
        status,
        bairro,
        local,
        numero,
        envolvidos,
        descricao,
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao atualizar ocorrência.");
      return;
    }

    alert("Ocorrência atualizada com sucesso!");
    router.push("/sistema/ocorrencias");
  }

  useEffect(() => {
    carregarOcorrencia();
  }, []);

  if (carregando) {
    return (
      <div className="p-6">
        <p className="text-slate-400">Carregando ocorrência...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl font-bold">Editar Ocorrência</h1>
        <p className="text-slate-400">
          Atualize os dados da ocorrência registrada.
        </p>
      </header>

      <form className="card space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Tipo de ocorrência</label>
            <select
              className="input"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="Perturbação do sossego">Perturbação do sossego</option>
              <option value="Apoio ao cidadão">Apoio ao cidadão</option>
              <option value="Patrulhamento preventivo">
                Patrulhamento preventivo
              </option>
              <option value="Apoio a outro órgão">Apoio a outro órgão</option>
              <option value="Fiscalização">Fiscalização</option>
              <option value="Acidente">Acidente</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Aberta">Aberta</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Finalizada">Finalizada</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Bairro</label>
            <input
              className="input"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Rua / Local</label>
            <input
              className="input"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Número</label>
            <input
              className="input"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">Envolvidos</label>
          <input
            className="input"
            value={envolvidos}
            onChange={(e) => setEnvolvidos(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Descrição da ocorrência</label>
          <textarea
            className="input h-36 resize-none"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-800 pt-6">
          <button
            type="button"
            onClick={() => router.push("/sistema/ocorrencias")}
            className="px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={atualizarOcorrencia}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold"
          >
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  );
}