"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Patrulhamento = {
  id: number;
  data: string;
  hora: string;
  local: string;
  guarda: string;
  observacao: string | null;
};

export default function Patrulhamento() {
  const [patrulhamentos, setPatrulhamentos] = useState<Patrulhamento[]>([]);
  const [busca, setBusca] = useState("");

  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [local, setLocal] = useState("");
  const [guarda, setGuarda] = useState("");
  const [observacao, setObservacao] = useState("");

  const [carregando, setCarregando] = useState(true);

  async function carregarPatrulhamentos() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("patrulhamentos")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar patrulhamentos.");
      setCarregando(false);
      return;
    }

    setPatrulhamentos(data || []);
    setCarregando(false);
  }

  async function salvarPatrulhamento() {
    if (!data || !hora || !local || !guarda) {
      alert("Preencha data, hora, local e guarda.");
      return;
    }

    const { error } = await supabase.from("patrulhamentos").insert([
      {
        data,
        hora,
        local,
        guarda,
        observacao,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Erro ao salvar patrulhamento.");
      return;
    }

    alert("Patrulhamento registrado com sucesso!");

    setData("");
    setHora("");
    setLocal("");
    setGuarda("");
    setObservacao("");

    carregarPatrulhamentos();
  }

  async function excluirPatrulhamento(id: number) {
    const confirmar = confirm("Deseja excluir este patrulhamento?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("patrulhamentos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir patrulhamento.");
      return;
    }

    carregarPatrulhamentos();
  }

  useEffect(() => {
    carregarPatrulhamentos();
  }, []);

  const hoje = new Date().toISOString().split("T")[0];

  const patrulhamentosFiltrados = patrulhamentos.filter((item) => {
    const texto = `
      ${item.data}
      ${item.hora}
      ${item.local}
      ${item.guarda}
      ${item.observacao || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Patrulhamento</h1>

        <p className="text-slate-400 text-sm md:text-base">
          Registro das rondas e pontos de presença da GCM Biritinga.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card titulo="Total de rondas" valor={patrulhamentos.length} />

        <Card
          titulo="Hoje"
          valor={patrulhamentos.filter((p) => p.data === hoje).length}
        />

        <Card titulo="Viatura" valorTexto="VTR-01" />

        <Card titulo="Status" valorTexto="Ativo" destaque />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card">
          <h2 className="text-xl md:text-2xl font-bold mb-4">Nova Ronda</h2>

          <div className="space-y-4">
            <div>
              <label className="label">Data</label>
              <input
                type="date"
                className="input"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Hora</label>
              <input
                type="time"
                className="input"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Local da ronda</label>
              <input
                className="input"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder="Ex: Praça Principal"
              />
            </div>

            <div>
              <label className="label">Guarda responsável</label>
              <input
                className="input"
                value={guarda}
                onChange={(e) => setGuarda(e.target.value)}
                placeholder="Nome do guarda"
              />
            </div>

            <div>
              <label className="label">Observação</label>
              <textarea
                className="input h-32 resize-none"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: ronda preventiva sem alterações."
              />
            </div>

            <button
              type="button"
              onClick={salvarPatrulhamento}
              className="btn-primary w-full text-lg"
            >
              Registrar Patrulhamento
            </button>
          </div>
        </div>

        <div className="card xl:col-span-2">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Patrulhamentos Registrados
          </h2>

          <div className="mb-5">
            <label className="label">Buscar patrulhamento</label>
            <input
              className="input"
              placeholder="Buscar por data, local, guarda ou observação..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {carregando ? (
            <p className="text-slate-400">Carregando patrulhamentos...</p>
          ) : patrulhamentosFiltrados.length === 0 ? (
            <p className="text-slate-400">Nenhum patrulhamento encontrado.</p>
          ) : (
            <>
              <div className="md:hidden space-y-4">
                {patrulhamentosFiltrados.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex justify-between gap-3 items-start">
                      <div>
                        <p className="text-blue-400 font-semibold">
                          {item.data}
                        </p>

                        <h3 className="text-xl font-bold">{item.local}</h3>
                      </div>

                      <span className="bg-green-700 text-green-100 px-3 py-2 rounded text-xs">
                        Ronda
                      </span>
                    </div>

                    <div className="text-slate-300 space-y-1">
                      <p>
                        <span className="text-slate-500">Hora: </span>
                        {item.hora}
                      </p>

                      <p>
                        <span className="text-slate-500">Guarda: </span>
                        {item.guarda}
                      </p>

                      {item.observacao && (
                        <p className="pt-2 text-slate-400">
                          {item.observacao}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => excluirPatrulhamento(item.id)}
                      className="w-full bg-red-700 hover:bg-red-800 text-white px-4 py-3 rounded-xl font-semibold"
                    >
                      Excluir
                    </button>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="text-left py-3">Data</th>
                      <th className="text-left py-3">Hora</th>
                      <th className="text-left py-3">Local</th>
                      <th className="text-left py-3">Guarda</th>
                      <th className="text-right py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {patrulhamentosFiltrados.map((item) => (
                      <tr key={item.id} className="border-b border-slate-800">
                        <td className="py-4 text-blue-400 font-semibold">
                          {item.data}
                        </td>

                        <td>{item.hora}</td>

                        <td className="text-slate-400">{item.local}</td>

                        <td>{item.guarda}</td>

                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => excluirPatrulhamento(item.id)}
                            className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-xs"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Card({
  titulo,
  valor,
  valorTexto,
  destaque,
}: {
  titulo: string;
  valor?: number;
  valorTexto?: string;
  destaque?: boolean;
}) {
  return (
    <div className="card min-h-32 flex flex-col justify-center">
      <p className="text-slate-400 text-lg md:text-base">{titulo}</p>

      <h2
        className={`text-5xl md:text-4xl font-bold ${
          destaque ? "text-green-400" : ""
        }`}
      >
        {valorTexto || valor}
      </h2>
    </div>
  );
}