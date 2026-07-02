"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import CardIndicador from "@/components/CardIndicador";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  FileText,
  AlertTriangle,
  Shield,
  CheckCircle,
  XCircle,
  Search,
  List,
  Eye,
  Edit,
  Trash2,
  Check,
  Play,
} from "lucide-react";

type Ocorrencia = {
  id: number;
  municipio_id: number;
  protocolo: string;
  tipo: string;
  local: string;
  bairro: string | null;
  data: string;
  hora?: string | null;
  status: string;
  prioridade?: string;
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

  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroGuarnicao, setFiltroGuarnicao] = useState("");
  const [filtroViatura, setFiltroViatura] = useState("");
  const [filtroResponsavel, setFiltroResponsavel] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  
  const [municipioId, setMunicipioId] = useState<number | null>(null);

  const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : null;

  const perfilUsuario = usuarioLogado?.perfil || "CONSULTA";
  const podeEditar = perfilUsuario !== "CONSULTA";

  async function carregarOcorrencias(municipio: number) {
    if (!municipio) {
  setCarregando(false);
  return;
}
    setCarregando(true);

    const { data, error } = await supabase
      .from("ocorrencias")
      .select(
  "id, municipio_id, protocolo, tipo, local, bairro, data, hora, status, prioridade, guarnicao_id, viatura_id, guarda_responsavel_id"
)
      .eq("municipio_id", municipio)
      .order("data", { ascending: false })
.order("hora", { ascending: false });

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
    if (!municipio) {
  return;
}
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

     async function carregarSistema() {
  const id = usuarioLogado?.municipio_id;

  if (!id) {
    alert("Município não identificado.");
    return;
  }

  setMunicipioId(id);

  await carregarOcorrencias(id);
  await carregarDadosApoio(id);
}

  useEffect(() => {
  void carregarSistema();
}, []);

  async function excluirOcorrencia(id: number) {
    if (!municipioId) {
  alert("Município não identificado.");
  return;
}

const ocorrencia = ocorrencias.find(
  (o) => o.id === id
);

if (ocorrencia?.status === "Finalizada") {
  alert(
    "Ocorrências finalizadas não podem ser excluídas."
  );
  return;
}

    if (!podeEditar) {
      alert("Você não possui permissão para excluir ocorrências.");
      return;
    }

    const confirmar = confirm("Tem certeza que deseja excluir esta ocorrência?");
    if (!confirmar) return;

    const { error } = await supabase.from("ocorrencias")
    
    .delete()
    .eq("id", id)
    .eq("municipio_id", municipioId);

    if (error) {
      console.error(error);
      alert("Erro ao excluir ocorrência.");
      return;
    }

    await registrarAuditoria({
  modulo: "Ocorrências",
  acao: "EXCLUIR",
  descricao: `Excluiu a ocorrência ${id}.`,
});

alert("Ocorrência excluída com sucesso.");
await carregarOcorrencias(municipioId);
  }

  async function alterarStatus(id: number, status: string) {
    if (!municipioId) {
  alert("Município não identificado.");
  return;
}
    if (!podeEditar) {
  alert("Você não possui permissão.");
  return;
}
    const { error } = await supabase
      .from("ocorrencias")
      .update({ status })
.eq("id", id)
.eq("municipio_id", municipioId);

    if (error) {
      alert("Erro ao atualizar status.");
      return;
    }

    await registrarAuditoria({
  modulo: "Ocorrências",
  acao: "ALTERAR_STATUS",
  descricao: `Alterou a ocorrência ${id} para ${status}.`,
});

    await carregarOcorrencias(municipioId);
  }

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

  function limparFiltros() {
    setBusca("");
    setFiltroStatus("");
    setFiltroTipo("");
    setFiltroGuarnicao("");
    setFiltroViatura("");
    setFiltroResponsavel("");
    setDataInicial("");
    setDataFinal("");
  }

  function aplicarHoje() {
    const hoje = new Date().toISOString().slice(0, 10);
    setDataInicial(hoje);
    setDataFinal(hoje);
  }

  function aplicarUltimos7Dias() {
    const hoje = new Date();
    const inicio = new Date();
    inicio.setDate(hoje.getDate() - 7);

    setDataInicial(inicio.toISOString().slice(0, 10));
    setDataFinal(hoje.toISOString().slice(0, 10));
  }

  function aplicarEsteMes() {
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    setDataInicial(inicio.toISOString().slice(0, 10));
    setDataFinal(hoje.toISOString().slice(0, 10));
  }

  const tiposOcorrencia = useMemo(() => {
    return Array.from(new Set(ocorrencias.map((o) => o.tipo).filter(Boolean)));
  }, [ocorrencias]);

  const ocorrenciasFiltradas = ocorrencias.filter((o) => {
    const texto = `
      ${o.protocolo}
      ${o.tipo}
      ${o.local}
      ${o.bairro || ""}
      ${o.status}
      ${nomeGuarnicao(o.guarnicao_id)}
      ${prefixoViatura(o.viatura_id)}
      ${nomeGuarda(o.guarda_responsavel_id)}
    `.toLowerCase();

    const passaBusca = texto.includes(busca.toLowerCase());
    const passaStatus = filtroStatus ? o.status === filtroStatus : true;
    const passaTipo = filtroTipo ? o.tipo === filtroTipo : true;
    const passaGuarnicao = filtroGuarnicao
      ? String(o.guarnicao_id) === filtroGuarnicao
      : true;
    const passaViatura = filtroViatura
      ? String(o.viatura_id) === filtroViatura
      : true;
    const passaResponsavel = filtroResponsavel
      ? String(o.guarda_responsavel_id) === filtroResponsavel
      : true;

    const passaDataInicial = dataInicial ? o.data >= dataInicial : true;
    const passaDataFinal = dataFinal ? o.data <= dataFinal : true;

    return (
      passaBusca &&
      passaStatus &&
      passaTipo &&
      passaGuarnicao &&
      passaViatura &&
      passaResponsavel &&
      passaDataInicial &&
      passaDataFinal
    );
  });

  return (
    <div className="p-3 md:p-6 pb-24 space-y-6">
      <header className="painel-premium p-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              🚨 Central de Ocorrências
            </h1>

            <p className="text-slate-400 text-base md:text-lg mt-2 max-w-4xl">
              Registro, acompanhamento e gerenciamento operacional das
              ocorrências da Guarda Civil Municipal.
            </p>
          </div>

          {podeEditar && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xl:w-[760px]">


              <Link
                href="/sistema/ocorrencias/nova"
                className="rounded-2xl bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 hover:scale-[1.02] transition p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-4xl">
                    ➕
                  </div>

                  <div>
                    <h3 className="font-black text-xl">Nova Ocorrência</h3>
                    <p className="text-blue-100 text-sm">Registro completo</p>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <CardIndicador
          titulo="Total de Ocorrências"
          valor={ocorrencias.length}
          descricao="Todas registradas"
          icone={<FileText className="w-9 h-9" />}
          cor="blue"
        />

        <CardIndicador
          titulo="Abertas"
          valor={ocorrencias.filter((o) => o.status === "Aberta").length}
          descricao="Aguardando atendimento"
          icone={<AlertTriangle className="w-9 h-9" />}
          cor="yellow"
        />

        <CardIndicador
          titulo="Em Andamento"
          valor={ocorrencias.filter((o) => o.status === "Em andamento").length}
          descricao="Em atendimento"
          icone={<Shield className="w-9 h-9" />}
          cor="purple"
        />

        <CardIndicador
          titulo="Finalizadas"
          valor={ocorrencias.filter((o) => o.status === "Finalizada").length}
          descricao="Concluídas"
          icone={<CheckCircle className="w-9 h-9" />}
          cor="green"
        />

        <CardIndicador
          titulo="Canceladas"
          valor={ocorrencias.filter((o) => o.status === "Cancelada").length}
          descricao="Canceladas"
          icone={<XCircle className="w-9 h-9" />}
          cor="red"
        />
      </section>

      <section className="painel-premium p-6">
        <div className="flex items-center gap-3 mb-5">
          <Search className="w-8 h-8 text-blue-400 shrink-0" />
<h2 className="text-3xl font-black">
  Filtros de Ocorrências
</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
            <label className="block text-sm font-medium mb-2">
              Prioridade
            </label>
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
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Tipo</label>
            <select
              className="input"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="">Todos os tipos</option>
              {tiposOcorrencia.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Guarnição</label>
            <select
              className="input"
              value={filtroGuarnicao}
              onChange={(e) => setFiltroGuarnicao(e.target.value)}
            >
              <option value="">Todas as guarnições</option>
              {guarnicoes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="label">Data Inicial</label>
            <input
              type="date"
              className="input"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Data Final</label>
            <input
              type="date"
              className="input"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Viatura</label>
            <select
              className="input"
              value={filtroViatura}
              onChange={(e) => setFiltroViatura(e.target.value)}
            >
              <option value="">Todas as viaturas</option>
              {viaturas.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.prefixo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Responsável</label>
            <select
              className="input"
              value={filtroResponsavel}
              onChange={(e) => setFiltroResponsavel(e.target.value)}
            >
              <option value="">Todos os responsáveis</option>
              {guardas.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-5">
          <button
            type="button"
            onClick={aplicarHoje}
            className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-sm whitespace-nowrap"
          >
            Hoje
          </button>

          <button
            type="button"
            onClick={aplicarUltimos7Dias}
            className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-sm whitespace-nowrap"
          >
            Últimos 7 dias
          </button>

          <button
            type="button"
            onClick={aplicarEsteMes}
            className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-sm whitespace-nowrap"
          >
            Este mês
          </button>

          <button
            type="button"
            className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-sm whitespace-nowrap"
          >
            Minhas ocorrências
          </button>
        </div>

        <div className="mt-5 flex flex-col md:flex-row md:justify-between md:items-center gap-3 text-sm text-slate-400">
          <p>
            Exibindo{" "}
            <span className="text-white font-bold">
              {ocorrenciasFiltradas.length}
            </span>{" "}
            ocorrência(s)
          </p>

          <button
            type="button"
            onClick={limparFiltros}
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            Limpar filtros
          </button>
        </div>
      </section>

      <section className="painel-premium p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <List className="w-7 h-7 text-blue-400" />
            <div>
              <h2 className="text-2xl font-black">Lista de Ocorrências</h2>
              <p className="text-slate-400 text-sm">
                Exibindo {ocorrenciasFiltradas.length} ocorrência(s)
              </p>
            </div>
          </div>
        </div>

        {carregando ? (
          <div className="py-20 text-center text-slate-400">
            Carregando ocorrências...
          </div>
        ) : ocorrenciasFiltradas.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-8xl mb-6">🚨</div>

            <h3 className="text-3xl font-black mb-3">
              Nenhuma ocorrência encontrada
            </h3>

            <p className="text-slate-400">
              Use os filtros acima ou registre uma nova ocorrência.
            </p>
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-4">
              {ocorrenciasFiltradas.map((ocorrencia) => (
                <div
                  key={ocorrencia.id}
                  className="bg-slate-950/40 border border-slate-700 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex justify-between gap-3 items-start">
                    <div>
                      <p className="text-blue-400 font-black">
                        {ocorrencia.protocolo}
                      </p>

                      <h3 className="text-xl font-bold">{ocorrencia.tipo}</h3>
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
    onClick={(e) => {
      if (ocorrencia.status === "Finalizada") {
        e.preventDefault();
        alert(
          "Ocorrências finalizadas não podem ser editadas."
        );
      }
    }}
    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-xl text-center font-semibold"
  >
    Editar
  </Link>
)}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto border border-slate-800 rounded-2xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="text-left py-4 px-4">Protocolo</th>
                    <th className="text-left py-4 px-4">Data/Hora</th>
                    <th className="text-left py-4 px-4">Tipo</th>
                    <th className="text-left py-4 px-4">Prioridade</th>
                    <th className="text-left py-4 px-4">Local</th>
                    <th className="text-left py-4 px-4">Guarnição</th>
                    <th className="text-left py-4 px-4">Viatura</th>
                    <th className="text-left py-4 px-4">Responsável</th>
                    <th className="text-left py-4 px-4">Status</th>
                    <th className="text-right py-4 px-4">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {ocorrenciasFiltradas.map((ocorrencia) => (
                    <tr
                      key={ocorrencia.id}
                      className="border-b border-slate-800 hover:bg-slate-900/50 transition"
                    >
                      <td className="py-4 px-4 text-blue-400 font-black">
                        {ocorrencia.protocolo}
                      </td>

                      <td className="py-4 px-4 text-slate-300">
                        <div>{ocorrencia.data}</div>
                        <div className="text-slate-500 text-xs">
                          {ocorrencia.hora || "--:--"}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-semibold">
                        {ocorrencia.tipo}
                      </td>

                      <td className="py-4 px-4">
  <Prioridade prioridade={ocorrencia.prioridade} />
</td>

                      <td className="py-4 px-4 text-slate-400">
                        <div>{ocorrencia.local}</div>
                        <div className="text-slate-500 text-xs">
                          {ocorrencia.bairro || "-"}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {nomeGuarnicao(ocorrencia.guarnicao_id)}
                      </td>

                      <td className="py-4 px-4">
                        {prefixoViatura(ocorrencia.viatura_id)}
                      </td>

                      <td className="py-4 px-4">
                        {nomeGuarda(ocorrencia.guarda_responsavel_id)}
                      </td>

                      <td className="py-4 px-4">
                        <Status status={ocorrencia.status} />
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/sistema/ocorrencias/${ocorrencia.id}`}
                            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-blue-700 flex items-center justify-center"
                            title="Ver"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {podeEditar && (
  <Link
    href={`/sistema/ocorrencias/${ocorrencia.id}/editar`}
    onClick={(e) => {
      if (ocorrencia.status === "Finalizada") {
        e.preventDefault();
        alert(
          "Ocorrências finalizadas não podem ser editadas."
        );
      }
    }}
    className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-yellow-700 flex items-center justify-center"
    title="Editar"
  >
    <Edit className="w-4 h-4" />
  </Link>
)}

                          {podeEditar && ocorrencia.status === "Aberta" && (
                            <button
                              type="button"
                              onClick={() =>
                                alterarStatus(ocorrencia.id, "Em andamento")
                              }
                              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-purple-700 flex items-center justify-center"
                              title="Aceitar"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}

                          {podeEditar &&
                              ocorrencia.status === "Em andamento" && (
                              <button
                                type="button"
                                onClick={() =>
                                  alterarStatus(ocorrencia.id, "Finalizada")
                                }
                                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-green-700 flex items-center justify-center"
                                title="Finalizar"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}

                          {podeEditar && (
                            <button
                              type="button"
                              onClick={() => excluirOcorrencia(ocorrencia.id)}
                              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-red-700 flex items-center justify-center"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
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

function Prioridade({
  prioridade,
}: {
  prioridade?: string;
}) {
  let cor =
    "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40";

  let texto = "MÉDIA";

  if (prioridade === "ALTA") {
    cor =
      "bg-red-500/20 text-red-300 border border-red-500/40";

    texto = "ALTA";
  }

  if (prioridade === "BAIXA") {
    cor =
      "bg-green-500/20 text-green-300 border border-green-500/40";

    texto = "BAIXA";
  }

  return (
    <span
      className={`${cor} px-3 py-1 rounded-full text-xs font-black`}
    >
      {texto}
    </span>
  );
}

function Status({ status }: { status: string }) {
  let cor =
    "bg-blue-500/20 text-blue-300 border border-blue-500/40";

  if (status === "Aberta") {
    cor = "bg-red-500/20 text-red-300 border border-red-500/40";
  }

  if (status === "Em andamento") {
    cor = "bg-purple-500/20 text-purple-300 border border-purple-500/40";
  }

  if (status === "Finalizada") {
    cor = "bg-green-500/20 text-green-300 border border-green-500/40";
  }

  if (status === "Cancelada") {
    cor = "bg-slate-500/20 text-slate-300 border border-slate-500/40";
  }

  return (
    <span
      className={`${cor} px-3 py-1 rounded-full text-xs font-black inline-block uppercase`}
    >
      {status}
    </span>
  );
}