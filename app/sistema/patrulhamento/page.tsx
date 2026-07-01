"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CardIndicador from "@/components/CardIndicador";
import { obterLocalizacao } from "@/lib/gps";
import {
  iniciarRastreamentoTempoReal,
  limparUltimoPontoGPS,
} from "@/lib/gps/rastreamentoTempoReal";


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
  status: string | null;
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

type GuarnicaoCompleta = {
  id: number;
  nome: string;
  comandante_id: number | null;
  viatura_id: number | null;
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
  
  const [rastreamentoAtivo, setRastreamentoAtivo] = useState(false);
  const [patrulhamentoAtivoId, setPatrulhamentoAtivoId] = useState<number | null>(null);
  
  const [guarnicoesServico, setGuarnicoesServico] = useState<GuarnicaoCompleta[]>([]);
  const [guarnicaoSelecionadaId, setGuarnicaoSelecionadaId] = useState("");
  const [mostrarListaGuardas, setMostrarListaGuardas] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [capturandoGps, setCapturandoGps] = useState(false);
  const [pararRastreamento, setPararRastreamento] =
  useState<(() => void) | null>(null);
  const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : {};

const perfilUsuario = usuarioLogado?.perfil || "CONSULTA";

const podeEditar = perfilUsuario !== "CONSULTA";

if (!usuarioLogado?.municipio_id) {
  return (
    <div className="p-6">
      Município não identificado.
    </div>
  );
}

async function selecionarGuarnicaoServico(guarnicaoId: string) {

  setGuarnicaoSelecionadaId(guarnicaoId);

  const guarnicao = guarnicoesServico.find(
    (g) => Number(g.id) === Number(guarnicaoId)
  );

  if (!guarnicao) return;

  setLocal(`Ronda preventiva - ${guarnicao.nome}`);

  if (guarnicao.viatura_id) {

    const { data: viaturaAtual } = await supabase
      .from("viaturas")
      .select("id, prefixo, modelo, placa, status")
      .eq("municipio_id", usuarioLogado.municipio_id)
      .eq("id", guarnicao.viatura_id)
      .single();

    if (viaturaAtual) {
      setViatura(viaturaAtual.prefixo);
    }
  }

  const { data: membros } = await supabase
  .from("guarnicao_membros")
  .select(`
    guarda_id,
    guardas!inner (
      nome,
      municipio_id
    )
  `)
  .eq("guarnicao_id", guarnicao.id)
  .eq(
    "guardas.municipio_id",
    usuarioLogado.municipio_id
  );

if (!membros || membros.length === 0) {
  setGuardasSelecionados([]);
  setGuarda("");
  return;
}

const nomes = membros
  .map((m: any) => m.guardas?.nome)
  .filter(Boolean);

setGuardasSelecionados(nomes);
setGuarda(nomes[0] || "");
}

async function carregarPatrulhamentos() {

    setCarregando(true);

    const { data, error } = await supabase
  .from("patrulhamentos")
  .select("*")
  .eq("municipio_id", usuarioLogado.municipio_id)
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
      .eq("municipio_id", usuarioLogado.municipio_id)
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
  .eq("municipio_id", usuarioLogado.municipio_id)
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

  async function capturarGps() {
  try {
    setCapturandoGps(true);

    const localizacao = await obterLocalizacao();

    setLatitude(localizacao.latitude.toString());
    setLongitude(localizacao.longitude.toString());

    alert("GPS capturado com sucesso.");
  } catch (error) {
    console.error(error);
    alert("Não foi possível obter a localização.");
  } finally {
    setCapturandoGps(false);
  }
}

  async function salvarPatrulhamento() {
  if (!podeEditar) {
    alert("Você não possui permissão para registrar patrulhamentos.");
    return;
  }
    const equipe = guardasSelecionados.join("\n");
    const guardaPrincipal = guardasSelecionados[0] || guarda;

    if (!data || !hora || !local || !guardaPrincipal) {
      alert(
  `Faltando: ${[
    !data ? "data" : "",
    !hora ? "hora" : "",
    !local ? "local" : "",
    !guardaPrincipal ? "guarda/equipe" : "",
  ].filter(Boolean).join(", ")}`
);
      return;
    }

   const { data: novoPatrulhamento, error } = await supabase
  .from("patrulhamentos")
  .insert([
  {
    municipio_id: usuarioLogado.municipio_id,
    data,
    hora,
    local,
    guarda: guardaPrincipal,
    equipe,
    viatura,
    latitude,
    longitude,
    observacao,
    status: "EM_ANDAMENTO",
  },
])
  .select()
  .single();

    if (error) {
      console.error(error);
      alert("Erro ao salvar patrulhamento.");
      return;
    }

    if (novoPatrulhamento?.id) {
  setPatrulhamentoAtivoId(
    novoPatrulhamento.id
  );

  localStorage.setItem(
    "patrulhamentoAtivoId",
    String(novoPatrulhamento.id)
  );

  const parar =
  iniciarRastreamentoTempoReal(
    {
      municipio_id:
        usuarioLogado.municipio_id,
      usuario_id: String(
        usuarioLogado.id
      ),
      patrulhamento_id:
        novoPatrulhamento.id,
    }
  );

  setPararRastreamento(() => parar);

  setRastreamentoAtivo(true);
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
  if (!podeEditar) {
    alert("Você não possui permissão para excluir patrulhamentos.");
    return;
  }
    const confirmar = confirm("Deseja excluir este patrulhamento?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("patrulhamentos")
      .delete()
.eq("id", id)
.eq("municipio_id", usuarioLogado.municipio_id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir patrulhamento.");
      return;
    }

    carregarPatrulhamentos();
  }

async function finalizarPatrulhamento(id: number) {
  if (pararRastreamento) {
    pararRastreamento();
  }

  const { error } = await supabase
    .from("patrulhamentos")
    .update({
      status: "FINALIZADO",
    })
    .eq("id", id)
    .eq("municipio_id", usuarioLogado.municipio_id);

  if (error) {
    console.error(error);
    return;
  }

  setRastreamentoAtivo(false);
  setPatrulhamentoAtivoId(null);

  localStorage.removeItem("patrulhamentoAtivoId");
  limparUltimoPontoGPS();

  alert("Patrulhamento finalizado com sucesso.");
  carregarPatrulhamentos();
}

async function carregarPlantaoAutomatico() {
  const municipioId = usuarioLogado.municipio_id;

  const { data: configEscala } = await supabase
    .from("escala_operacional_config")
    .select("*")
    .eq("municipio_id", municipioId)
    .eq("ativo", true)
    .single();

  const { data: guarnicoes } = await supabase
    .from("guarnicoes")
    .select("id, nome, comandante_id, viatura_id")
    .eq("municipio_id", municipioId)
    .eq("ativa", true);

  if (!configEscala || !guarnicoes || !configEscala.ordem_guarnicoes?.length) {
    return;
  }

  const dataBase = new Date(`${configEscala.data_base}T07:00:00`);
  const agora = new Date();

  const diasPassados = Math.floor(
    (agora.getTime() - dataBase.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const ordem = configEscala.ordem_guarnicoes;

  const indiceBase = ordem.findIndex(
    (id: number) => Number(id) === Number(configEscala.guarnicao_base_id)
  );

  if (indiceBase === -1) return;

  const indiceAtual =
    ((indiceBase + diasPassados) % ordem.length + ordem.length) %
    ordem.length;

  const guarnicaoAtual = guarnicoes.find(
    (g: GuarnicaoCompleta) =>
      Number(g.id) === Number(ordem[indiceAtual])
  );

  if (!guarnicaoAtual) return;

  setGuarnicoesServico([guarnicaoAtual]);
  setGuarnicaoSelecionadaId(String(guarnicaoAtual.id));
  setLocal(`Ronda preventiva - ${guarnicaoAtual.nome}`);

  if (guarnicaoAtual.viatura_id) {
    const { data: viaturaAtual } = await supabase
      .from("viaturas")
      .select("id, prefixo, modelo, placa, status")
      .eq("municipio_id", municipioId)
      .eq("id", guarnicaoAtual.viatura_id)
      .single();

    if (viaturaAtual) {
      setViatura(viaturaAtual.prefixo);
    }
  }

  const { data: membros } = await supabase
    .from("guarnicao_membros")
    .select(`
      guarda_id,
      guardas!inner (
        nome,
        municipio_id
      )
    `)
    .eq("guarnicao_id", guarnicaoAtual.id)
    .eq("guardas.municipio_id", municipioId);

  if (!membros || membros.length === 0) {
    setGuardasSelecionados([]);
    setGuarda("");
    return;
  }

  const nomes = membros
    .map((m: any) => m.guardas?.nome)
    .filter(Boolean);

  setGuardasSelecionados(nomes);
  setGuarda(nomes[0] || "");
}

  useEffect(() => {
  const agora = new Date();

  setData(agora.toISOString().split("T")[0]);

  setHora(
    agora.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  );

  void carregarPatrulhamentos();
  void carregarGuardas();
  void carregarViaturas();
  void carregarPlantaoAutomatico();
}, []);

useEffect(() => {
  const idSalvo = localStorage.getItem(
    "patrulhamentoAtivoId"
  );

  if (!idSalvo) return;

  const patrulhamentoId = Number(idSalvo);

  setPatrulhamentoAtivoId(
    patrulhamentoId
  );

  const parar =
    iniciarRastreamentoTempoReal(
      {
        municipio_id:
          usuarioLogado.municipio_id,
        usuario_id: String(
          usuarioLogado.id
        ),
        patrulhamento_id:
          patrulhamentoId,
      }
    );

  setPararRastreamento(() => parar);
  setRastreamentoAtivo(true);
}, []);

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

  function StatusPatrulhamento({ status }: { status: string | null }) {
  if (status === "FINALIZADO") {
    return (
      <span className="bg-green-700 text-green-100 px-3 py-2 rounded text-xs inline-block">
        Finalizado
      </span>
    );
  }

  return (
    <span className="bg-yellow-600 text-yellow-100 px-3 py-2 rounded text-xs inline-block">
      Em andamento
    </span>
  );
}

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="mb-6">
  <div className="flex flex-col gap-4 border-b border-slate-800 pb-5">

    <div>
      <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
        Patrulhamento
      </h1>

      <p className="text-slate-400 text-base md:text-lg mt-1">
        Controle das rondas, equipes, viaturas e áreas patrulhadas.
      </p>
    </div>

  </div>
</header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">

  <CardIndicador
    titulo="Total"
    valor={patrulhamentos.length}
    icone="🚔"
    cor="blue"
  />

  <CardIndicador
    titulo="Viaturas"
    valor={
      new Set(
  patrulhamentos
    .map((p) => p.viatura)
    .filter(Boolean)
).size
    }
    icone="🚓"
    cor="purple"
  />

  <CardIndicador
    titulo="Equipes"
    valor={
      new Set(
  patrulhamentos
    .map((p) => p.equipe)
    .filter(Boolean)
).size
    }
    icone="👮"
    cor="green"
  />

  <CardIndicador
    titulo="Hoje"
    valor={
      patrulhamentos.filter(
        (p) =>
          p.data ===
          new Date().toISOString().split("T")[0]
      ).length
    }
    icone="📍"
    cor="yellow"
  />

</section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {podeEditar && (
  <div className="card">
    <h2 className="text-xl md:text-2xl font-bold mb-4">
      Nova Ronda
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
  <label className="label">Guarnição de serviço</label>

  <select
    className="input mb-3"
    value={guarnicaoSelecionadaId}
    onChange={(e) => selecionarGuarnicaoServico(e.target.value)}
  >
    <option value="">Selecione a guarnição</option>

    {guarnicoesServico.map((g) => (
      <option key={g.id} value={g.id}>
        {g.nome}
      </option>
    ))}
  </select>

  {guardasSelecionados.length > 0 && (
    <div className="mb-3 rounded-xl border border-cyan-700 bg-cyan-950/30 p-3">
      <p className="font-semibold text-cyan-300 mb-2">
        Equipe selecionada
      </p>

      <div className="space-y-1">
        {guardasSelecionados.map((nome) => (
          <p key={nome} className="text-sm text-slate-200">
            👮 {nome}
          </p>
        ))}
      </div>
    </div>
  )}

  <button
    type="button"
    onClick={() => setMostrarListaGuardas(!mostrarListaGuardas)}
    className="btn-secondary w-full"
  >
    {mostrarListaGuardas ? "Ocultar guardas" : "+ Adicionar guarda extra"}
  </button>

  {mostrarListaGuardas && (
    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 mt-3">
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
                onClick={capturarGps}
                disabled={capturandoGps}
                className="btn-secondary w-full text-lg disabled:opacity-50"
              >
                {capturandoGps
  ? "Capturando localização..."
  : "📍 Capturar GPS Inicial"}
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
              🚔 Registrar e Iniciar Patrulhamento
            </button>
          </div>
          </div>
)}

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

                      <StatusPatrulhamento status={item.status} />
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

                    {podeEditar && item.status !== "FINALIZADO" && (
  <button
    type="button"
    onClick={() => finalizarPatrulhamento(item.id)}
    className="w-full bg-green-700 hover:bg-green-800 text-white px-4 py-3 rounded-xl font-semibold"
  >
    Finalizar Patrulhamento
  </button>
)}

                    {podeEditar && (
  <button
    type="button"
    onClick={() => excluirPatrulhamento(item.id)}
    className="w-full bg-red-700 hover:bg-red-800 text-white px-4 py-3 rounded-xl font-semibold"
  >
    Excluir
  </button>
)}
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
                      <th className="text-left py-3">Status</th>
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

                        <td>{item.guarda || "-"}</td>

                        <td>
  <StatusPatrulhamento status={item.status} />
</td>

                        <td className="text-right">
  <div className="flex justify-end gap-2">

    {podeEditar && item.status !== "FINALIZADO" && (
      <button
        type="button"
        onClick={() => finalizarPatrulhamento(item.id)}
        className="bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-lg text-xs"
      >
        Finalizar
      </button>
    )}

   <Link
  href={`/sistema/patrulhamento/${item.id}`}
  className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-xs"
>
  Ver Rota
</Link>

    {podeEditar && (
      <button
        type="button"
        onClick={() => excluirPatrulhamento(item.id)}
        className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-xs"
      >
        Excluir
      </button>
    )}

  </div>
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

