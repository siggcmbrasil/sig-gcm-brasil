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
  const [busca, setBusca] = useState("");

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

  const hoje = new Date().toISOString().split("T")[0];

  const escalasFiltradas = escalas.filter((escala) => {
    const texto = `
      ${escala.data}
      ${escala.guarda}
      ${escala.turno}
      ${escala.funcao}
      ${escala.status}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  const escalasHoje = escalas.filter((e) => e.data === hoje);
  const emServicoHoje = escalasHoje.filter((e) => e.status === "Em serviço");

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Escalas</h1>

        <p className="text-slate-400 text-sm md:text-base">
          Controle das escalas de serviço da GCM Biritinga.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card titulo="Total" valor={escalas.length} />

        <Card
          titulo="Hoje"
          valor={escalasHoje.length}
        />

        <Card
          titulo="Em serviço hoje"
          valor={emServicoHoje.length}
        />

        <Card
          titulo="Folgas"
          valor={escalas.filter((e) => e.status === "Folga").length}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Nova Escala
          </h2>

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
                <option>Plantão especial</option>
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
                <option>Fiscalização</option>
                <option>Motorista</option>
                <option>Supervisor</option>
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
                <option>Afastado</option>
              </select>
            </div>

            <button
              type="button"
              onClick={salvarEscala}
              className="btn-primary w-full text-lg"
            >
              Salvar Escala
            </button>
          </div>
        </div>

        <div className="card xl:col-span-2">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Escalas Cadastradas
          </h2>

          <div className="mb-5">
            <label className="label">Buscar escala</label>
            <input
              className="input"
              placeholder="Buscar por data, guarda, turno, função ou status..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {carregando ? (
            <p className="text-slate-400">Carregando escalas...</p>
          ) : escalasFiltradas.length === 0 ? (
            <p className="text-slate-400">Nenhuma escala encontrada.</p>
          ) : (
            <>
              <div className="md:hidden space-y-4">
                {escalasFiltradas.map((escala) => (
                  <div
                    key={escala.id}
                    className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex justify-between gap-3 items-start">
                      <div>
                        <p className="text-blue-400 font-semibold">
                          {escala.data}
                        </p>

                        <h3 className="text-xl font-bold">
                          {escala.guarda}
                        </h3>
                      </div>

                      <Status status={escala.status} />
                    </div>

                    <div className="text-slate-300 space-y-1">
                      <p>
                        <span className="text-slate-500">Turno: </span>
                        {escala.turno}
                      </p>

                      <p>
                        <span className="text-slate-500">Função: </span>
                        {escala.funcao}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => excluirEscala(escala.id)}
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
                      <th className="text-left py-3">Guarda</th>
                      <th className="text-left py-3">Turno</th>
                      <th className="text-left py-3">Função</th>
                      <th className="text-left py-3">Status</th>
                      <th className="text-right py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {escalasFiltradas.map((escala) => (
                      <tr key={escala.id} className="border-b border-slate-800">
                        <td className="py-4 text-blue-400 font-semibold">
                          {escala.data}
                        </td>

                        <td>{escala.guarda}</td>

                        <td className="text-slate-400">
                          {escala.turno}
                        </td>

                        <td className="text-slate-400">
                          {escala.funcao}
                        </td>

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
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="card min-h-32 flex flex-col justify-center">
      <p className="text-slate-400 text-lg md:text-base">
        {titulo}
      </p>

      <h2 className="text-5xl md:text-4xl font-bold">
        {valor}
      </h2>
    </div>
  );
}

function Status({
  status,
}: {
  status: string;
}) {
  let cor = "bg-green-700 text-green-100";

  if (status === "Folga") cor = "bg-yellow-600 text-yellow-100";
  if (status === "Férias") cor = "bg-blue-700 text-blue-100";
  if (status === "Afastado") cor = "bg-red-700 text-red-100";

  return (
    <span className={`${cor} px-3 py-2 rounded text-xs inline-block`}>
      {status}
    </span>
  );
}