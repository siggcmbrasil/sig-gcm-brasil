"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CardIndicador from "@/components/CardIndicador";

type Ocorrencia = {
  id: number;
  protocolo: string;
  tipo: string;
  local: string;
  bairro: string | null;
  data: string;
  status: string;
  guarnicao_id: number | null;
  viatura_id: number | null;
  guarda_responsavel_id: number | null;
};

type Guarnicao = {
  id: number;
  nome: string;
};

type Viatura = {
  id: number;
  prefixo: string;
};

type Guarda = {
  id: number;
  nome: string;
};
export default function Ocorrencias() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [guarnicoes, setGuarnicoes] = useState<Guarnicao[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : {};

  const perfilUsuario = usuarioLogado?.perfil || "CONSULTA";

  const podeEditar = perfilUsuario !== "CONSULTA";
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [municipioId, setMunicipioId] = useState<number>(1);

  async function carregarOcorrencias(municipio: number) {
    setCarregando(true);

    const { data, error } = await supabase
  .from("ocorrencias")
  .select(`id, protocolo, tipo, local, bairro, data, status, guarnicao_id, viatura_id, guarda_responsavel_id`)
  .eq("municipio_id", municipio)
  .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar ocorrências.");
      setCarregando(false);
      return;
    }

    setOcorrencias(data || []);
    setCarregando(false);
  }

  async function carregarDadosApoio(municipio: number) {
  const { data: guarnicoesData } = await supabase
    .from("guarnicoes")
    .select("id, nome")
    .eq("municipio_id", municipio)
    .order("nome");

  const { data: viaturasData } = await supabase
    .from("viaturas")
    .select("id, prefixo")
    .eq("municipio_id", municipio)
    .order("prefixo");

  const { data: guardasData } = await supabase
    .from("guardas")
    .select("id, nome")
    .eq("municipio_id", municipio)
    .order("nome");

  setGuarnicoes(guarnicoesData || []);
  setViaturas(viaturasData || []);
  setGuardas(guardasData || []);
}

  async function excluirOcorrencia(id: number) {
  if (!podeEditar) {
    alert("Você não possui permissão para excluir ocorrências.");
    return;
  }

  const confirmar = confirm(
    "Tem certeza que deseja excluir esta ocorrência?"
  );

    if (!confirmar) return;

    const { error } = await supabase
      .from("ocorrencias")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir ocorrência.");
      return;
    }

    alert("Ocorrência excluída com sucesso.");
    carregarOcorrencias(municipioId);
  }

  useEffect(() => {
  carregarSistema();
}, []);

async function carregarSistema() {
  const { data } = await supabase
    .from("configuracoes_sistema")
    .select("municipio_padrao_id")
    .limit(1)
    .single();

  const id = data?.municipio_padrao_id || 1;

  setMunicipioId(id);
  carregarOcorrencias(id);
  carregarDadosApoio(id);
}

  const ocorrenciasFiltradas = ocorrencias.filter((o) => {
  const texto = `${o.protocolo} ${o.tipo} ${o.local} ${o.bairro || ""} ${o.status}`.toLowerCase();

  const passaBusca = texto.includes(busca.toLowerCase());
  const passaStatus = filtroStatus ? o.status === filtroStatus : true;
  const passaData = filtroData ? o.data === filtroData : true;

  return passaBusca && passaStatus && passaData;
});

function nomeGuarnicao(id: number | null) {
  if (!id) return "-";

  const guarnicao = guarnicoes.find((g) => g.id === id);
  return guarnicao?.nome || "-";
}

function prefixoViatura(id: number | null) {
  if (!id) return "-";

  const viatura = viaturas.find((v) => v.id === id);
  return viatura?.prefixo || "-";
}

function nomeGuarda(id: number | null) {
  if (!id) return "-";

  const guarda = guardas.find((g) => g.id === id);
  return guarda?.nome || "-";
}

  return (
    
  
  <div className="p-3 md:p-6 pb-24">

    <header className="mb-6">
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-5">

        <div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
  🚨 Central de Ocorrências
</h1>

<p className="text-slate-400 text-base md:text-lg mt-1">
  Registro, acompanhamento e gerenciamento operacional das ocorrências da Guarda Civil Municipal de Biritinga.
</p>
        </div>

        {podeEditar && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    <Link
      href="/sistema/ocorrencias/expressa"
      className="bg-red-700 hover:bg-red-800 px-5 py-4 rounded-2xl font-semibold text-center"
    >
      🚨 Ocorrência Expressa
    </Link>

    <Link
      href="/sistema/ocorrencias/nova"
      className="bg-blue-600 hover:bg-blue-700 px-5 py-4 rounded-2xl font-semibold text-center"
    >
      ➕ Nova Ocorrência
    </Link>
  </div>
)}

      </div>
    </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
  <CardIndicador
    titulo="Total"
    valor={ocorrencias.length}
    icone="📋"
    cor="blue"
  />

  <CardIndicador
    titulo="Abertas"
    valor={ocorrencias.filter(o => o.status === "Aberta").length}
    icone="🚨"
    cor="yellow"
  />

  <CardIndicador
    titulo="Andamento"
    valor={ocorrencias.filter(o => o.status === "Em andamento").length}
    icone="🚔"
    cor="purple"
  />

  <CardIndicador
    titulo="Finalizadas"
    valor={ocorrencias.filter(o => o.status === "Finalizada").length}
    icone="✅"
    cor="green"
  />
</section>

      <section className="card mb-6">
  <h2 className="text-xl font-bold mb-4">
    🔎 Filtros de Ocorrências
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div>
      <label className="label">Buscar</label>
      <input
        className="input"
        placeholder="Protocolo, tipo, local, bairro..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
    </div>

    <div>
      <label className="label">Status</label>
      <select
        className="input"
        value={filtroStatus}
        onChange={(e) => setFiltroStatus(e.target.value)}
      >
        <option value="">Todos</option>
        <option value="Aberta">Aberta</option>
        <option value="Em andamento">Em andamento</option>
        <option value="Finalizada">Finalizada</option>
      </select>
    </div>

    <div>
      <label className="label">Data</label>
      <input
        type="date"
        className="input"
        value={filtroData}
        onChange={(e) => setFiltroData(e.target.value)}
      />
    </div>
  </div>

  <div className="mt-4 flex justify-between items-center gap-3 text-sm text-slate-400">
    <p>
      Exibindo {ocorrenciasFiltradas.length} ocorrência(s)
    </p>

    <button
      type="button"
      onClick={() => {
        setBusca("");
        setFiltroStatus("");
        setFiltroData("");
      }}
      className="text-blue-400 hover:text-blue-300 font-semibold"
    >
      Limpar filtros
    </button>
  </div>
</section>

      <section className="card">
        <h2 className="text-xl md:text-2xl font-bold mb-4">
          Ocorrências Registradas
        </h2>

        {carregando ? (
          <p className="text-slate-400">Carregando ocorrências...</p>
        ) : ocorrenciasFiltradas.length === 0 ? (
          <p className="text-slate-400">Nenhuma ocorrência encontrada.</p>
        ) : (
          <>
            <div className="md:hidden space-y-4">
              {ocorrenciasFiltradas.map((ocorrencia) => (
                <div
                  key={ocorrencia.id}
                  className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-3"
                >
                  <div className="flex justify-between gap-3 items-start">
                    <div>
                      <p className="text-blue-400 font-semibold">
                        {ocorrencia.protocolo}
                      </p>

                      <h3 className="text-xl font-bold">
                        {ocorrencia.tipo}
                      </h3>
                    </div>

                    <Status status={ocorrencia.status} />
                  </div>

                  <div className="text-slate-300 space-y-1">
                    <p>
                      <span className="text-slate-500">Local: </span>
                      {ocorrencia.local}
                    </p>

                    <p>
                      <span className="text-slate-500">Bairro: </span>
                      {ocorrencia.bairro || "-"}
                    </p>

                    <p>
                      <span className="text-slate-500">Data: </span>
                      {ocorrencia.data}
                    </p>

                    <p>
  <span className="text-slate-500">Guarnição: </span>
  {nomeGuarnicao(ocorrencia.guarnicao_id)}
</p>

<p>
  <span className="text-slate-500">Viatura: </span>
  {prefixoViatura(ocorrencia.viatura_id)}
</p>

<p>
  <span className="text-slate-500">Responsável: </span>
  {nomeGuarda(ocorrencia.guarda_responsavel_id)}
</p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pt-2">
                    <Link
                      href={`/sistema/ocorrencias/${ocorrencia.id}`}
                      className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-xl text-center font-semibold"
                    >
                      Ver
                    </Link>

                    {podeEditar && (
  <Link
    href={`/sistema/ocorrencias/${ocorrencia.id}/editar`}
    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-xl text-center font-semibold"
  >
    Editar
  </Link>
)}

                    {podeEditar && (
  <button
    type="button"
    onClick={() => excluirOcorrencia(ocorrencia.id)}
    className="bg-red-700 hover:bg-red-800 text-white px-4 py-3 rounded-xl font-semibold"
  >
    Excluir
  </button>
)}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="text-left py-3">Protocolo</th>
                    <th className="text-left py-3">Natureza</th>
                    <th className="text-left py-3">Local</th>
                    <th className="text-left py-3">Bairro</th>
                    <th className="text-left py-3">Data</th>
                    <th className="text-left py-3">Guarnição</th>
                    <th className="text-left py-3">Viatura</th>
                    <th className="text-left py-3">Responsável</th>
                    <th className="text-left py-3">Situação</th>
                    <th className="text-right py-3">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {ocorrenciasFiltradas.map((ocorrencia) => (
                    <tr
                      key={ocorrencia.id}
                      className="border-b border-slate-800"
                    >
                      <td className="py-4 text-blue-400 font-semibold">
                        {ocorrencia.protocolo}
                      </td>

                      <td>{ocorrencia.tipo}</td>

                      <td className="text-slate-400">
                        {ocorrencia.local}
                      </td>

                      <td className="text-slate-400">
                        {ocorrencia.bairro || "-"}
                      </td>

                      <td>{ocorrencia.data}</td>

<td>
  {nomeGuarnicao(ocorrencia.guarnicao_id)}
</td>

<td>
  {prefixoViatura(ocorrencia.viatura_id)}
</td>

<td>
  {nomeGuarda(ocorrencia.guarda_responsavel_id)}
</td>

<td>
  <Status status={ocorrencia.status} />
</td>

                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/sistema/ocorrencias/${ocorrencia.id}`}
                            className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-xs"
                          >
                            Ver
                          </Link>

                          {podeEditar && (
  <Link
    href={`/sistema/ocorrencias/${ocorrencia.id}/editar`}
    className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-xs"
  >
    Editar
  </Link>
)}

{podeEditar && (
  <button
    type="button"
    onClick={() => excluirOcorrencia(ocorrencia.id)}
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

function Status({ status }: { status: string }) {
  let cor = "bg-blue-700 text-blue-100";

  if (status === "Aberta") {
    cor = "bg-yellow-600 text-yellow-100";
  }

  if (status === "Em andamento") {
    cor = "bg-blue-700 text-blue-100";
  }

  if (status === "Finalizada") {
    cor = "bg-green-700 text-green-100";
  }

  return (
    <span className={`${cor} px-3 py-2 rounded text-xs inline-block`}>
      {status}
    </span>
  );
}