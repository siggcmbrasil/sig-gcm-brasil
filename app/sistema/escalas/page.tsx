"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Escala = {
  id: number;
  data: string;
  guarda: string;
  turno: string;
  funcao: string;
  status: string;
};

export default function Escalas() {
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [data, setData] = useState("");
  const [guarda, setGuarda] = useState("");
  const [turno, setTurno] = useState("07:00 - 19:00");
  const [funcao, setFuncao] = useState("Patrulhamento");
  const [status, setStatus] = useState("Em serviço");
  const [carregando, setCarregando] = useState(true);

  async function carregarEscalas() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("escalas")
      .select("*")
      .order("data", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar escalas.");
      setCarregando(false);
      return;
    }

    setEscalas(data || []);
    setCarregando(false);
  }

  async function salvarEscala() {
    if (!data || !guarda || !turno || !funcao) {
      alert("Preencha data, guarda, turno e função.");
      return;
    }

    const { error } = await supabase.from("escalas").insert([
      {
        data,
        guarda,
        turno,
        funcao,
        status,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Erro ao cadastrar escala.");
      return;
    }

    alert("Escala cadastrada com sucesso!");

    setData("");
    setGuarda("");
    setTurno("07:00 - 19:00");
    setFuncao("Patrulhamento");
    setStatus("Em serviço");

    carregarEscalas();
  }

  async function excluirEscala(id: number) {
    const confirmar = confirm("Tem certeza que deseja excluir esta escala?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("escalas")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir escala.");
      return;
    }

    alert("Escala excluída com sucesso.");
    carregarEscalas();
  }

  useEffect(() => {
    carregarEscalas();
  }, []);

  return (
    <div className="p-6">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl font-bold">Escalas</h1>
        <p className="text-slate-400">
          Controle das escalas de serviço da GCM Biritinga.
        </p>
      </header>

      <section className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-slate-400">Total de escalas</p>
          <h2 className="text-4xl font-bold">{escalas.length}</h2>
        </div>

        <div className="card">
          <p className="text-slate-400">Em serviço</p>
          <h2 className="text-4xl font-bold">
            {escalas.filter((e) => e.status === "Em serviço").length}
          </h2>
        </div>

        <div className="card">
          <p className="text-slate-400">Folga</p>
          <h2 className="text-4xl font-bold">
            {escalas.filter((e) => e.status === "Folga").length}
          </h2>
        </div>

        <div className="card">
          <p className="text-slate-400">Férias</p>
          <h2 className="text-4xl font-bold">
            {escalas.filter((e) => e.status === "Férias").length}
          </h2>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-4">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Nova Escala</h2>

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
              <label className="label">Guarda</label>
              <input
                className="input"
                value={guarda}
                onChange={(e) => setGuarda(e.target.value)}
                placeholder="Nome do guarda"
              />
            </div>

            <div>
              <label className="label">Turno</label>
              <select
                className="input"
                value={turno}
                onChange={(e) => setTurno(e.target.value)}
              >
                <option>07:00 - 19:00</option>
                <option>19:00 - 07:00</option>
                <option>08:00 - 12:00</option>
                <option>13:00 - 17:00</option>
              </select>
            </div>

            <div>
              <label className="label">Função</label>
              <select
                className="input"
                value={funcao}
                onChange={(e) => setFuncao(e.target.value)}
              >
                <option>Patrulhamento</option>
                <option>Base</option>
                <option>Ronda Escolar</option>
                <option>Apoio a Evento</option>
                <option>Administrativo</option>
              </select>
            </div>

            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Em serviço</option>
                <option>Folga</option>
                <option>Férias</option>
              </select>
            </div>

            <button
              type="button"
              onClick={salvarEscala}
              className="btn-primary w-full"
            >
              Salvar Escala
            </button>
          </div>
        </div>

        <div className="card col-span-2">
          <h2 className="text-xl font-bold mb-4">Escalas Cadastradas</h2>

          {carregando ? (
            <p className="text-slate-400">Carregando escalas...</p>
          ) : escalas.length === 0 ? (
            <p className="text-slate-400">Nenhuma escala cadastrada.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="text-left py-3">Data</th>
                  <th className="text-left py-3">Guarda</th>
                  <th className="text-left py-3">Turno</th>
                  <th className="text-left py-3">Função</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-right py-3">Ações</th>
                </tr>
              </thead>

              <tbody>
                {escalas.map((escala) => (
                  <tr key={escala.id} className="border-b border-slate-800">
                    <td className="py-4 text-blue-400 font-semibold">
                      {escala.data}
                    </td>
                    <td>{escala.guarda}</td>
                    <td className="text-slate-400">{escala.turno}</td>
                    <td className="text-slate-400">{escala.funcao}</td>
                    <td>
                      <Status status={escala.status} />
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => excluirEscala(escala.id)}
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

function Status({ status }: { status: string }) {
  let cor = "bg-green-700 text-green-100";

  if (status === "Folga") {
    cor = "bg-yellow-600 text-yellow-100";
  }

  if (status === "Férias") {
    cor = "bg-blue-700 text-blue-100";
  }

  return (
    <span className={`${cor} px-3 py-1 rounded text-xs`}>
      {status}
    </span>
  );
}