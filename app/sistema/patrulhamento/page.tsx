"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Eye,
  Filter,
  Flag,
  Loader2,
  Map,
  MapPin,
  Navigation,
  Plus,
  Radar,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";

type ContextoPatrulhamento = {
  usuario_id: number;
  usuario_nome: string | null;
  perfil: string;
  municipio_id: number;
};

type PermissoesPatrulhamento = {
  pode_ver: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
};

type Patrulhamento = {
  id: number;
  municipio_id: number;
  data: string | null;
  hora: string | null;
  local: string | null;
  guarda: string | null;
  equipe: string | null;
  viatura: string | null;
  latitude: number | null;
  longitude: number | null;
  observacao: string | null;
  status: string | null;
  finalizado_em?: string | null;
};

type RespostaPatrulhamento = {
  ok?: boolean;
  erro?: string;
  mensagem?: string;
  contexto?: ContextoPatrulhamento;
  permissoes?: PermissoesPatrulhamento;
  patrulhamentos?: Patrulhamento[];
  patrulhamento?: Patrulhamento;
  gps_final_registrado?: boolean;
};

type Coordenadas = {
  latitude: number;
  longitude: number;
  precisao: number | null;
  velocidade: number | null;
};

const CHAVE_WATCH = "patrulhamento_v2_watch_id";
const CHAVE_ATIVO = "patrulhamentoAtivoId";
const CHAVE_ULTIMO = "patrulhamento_v2_ultimo_ponto";

function texto(valor: unknown) {
  return String(valor ?? "").trim();
}

function normalizar(valor: unknown) {
  return texto(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function statusFinalizado(valor: unknown) {
  return normalizar(valor) === "FINALIZADO";
}

function statusAtivo(valor: unknown) {
  const status = normalizar(valor);

  return (
    status === "ATIVO" ||
    status === "EM ANDAMENTO" ||
    status === "EM_ANDAMENTO" ||
    status === "INICIADO"
  );
}

function formatarData(valor?: string | null) {
  if (!valor) {
    return "Data não informada";
  }

  const data = new Date(`${valor}T12:00:00`);

  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return new Intl.DateTimeFormat("pt-BR").format(data);
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

function classeStatus(valor: unknown) {
  if (statusFinalizado(valor)) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }

  if (statusAtivo(valor)) {
    return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";
  }

  return "border-amber-500/30 bg-amber-500/10 text-amber-200";
}

function rotuloStatus(valor: unknown) {
  if (statusFinalizado(valor)) {
    return "Finalizado";
  }

  if (statusAtivo(valor)) {
    return "Em andamento";
  }

  return texto(valor) || "Pendente";
}

function limparMonitoramentoLocal() {
  if (
    typeof navigator !== "undefined" &&
    navigator.geolocation
  ) {
    const watchId = localStorage.getItem(CHAVE_WATCH);

    if (watchId) {
      navigator.geolocation.clearWatch(Number(watchId));
    }
  }

  localStorage.removeItem(CHAVE_WATCH);
  localStorage.removeItem(CHAVE_ATIVO);
  localStorage.removeItem(CHAVE_ULTIMO);
}

function obterLocalizacaoFinal(): Promise<Coordenadas> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new Error(
          "GPS não disponível neste dispositivo."
        )
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          precisao:
            Number.isFinite(position.coords.accuracy)
              ? position.coords.accuracy
              : null,
          velocidade:
            typeof position.coords.speed === "number" &&
            Number.isFinite(position.coords.speed)
              ? position.coords.speed
              : null,
        });
      },
      (error) => {
        const mensagem =
          error.code === error.PERMISSION_DENIED
            ? "A permissão de localização foi negada."
            : error.code === error.TIMEOUT
              ? "O GPS demorou demais para responder."
              : "Não foi possível obter a localização atual.";

        reject(new Error(mensagem));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}

export default function PatrulhamentoPage() {
  const router = useRouter();

  const [patrulhamentos, setPatrulhamentos] =
    useState<Patrulhamento[]>([]);

  const [contexto, setContexto] =
    useState<ContextoPatrulhamento | null>(null);

  const [permissoes, setPermissoes] =
    useState<PermissoesPatrulhamento | null>(null);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] =
    useState("TODOS");

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] = useState("");
  const [processandoId, setProcessandoId] =
    useState<number | null>(null);

  const [
    patrulhamentoAtivoId,
    setPatrulhamentoAtivoId,
  ] = useState<number | null>(null);

  useEffect(() => {
    void carregarPatrulhamentos();
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
    method: "GET" | "PATCH" | "DELETE",
    body?: Record<string, unknown>
  ) {
    const accessToken = await obterAccessToken();

    const resposta = await fetch("/api/patrulhamento", {
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
      .catch(() => null)) as RespostaPatrulhamento | null;

    if (resposta.status === 401) {
      localStorage.removeItem("usuarioLogado");
      router.replace("/login");
      throw new Error("Sessão expirada.");
    }

    if (!resposta.ok || !dados?.ok) {
      throw new Error(
        dados?.erro ||
          "Não foi possível concluir a operação."
      );
    }

    return dados;
  }

  function sincronizarAtivo(lista: Patrulhamento[]) {
    const idLocal = Number(
      localStorage.getItem(CHAVE_ATIVO) || 0
    );

    const ativoLocal = lista.find(
      (item) =>
        item.id === idLocal &&
        !statusFinalizado(item.status)
    );

    if (ativoLocal) {
      setPatrulhamentoAtivoId(ativoLocal.id);
      return;
    }

    if (idLocal) {
      localStorage.removeItem(CHAVE_ATIVO);
    }

    const ativoServidor = lista.find((item) =>
      statusAtivo(item.status)
    );

    setPatrulhamentoAtivoId(
      ativoServidor?.id || null
    );
  }

  async function carregarPatrulhamentos() {
    setCarregando(true);
    setErro("");

    try {
      const dados = await chamarApi("GET");

      const lista = Array.isArray(
        dados.patrulhamentos
      )
        ? dados.patrulhamentos
        : [];

      setPatrulhamentos(lista);
      setContexto(dados.contexto || null);
      setPermissoes(dados.permissoes || null);
      sincronizarAtivo(lista);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao carregar patrulhamentos.";

      console.error(
        "Erro ao carregar patrulhamentos:",
        {
          mensagem,
          error,
        }
      );

      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  async function finalizarPatrulhamento(
    patrulhamento: Patrulhamento
  ) {
    if (!permissoes?.pode_editar) {
      alert(
        "Você não possui permissão para finalizar patrulhamentos."
      );
      return;
    }

    const confirmar = window.confirm(
      `Finalizar o patrulhamento ${patrulhamento.id}?\n\nO sistema tentará registrar o ponto GPS final.`
    );

    if (!confirmar) {
      return;
    }

    setProcessandoId(patrulhamento.id);

    try {
      let coordenadas: Coordenadas | null = null;

      try {
        coordenadas = await obterLocalizacaoFinal();
      } catch (gpsError) {
        const mensagemGps =
          gpsError instanceof Error
            ? gpsError.message
            : "Não foi possível capturar o GPS.";

        const finalizarSemGps = window.confirm(
          `${mensagemGps}\n\nDeseja finalizar mesmo sem registrar o ponto GPS final?`
        );

        if (!finalizarSemGps) {
          return;
        }
      }

      const dados = await chamarApi("PATCH", {
        id: patrulhamento.id,
        latitude: coordenadas?.latitude ?? null,
        longitude: coordenadas?.longitude ?? null,
        precisao: coordenadas?.precisao ?? null,
        velocidade: coordenadas?.velocidade ?? null,
      });

      limparMonitoramentoLocal();
      setPatrulhamentoAtivoId(null);

      alert(
        dados.gps_final_registrado
          ? "Patrulhamento finalizado com ponto GPS registrado."
          : dados.mensagem ||
              "Patrulhamento finalizado sem ponto GPS final."
      );

      await carregarPatrulhamentos();
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao finalizar patrulhamento.";

      console.error(
        "Erro ao finalizar patrulhamento:",
        {
          mensagem,
          error,
        }
      );

      alert(mensagem);
    } finally {
      setProcessandoId(null);
    }
  }

  async function excluirPatrulhamento(
    patrulhamento: Patrulhamento
  ) {
    if (!permissoes?.pode_excluir) {
      alert(
        "Você não possui permissão para excluir patrulhamentos."
      );
      return;
    }

    const motivo = window.prompt(
      `Informe o motivo da exclusão do patrulhamento ${patrulhamento.id}:`
    );

    if (motivo === null) {
      return;
    }

    if (motivo.trim().length < 3) {
      alert(
        "Informe um motivo válido para a exclusão."
      );
      return;
    }

    const confirmar = window.confirm(
      `Excluir definitivamente o patrulhamento ${patrulhamento.id}?\n\nEsta ação não poderá ser desfeita.`
    );

    if (!confirmar) {
      return;
    }

    setProcessandoId(patrulhamento.id);

    try {
      const dados = await chamarApi("DELETE", {
        id: patrulhamento.id,
        motivo: motivo.trim(),
      });

      if (
        patrulhamentoAtivoId ===
        patrulhamento.id
      ) {
        limparMonitoramentoLocal();
        setPatrulhamentoAtivoId(null);
      }

      alert(
        dados.mensagem ||
          "Patrulhamento excluído com sucesso."
      );

      await carregarPatrulhamentos();
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao excluir patrulhamento.";

      console.error(
        "Erro ao excluir patrulhamento:",
        {
          mensagem,
          error,
        }
      );

      alert(mensagem);
    } finally {
      setProcessandoId(null);
    }
  }

  const filtrados = useMemo(() => {
    const termo = normalizar(busca);

    return patrulhamentos.filter((item) => {
      const conteudo = normalizar(
        [
          item.id,
          item.data,
          item.hora,
          item.local,
          item.guarda,
          item.equipe,
          item.viatura,
          item.observacao,
          item.status,
        ].join(" ")
      );

      const atendeBusca =
        !termo || conteudo.includes(termo);

      const atendeStatus =
        filtroStatus === "TODOS" ||
        (filtroStatus === "ATIVOS" &&
          !statusFinalizado(item.status)) ||
        (filtroStatus === "FINALIZADOS" &&
          statusFinalizado(item.status));

      return atendeBusca && atendeStatus;
    });
  }, [patrulhamentos, busca, filtroStatus]);

  const resumo = useMemo(() => {
    const finalizados = patrulhamentos.filter(
      (item) => statusFinalizado(item.status)
    ).length;

    const ativos = patrulhamentos.length - finalizados;

    const equipes = new Set(
      patrulhamentos
        .map((item) => texto(item.equipe))
        .filter(Boolean)
    ).size;

    const viaturas = new Set(
      patrulhamentos
        .map((item) => texto(item.viatura))
        .filter(Boolean)
    ).size;

    return {
      total: patrulhamentos.length,
      ativos,
      finalizados,
      equipes,
      viaturas,
    };
  }, [patrulhamentos]);

  if (carregando) {
    return (
      <ProtecaoModulo modulo="patrulhamento">
        <div className="grid min-h-[70vh] place-items-center p-6">
          <div className="flex items-center gap-3 text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            Carregando Central de Patrulhamento...
          </div>
        </div>
      </ProtecaoModulo>
    );
  }

  return (
    <ProtecaoModulo modulo="patrulhamento">
      <main className="min-h-screen bg-slate-950 pb-24 text-white">
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.17),transparent_38%),linear-gradient(180deg,#07111f_0%,#020617_100%)]">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-9">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_35px_rgba(34,211,238,0.12)]">
                  <Radar className="h-7 w-7 text-cyan-300" />
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
                    Central de Patrulhamento
                  </h1>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 md:text-base">
                    Acompanhe deslocamentos operacionais, rotas GPS, equipes, viaturas e pontos visitados.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    void carregarPatrulhamentos()
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar
                </button>

                {permissoes?.pode_criar && (
                  <Link
                    href="/sistema/patrulhamento/novo"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
                  >
                    <Plus className="h-5 w-5" />
                    Novo patrulhamento
                  </Link>
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
                    Não foi possível carregar os patrulhamentos
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-red-100/75">
                    {erro}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void carregarPatrulhamentos()
                  }
                  className="rounded-xl border border-red-400/25 px-3 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/15"
                >
                  Tentar novamente
                </button>
              </div>
            </section>
          )}

          {patrulhamentoAtivoId && (
            <section className="rounded-3xl border border-cyan-400/30 bg-cyan-400/[0.08] p-5 shadow-[0_0_35px_rgba(34,211,238,0.08)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <Activity className="mt-0.5 h-6 w-6 animate-pulse text-cyan-300" />

                  <div>
                    <h2 className="font-black text-cyan-100">
                      Patrulhamento em andamento
                    </h2>

                    <p className="mt-1 text-sm text-cyan-100/70">
                      O patrulhamento #{patrulhamentoAtivoId} está ativo neste dispositivo.
                    </p>
                  </div>
                </div>

                <Link
                  href={`/sistema/patrulhamento/${patrulhamentoAtivoId}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
                >
                  Continuar acompanhamento
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          )}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <ResumoCard
              titulo="Total"
              valor={resumo.total}
              icone={<Route className="h-5 w-5" />}
            />

            <ResumoCard
              titulo="Em andamento"
              valor={resumo.ativos}
              icone={<Navigation className="h-5 w-5" />}
            />

            <ResumoCard
              titulo="Finalizados"
              valor={resumo.finalizados}
              icone={<CheckCircle2 className="h-5 w-5" />}
            />

            <ResumoCard
              titulo="Equipes"
              valor={resumo.equipes}
              icone={<Users className="h-5 w-5" />}
            />

            <ResumoCard
              titulo="Viaturas"
              valor={resumo.viaturas}
              icone={<ShieldCheck className="h-5 w-5" />}
            />
          </section>

          <section className="grid gap-3 md:grid-cols-3">
            <Atalho
              href="/sistema/patrulhamento/rotas"
              titulo="Rotas GPS"
              texto="Visualize trajetos e pontos registrados."
              icone={<Map className="h-6 w-6" />}
            />

            <Atalho
              href="/sistema/patrulhamento/visitas"
              titulo="Visitas e pontos"
              texto="Acompanhe os locais visitados durante o percurso."
              icone={<MapPin className="h-6 w-6" />}
            />

            <Atalho
              href="/sistema/patrulhamento/visitas/qrcode"
              titulo="QR Code"
              texto="Cadastre e utilize pontos de presença."
              icone={<Flag className="h-6 w-6" />}
            />
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/20 md:p-5">
            <div className="mb-4 flex items-center gap-3">
              <Filter className="h-5 w-5 text-cyan-300" />

              <div>
                <h2 className="font-bold">
                  Filtros
                </h2>

                <p className="text-sm text-slate-500">
                  Pesquise por data, local, guarda, equipe, viatura ou status.
                </p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_230px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                <input
                  type="search"
                  value={busca}
                  onChange={(event) =>
                    setBusca(event.target.value)
                  }
                  placeholder="Buscar patrulhamentos..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                />
              </div>

              <select
                value={filtroStatus}
                onChange={(event) =>
                  setFiltroStatus(event.target.value)
                }
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-white outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
              >
                <option value="TODOS">
                  Todos os status
                </option>
                <option value="ATIVOS">
                  Em andamento
                </option>
                <option value="FINALIZADOS">
                  Finalizados
                </option>
              </select>
            </div>

            <div className="mt-3 text-sm text-slate-500">
              {filtrados.length} de {patrulhamentos.length} registro(s)
            </div>
          </section>

          {filtrados.length === 0 ? (
            <section className="rounded-3xl border border-dashed border-white/10 bg-slate-900/40 p-10 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white/5">
                <Route className="h-8 w-8 text-slate-500" />
              </div>

              <h2 className="mt-5 text-lg font-bold">
                Nenhum patrulhamento encontrado
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Não existem patrulhamentos cadastrados com os filtros selecionados.
              </p>
            </section>
          ) : (
            <section className="grid gap-4 lg:grid-cols-2">
              {filtrados.map((item) => {
                const finalizado =
                  statusFinalizado(item.status);

                const processando =
                  processandoId === item.id;

                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:border-cyan-400/25"
                  >
                    <div className="border-b border-white/10 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-bold ${classeStatus(
                                item.status
                              )}`}
                            >
                              {rotuloStatus(item.status)}
                            </span>

                            {patrulhamentoAtivoId ===
                              item.id && (
                              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
                                Ativo neste aparelho
                              </span>
                            )}
                          </div>

                          <h2 className="mt-3 truncate text-lg font-black">
                            {item.local ||
                              `Patrulhamento #${item.id}`}
                          </h2>

                          <p className="mt-1 text-sm font-semibold text-cyan-300">
                            Patrulhamento #{item.id}
                          </p>
                        </div>

                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/5 text-cyan-300">
                          <Navigation className="h-5 w-5" />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 p-5 sm:grid-cols-2">
                      <Info
                        titulo="Data e hora"
                        valor={`${formatarData(
                          item.data
                        )}${item.hora ? ` às ${item.hora}` : ""}`}
                      />

                      <Info
                        titulo="Guarda responsável"
                        valor={
                          item.guarda || "Não informado"
                        }
                      />

                      <Info
                        titulo="Equipe"
                        valor={
                          item.equipe || "Não informada"
                        }
                      />

                      <Info
                        titulo="Viatura"
                        valor={
                          item.viatura || "Não informada"
                        }
                      />

                      {finalizado && (
                        <Info
                          titulo="Finalizado em"
                          valor={formatarDataHora(
                            item.finalizado_em
                          )}
                        />
                      )}

                      <Info
                        titulo="GPS inicial"
                        valor={
                          item.latitude !== null &&
                          item.longitude !== null
                            ? `${Number(
                                item.latitude
                              ).toFixed(6)}, ${Number(
                                item.longitude
                              ).toFixed(6)}`
                            : "Não registrado"
                        }
                      />
                    </div>

                    {item.observacao && (
                      <div className="mx-5 mb-5 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                        <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                          Observação
                        </div>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                          {item.observacao}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 border-t border-white/10 p-4">
                      <Link
                        href={`/sistema/patrulhamento/${item.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
                      >
                        <Eye className="h-4 w-4" />
                        Abrir
                      </Link>

                      {!finalizado &&
                        permissoes?.pode_editar && (
                          <button
                            type="button"
                            onClick={() =>
                              void finalizarPatrulhamento(
                                item
                              )
                            }
                            disabled={processando}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {processando ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            Finalizar
                          </button>
                        )}

                      {permissoes?.pode_excluir && (
                        <button
                          type="button"
                          onClick={() =>
                            void excluirPatrulhamento(
                              item
                            )
                          }
                          disabled={processando}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {processando ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Excluir
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </main>
    </ProtecaoModulo>
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

function Atalho({
  href,
  titulo,
  texto: descricao,
  icone,
}: {
  href: string;
  titulo: string;
  texto: string;
  icone: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-white/10 bg-slate-900/70 p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-cyan-400/[0.05]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300">
          {icone}
        </div>

        <ChevronRight className="h-5 w-5 text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300" />
      </div>

      <h2 className="mt-4 font-black">
        {titulo}
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {descricao}
      </p>
    </Link>
  );
}

function Info({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        {titulo}
      </div>

      <div className="mt-1 break-words text-sm font-semibold text-slate-200">
        {valor}
      </div>
    </div>
  );
}