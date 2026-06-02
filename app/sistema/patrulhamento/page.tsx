"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Patrulhamento = {
  id: number;
  data: string;
  hora: string;
  local: string;
  guarda: string;
  equipe: string | null;
  viatura: string | null;
  latitude: string | null;
  longitude: string | null;
  observacao: string | null;
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
  placa: string;
  status: string;
};

export default function Patrulhamento() {
  const [patrulhamentos, setPatrulhamentos] = useState<Patrulhamento[]>([]);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [guardasSelecionados, setGuardasSelecionados] = useState<string[]>([]);
  const [busca, setBusca] = useState("");

  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [local, setLocal] = useState("");
  const [guarda, setGuarda] = useState("");
  const [viatura, setViatura] = useState("");
  const [observacao, setObservacao] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [capturandoGps, setCapturandoGps] = useState(false);

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
      .select("id, prefixo, modelo, placa, status")
      .in("status", ["Operacional", "Reserva"])
      .order("prefixo", { ascending: true });

    if (error) {
      console.error(error);
      alert("Erro ao carregar viaturas.");
      return;
    }

    setViaturas(data || []);
  }

  function selecionarGuarda(nome: string) {
    if (guardasSelecionados.includes(nome)) {
      setGuardasSelecionados(
        guardasSelecionados.filter((item) => item !== nome)
      );
      return;
    }

    setGuardasSelecionados([...guardasSelecionados, nome]);
  }

  function obterLocalizacao() {
    if (!navigator.geolocation) {
      alert("GPS não suportado neste dispositivo.");
      return;
    }

    setCapturandoGps(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        setCapturandoGps(false);
        alert("GPS capturado com sucesso.");
      },
      () => {
        setCapturandoGps(false);
        alert("Não foi possível obter a localização.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  async function salvarPatrulhamento() {
    const equipe = guardasSelecionados.join("\n");
    const guardaPrincipal = guardasSelecionados[0] || guarda;

    if (!data || !hora || !local || !guardaPrincipal) {
      alert("Preencha data, hora, local e selecione pelo menos um guarda.");
      return;
    }

    const { error } = await supabase.from("patrulhamentos").insert([
      {
        data,
        hora,
        local,
        guarda: guardaPrincipal,
        equipe,
        viatura,
        latitude,
        longitude,
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
    setViatura("");
    setObservacao("");
    setLatitude("");
    setLongitude("");
    setGuardasSelecionados([]);

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
    carregarGuardas();
    carregarViaturas();
  }, []);

  const hoje = new Date().toISOString().split("T")[0];

  const patrulhamentosFiltrados = patrulhamentos.filter((item) => {
    const texto = `
      ${item.data}
      ${item.hora}
      ${item.local}
      ${item.guarda}
      ${item.equipe || ""}
      ${item.viatura || ""}
      ${item.observacao || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Patrulhamento</h1>

        <p className="text-slate-400 text-sm md:text-base">
          Registro das rondas, equipes, viaturas e pontos de presença.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card titulo="Total de rondas" valor={patrulhamentos.length} />

        <Card
          titulo="Hoje"
          valor={patrulhamentos.filter((p) => p.data === hoje).length}
        />

        <Card
          titulo="Com GPS"
          valor={patrulhamentos.filter((p) => p.latitude && p.longitude).length}
        />

        <Card
          titulo="Com viatura"
          valor={patrulhamentos.filter((p) => p.viatura).length}
        />
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

            <div className="border-t border-slate-800 pt-4">
              <label className="label">Equipe de patrulhamento</label>

              {guardas.length === 0 ? (
                <p className="text-slate-400">Nenhum guarda cadastrado.</p>
              ) : (
                <div className="space-y-3">
                  {guardas.map((g) => (
                    <label
                      key={g.id}
                      className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 flex gap-3 items-start cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={guardasSelecionados.includes(g.nome)}
                        onChange={() => selecionarGuarda(g.nome)}
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
              <button
                type="button"
                onClick={obterLocalizacao}
                disabled={capturandoGps}
                className="btn-secondary w-full text-lg disabled:opacity-50"
              >
                {capturandoGps ? "Capturando GPS..." : "📍 Capturar GPS"}
              </button>

              {latitude && longitude && (
                <div className="mt-3 rounded-xl border border-green-700 bg-green-950/40 p-3 text-sm text-green-300">
                  <p>Latitude: {latitude}</p>
                  <p>Longitude: {longitude}</p>
                </div>
              )}
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
              placeholder="Buscar por data, local, guarda, equipe, viatura..."
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
                          {item.data} às {item.hora}
                        </p>

                        <h3 className="text-xl font-bold">{item.local}</h3>
                      </div>

                      <span className="bg-green-700 text-green-100 px-3 py-2 rounded text-xs">
                        Ronda
                      </span>
                    </div>

                    <div className="text-slate-300 space-y-1">
                      <p>
                        <span className="text-slate-500">Viatura: </span>
                        {item.viatura || "-"}
                      </p>

                      <p>
                        <span className="text-slate-500">Guarda principal: </span>
                        {item.guarda}
                      </p>

                      {item.equipe && (
                        <div>
                          <p className="text-slate-500">Equipe:</p>
                          <pre className="whitespace-pre-wrap font-sans text-slate-300">
                            {item.equipe}
                          </pre>
                        </div>
                      )}

                      {item.latitude && item.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                          target="_blank"
                          className="block bg-blue-700 hover:bg-blue-800 text-center px-4 py-3 rounded-xl font-semibold mt-3"
                        >
                          Abrir GPS
                        </a>
                      )}

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
                      <th className="text-left py-3">Viatura</th>
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

                        <td>{item.viatura || "-"}</td>

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

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="card min-h-32 flex flex-col justify-center">
      <p className="text-slate-400 text-lg md:text-base">{titulo}</p>
      <h2 className="text-5xl md:text-4xl font-bold">{valor}</h2>
    </div>
  );
}