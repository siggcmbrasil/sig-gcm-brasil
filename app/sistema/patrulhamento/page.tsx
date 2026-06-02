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

    alert("Patrulhamento excluído com sucesso.");
    carregarPatrulhamentos();
  }

  useEffect(() => {
    carregarPatrulhamentos();
  }, []);

  return (
    <div className="p-6">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl font-bold">Patrulhamento</h1>
        <p className="text-slate-400">
          Registro das rondas e pontos de presença da GCM Biritinga.
        </p>
      </header>

      <section className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-slate-400">Total de rondas</p>
          <h2 className="text-4xl font-bold">{patrulhamentos.length}</h2>
        </div>

        <div className="card">
          <p className="text-slate-400">Hoje</p>
          <h2 className="text-4xl font-bold">
            {
              patrulhamentos.filter(
                (p) => p.data === new Date().toISOString().split("T")[0]
              ).length
            }
          </h2>
        </div>

        <div className="card">
          <p className="text-slate-400">Viatura</p>
          <h2 className="text-4xl font-bold">VTR-01</h2>
        </div>

        <div className="card">
          <p className="text-slate-400">Status</p>
          <h2 className="text-3xl font-bold text-green-400">Ativo</h2>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-4">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Nova Ronda</h2>

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
                className="input h-28 resize-none"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: ronda preventiva sem alterações."
              />
            </div>

            <button
              type="button"
              onClick={salvarPatrulhamento}
              className="btn-primary w-full"
            >
              Registrar Patrulhamento
            </button>
          </div>
        </div>

        <div className="card col-span-2">
          <h2 className="text-xl font-bold mb-4">
            Patrulhamentos Registrados
          </h2>

          {carregando ? (
            <p className="text-slate-400">Carregando patrulhamentos...</p>
          ) : patrulhamentos.length === 0 ? (
            <p className="text-slate-400">
              Nenhum patrulhamento registrado.
            </p>
          ) : (
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
                {patrulhamentos.map((item) => (
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
          )}
        </div>
      </section>
    </div>
  );
}