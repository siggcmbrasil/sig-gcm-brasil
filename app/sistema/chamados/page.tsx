"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Chamado = {
  id: number;
  protocolo: string;
  solicitante: string;
  telefone: string | null;
  tipo: string;
  local: string;
  prioridade: string;
  status: string;
  observacao: string | null;
};

export default function Chamados() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [solicitante, setSolicitante] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipo, setTipo] = useState("");
  const [local, setLocal] = useState("");
  const [prioridade, setPrioridade] = useState("Normal");
  const [status, setStatus] = useState("Aberto");
  const [observacao, setObservacao] = useState("");
  const [carregando, setCarregando] = useState(true);

  async function carregarChamados() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("chamados")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar chamados.");
      setCarregando(false);
      return;
    }

    setChamados(data || []);
    setCarregando(false);
  }

  async function salvarChamado() {
    if (!solicitante || !tipo || !local) {
      alert("Preencha solicitante, tipo e local.");
      return;
    }

    const protocolo = "CH-" + Date.now();

    const { error } = await supabase.from("chamados").insert([
      {
        protocolo,
        solicitante,
        telefone,
        tipo,
        local,
        prioridade,
        status,
        observacao,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Erro ao salvar chamado.");
      return;
    }

    alert("Chamado registrado com sucesso!");

    setSolicitante("");
    setTelefone("");
    setTipo("");
    setLocal("");
    setPrioridade("Normal");
    setStatus("Aberto");
    setObservacao("");

    carregarChamados();
  }

  async function excluirChamado(id: number) {
    const confirmar = confirm("Deseja excluir este chamado?");
    if (!confirmar) return;

    const { error } = await supabase.from("chamados").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir chamado.");
      return;
    }

    carregarChamados();
  }

  useEffect(() => {
    carregarChamados();
  }, []);

  return (
    <div className="p-6">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl font-bold">Chamados</h1>
        <p className="text-slate-400">
          Central de atendimento e despacho da GCM Biritinga.
        </p>
      </header>

      <section className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-slate-400">Total de chamados</p>
          <h2 className="text-4xl font-bold">{chamados.length}</h2>
        </div>

        <div className="card">
          <p className="text-slate-400">Abertos</p>
          <h2 className="text-4xl font-bold">
            {chamados.filter((c) => c.status === "Aberto").length}
          </h2>
        </div>

        <div className="card">
          <p className="text-slate-400">Em atendimento</p>
          <h2 className="text-4xl font-bold">
            {chamados.filter((c) => c.status === "Em atendimento").length}
          </h2>
        </div>

        <div className="card">
          <p className="text-slate-400">Urgentes</p>
          <h2 className="text-4xl font-bold">
            {chamados.filter((c) => c.prioridade === "Urgente").length}
          </h2>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-4">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Novo Chamado</h2>

          <div className="space-y-4">
            <input
              className="input"
              placeholder="Solicitante"
              value={solicitante}
              onChange={(e) => setSolicitante(e.target.value)}
            />

            <input
              className="input"
              placeholder="Telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />

            <select
              className="input"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="">Tipo do chamado</option>
              <option>Perturbação do sossego</option>
              <option>Apoio ao cidadão</option>
              <option>Fiscalização</option>
              <option>Ronda preventiva</option>
              <option>Acidente</option>
              <option>Outro</option>
            </select>

            <input
              className="input"
              placeholder="Local"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
            />

            <select
              className="input"
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value)}
            >
              <option>Baixa</option>
              <option>Normal</option>
              <option>Urgente</option>
            </select>

            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option>Aberto</option>
              <option>Em atendimento</option>
              <option>Finalizado</option>
            </select>

            <textarea
              className="input h-28 resize-none"
              placeholder="Observação"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />

            <button
              type="button"
              onClick={salvarChamado}
              className="btn-primary w-full"
            >
              Registrar Chamado
            </button>
          </div>
        </div>

        <div className="card col-span-2">
          <h2 className="text-xl font-bold mb-4">Chamados Registrados</h2>

          {carregando ? (
            <p className="text-slate-400">Carregando chamados...</p>
          ) : chamados.length === 0 ? (
            <p className="text-slate-400">Nenhum chamado registrado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700 text-slate-400">
                <tr>
                  <th className="text-left py-3">Protocolo</th>
                  <th className="text-left py-3">Solicitante</th>
                  <th className="text-left py-3">Tipo</th>
                  <th className="text-left py-3">Prioridade</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-right py-3">Ações</th>
                </tr>
              </thead>

              <tbody>
                {chamados.map((chamado) => (
                  <tr key={chamado.id} className="border-b border-slate-800">
                    <td className="py-4 text-blue-400 font-semibold">
                      {chamado.protocolo}
                    </td>

                    <td>{chamado.solicitante}</td>
                    <td className="text-slate-400">{chamado.tipo}</td>

                    <td>
                      <Prioridade prioridade={chamado.prioridade} />
                    </td>

                    <td>
                      <Status status={chamado.status} />
                    </td>

                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => excluirChamado(chamado.id)}
                        className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-xs"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function Prioridade({ prioridade }: { prioridade: string }) {
  let cor = "bg-blue-700 text-blue-100";

  if (prioridade === "Baixa") cor = "bg-slate-700 text-slate-100";
  if (prioridade === "Normal") cor = "bg-blue-700 text-blue-100";
  if (prioridade === "Urgente") cor = "bg-red-700 text-red-100";

  return <span className={`${cor} px-3 py-1 rounded text-xs`}>{prioridade}</span>;
}

function Status({ status }: { status: string }) {
  let cor = "bg-yellow-600 text-yellow-100";

  if (status === "Aberto") cor = "bg-yellow-600 text-yellow-100";
  if (status === "Em atendimento") cor = "bg-blue-700 text-blue-100";
  if (status === "Finalizado") cor = "bg-green-700 text-green-100";

  return <span className={`${cor} px-3 py-1 rounded text-xs`}>{status}</span>;
}