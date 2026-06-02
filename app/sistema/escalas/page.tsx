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
  supervisor: string | null;
  viatura: string | null;
  equipe: string | null;
  observacoes: string | null;
};

type Guarda = {
  id: number;
  matricula: string;
  nome: string;
  cargo: string;
  status: string;
};

type Viatura = {
  id: number;
  prefixo: string;
  modelo: string;
  status: string;
};

export default function Escalas() {
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [equipeSelecionada, setEquipeSelecionada] = useState<string[]>([]);
  const [busca, setBusca] = useState("");

  const [data, setData] = useState("");
  const [guarda, setGuarda] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [viatura, setViatura] = useState("");
  const [turno, setTurno] = useState("07:00 - 19:00");
  const [funcao, setFuncao] = useState("Patrulhamento");
  const [status, setStatus] = useState("Em serviço");
  const [observacoes, setObservacoes] = useState("");

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

  async function carregarGuardas() {
    const { data, error } = await supabase
      .from("guardas")
      .select("id, matricula, nome, cargo, status")
      .order("nome", { ascending: true });

    if (error) {
      console.error(error);
      alert("Erro ao carregar guardas.");
      return;
    }

    setGuardas(data || []);
  }

  async function carregarViaturas() {
    const { data, error } = await supabase
      .from("viaturas")
      .select("id, prefixo, modelo, status")
      .in("status", ["Operacional", "Reserva"])
      .order("prefixo", { ascending: true });

    if (error) {
      console.error(error);
      alert("Erro ao carregar viaturas.");
      return;
    }

    setViaturas(data || []);
  }

  function selecionarMembroEquipe(nome: string) {
    if (equipeSelecionada.includes(nome)) {
      setEquipeSelecionada(equipeSelecionada.filter((item) => item !== nome));
      return;
    }

    setEquipeSelecionada([...equipeSelecionada, nome]);
  }

  async function salvarEscala() {
    if (!data || !guarda || !turno || !funcao) {
      alert("Preencha data, guarda principal, turno e função.");
      return;
    }

    const { error } = await supabase.from("escalas").insert([
      {
        data,
        guarda,
        supervisor,
        viatura,
        turno,
        funcao,
        status,
        equipe: equipeSelecionada.join("\n"),
        observacoes,
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
    setSupervisor("");
    setViatura("");
    setTurno("07:00 - 19:00");
    setFuncao("Patrulhamento");
    setStatus("Em serviço");
    setObservacoes("");
    setEquipeSelecionada([]);

    carregarEscalas();
  }

  async function excluirEscala(id: number) {
    const confirmar = confirm("Tem certeza que deseja excluir esta escala?");

    if (!confirmar) return;

    const { error } = await supabase.from("escalas").delete().eq("id", id);

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
    carregarGuardas();
    carregarViaturas();
  }, []);

  const hoje = new Date().toISOString().split("T")[0];

  const escalasHoje = escalas.filter((e) => e.data === hoje);
  const emServicoHoje = escalasHoje.filter((e) => e.status === "Em serviço");

  const escalasFiltradas = escalas.filter((escala) => {
    const texto = `
      ${escala.data}
      ${escala.guarda}
      ${escala.supervisor || ""}
      ${escala.viatura || ""}
      ${escala.equipe || ""}
      ${escala.turno}
      ${escala.funcao}
      ${escala.status}
      ${escala.observacoes || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          Escala Operacional
        </h1>

        <p className="text-slate-400 text-sm md:text-base">
          Controle diário de equipe, supervisor, viatura e plantão.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card titulo="Total" valor={escalas.length} />
        <Card titulo="Hoje" valor={escalasHoje.length} />
        <Card titulo="Em serviço hoje" valor={emServicoHoje.length} />
        <Card
          titulo="Plantões 24h"
          valor={escalas.filter((e) => e.turno === "24 horas").length}
        />
      </section>

      <section className="card mb-6">
        <h2 className="text-xl md:text-2xl font-bold mb-4">
          Escala de Hoje
        </h2>

        {escalasHoje.length === 0 ? (
          <p className="text-slate-400">
            Nenhuma escala cadastrada para hoje.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {escalasHoje.map((escala) => (
              <div
                key={escala.id}
                className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-2"
              >
                <div className="flex justify-between gap-3 items-start">
                  <div>
                    <p className="text-blue-400 font-semibold">
                      {escala.turno}
                    </p>

                    <h3 className="text-xl font-bold">
                      {escala.guarda}
                    </h3>
                  </div>

                  <Status status={escala.status} />
                </div>

                <Linha nome="Supervisor" valor={escala.supervisor || "-"} />
                <Linha nome="Viatura" valor={escala.viatura || "-"} />
                <Linha nome="Função" valor={escala.funcao} />

                {escala.equipe && (
                  <div>
                    <p className="text-slate-400">Equipe</p>
                    <pre className="whitespace-pre-wrap font-sans">
                      {escala.equipe}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
              <label className="label">Guarda principal</label>
              <select
                className="input"
                value={guarda}
                onChange={(e) => setGuarda(e.target.value)}
              >
                <option value="">Selecione um guarda</option>

                {guardas.map((g) => (
                  <option key={g.id} value={g.nome}>
                    {g.nome} • {g.matricula} • {g.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Supervisor</label>
              <select
                className="input"
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
              >
                <option value="">Selecione o supervisor</option>

                {guardas.map((g) => (
                  <option key={g.id} value={g.nome}>
                    {g.nome} • {g.matricula}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Viatura</label>
              <select
                className="input"
                value={viatura}
                onChange={(e) => setViatura(e.target.value)}
              >
                <option value="">Selecione uma viatura</option>

                {viaturas.map((v) => (
                  <option key={v.id} value={v.prefixo}>
                    {v.prefixo} • {v.modelo} • {v.status}
                  </option>
                ))}
              </select>
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
                <option>24 horas</option>
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

            <div className="border-t border-slate-800 pt-4">
              <label className="label">Equipe</label>

              {guardas.length === 0 ? (
                <p className="text-slate-400">Nenhum guarda cadastrado.</p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {guardas.map((g) => (
                    <label
                      key={g.id}
                      className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 flex gap-3 items-start cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={equipeSelecionada.includes(g.nome)}
                        onChange={() => selecionarMembroEquipe(g.nome)}
                        className="mt-1"
                      />

                      <div>
                        <p className="font-bold">{g.nome}</p>
                        <p className="text-sm text-slate-400">
                          {g.matricula} • {g.cargo}
                        </p>
                        <p className="text-xs text-blue-400">{g.status}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="label">Observações</label>
              <textarea
                className="input h-28 resize-none"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações da escala..."
              />
            </div>

            <button
              type="button"
              onClick={salvarEscala}
              className="btn-primary w-full text-lg"
            >
              Salvar Escala Operacional
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
              placeholder="Buscar por data, guarda, supervisor, viatura..."
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
                          {escala.data} • {escala.turno}
                        </p>

                        <h3 className="text-xl font-bold">
                          {escala.guarda}
                        </h3>
                      </div>

                      <Status status={escala.status} />
                    </div>

                    <Linha nome="Supervisor" valor={escala.supervisor || "-"} />
                    <Linha nome="Viatura" valor={escala.viatura || "-"} />
                    <Linha nome="Função" valor={escala.funcao} />

                    {escala.equipe && (
                      <div>
                        <p className="text-slate-400">Equipe</p>
                        <pre className="whitespace-pre-wrap font-sans text-slate-300">
                          {escala.equipe}
                        </pre>
                      </div>
                    )}

                    {escala.observacoes && (
                      <p className="text-slate-400">
                        {escala.observacoes}
                      </p>
                    )}

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
                      <th className="text-left py-3">Supervisor</th>
                      <th className="text-left py-3">Viatura</th>
                      <th className="text-left py-3">Turno</th>
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
                          {escala.supervisor || "-"}
                        </td>
                        <td>{escala.viatura || "-"}</td>
                        <td className="text-slate-400">{escala.turno}</td>

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

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="card min-h-32 flex flex-col justify-center">
      <p className="text-slate-400 text-lg md:text-base">{titulo}</p>
      <h2 className="text-5xl md:text-4xl font-bold">{valor}</h2>
    </div>
  );
}

function Linha({ nome, valor }: { nome: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-800 pb-2">
      <span className="text-slate-400">{nome}</span>
      <span className="text-right">{valor}</span>
    </div>
  );
}

function Status({ status }: { status: string }) {
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