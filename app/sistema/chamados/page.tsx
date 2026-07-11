"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  AlertTriangle,
  Check,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Clock3,
  Eye,
  FilePlus2,
  Filter,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  User,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";

type ContextoChamados = {
  usuario_id: number;
  usuario_nome: string | null;
  perfil: string;
  municipio_id: number;
};

type PermissoesChamados = {
  pode_ver: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
  pode_atender: boolean;
  pode_finalizar: boolean;
  pode_gerar_ocorrencia: boolean;
};

type LocalChamado = {
  id: number;
  nome: string;
  tipo: string | null;
};

type Chamado = {
  id: number;
  municipio_id?: number;
  protocolo: string | null;
  solicitante: string | null;
  telefone: string | null;
  tipo: string | null;
  local: string | null;
  bairro: string | null;
  numero: string | null;
  referencia: string | null;
  tipo_local: string | null;
  prioridade: string | null;
  status: string | null;
  observacao: string | null;
  atendido_por?: string | null;
  data_atendimento?: string | null;
  finalizado_por?: string | null;
  finalizado_em?: string | null;
  observacao_finalizacao?: string | null;
  criado_em?: string | null;
  data?: string | null;
  hora?: string | null;
};

type RespostaChamados = {
  ok?: boolean;
  erro?: string;
  mensagem?: string;
  contexto?: ContextoChamados;
  permissoes?: PermissoesChamados;
  chamados?: Chamado[];
  locais?: LocalChamado[];
  chamado?: Chamado;
};

type FormularioChamado = {
  solicitante: string;
  telefone: string;
  tipo: string;
  local: string;
  bairro: string;
  numero: string;
  referencia: string;
  tipo_local: string;
  prioridade: "BAIXA" | "MÉDIA" | "ALTA" | "URGENTE";
  status: "Aberto" | "Em Atendimento" | "Finalizado";
  observacao: string;
};

const FORMULARIO_INICIAL: FormularioChamado = {
  solicitante: "",
  telefone: "",
  tipo: "",
  local: "",
  bairro: "",
  numero: "",
  referencia: "",
  tipo_local: "",
  prioridade: "MÉDIA",
  status: "Aberto",
  observacao: "",
};

const TIPOS_CHAMADO = [
  "Averiguação de denúncia",
  "Apoio ao SAMU",
  "Perturbação do sossego",
  "Violência doméstica",
  "Acidente de trânsito",
  "Pessoa em atitude suspeita",
  "Desentendimento",
  "Dano ao patrimônio",
  "Animal solto em via pública",
  "Apoio a órgão público",
  "Outro",
];

const TIPOS_LOCAL = [
  "Residência",
  "Comércio",
  "Via pública",
  "Órgão público",
  "Escola",
  "Unidade de saúde",
  "Zona rural",
  "Outro",
];

function texto(valor: unknown) {
  return String(valor ?? "").trim();
}

function normalizar(valor: unknown) {
  return texto(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizarStatus(valor: unknown) {
  const status = normalizar(valor);

  if (
    status === "em atendimento" ||
    status === "em andamento"
  ) {
    return "EM_ATENDIMENTO";
  }

  if (
    status === "finalizado" ||
    status === "finalizada"
  ) {
    return "FINALIZADO";
  }

  return "ABERTO";
}

function normalizarPrioridade(valor: unknown) {
  const prioridade = normalizar(valor);

  if (prioridade === "baixa") {
    return "BAIXA";
  }

  if (prioridade === "alta") {
    return "ALTA";
  }

  if (prioridade === "urgente") {
    return "URGENTE";
  }

  return "MÉDIA";
}

function formatarTelefone(valor: string) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

function formatarDataHora(valor?: string | null) {
  if (!valor) {
    return "Não informado";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

function classeStatus(status: unknown) {
  const valor = normalizarStatus(status);

  if (valor === "FINALIZADO") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }

  if (valor === "EM_ATENDIMENTO") {
    return "border-violet-500/30 bg-violet-500/10 text-violet-200";
  }

  return "border-red-500/30 bg-red-500/10 text-red-200";
}

function classePrioridade(prioridade: unknown) {
  const valor = normalizarPrioridade(prioridade);

  if (valor === "URGENTE") {
    return "border-red-400/40 bg-red-500/20 text-red-100";
  }

  if (valor === "ALTA") {
    return "border-orange-500/35 bg-orange-500/10 text-orange-200";
  }

  if (valor === "BAIXA") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }

  return "border-amber-500/30 bg-amber-500/10 text-amber-200";
}

export default function ChamadosPage() {
  const router = useRouter();

  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [locais, setLocais] = useState<LocalChamado[]>([]);
  const [contexto, setContexto] = useState<ContextoChamados | null>(null);
  const [permissoes, setPermissoes] = useState<PermissoesChamados | null>(null);

  const [formulario, setFormulario] =
    useState<FormularioChamado>(FORMULARIO_INICIAL);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [painelFormularioAberto, setPainelFormularioAberto] = useState(false);
  const [visualizando, setVisualizando] = useState<Chamado | null>(null);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [filtroPrioridade, setFiltroPrioridade] = useState("TODAS");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [processandoId, setProcessandoId] = useState<number | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    void carregarChamados();
  }, []);

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

  async function chamarApi(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    body?: Record<string, unknown>
  ) {
    const accessToken = await obterAccessToken();

    const resposta = await fetch("/api/chamados", {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body
          ? {
              "Content-Type": "application/json",
            }
          : {}),
      },
      cache: "no-store",
      body: body ? JSON.stringify(body) : undefined,
    });

    const dados = (await resposta
      .json()
      .catch(() => null)) as RespostaChamados | null;

    if (resposta.status === 401) {
      localStorage.removeItem("usuarioLogado");
      router.replace("/login");
      throw new Error("Sessão expirada.");
    }

    if (!resposta.ok || !dados?.ok) {
      throw new Error(
        dados?.erro || "Não foi possível concluir a operação."
      );
    }

    return dados;
  }

  async function carregarChamados() {
    setCarregando(true);
    setErro("");

    try {
      const dados = await chamarApi("GET");

      setChamados(
        Array.isArray(dados.chamados) ? dados.chamados : []
      );

      setLocais(
        Array.isArray(dados.locais) ? dados.locais : []
      );

      setContexto(dados.contexto || null);
      setPermissoes(dados.permissoes || null);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao carregar chamados.";

      console.error("Erro ao carregar chamados:", {
        mensagem,
        error,
      });

      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  function atualizarCampo<K extends keyof FormularioChamado>(
    campo: K,
    valor: FormularioChamado[K]
  ) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function limparFormulario() {
    setFormulario(FORMULARIO_INICIAL);
    setEditandoId(null);
  }

  function abrirNovoChamado() {
    limparFormulario();
    setPainelFormularioAberto(true);
  }

  function editarChamado(chamado: Chamado) {
    if (!permissoes?.pode_editar) {
      alert("Você não possui permissão para editar chamados.");
      return;
    }

    const statusNormalizado = normalizarStatus(chamado.status);

    setFormulario({
      solicitante: texto(chamado.solicitante),
      telefone: texto(chamado.telefone),
      tipo: texto(chamado.tipo),
      local: texto(chamado.local),
      bairro: texto(chamado.bairro),
      numero: texto(chamado.numero),
      referencia: texto(chamado.referencia),
      tipo_local: texto(chamado.tipo_local),
      prioridade: normalizarPrioridade(
        chamado.prioridade
      ) as FormularioChamado["prioridade"],
      status:
        statusNormalizado === "FINALIZADO"
          ? "Finalizado"
          : statusNormalizado === "EM_ATENDIMENTO"
            ? "Em Atendimento"
            : "Aberto",
      observacao: texto(chamado.observacao),
    });

    setEditandoId(chamado.id);
    setPainelFormularioAberto(true);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function selecionarLocal(localId: string) {
    if (!localId) {
      return;
    }

    const localSelecionado = locais.find(
      (item) => String(item.id) === localId
    );

    if (!localSelecionado) {
      return;
    }

    setFormulario((atual) => ({
      ...atual,
      local: localSelecionado.nome,
      tipo_local:
        texto(localSelecionado.tipo) || atual.tipo_local,
    }));
  }

  async function salvarChamado() {
    if (salvando) {
      return;
    }

    if (!formulario.tipo.trim()) {
      alert("Informe o tipo do chamado.");
      return;
    }

    if (!formulario.local.trim()) {
      alert("Informe o local do chamado.");
      return;
    }

    if (editandoId && !permissoes?.pode_editar) {
      alert("Você não possui permissão para editar chamados.");
      return;
    }

    if (!editandoId && !permissoes?.pode_criar) {
      alert("Você não possui permissão para criar chamados.");
      return;
    }

    setSalvando(true);

    try {
      const payload = {
        ...(editandoId ? { id: editandoId } : {}),
        solicitante: formulario.solicitante.trim(),
        telefone: formulario.telefone.trim(),
        tipo: formulario.tipo.trim(),
        local: formulario.local.trim(),
        bairro: formulario.bairro.trim(),
        numero: formulario.numero.trim(),
        referencia: formulario.referencia.trim(),
        tipo_local: formulario.tipo_local.trim(),
        prioridade: formulario.prioridade,
        status: formulario.status,
        observacao: formulario.observacao.trim(),
      };

      const dados = await chamarApi(
        editandoId ? "PUT" : "POST",
        payload
      );

      alert(
        dados.mensagem ||
          (editandoId
            ? "Chamado atualizado com sucesso."
            : "Chamado registrado com sucesso.")
      );

      limparFormulario();
      setPainelFormularioAberto(false);
      await carregarChamados();
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao salvar chamado.";

      console.error("Erro ao salvar chamado:", {
        mensagem,
        error,
      });

      alert(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function alterarFluxo(
    chamado: Chamado,
    acao: "ATENDER" | "FINALIZAR"
  ) {
    if (!permissoes?.pode_editar) {
      alert("Você não possui permissão para alterar chamados.");
      return;
    }

    let observacaoFinalizacao = "";

    if (acao === "ATENDER") {
      const confirmar = window.confirm(
        `Iniciar o atendimento do chamado ${
          chamado.protocolo || chamado.id
        }?`
      );

      if (!confirmar) {
        return;
      }
    } else {
      const observacao = window.prompt(
        "Informe a observação de finalização:",
        texto(chamado.observacao_finalizacao)
      );

      if (observacao === null) {
        return;
      }

      observacaoFinalizacao = observacao.trim();

      const confirmar = window.confirm(
        `Finalizar o chamado ${
          chamado.protocolo || chamado.id
        }?`
      );

      if (!confirmar) {
        return;
      }
    }

    setProcessandoId(chamado.id);

    try {
      const dados = await chamarApi("PATCH", {
        id: chamado.id,
        acao,
        observacao_finalizacao: observacaoFinalizacao,
      });

      alert(
        dados.mensagem ||
          (acao === "ATENDER"
            ? "Chamado colocado em atendimento."
            : "Chamado finalizado com sucesso.")
      );

      await carregarChamados();
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao alterar chamado.";

      console.error("Erro ao alterar fluxo do chamado:", {
        mensagem,
        error,
      });

      alert(mensagem);
    } finally {
      setProcessandoId(null);
    }
  }

  async function excluirChamado(chamado: Chamado) {
    if (!permissoes?.pode_excluir) {
      alert("Você não possui permissão para excluir chamados.");
      return;
    }

    const confirmar = window.confirm(
      `Excluir definitivamente o chamado ${
        chamado.protocolo || chamado.id
      }?\n\nEsta ação não poderá ser desfeita.`
    );

    if (!confirmar) {
      return;
    }

    setProcessandoId(chamado.id);

    try {
      const dados = await chamarApi("DELETE", {
        id: chamado.id,
      });

      alert(dados.mensagem || "Chamado excluído com sucesso.");
      await carregarChamados();
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao excluir chamado.";

      console.error("Erro ao excluir chamado:", {
        mensagem,
        error,
      });

      alert(mensagem);
    } finally {
      setProcessandoId(null);
    }
  }

  function gerarOcorrencia(chamado: Chamado) {
    if (!permissoes?.pode_gerar_ocorrencia) {
      alert(
        "Você não possui permissão para gerar ocorrência."
      );
      return;
    }

    const params = new URLSearchParams({
      chamado_id: String(chamado.id),
      tipo: texto(chamado.tipo),
      local: texto(chamado.local),
      bairro: texto(chamado.bairro),
      numero: texto(chamado.numero),
      prioridade: normalizarPrioridade(chamado.prioridade),
      descricao: [
        chamado.observacao
          ? `Informações do chamado: ${chamado.observacao}`
          : "",
        chamado.solicitante
          ? `Solicitante: ${chamado.solicitante}.`
          : "",
        chamado.telefone
          ? `Telefone: ${chamado.telefone}.`
          : "",
        chamado.referencia
          ? `Referência: ${chamado.referencia}.`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });

    router.push(
      `/sistema/ocorrencias/nova?${params.toString()}`
    );
  }

  const chamadosFiltrados = useMemo(() => {
    const termo = normalizar(busca);

    return chamados.filter((chamado) => {
      const textoBusca = normalizar(
        [
          chamado.protocolo,
          chamado.solicitante,
          chamado.telefone,
          chamado.tipo,
          chamado.local,
          chamado.bairro,
          chamado.numero,
          chamado.referencia,
          chamado.tipo_local,
          chamado.prioridade,
          chamado.status,
          chamado.observacao,
          chamado.atendido_por,
          chamado.finalizado_por,
        ].join(" ")
      );

      const passaBusca =
        !termo || textoBusca.includes(termo);

      const passaStatus =
        filtroStatus === "TODOS" ||
        normalizarStatus(chamado.status) === filtroStatus;

      const passaPrioridade =
        filtroPrioridade === "TODAS" ||
        normalizarPrioridade(chamado.prioridade) ===
          filtroPrioridade;

      return passaBusca && passaStatus && passaPrioridade;
    });
  }, [chamados, busca, filtroStatus, filtroPrioridade]);

  const resumo = useMemo(() => {
    return {
      total: chamados.length,
      abertos: chamados.filter(
        (item) => normalizarStatus(item.status) === "ABERTO"
      ).length,
      atendimento: chamados.filter(
        (item) =>
          normalizarStatus(item.status) === "EM_ATENDIMENTO"
      ).length,
      finalizados: chamados.filter(
        (item) =>
          normalizarStatus(item.status) === "FINALIZADO"
      ).length,
      altaUrgente: chamados.filter((item) => {
        const prioridade = normalizarPrioridade(
          item.prioridade
        );

        return prioridade === "ALTA" || prioridade === "URGENTE";
      }).length,
    };
  }, [chamados]);

  const filtrosAtivos =
    Boolean(busca.trim()) ||
    filtroStatus !== "TODOS" ||
    filtroPrioridade !== "TODAS";

  function limparFiltros() {
    setBusca("");
    setFiltroStatus("TODOS");
    setFiltroPrioridade("TODAS");
  }

  if (carregando) {
    return (
      <ProtecaoModulo modulo="chamados">
        <div className="grid min-h-[70vh] place-items-center p-6">
          <div className="flex items-center gap-3 text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            Carregando Central de Chamados...
          </div>
        </div>
      </ProtecaoModulo>
    );
  }

  return (
    <ProtecaoModulo modulo="chamados">
      <main className="min-h-screen bg-slate-950 pb-24 text-white">
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.17),transparent_38%),linear-gradient(180deg,#07111f_0%,#020617_100%)]">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-9">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_35px_rgba(34,211,238,0.12)]">
                  <ClipboardList className="h-7 w-7 text-cyan-300" />
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                      Central Operacional
                    </span>

                    {contexto?.usuario_nome && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                        {contexto.usuario_nome}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl font-black tracking-tight md:text-4xl">
                    Central de Chamados
                  </h1>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 md:text-base">
                    Registre solicitações, acompanhe atendimentos e transforme chamados em ocorrências operacionais.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void carregarChamados()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar
                </button>

                {permissoes?.pode_criar && (
                  <button
                    type="button"
                    onClick={abrirNovoChamado}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
                  >
                    <Plus className="h-5 w-5" />
                    Novo chamado
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 md:px-6">
          {erro && (
            <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />

                <div className="flex-1">
                  <h2 className="font-bold text-red-100">
                    Não foi possível carregar os chamados
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-red-100/75">
                    {erro}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void carregarChamados()}
                  className="rounded-xl border border-red-400/25 px-3 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/15"
                >
                  Tentar novamente
                </button>
              </div>
            </section>
          )}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <ResumoCard
              titulo="Total"
              valor={resumo.total}
              icone={<ClipboardList className="h-5 w-5" />}
            />

            <ResumoCard
              titulo="Abertos"
              valor={resumo.abertos}
              icone={<AlertTriangle className="h-5 w-5" />}
            />

            <ResumoCard
              titulo="Em atendimento"
              valor={resumo.atendimento}
              icone={<Play className="h-5 w-5" />}
            />

            <ResumoCard
              titulo="Finalizados"
              valor={resumo.finalizados}
              icone={<Check className="h-5 w-5" />}
            />

            <ResumoCard
              titulo="Alta ou urgente"
              valor={resumo.altaUrgente}
              icone={<ShieldCheck className="h-5 w-5" />}
            />
          </section>

          {painelFormularioAberto && (
            <section className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-slate-900/80 shadow-2xl shadow-black/20">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-6">
                <div>
                  <h2 className="text-lg font-black">
                    {editandoId
                      ? "Editar chamado"
                      : "Novo chamado"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Preencha os dados essenciais para o atendimento.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    limparFormulario();
                    setPainelFormularioAberto(false);
                  }}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-slate-400 transition hover:bg-white/5 hover:text-white"
                  aria-label="Fechar formulário"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6 xl:grid-cols-3">
                <Campo
                  label="Solicitante"
                  value={formulario.solicitante}
                  onChange={(valor) =>
                    atualizarCampo("solicitante", valor)
                  }
                  placeholder="Nome de quem solicitou"
                />

                <Campo
                  label="Telefone"
                  value={formulario.telefone}
                  onChange={(valor) =>
                    atualizarCampo(
                      "telefone",
                      formatarTelefone(valor)
                    )
                  }
                  placeholder="(75) 99999-9999"
                />

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Tipo do chamado *
                  </label>

                  <input
                    type="text"
                    list="tipos-chamado"
                    value={formulario.tipo}
                    onChange={(event) =>
                      atualizarCampo("tipo", event.target.value)
                    }
                    placeholder="Selecione ou digite"
                    className="input-seguro"
                  />

                  <datalist id="tipos-chamado">
                    {TIPOS_CHAMADO.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Usar local cadastrado
                  </label>

                  <select
                    defaultValue=""
                    onChange={(event) =>
                      selecionarLocal(event.target.value)
                    }
                    className="input-seguro"
                  >
                    <option value="">
                      Selecione um local
                    </option>

                    {locais.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nome}
                        {item.tipo ? ` — ${item.tipo}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <Campo
                  label="Local *"
                  value={formulario.local}
                  onChange={(valor) =>
                    atualizarCampo("local", valor)
                  }
                  placeholder="Rua, avenida, praça ou referência"
                />

                <Campo
                  label="Bairro ou localidade"
                  value={formulario.bairro}
                  onChange={(valor) =>
                    atualizarCampo("bairro", valor)
                  }
                  placeholder="Ex.: Centro"
                />

                <Campo
                  label="Número"
                  value={formulario.numero}
                  onChange={(valor) =>
                    atualizarCampo("numero", valor)
                  }
                  placeholder="S/N"
                />

                <Campo
                  label="Ponto de referência"
                  value={formulario.referencia}
                  onChange={(valor) =>
                    atualizarCampo("referencia", valor)
                  }
                  placeholder="Próximo a..."
                />

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Tipo do local
                  </label>

                  <select
                    value={formulario.tipo_local}
                    onChange={(event) =>
                      atualizarCampo(
                        "tipo_local",
                        event.target.value
                      )
                    }
                    className="input-seguro"
                  >
                    <option value="">Selecione</option>

                    {TIPOS_LOCAL.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Prioridade
                  </label>

                  <select
                    value={formulario.prioridade}
                    onChange={(event) =>
                      atualizarCampo(
                        "prioridade",
                        event.target
                          .value as FormularioChamado["prioridade"]
                      )
                    }
                    className="input-seguro"
                  >
                    <option value="BAIXA">Baixa</option>
                    <option value="MÉDIA">Média</option>
                    <option value="ALTA">Alta</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </div>

                {editandoId && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-200">
                      Status
                    </label>

                    <select
                      value={formulario.status}
                      onChange={(event) =>
                        atualizarCampo(
                          "status",
                          event.target
                            .value as FormularioChamado["status"]
                        )
                      }
                      className="input-seguro"
                    >
                      <option value="Aberto">Aberto</option>
                      <option value="Em Atendimento">
                        Em Atendimento
                      </option>
                      <option value="Finalizado">
                        Finalizado
                      </option>
                    </select>
                  </div>
                )}

                <div className="md:col-span-2 xl:col-span-3">
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Observações
                  </label>

                  <textarea
                    value={formulario.observacao}
                    onChange={(event) =>
                      atualizarCampo(
                        "observacao",
                        event.target.value.slice(0, 5000)
                      )
                    }
                    rows={5}
                    placeholder="Relate as informações recebidas, riscos, pessoas envolvidas e orientações..."
                    className="input-seguro resize-y"
                  />

                  <div className="mt-2 text-right text-xs text-slate-500">
                    {formulario.observacao.length}/5000
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:justify-end md:px-6">
                <button
                  type="button"
                  onClick={() => {
                    limparFormulario();
                    setPainelFormularioAberto(false);
                  }}
                  disabled={salvando}
                  className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => void salvarChamado()}
                  disabled={salvando}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-6 py-3 font-black text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      {editandoId ? "Salvar alterações" : "Registrar chamado"}
                    </>
                  )}
                </button>
              </div>
            </section>
          )}

          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/20 md:p-5">
            <div className="mb-4 flex items-center gap-3">
              <Filter className="h-5 w-5 text-cyan-300" />

              <div>
                <h2 className="font-bold">Filtros</h2>

                <p className="text-sm text-slate-500">
                  Pesquise por protocolo, solicitante, telefone, tipo ou local.
                </p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                <input
                  type="search"
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Buscar chamados..."
                  className="input-seguro pl-12"
                />
              </div>

              <select
                value={filtroStatus}
                onChange={(event) =>
                  setFiltroStatus(event.target.value)
                }
                className="input-seguro"
              >
                <option value="TODOS">Todos os status</option>
                <option value="ABERTO">Abertos</option>
                <option value="EM_ATENDIMENTO">
                  Em atendimento
                </option>
                <option value="FINALIZADO">Finalizados</option>
              </select>

              <select
                value={filtroPrioridade}
                onChange={(event) =>
                  setFiltroPrioridade(event.target.value)
                }
                className="input-seguro"
              >
                <option value="TODAS">Todas as prioridades</option>
                <option value="BAIXA">Baixa</option>
                <option value="MÉDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>

              {filtrosAtivos && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
                >
                  <RotateCcw className="h-4 w-4" />
                  Limpar
                </button>
              )}
            </div>

            <div className="mt-3 text-sm text-slate-500">
              {chamadosFiltrados.length} de {chamados.length} chamado(s)
            </div>
          </section>

          {chamadosFiltrados.length === 0 ? (
            <section className="rounded-3xl border border-dashed border-white/10 bg-slate-900/40 p-10 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white/5">
                <ClipboardList className="h-8 w-8 text-slate-500" />
              </div>

              <h2 className="mt-5 text-lg font-bold">
                Nenhum chamado encontrado
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Não existem chamados cadastrados com os filtros selecionados.
              </p>

              {filtrosAtivos && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="mt-5 rounded-xl bg-cyan-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-400"
                >
                  Limpar filtros
                </button>
              )}
            </section>
          ) : (
            <section className="grid gap-4 lg:grid-cols-2">
              {chamadosFiltrados.map((chamado) => {
                const status = normalizarStatus(chamado.status);
                const processando = processandoId === chamado.id;

                return (
                  <article
                    key={chamado.id}
                    className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:border-cyan-400/25"
                  >
                    <div className="border-b border-white/10 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-bold ${classeStatus(
                                chamado.status
                              )}`}
                            >
                              {status === "FINALIZADO"
                                ? "Finalizado"
                                : status === "EM_ATENDIMENTO"
                                  ? "Em atendimento"
                                  : "Aberto"}
                            </span>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-bold ${classePrioridade(
                                chamado.prioridade
                              )}`}
                            >
                              {normalizarPrioridade(chamado.prioridade)}
                            </span>
                          </div>

                          <h2 className="mt-3 truncate text-lg font-black">
                            {chamado.tipo || "Chamado sem tipo"}
                          </h2>

                          <p className="mt-1 text-sm font-medium text-cyan-300">
                            {chamado.protocolo || `Chamado #${chamado.id}`}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setVisualizando(chamado)}
                          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-200"
                          title="Ver detalhes"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 p-5">
                      <LinhaResumo
                        icone={<MapPin className="h-4 w-4" />}
                        titulo="Local"
                        valor={[
                          chamado.local,
                          chamado.numero
                            ? `nº ${chamado.numero}`
                            : "",
                          chamado.bairro,
                        ]
                          .filter(Boolean)
                          .join(" — ") || "Não informado"}
                      />

                      <LinhaResumo
                        icone={<User className="h-4 w-4" />}
                        titulo="Solicitante"
                        valor={chamado.solicitante || "Não informado"}
                      />

                      <LinhaResumo
                        icone={<Phone className="h-4 w-4" />}
                        titulo="Telefone"
                        valor={chamado.telefone || "Não informado"}
                      />

                      <LinhaResumo
                        icone={<Clock3 className="h-4 w-4" />}
                        titulo="Atendimento"
                        valor={
                          chamado.data_atendimento
                            ? formatarDataHora(chamado.data_atendimento)
                            : "Ainda não iniciado"
                        }
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-white/10 p-4">
                      {permissoes?.pode_editar && (
                        <Acao
                          titulo="Editar"
                          icone={<Pencil className="h-4 w-4" />}
                          onClick={() => editarChamado(chamado)}
                          disabled={processando}
                        />
                      )}

                      {status === "ABERTO" &&
                        permissoes?.pode_atender && (
                          <Acao
                            titulo="Atender"
                            icone={
                              processando ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )
                            }
                            onClick={() =>
                              void alterarFluxo(chamado, "ATENDER")
                            }
                            disabled={processando}
                            destaque="violet"
                          />
                        )}

                      {status === "EM_ATENDIMENTO" &&
                        permissoes?.pode_finalizar && (
                          <Acao
                            titulo="Finalizar"
                            icone={
                              processando ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )
                            }
                            onClick={() =>
                              void alterarFluxo(chamado, "FINALIZAR")
                            }
                            disabled={processando}
                            destaque="green"
                          />
                        )}

                      {permissoes?.pode_gerar_ocorrencia && (
                        <Acao
                          titulo="Gerar ocorrência"
                          icone={<FilePlus2 className="h-4 w-4" />}
                          onClick={() => gerarOcorrencia(chamado)}
                          disabled={processando}
                          destaque="cyan"
                        />
                      )}

                      {permissoes?.pode_excluir && (
                        <Acao
                          titulo="Excluir"
                          icone={
                            processando ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )
                          }
                          onClick={() => void excluirChamado(chamado)}
                          disabled={processando}
                          destaque="red"
                        />
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>

        {visualizando && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm md:items-center md:p-6"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setVisualizando(null);
              }
            }}
          >
            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-white/10 bg-slate-950 shadow-2xl md:rounded-3xl">
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-slate-950/95 p-5 backdrop-blur md:p-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${classeStatus(
                        visualizando.status
                      )}`}
                    >
                      {visualizando.status || "Aberto"}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${classePrioridade(
                        visualizando.prioridade
                      )}`}
                    >
                      {normalizarPrioridade(visualizando.prioridade)}
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-black md:text-2xl">
                    {visualizando.tipo || "Detalhes do chamado"}
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-cyan-300">
                    {visualizando.protocolo ||
                      `Chamado #${visualizando.id}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setVisualizando(null)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
                <Info titulo="Solicitante" valor={visualizando.solicitante} />
                <Info titulo="Telefone" valor={visualizando.telefone} />
                <Info titulo="Local" valor={visualizando.local} />
                <Info titulo="Bairro" valor={visualizando.bairro} />
                <Info titulo="Número" valor={visualizando.numero} />
                <Info titulo="Tipo do local" valor={visualizando.tipo_local} />
                <Info
                  titulo="Referência"
                  valor={visualizando.referencia}
                  larguraTotal
                />
                <Info
                  titulo="Observações"
                  valor={visualizando.observacao}
                  larguraTotal
                />
                <Info
                  titulo="Atendido por"
                  valor={visualizando.atendido_por}
                />
                <Info
                  titulo="Data do atendimento"
                  valor={
                    visualizando.data_atendimento
                      ? formatarDataHora(
                          visualizando.data_atendimento
                        )
                      : ""
                  }
                />
                <Info
                  titulo="Finalizado por"
                  valor={visualizando.finalizado_por}
                />
                <Info
                  titulo="Data da finalização"
                  valor={
                    visualizando.finalizado_em
                      ? formatarDataHora(visualizando.finalizado_em)
                      : ""
                  }
                />
                <Info
                  titulo="Observação da finalização"
                  valor={visualizando.observacao_finalizacao}
                  larguraTotal
                />
              </div>

              <div className="flex flex-col gap-3 border-t border-white/10 p-5 sm:flex-row sm:justify-end md:p-6">
                {permissoes?.pode_gerar_ocorrencia && (
                  <button
                    type="button"
                    onClick={() => gerarOcorrencia(visualizando)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
                  >
                    <FilePlus2 className="h-5 w-5" />
                    Gerar ocorrência
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setVisualizando(null)}
                  className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-slate-300 transition hover:bg-white/5"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx global>{`
          .input-seguro {
            width: 100%;
            border-radius: 1rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(2, 6, 23, 0.72);
            padding: 0.875rem 1rem;
            color: white;
            outline: none;
            transition:
              border-color 160ms ease,
              box-shadow 160ms ease;
          }

          .input-seguro::placeholder {
            color: rgb(71 85 105);
          }

          .input-seguro:focus {
            border-color: rgba(34, 211, 238, 0.6);
            box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.1);
          }
        `}</style>
      </main>
    </ProtecaoModulo>
  );
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-200">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="input-seguro"
      />
    </div>
  );
}

function ResumoCard({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: number;
  icone: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-lg shadow-black/10">
      <div className="flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300">
          {icone}
        </div>

        <span className="text-2xl font-black">
          {valor}
        </span>
      </div>

      <div className="mt-3 text-sm text-slate-500">
        {titulo}
      </div>
    </div>
  );
}

function LinhaResumo({
  icone,
  titulo,
  valor,
}: {
  icone: ReactNode;
  titulo: string;
  valor: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-slate-500">
        {icone}
      </div>

      <div className="min-w-0">
        <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
          {titulo}
        </div>

        <div className="mt-1 break-words text-sm font-medium text-slate-300">
          {valor}
        </div>
      </div>
    </div>
  );
}

function Acao({
  titulo,
  icone,
  onClick,
  disabled,
  destaque = "slate",
}: {
  titulo: string;
  icone: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destaque?: "slate" | "cyan" | "violet" | "green" | "red";
}) {
  const classes = {
    slate:
      "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
    cyan:
      "border-cyan-400/20 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20",
    violet:
      "border-violet-400/20 bg-violet-400/10 text-violet-200 hover:bg-violet-400/20",
    green:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20",
    red:
      "border-red-400/20 bg-red-400/10 text-red-200 hover:bg-red-400/20",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${classes[destaque]}`}
    >
      {icone}
      {titulo}
    </button>
  );
}

function Info({
  titulo,
  valor,
  larguraTotal = false,
}: {
  titulo: string;
  valor?: string | null;
  larguraTotal?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 ${
        larguraTotal ? "md:col-span-2" : ""
      }`}
    >
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        {titulo}
      </div>

      <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">
        {texto(valor) || "Não informado"}
      </div>
    </div>
  );
}