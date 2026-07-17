"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  RefreshCw,
  Zap,
  Map,
  BarChart3,
  Clock,
  MapPin,
  Car,
  Users,
  User,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import CardIndicador from "@/components/CardIndicador";
import { registrarAuditoria } from "@/lib/auditoria";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import ListaOcorrenciasMobile from "@/components/ocorrencias/ListaOcorrenciasMobile";
import {
  montarUrlComMunicipioContexto,
} from "@/lib/contextoMunicipio";

type UsuarioLogado = {
  id: string;
  nome?: string;
  perfil:
    | "DESENVOLVEDOR"
    | "ADMIN"
    | "COMANDANTE"
    | "DIRETOR"
    | "CMT_GUARNICAO"
    | "PLANTONISTA"
    | "GUARDA"
    | "CONSULTA";
  municipio_id: number;
};

type Ocorrencia = {
  id: number;
  municipio_id: number;
  protocolo: string;
  tipo: string;
  local: string;
  bairro: string | null;
  data: string;
  hora: string | null;
  status: string;
  prioridade: string | null;
  guarnicao_id: number | null;
  viatura_id: number | null;
  guarda_responsavel_id: number | null;
  criado_por: string | null;
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

type ContextoOcorrencias = {
  usuario_id: number;
  usuario_nome: string | null;
  perfil: UsuarioLogado["perfil"];
  municipio_id: number;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
};

type RespostaOcorrenciasApi = {
  ok?: boolean;
  erro?: string;
  contexto?: ContextoOcorrencias;
  ocorrencias?: Ocorrencia[];
  guarnicoes?: Guarnicao[];
  viaturas?: Viatura[];
  guardas?: Guarda[];
};

type RespostaAcaoOcorrencia = {
  ok?: boolean;
  erro?: string;
  mensagem?: string;
  alterado?: boolean;
  excluida?: boolean;
  ocorrencia?: Ocorrencia;
};

const STATUS_VALIDOS = [
  "Aberta",
  "Em andamento",
  "Finalizada",
  "Cancelada",
];

const LIMITE_REGISTROS = 100;

export default function Ocorrencias() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erroTela, setErroTela] = useState("");
  const [atualizando, setAtualizando] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

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
  const [somenteMinhas, setSomenteMinhas] = useState(false);
  const [mostrarFiltrosMobile, setMostrarFiltrosMobile] =
  useState(false);

  const [podeCriar, setPodeCriar] = useState(false);
  const [podeEditar, setPodeEditar] = useState(false);
  const [podeExcluir, setPodeExcluir] = useState(false);

  const acessoRegistradoRef = useRef(false);

  async function obterAccessToken() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.access_token) {
      throw new Error(
        "Sua sessão expirou. Entre novamente no sistema."
      );
    }

    return session.access_token;
  }

  async function carregarSistema(silencioso = false) {
    if (silencioso) setAtualizando(true);
    else setCarregando(true);
    setErroTela("");

    try {
      const accessToken = await obterAccessToken();

      let usuarioCache:
        | UsuarioLogado
        | null = null;

      try {
        const salvo =
          localStorage.getItem(
            "usuarioLogado"
          );

        usuarioCache =
          salvo
            ? (JSON.parse(
                salvo
              ) as UsuarioLogado)
            : null;
      } catch {
        usuarioCache = null;
      }

      const url =
        montarUrlComMunicipioContexto({
          url:
            "/api/ocorrencias",
          perfil:
            usuarioCache?.perfil,
          municipioIdUsuario:
            usuarioCache
              ?.municipio_id,
        });

      const resposta =
        await fetch(url, {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });

      const dados = (await resposta
        .json()
        .catch(() => null)) as RespostaOcorrenciasApi | null;

      if (!resposta.ok || !dados?.ok || !dados.contexto) {
        if (resposta.status === 401) {
          localStorage.removeItem("usuarioLogado");
          window.location.replace("/login");
          return;
        }

        throw new Error(
          dados?.erro ||
            "Não foi possível carregar as ocorrências."
        );
      }

      const contexto = dados.contexto;

      setUsuario({
        id: String(contexto.usuario_id),
        nome: contexto.usuario_nome || undefined,
        perfil: contexto.perfil,
        municipio_id: contexto.municipio_id,
      });

      setPodeCriar(Boolean(contexto.pode_criar));
      setPodeEditar(Boolean(contexto.pode_editar));
      setPodeExcluir(Boolean(contexto.pode_excluir));

      setOcorrencias(dados.ocorrencias || []);
      setGuarnicoes(dados.guarnicoes || []);
      setViaturas(dados.viaturas || []);
      setGuardas(dados.guardas || []);
      setUltimaAtualizacao(new Date());

      if (!acessoRegistradoRef.current) {
        acessoRegistradoRef.current = true;

        await registrarAuditoria({
          modulo: "Ocorrências",
          acao: "ACESSO",
          descricao: "Acessou a lista de ocorrências.",
          tabela: "ocorrencias",
          detalhes: {
            municipio_id: contexto.municipio_id,
            usuario_id: contexto.usuario_id,
            perfil: contexto.perfil,
          },
        });
      }
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao carregar ocorrências.";

      console.error("Erro ao carregar ocorrências:", {
        mensagem,
        error,
      });

      setErroTela(mensagem);
      setOcorrencias([]);
    } finally {
      if (silencioso) setAtualizando(false);
      else setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarSistema();

    const intervalo = window.setInterval(() => {
      void carregarSistema(true);
    }, 15000);

    return () => window.clearInterval(intervalo);
  }, []);

  async function excluirOcorrencia(id: number) {
    if (!usuario) {
      alert("Sessão inválida.");
      return;
    }

    if (!podeExcluir) {
      alert("Você não possui permissão para excluir ocorrências.");
      return;
    }

    const ocorrencia = ocorrencias.find((item) => item.id === id);

    if (!ocorrencia) {
      alert("Ocorrência não encontrada.");
      return;
    }

    if (ocorrencia.status === "Finalizada") {
      alert("Ocorrências finalizadas não podem ser excluídas.");
      return;
    }

    const motivo = window.prompt("Informe o motivo da exclusão:")?.trim();

    if (!motivo) {
      alert("Informe o motivo da exclusão.");
      return;
    }

    const confirmou = window.confirm(
      "Confirma a exclusão desta ocorrência? Esta ação será auditada."
    );

    if (!confirmou) return;

    try {
      const accessToken = await obterAccessToken();

      const resposta = await fetch(`/api/ocorrencias/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ motivo }),
      });

      const dados = (await resposta
        .json()
        .catch(() => null)) as RespostaAcaoOcorrencia | null;

      if (!resposta.ok || !dados?.ok) {
        if (resposta.status === 401) {
          localStorage.removeItem("usuarioLogado");
          window.location.replace("/login");
          return;
        }

        if (dados?.excluida === true) {
          await carregarSistema();
          alert(
            dados.erro ||
              "A ocorrência foi excluída, mas houve falha na auditoria."
          );
          return;
        }

        throw new Error(
          dados?.erro || "Não foi possível excluir a ocorrência."
        );
      }

      alert(dados.mensagem || "Ocorrência excluída com sucesso.");
      await carregarSistema();
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao excluir ocorrência.";

      console.error("Erro ao excluir ocorrência:", {
        mensagem,
        error,
        ocorrencia_id: id,
      });

      alert(mensagem);
    }
  }

  async function alterarStatus(id: number, novoStatus: string) {
    if (!usuario) {
      alert("Sessão inválida.");
      return;
    }

    if (!podeEditar) {
      alert("Você não possui permissão para alterar ocorrências.");
      return;
    }

    if (!STATUS_VALIDOS.includes(novoStatus)) {
      alert("Status inválido.");
      return;
    }

    const ocorrencia = ocorrencias.find((item) => item.id === id);

    if (!ocorrencia) {
      alert("Ocorrência não encontrada.");
      return;
    }

    if (ocorrencia.status === "Finalizada") {
      alert("Ocorrências finalizadas não podem ter o status alterado.");
      return;
    }

    try {
      const accessToken = await obterAccessToken();

      const resposta = await fetch(`/api/ocorrencias/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: novoStatus }),
      });

      const dados = (await resposta
        .json()
        .catch(() => null)) as RespostaAcaoOcorrencia | null;

      if (!resposta.ok || !dados?.ok) {
        if (resposta.status === 401) {
          localStorage.removeItem("usuarioLogado");
          window.location.replace("/login");
          return;
        }

        if (dados?.alterado === true) {
          await carregarSistema();
          alert(
            dados.erro ||
              "A ocorrência foi atualizada, mas houve falha na auditoria."
          );
          return;
        }

        throw new Error(
          dados?.erro || "Não foi possível atualizar a ocorrência."
        );
      }

      await carregarSistema();
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao atualizar ocorrência.";

      console.error("Erro ao alterar status da ocorrência:", {
        mensagem,
        error,
        ocorrencia_id: id,
        status_novo: novoStatus,
      });

      alert(mensagem);
    }
  }

  function nomeGuarnicao(id: number | null) {
    if (!id) return "-";
    return guarnicoes.find((g) => g.id === id)?.nome || "-";
  }

  function prefixoViatura(id: number | null) {
    if (!id) return "-";
    return viaturas.find((v) => v.id === id)?.prefixo || "-";
  }

  function nomeGuarda(id: number | null) {
    if (!id) return "-";
    return guardas.find((g) => g.id === id)?.nome || "-";
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
    setSomenteMinhas(false);
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
    return Array.from(
      new Set(ocorrencias.map((o) => o.tipo).filter(Boolean))
    );
  }, [ocorrencias]);

  const ocorrenciasFiltradas = ocorrencias.filter((o) => {
    const termoBusca = busca.trim().toLowerCase();

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

    const passaBusca = termoBusca ? texto.includes(termoBusca) : true;
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

    const passaMinhas =
      somenteMinhas && usuario ? o.criado_por === usuario.id : true;

    return (
      passaBusca &&
      passaStatus &&
      passaTipo &&
      passaGuarnicao &&
      passaViatura &&
      passaResponsavel &&
      passaDataInicial &&
      passaDataFinal &&
      passaMinhas
    );
  });

return (
  <ProtecaoModulo modulo="ocorrencias">
    <div className="p-3 md:p-6 pb-24 space-y-6">
      <header className="painel-premium p-4 md:p-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              🚨 Central de Ocorrências
            </h1>

            <p className="text-slate-400 text-base md:text-lg mt-2 max-w-4xl">
              Registro, acompanhamento e gerenciamento operacional das
              ocorrências da Guarda Civil Municipal.
            </p>

            {usuario && (
              <p className="text-xs text-slate-500 mt-3">
                Município ID: {usuario.municipio_id} • Perfil: {usuario.perfil}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[720px]">
            {podeCriar && (
              <Link href="/sistema/ocorrencias/nova" className="rounded-2xl bg-blue-600 p-4 transition hover:bg-blue-500 hover:-translate-y-0.5">
                <FileText className="h-6 w-6" />
                <p className="mt-3 font-black">Nova</p>
                <p className="text-xs text-blue-100">Registro completo</p>
              </Link>
            )}
            {podeCriar && (
              <Link href="/sistema/ocorrencias/expressa" className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100 transition hover:bg-amber-500/20 hover:-translate-y-0.5">
                <Zap className="h-6 w-6" />
                <p className="mt-3 font-black">Expressa</p>
                <p className="text-xs text-amber-200/70">Registro rápido</p>
              </Link>
            )}
            <Link href="/sistema/mapa-operacional" className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-cyan-100 transition hover:bg-cyan-500/20 hover:-translate-y-0.5">
              <Map className="h-6 w-6" />
              <p className="mt-3 font-black">Mapa</p>
              <p className="text-xs text-cyan-200/70">Visão territorial</p>
            </Link>
            <Link href="/sistema/ocorrencias/relatorios" className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4 text-violet-100 transition hover:bg-violet-500/20 hover:-translate-y-0.5">
              <BarChart3 className="h-6 w-6" />
              <p className="mt-3 font-black">Relatórios</p>
              <p className="text-xs text-violet-200/70">Análise operacional</p>
            </Link>
          </div>
        </div>
      </header>

      {podeCriar && (
  <Link
    href="/sistema/ocorrencias/nova"
    className="fixed bottom-24 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-900/40 transition hover:scale-105 active:scale-95 md:hidden"
  >
    <span className="text-4xl font-black leading-none">
      +
    </span>
  </Link>
)}

      {erroTela && (
        <section className="painel-premium p-6 border border-red-500/40">
          <div className="flex items-center gap-3 text-red-300 font-bold">
            <AlertTriangle className="w-6 h-6" />
            {erroTela}
          </div>
        </section>
      )}

      <section className="hidden md:grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <CardIndicador
          titulo="Total de Ocorrências"
          valor={ocorrencias.length}
          descricao={`Últimos ${LIMITE_REGISTROS} registros`}
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

      <section className="grid grid-cols-5 gap-2 md:hidden">

  <ResumoCard

    emoji="🚨"

    valor={ocorrencias.length}

    cor="bg-blue-600"

  />



  <ResumoCard

    emoji="🔴"

    valor={

      ocorrencias.filter(

        (o) => o.status === "Aberta"

      ).length

    }

    cor="bg-red-600"

  />



  <ResumoCard

    emoji="🟣"

    valor={

      ocorrencias.filter(

        (o) =>

          o.status ===

          "Em andamento"

      ).length

    }

    cor="bg-violet-600"

  />



  <ResumoCard

    emoji="🟢"

    valor={

      ocorrencias.filter(

        (o) =>

          o.status ===

          "Finalizada"

      ).length

    }

    cor="bg-emerald-600"

  />



  <ResumoCard

    emoji="⚫"

    valor={

      ocorrencias.filter(

        (o) =>

          o.status ===

          "Cancelada"

      ).length

    }

    cor="bg-slate-700"

  />

</section>

<section className="painel-premium p-4 md:p-6">
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <Search className="h-6 w-6 shrink-0 text-blue-400 md:h-8 md:w-8" />

      <h2 className="text-xl font-black md:text-3xl">
        Filtros de Ocorrências
      </h2>
    </div>

    <button
      type="button"
      onClick={() =>
        setMostrarFiltrosMobile(
          (valor) => !valor
        )
      }
      className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-blue-300 md:hidden"
    >
      {mostrarFiltrosMobile
        ? "Fechar"
        : "Abrir"}
    </button>
  </div>

        <div
  className={`${
    mostrarFiltrosMobile
      ? "grid"
      : "hidden"
  } md:grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-5`}
>
          <div>
            <label className="label">Buscar</label>
            <input
              className="input"
              placeholder="Protocolo, tipo, local, bairro..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              maxLength={80}
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
              {STATUS_VALIDOS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
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

<div
  className={`${
    mostrarFiltrosMobile
      ? "grid"
      : "hidden"
  } md:grid grid-cols-1 md:grid-cols-4 gap-4 mt-4`}
>          <div>
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

        <div
  className={`${
    mostrarFiltrosMobile
      ? "flex"
      : "hidden"
  } md:flex flex-wrap gap-3 mt-5`}
>
          <button type="button" onClick={aplicarHoje} className="btn-secondary">
            Hoje
          </button>

          <button
            type="button"
            onClick={aplicarUltimos7Dias}
            className="btn-secondary"
          >
            Últimos 7 dias
          </button>

          <button
            type="button"
            onClick={aplicarEsteMes}
            className="btn-secondary"
          >
            Este mês
          </button>

          <button
            type="button"
            onClick={() => setSomenteMinhas((valor) => !valor)}
            className={somenteMinhas ? "sig-btn-gold" : "btn-secondary"}
          >
            Minhas ocorrências
          </button>
        </div>

        <div
  className={`${
    mostrarFiltrosMobile
      ? "flex"
      : "hidden"
  } md:flex mt-5 flex-col gap-3 text-sm text-slate-400 md:flex-row md:items-center md:justify-between`}
>
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
        <div className="flex flex-col gap-4 mb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <List className="w-7 h-7 text-blue-400" />
            <div>
              <h2 className="text-2xl font-black">Lista de Ocorrências</h2>
              <p className="text-slate-400 text-sm">
                Exibindo {ocorrenciasFiltradas.length} ocorrência(s)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              {ultimaAtualizacao ? `Atualizado às ${ultimaAtualizacao.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "Aguardando atualização"}
            </span>
            <button type="button" onClick={() => void carregarSistema(true)} disabled={atualizando} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-blue-300 hover:bg-slate-800 disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${atualizando ? "animate-spin" : ""}`} />
              Atualizar
            </button>
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
            
            <ListaOcorrenciasMobile
  ocorrencias={ocorrenciasFiltradas}
  podeEditar={podeEditar}
  podeExcluir={podeExcluir}
  nomeGuarnicao={nomeGuarnicao}
  prefixoViatura={prefixoViatura}
  nomeGuarda={nomeGuarda}
  alterarStatus={alterarStatus}
  excluirOcorrencia={excluirOcorrencia}
/>

            <div className="hidden grid-cols-1 gap-4 md:grid xl:grid-cols-2 2xl:grid-cols-3">
              {ocorrenciasFiltradas.map((ocorrencia) => {
                const finalizada = ocorrencia.status === "Finalizada";
                const cancelada = ocorrencia.status === "Cancelada";

                return (
                  <article key={ocorrencia.id} className={`group overflow-hidden rounded-3xl border bg-slate-950/55 shadow-xl transition hover:-translate-y-1 hover:border-blue-500/40 ${ocorrencia.prioridade === "ALTA" ? "border-red-500/40" : "border-slate-800"}`}>
                    <div className="border-b border-slate-800 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black tracking-wide text-blue-400">{ocorrencia.protocolo}</p>
                          <h3 className="mt-1 break-words text-xl font-black uppercase text-white">{ocorrencia.tipo}</h3>
                        </div>
                        <Prioridade prioridade={ocorrencia.prioridade} />
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <Status status={ocorrencia.status} />
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400"><Clock className="h-4 w-4" />{ocorrencia.data} • {ocorrencia.hora || "--:--"}</span>
                      </div>
                    </div>

                    <div className="grid gap-3 p-5 text-sm">
                      <InfoOperacional icone={<MapPin className="h-4 w-4" />} rotulo="Local" valor={[ocorrencia.local, ocorrencia.bairro].filter(Boolean).join(" • ")} />
                      <InfoOperacional icone={<Users className="h-4 w-4" />} rotulo="Guarnição" valor={nomeGuarnicao(ocorrencia.guarnicao_id)} />
                      <InfoOperacional icone={<Car className="h-4 w-4" />} rotulo="Viatura" valor={prefixoViatura(ocorrencia.viatura_id)} />
                      <InfoOperacional icone={<User className="h-4 w-4" />} rotulo="Responsável" valor={nomeGuarda(ocorrencia.guarda_responsavel_id)} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-slate-800 p-4">
                      <Link href={`/sistema/ocorrencias/${ocorrencia.id}`} className="col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 font-black text-white hover:bg-blue-500"><Eye className="h-4 w-4" />Visualizar</Link>
                      {podeEditar && !finalizada && !cancelada && (
                        <Link href={`/sistema/ocorrencias/${ocorrencia.id}/editar`} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3 py-3 font-bold text-amber-200 hover:bg-amber-500/20"><Edit className="h-4 w-4" />Editar</Link>
                      )}
                      {podeEditar && ocorrencia.status === "Aberta" && (
                        <button type="button" onClick={() => void alterarStatus(ocorrencia.id, "Em andamento")} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-500/25 bg-violet-500/10 px-3 py-3 font-bold text-violet-200 hover:bg-violet-500/20"><Play className="h-4 w-4" />Assumir</button>
                      )}
                      {podeEditar && ocorrencia.status === "Em andamento" && (
                        <button type="button" onClick={() => void alterarStatus(ocorrencia.id, "Finalizada")} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-3 font-bold text-emerald-200 hover:bg-emerald-500/20"><Check className="h-4 w-4" />Finalizar</button>
                      )}
                      {podeExcluir && !finalizada && (
                        <button type="button" onClick={() => void excluirOcorrencia(ocorrencia.id)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-3 py-3 font-bold text-red-200 hover:bg-red-500/20"><Trash2 className="h-4 w-4" />Excluir</button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  </ProtecaoModulo>
  );
}


function InfoOperacional({ icone, rotulo, valor }: { icone: ReactNode; rotulo: string; valor: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
      <span className="mt-0.5 text-blue-400">{icone}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">{rotulo}</p>
        <p className="mt-0.5 break-words font-semibold text-slate-200">{valor || "-"}</p>
      </div>
    </div>
  );
}

function Prioridade({ prioridade }: { prioridade?: string | null }) {
  let cor =
    "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40";

  let texto = "MÉDIA";

  if (prioridade === "ALTA") {
    cor = "bg-red-500/20 text-red-300 border border-red-500/40";
    texto = "ALTA";
  }

  if (prioridade === "BAIXA") {
    cor = "bg-green-500/20 text-green-300 border border-green-500/40";
    texto = "BAIXA";
  }

  return (
    <span className={`${cor} px-3 py-1 rounded-full text-xs font-black`}>
      {texto}
    </span>
  );
}

function Status({ status }: { status: string }) {
  let cor = "bg-blue-500/20 text-blue-300 border border-blue-500/40";

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

function ResumoCard({
  emoji,
  valor,
  cor,
}: {
  emoji: string;
  valor: number;
  cor: string;
}) {
  return (
    <div
      className={`${cor} rounded-2xl py-4 text-center shadow-lg`}
    >
      <div className="text-xl">
        {emoji}
      </div>

      <div className="mt-1 text-2xl font-black text-white">
        {valor}
      </div>
    </div>
  );
}