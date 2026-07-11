"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  ImageIcon,
  Loader2,
  Map as MapIcon,
  MapPin,
  Printer,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Trash2,
  User,
  X,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import { supabase } from "@/lib/supabase";

type Contexto = {
  usuario_id: number;
  usuario_nome: string | null;
  perfil: string;
  municipio_id: number;
};

type Permissoes = {
  pode_ver: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
};

type CheckinVisita = {
  id: number;
  municipio_id: number;
  plano_id: number | null;
  ponto_id: number | null;
  usuario_id: number | null;
  nome: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  precisao: number | string | null;
  distancia_metros: number | string | null;
  observacao: string | null;
  foto_url: string | null;
  criado_em: string | null;
};

type PontoVisita = {
  id: number;
  nome_local: string | null;
};

type PlanoVisita = {
  id: number;
  nome: string | null;
};

type Resumo = {
  checkins: number;
  planos: number;
  pontos: number;
  dentro_raio: number;
  fora_raio: number;
  com_foto: number;
};

type RespostaRelatorio = {
  ok?: boolean;
  erro?: string;
  mensagem?: string;
  contexto?: Contexto;
  permissoes?: Permissoes;
  checkins?: CheckinVisita[];
  pontos?: PontoVisita[];
  planos?: PlanoVisita[];
  resumo?: Resumo;
  limite_aplicado?: number;
};

type Filtros = {
  busca: string;
  dataInicio: string;
  dataFim: string;
  pontoId: string;
  planoId: string;
  limite: string;
};

const FILTROS_INICIAIS: Filtros = {
  busca: "",
  dataInicio: "",
  dataFim: "",
  pontoId: "",
  planoId: "",
  limite: "500",
};

function formatarDataHora(
  valor: string | null
) {
  if (!valor) {
    return "Data não informada";
  }

  const data = new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return valor;
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "medium",
    }
  ).format(data);
}

function numeroValido(
  valor: unknown
) {
  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : null;
}

function urlHttpValida(
  valor: string | null
) {
  if (!valor) {
    return null;
  }

  try {
    const url = new URL(valor);

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export default function RelatorioVisitasPage() {
  const router = useRouter();

  const [contexto, setContexto] =
    useState<Contexto | null>(
      null
    );

  const [permissoes, setPermissoes] =
    useState<Permissoes | null>(
      null
    );

  const [checkins, setCheckins] =
    useState<CheckinVisita[]>(
      []
    );

  const [pontos, setPontos] =
    useState<PontoVisita[]>(
      []
    );

  const [planos, setPlanos] =
    useState<PlanoVisita[]>(
      []
    );

  const [resumo, setResumo] =
    useState<Resumo>({
      checkins: 0,
      planos: 0,
      pontos: 0,
      dentro_raio: 0,
      fora_raio: 0,
      com_foto: 0,
    });

  const [filtros, setFiltros] =
    useState<Filtros>(
      FILTROS_INICIAIS
    );

  const [
    filtrosAplicados,
    setFiltrosAplicados,
  ] = useState<Filtros>(
    FILTROS_INICIAIS
  );

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    excluindoId,
    setExcluindoId,
  ] = useState<number | null>(
    null
  );

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    void carregarRelatorio(
      FILTROS_INICIAIS
    );
  }, []);

  const mapaPontos =
    useMemo(
      () =>
        new Map(
          pontos.map((item) => [
            Number(item.id),
            item.nome_local ||
              `Ponto ${item.id}`,
          ])
        ),
      [pontos]
    );

  const mapaPlanos =
    useMemo(
      () =>
        new Map(
          planos.map((item) => [
            Number(item.id),
            item.nome ||
              `Plano ${item.id}`,
          ])
        ),
      [planos]
    );

  async function obterAccessToken() {
    const {
      data: { session },
      error,
    } =
      await supabase.auth.getSession();

    if (
      error ||
      !session?.access_token
    ) {
      throw new Error(
        "Sua sessão expirou. Entre novamente no sistema."
      );
    }

    return session.access_token;
  }

  async function lerResposta(
    resposta: Response
  ) {
    const dados = (await resposta
      .json()
      .catch(
        () => null
      )) as RespostaRelatorio | null;

    if (
      resposta.status === 401
    ) {
      router.replace(
        "/login"
      );

      throw new Error(
        "Sessão expirada."
      );
    }

    if (
      !resposta.ok ||
      !dados?.ok
    ) {
      throw new Error(
        dados?.erro ||
          "Não foi possível concluir a operação."
      );
    }

    return dados;
  }

  function montarConsulta(
    valores: Filtros
  ) {
    const parametros =
      new URLSearchParams();

    if (
      valores.busca.trim()
    ) {
      parametros.set(
        "busca",
        valores.busca.trim()
      );
    }

    if (valores.dataInicio) {
      parametros.set(
        "data_inicio",
        valores.dataInicio
      );
    }

    if (valores.dataFim) {
      parametros.set(
        "data_fim",
        valores.dataFim
      );
    }

    if (valores.pontoId) {
      parametros.set(
        "ponto_id",
        valores.pontoId
      );
    }

    if (valores.planoId) {
      parametros.set(
        "plano_id",
        valores.planoId
      );
    }

    parametros.set(
      "limite",
      valores.limite || "500"
    );

    return parametros.toString();
  }

  async function carregarRelatorio(
    valores: Filtros
  ) {
    setCarregando(true);
    setErro("");

    try {
      const accessToken =
        await obterAccessToken();

      const consulta =
        montarConsulta(valores);

      const resposta = await fetch(
        `/api/patrulhamento/visitas/relatorio?${consulta}`,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

      const dados =
        await lerResposta(
          resposta
        );

      setContexto(
        dados.contexto ||
          null
      );

      setPermissoes(
        dados.permissoes ||
          null
      );

      setCheckins(
        dados.checkins ||
          []
      );

      setPontos(
        dados.pontos ||
          []
      );

      setPlanos(
        dados.planos ||
          []
      );

      setResumo(
        dados.resumo || {
          checkins:
            dados.checkins?.length ||
            0,
          planos:
            dados.planos?.length ||
            0,
          pontos:
            dados.pontos?.length ||
            0,
          dentro_raio: 0,
          fora_raio: 0,
          com_foto: 0,
        }
      );

      setFiltrosAplicados({
        ...valores,
      });
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao carregar o relatório.";

      console.error(
        "Erro ao carregar relatório de visitas:",
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

  async function excluirCheckin(
    item: CheckinVisita
  ) {
    if (
      excluindoId !== null
    ) {
      return;
    }

    if (
      !permissoes?.pode_excluir
    ) {
      alert(
        "Você não possui permissão para excluir check-ins de visita."
      );
      return;
    }

    const motivo = window.prompt(
      `Informe o motivo da exclusão do check-in #${item.id}:`
    );

    if (motivo === null) {
      return;
    }

    if (
      motivo.trim().length < 5
    ) {
      alert(
        "Informe um motivo com pelo menos 5 caracteres."
      );
      return;
    }

    const confirmar =
      window.confirm(
        `Confirma a exclusão do check-in #${item.id}?\n\nMotivo: ${motivo.trim()}`
      );

    if (!confirmar) {
      return;
    }

    setExcluindoId(
      item.id
    );

    try {
      const accessToken =
        await obterAccessToken();

      const resposta = await fetch(
        "/api/patrulhamento/visitas/relatorio",
        {
          method: "DELETE",
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: item.id,
            motivo:
              motivo.trim(),
          }),
        }
      );

      const dados =
        await lerResposta(
          resposta
        );

      alert(
        dados.mensagem ||
          "Check-in excluído com sucesso."
      );

      await carregarRelatorio(
        filtrosAplicados
      );
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao excluir o check-in.";

      console.error(
        "Erro ao excluir check-in de visita:",
        {
          mensagem,
          error,
          checkin_id:
            item.id,
        }
      );

      alert(mensagem);
    } finally {
      setExcluindoId(null);
    }
  }

  function limparFiltros() {
    setFiltros({
      ...FILTROS_INICIAIS,
    });

    void carregarRelatorio(
      FILTROS_INICIAIS
    );
  }

  function abrirMapa(
    item: CheckinVisita
  ) {
    const latitude =
      numeroValido(
        item.latitude
      );

    const longitude =
      numeroValido(
        item.longitude
      );

    if (
      latitude === null ||
      longitude === null
    ) {
      alert(
        "Este check-in não possui coordenadas válidas."
      );
      return;
    }

    window.open(
      `https://www.google.com/maps?q=${encodeURIComponent(
        `${latitude},${longitude}`
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function nomePonto(
    pontoId: number | null
  ) {
    if (!pontoId) {
      return "Ponto não informado";
    }

    return (
      mapaPontos.get(
        Number(pontoId)
      ) ||
      `Ponto ${pontoId}`
    );
  }

  function nomePlano(
    planoId: number | null
  ) {
    if (!planoId) {
      return "Plano não informado";
    }

    return (
      mapaPlanos.get(
        Number(planoId)
      ) ||
      `Plano ${planoId}`
    );
  }

  function classeDistancia(
    distancia: unknown
  ) {
    const metros =
      numeroValido(distancia);

    if (metros === null) {
      return "border-slate-700 bg-slate-800 text-slate-300";
    }

    if (metros <= 200) {
      return "border-emerald-700 bg-emerald-900/50 text-emerald-300";
    }

    return "border-red-700 bg-red-900/50 text-red-300";
  }

  function textoDistancia(
    distancia: unknown
  ) {
    const metros =
      numeroValido(distancia);

    if (metros === null) {
      return "Distância não informada";
    }

    if (metros <= 200) {
      return "Dentro do raio permitido";
    }

    return "Fora do raio permitido";
  }

  return (
    <ProtecaoModulo modulo="patrulhamento">
      <main className="min-h-screen bg-slate-950 pb-24 text-white print:bg-white print:text-black">
        <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
          <div className="print:hidden">
            <Link
              href="/sistema/patrulhamento/visitas"
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Visitas
            </Link>

            <SigPageHeader
              titulo="Relatório de Visitas"
              subtitulo="Check-ins realizados nos pontos de visita por QR Code."
              icone={FileText}
            />
          </div>

          <section className="hidden border-b border-black pb-4 print:block">
            <h1 className="text-2xl font-black">
              Relatório de Visitas
            </h1>

            <p className="mt-1 text-sm">
              Município #{contexto?.municipio_id || "-"} • Emitido em{" "}
              {new Date().toLocaleString("pt-BR")}
            </p>
          </section>

          <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <ResumoCard
              titulo="Check-ins"
              valor={resumo.checkins}
              icone={
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              }
            />

            <ResumoCard
              titulo="Planos"
              valor={resumo.planos}
              icone={
                <ShieldCheck className="h-7 w-7 text-blue-400" />
              }
            />

            <ResumoCard
              titulo="Pontos"
              valor={resumo.pontos}
              icone={
                <MapPin className="h-7 w-7 text-cyan-400" />
              }
            />

            <ResumoCard
              titulo="Dentro do raio"
              valor={resumo.dentro_raio}
              icone={
                <Route className="h-7 w-7 text-emerald-400" />
              }
            />

            <ResumoCard
              titulo="Fora do raio"
              valor={resumo.fora_raio}
              icone={
                <Route className="h-7 w-7 text-red-400" />
              }
            />

            <ResumoCard
              titulo="Com foto"
              valor={resumo.com_foto}
              icone={
                <Camera className="h-7 w-7 text-violet-400" />
              }
            />
          </section>

          <SigCard className="print:hidden">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                <Filter className="h-5 w-5 text-cyan-300" />
              </div>

              <div>
                <h2 className="font-black text-white">
                  Filtros do relatório
                </h2>

                <p className="text-sm text-slate-500">
                  A filtragem é validada e executada no servidor.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-300">
                  Busca
                </span>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                  <input
                    value={filtros.busca}
                    maxLength={120}
                    onChange={(event) =>
                      setFiltros(
                        (atual) => ({
                          ...atual,
                          busca:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="Guarda ou observação"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-3 pl-10 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-300">
                  Data inicial
                </span>

                <input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(event) =>
                    setFiltros(
                      (atual) => ({
                        ...atual,
                        dataInicio:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-300">
                  Data final
                </span>

                <input
                  type="date"
                  value={filtros.dataFim}
                  min={
                    filtros.dataInicio ||
                    undefined
                  }
                  onChange={(event) =>
                    setFiltros(
                      (atual) => ({
                        ...atual,
                        dataFim:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-300">
                  Ponto de visita
                </span>

                <select
                  value={filtros.pontoId}
                  onChange={(event) =>
                    setFiltros(
                      (atual) => ({
                        ...atual,
                        pontoId:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                >
                  <option value="">
                    Todos os pontos
                  </option>

                  {pontos.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.nome_local ||
                          `Ponto ${item.id}`}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-300">
                  Plano
                </span>

                <select
                  value={filtros.planoId}
                  onChange={(event) =>
                    setFiltros(
                      (atual) => ({
                        ...atual,
                        planoId:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                >
                  <option value="">
                    Todos os planos
                  </option>

                  {planos.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.nome ||
                          `Plano ${item.id}`}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-300">
                  Limite de registros
                </span>

                <select
                  value={filtros.limite}
                  onChange={(event) =>
                    setFiltros(
                      (atual) => ({
                        ...atual,
                        limite:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                >
                  <option value="100">
                    100 registros
                  </option>
                  <option value="500">
                    500 registros
                  </option>
                  <option value="1000">
                    1.000 registros
                  </option>
                  <option value="2000">
                    2.000 registros
                  </option>
                </select>
              </label>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={limparFiltros}
                disabled={carregando}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Limpar
              </button>

              <button
                type="button"
                onClick={() =>
                  window.print()
                }
                disabled={
                  carregando ||
                  checkins.length === 0
                }
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 font-bold text-cyan-200 transition hover:bg-cyan-400/15 disabled:opacity-50"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </button>

              <button
                type="button"
                onClick={() =>
                  void carregarRelatorio(
                    filtros
                  )
                }
                disabled={carregando}
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
              >
                {carregando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Aplicar filtros
              </button>
            </div>
          </SigCard>

          {erro && (
            <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-red-100 print:hidden">
              <h2 className="font-black">
                Erro ao carregar relatório
              </h2>

              <p className="mt-2 text-sm text-red-100/75">
                {erro}
              </p>
            </section>
          )}

          {carregando ? (
            <SigCard>
              <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                Carregando relatório...
              </div>
            </SigCard>
          ) : checkins.length === 0 ? (
            <SigCard>
              <div className="py-16 text-center">
                <FileText className="mx-auto h-16 w-16 text-slate-700" />

                <h2 className="mt-4 text-xl font-black text-white">
                  Nenhum check-in encontrado
                </h2>

                <p className="mt-2 text-slate-500">
                  Não existem registros para os filtros aplicados.
                </p>
              </div>
            </SigCard>
          ) : (
            <section className="space-y-4">
              <div className="flex flex-col gap-2 print:text-black sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black">
                    Registros encontrados
                  </h2>

                  <p className="text-sm text-slate-500 print:text-black">
                    {checkins.length} check-in(s) exibido(s)
                  </p>
                </div>

                {contexto?.usuario_nome && (
                  <span className="text-sm text-slate-500 print:text-black">
                    Consulta realizada por {contexto.usuario_nome}
                  </span>
                )}
              </div>

              {checkins.map(
                (item) => {
                  const fotoUrl =
                    urlHttpValida(
                      item.foto_url
                    );

                  const latitude =
                    numeroValido(
                      item.latitude
                    );

                  const longitude =
                    numeroValido(
                      item.longitude
                    );

                  const precisao =
                    numeroValido(
                      item.precisao
                    );

                  const distancia =
                    numeroValido(
                      item.distancia_metros
                    );

                  return (
                    <SigCard
                      key={item.id}
                      className="break-inside-avoid print:border print:border-slate-300 print:bg-white print:shadow-none"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-cyan-300 print:border-black print:bg-white print:text-black">
                              Check-in #{item.id}
                            </span>

                            <span
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${classeDistancia(
                                item.distancia_metros
                              )}`}
                            >
                              <Route className="h-3.5 w-3.5" />

                              {distancia === null
                                ? "Sem distância"
                                : `${Math.round(
                                    distancia
                                  )} m`}
                              {" • "}
                              {textoDistancia(
                                item.distancia_metros
                              )}
                            </span>
                          </div>

                          <h3 className="mt-4 flex items-center gap-2 text-lg font-black text-white print:text-black">
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 print:text-black" />
                            {nomePonto(
                              item.ponto_id
                            )}
                          </h3>

                          <div className="mt-3 grid gap-2 text-sm text-slate-400 print:text-black sm:grid-cols-2">
                            <p className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 shrink-0 text-blue-400 print:text-black" />
                              {nomePlano(
                                item.plano_id
                              )}
                            </p>

                            <p className="flex items-center gap-2">
                              <User className="h-4 w-4 shrink-0 text-cyan-400 print:text-black" />
                              {item.nome ||
                                "Usuário não identificado"}
                            </p>

                            <p className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 shrink-0 text-violet-400 print:text-black" />
                              {formatarDataHora(
                                item.criado_em
                              )}
                            </p>

                            <p className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 shrink-0 text-emerald-400 print:text-black" />
                              {latitude === null ||
                              longitude === null
                                ? "Coordenadas não informadas"
                                : `${latitude.toFixed(
                                    6
                                  )}, ${longitude.toFixed(
                                    6
                                  )}`}
                            </p>

                            <p className="flex items-center gap-2">
                              <Clock3 className="h-4 w-4 shrink-0 text-amber-400 print:text-black" />
                              Precisão:{" "}
                              {precisao === null
                                ? "não informada"
                                : `${Math.round(
                                    precisao
                                  )} m`}
                            </p>
                          </div>

                          {item.observacao && (
                            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm leading-6 text-slate-300 print:border-slate-300 print:bg-white print:text-black">
                              {item.observacao}
                            </div>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2 print:hidden">
                            <button
                              type="button"
                              onClick={() =>
                                abrirMapa(
                                  item
                                )
                              }
                              disabled={
                                latitude === null ||
                                longitude === null
                              }
                              className="inline-flex items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-400/10 px-3 py-2 text-sm font-bold text-blue-200 transition hover:bg-blue-400/15 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <MapIcon className="h-4 w-4" />
                              Ver no mapa
                            </button>

                            {permissoes?.pode_excluir && (
                              <button
                                type="button"
                                onClick={() =>
                                  void excluirCheckin(
                                    item
                                  )
                                }
                                disabled={
                                  excluindoId !== null
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200 transition hover:bg-red-500/15 disabled:opacity-50"
                              >
                                {excluindoId ===
                                item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                Excluir
                              </button>
                            )}
                          </div>
                        </div>

                        {fotoUrl ? (
                          <a
                            href={fotoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block shrink-0 print:hidden"
                          >
                            <img
                              src={fotoUrl}
                              alt={`Foto do check-in ${item.id}`}
                              className="h-44 w-full rounded-2xl border border-white/10 object-cover transition hover:opacity-85 lg:w-60"
                            />
                          </a>
                        ) : (
                          <div className="flex h-36 w-full shrink-0 flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-950/50 text-sm text-slate-600 print:hidden lg:h-44 lg:w-60">
                            <ImageIcon className="mb-2 h-7 w-7" />
                            Sem foto
                          </div>
                        )}
                      </div>
                    </SigCard>
                  );
                }
              )}
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
  icone: React.ReactNode;
}) {
  return (
    <SigCard className="print:border print:border-slate-300 print:bg-white print:shadow-none">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 print:text-black">
            {titulo}
          </p>

          <p className="mt-2 text-3xl font-black text-white print:text-black">
            {valor}
          </p>
        </div>

        <div className="print:hidden">
          {icone}
        </div>
      </div>
    </SigCard>
  );
}