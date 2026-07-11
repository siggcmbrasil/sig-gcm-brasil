"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  CalendarDays,
  Car,
  Check,
  ChevronRight,
  Clock3,
  Crosshair,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { supabase } from "@/lib/supabase";
import { iniciarGPSPatrulhamento } from "@/lib/patrulhamento/iniciarGPS";
import { montarUrlComMunicipioContexto } from "@/lib/contextoMunicipio";

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

type Guarda = {
  id: number;
  matricula: string | null;
  nome: string | null;
  cargo: string | null;
  status: string | null;
};

type Viatura = {
  id: number;
  prefixo: string | null;
  modelo: string | null;
  placa: string | null;
  status: string | null;
};

type Guarnicao = {
  id: number;
  nome: string | null;
  comandante_id: number | null;
  viatura_id: number | null;
  ativa: boolean | null;
  guarda_ids: number[];
};

type PatrulhamentoCriado = {
  id: number;
  municipio_id: number;
  data: string;
  hora: string;
  local: string;
  guarda: string;
  equipe: string | null;
  viatura: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  observacao: string | null;
  status: string;
  criado_em: string;
};

type RespostaNovoPatrulhamento = {
  ok?: boolean;
  erro?: string;
  mensagem?: string;
  contexto?: Contexto;
  permissoes?: Permissoes;
  data_referencia?: string;
  guardas?: Guarda[];
  viaturas?: Viatura[];
  guarnicoes?: Guarnicao[];
  guarnicao_servico?: Guarnicao | null;
  patrulhamento?: PatrulhamentoCriado;
  rastreamento?: {
    municipio_id: number;
    patrulhamento_id: number;
  };
};

type Coordenadas = {
  latitude: number;
  longitude: number;
  precisao: number | null;
  velocidade: number | null;
};

function hojeLocal() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(
    agora.getMonth() + 1
  ).padStart(2, "0");
  const dia = String(
    agora.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function horaLocal() {
  const agora = new Date();

  return `${String(
    agora.getHours()
  ).padStart(2, "0")}:${String(
    agora.getMinutes()
  ).padStart(2, "0")}`;
}

function texto(valor: unknown) {
  return String(valor ?? "").trim();
}

function obterLocalizacaoInicial(): Promise<Coordenadas> {
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
        const latitude = Number(
          position.coords.latitude
        );
        const longitude = Number(
          position.coords.longitude
        );

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          reject(
            new Error(
              "A localização recebida é inválida."
            )
          );
          return;
        }

        resolve({
          latitude,
          longitude,
          precisao:
            Number.isFinite(
              position.coords.accuracy
            )
              ? position.coords.accuracy
              : null,
          velocidade:
            typeof position.coords.speed ===
              "number" &&
            Number.isFinite(
              position.coords.speed
            )
              ? position.coords.speed
              : null,
        });
      },
      (error) => {
        const mensagem =
          error.code === error.PERMISSION_DENIED
            ? "Permita o acesso à localização para iniciar o patrulhamento."
            : error.code === error.TIMEOUT
              ? "O GPS demorou demais para responder. Tente novamente em local aberto."
              : "Não foi possível capturar a localização inicial.";

        reject(new Error(mensagem));
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  });
}


function montarUrlPatrulhamento(
  url: string
) {
  let usuario:
    | Record<string, unknown>
    | null = null;

  try {
    const salvo =
      localStorage.getItem(
        "usuarioLogado"
      );

    usuario =
      salvo
        ? (JSON.parse(
            salvo
          ) as Record<
            string,
            unknown
          >)
        : null;
  } catch {
    usuario = null;
  }

  return montarUrlComMunicipioContexto({
    url,
    perfil:
      usuario?.perfil,
    municipioIdUsuario:
      usuario?.municipio_id,
  });
}

export default function NovoPatrulhamentoPage() {
  const router = useRouter();

  const [contexto, setContexto] =
    useState<Contexto | null>(null);

  const [permissoes, setPermissoes] =
    useState<Permissoes | null>(null);

  const [guardas, setGuardas] =
    useState<Guarda[]>([]);

  const [viaturas, setViaturas] =
    useState<Viatura[]>([]);

  const [guarnicoes, setGuarnicoes] =
    useState<Guarnicao[]>([]);

  const [guarnicaoServicoId, setGuarnicaoServicoId] =
    useState<number | null>(null);

  const [data, setData] =
    useState(hojeLocal());

  const [hora, setHora] =
    useState(horaLocal());

  const [local, setLocal] =
    useState("");

  const [observacao, setObservacao] =
    useState("");

  const [guarnicaoId, setGuarnicaoId] =
    useState("");

  const [viaturaId, setViaturaId] =
    useState("");

  const [guardaIds, setGuardaIds] =
    useState<number[]>([]);

  const [buscaGuarda, setBuscaGuarda] =
    useState("");

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    void carregarDados(hojeLocal());
  }, []);

  async function obterAccessToken() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

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

  async function chamarApi(
    method: "GET" | "POST",
    body?: Record<string, unknown>,
    dataReferencia?: string
  ) {
    const accessToken =
      await obterAccessToken();

    const urlBase =
      method === "GET" &&
      dataReferencia
        ? `/api/patrulhamento/novo?data_referencia=${encodeURIComponent(
            dataReferencia
          )}`
        : "/api/patrulhamento/novo";

    const url =
      montarUrlPatrulhamento(
        urlBase
      );

    const resposta = await fetch(url, {
      method,
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
        ...(body
          ? {
              "Content-Type":
                "application/json",
            }
          : {}),
      },
      cache: "no-store",
      body: body
        ? JSON.stringify(body)
        : undefined,
    });

    const dados = (await resposta
      .json()
      .catch(
        () => null
      )) as RespostaNovoPatrulhamento | null;

    if (resposta.status === 401) {
      localStorage.removeItem(
        "usuarioLogado"
      );
      router.replace("/login");
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

  function aplicarGuarnicao(
    guarnicao: Guarnicao | null,
    listaViaturas: Viatura[]
  ) {
    if (!guarnicao) {
      setGuarnicaoId("");
      setGuardaIds([]);
      setViaturaId("");
      return;
    }

    setGuarnicaoId(
      String(guarnicao.id)
    );

    setGuardaIds(
      Array.isArray(
        guarnicao.guarda_ids
      )
        ? guarnicao.guarda_ids
            .map((id) => Number(id))
            .filter(
              (id) =>
                Number.isSafeInteger(id) &&
                id > 0
            )
        : []
    );

    setLocal(
      `Patrulhamento preventivo - ${guarnicao.nome || "Guarnição"}`
    );

    if (
      guarnicao.viatura_id &&
      listaViaturas.some(
        (item) =>
          Number(item.id) ===
          Number(
            guarnicao.viatura_id
          )
      )
    ) {
      setViaturaId(
        String(
          guarnicao.viatura_id
        )
      );
    } else {
      setViaturaId("");
    }
  }

  async function carregarDados(
    dataReferencia: string,
    preservarSelecao = false
  ) {
    setCarregando(true);
    setErro("");

    try {
      const dados =
        await chamarApi(
          "GET",
          undefined,
          dataReferencia
        );

      const listaGuardas =
        dados.guardas || [];

      const listaViaturas =
        dados.viaturas || [];

      const listaGuarnicoes =
        dados.guarnicoes || [];

      setContexto(
        dados.contexto || null
      );

      setPermissoes(
        dados.permissoes || null
      );

      setGuardas(listaGuardas);
      setViaturas(listaViaturas);
      setGuarnicoes(
        listaGuarnicoes
      );

      setGuarnicaoServicoId(
        dados.guarnicao_servico?.id ||
          null
      );

      if (!preservarSelecao) {
        aplicarGuarnicao(
          dados.guarnicao_servico ||
            null,
          listaViaturas
        );
      }
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao carregar os dados.";

      console.error(
        "Erro ao carregar novo patrulhamento:",
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

  function alterarData(
    novaData: string
  ) {
    setData(novaData);

    if (novaData) {
      void carregarDados(
        novaData,
        false
      );
    }
  }

  function alterarGuarnicao(
    valor: string
  ) {
    setGuarnicaoId(valor);

    const selecionada =
      guarnicoes.find(
        (item) =>
          String(item.id) ===
          valor
      ) || null;

    aplicarGuarnicao(
      selecionada,
      viaturas
    );
  }

  function alternarGuarda(
    guardaId: number
  ) {
    setGuardaIds(
      (atuais) =>
        atuais.includes(guardaId)
          ? atuais.filter(
              (id) =>
                id !== guardaId
            )
          : [...atuais, guardaId]
    );
  }

  const guardasFiltrados =
    useMemo(() => {
      const selecionada =
        guarnicoes.find(
          (guarnicao) =>
            String(guarnicao.id) ===
            guarnicaoId
        ) || null;

      const idsDaGuarnicao =
        selecionada &&
        Array.isArray(
          selecionada.guarda_ids
        )
          ? selecionada.guarda_ids
              .map((id) => Number(id))
              .filter(
                (id) =>
                  Number.isSafeInteger(id) &&
                  id > 0
              )
          : null;

      const listaBase =
        idsDaGuarnicao === null
          ? guardas
          : guardas.filter(
              (guarda) =>
                idsDaGuarnicao.includes(
                  Number(guarda.id)
                )
            );

      const termo = texto(
        buscaGuarda
      ).toLocaleLowerCase(
        "pt-BR"
      );

      if (!termo) {
        return listaBase;
      }

      return listaBase.filter(
        (guarda) =>
          [
            guarda.nome,
            guarda.matricula,
            guarda.cargo,
          ]
            .join(" ")
            .toLocaleLowerCase(
              "pt-BR"
            )
            .includes(termo)
      );
    }, [
      guardas,
      guarnicoes,
      guarnicaoId,
      buscaGuarda,
    ]);

  const guardasSelecionados =
    useMemo(
      () =>
        guardaIds
          .map(
            (id) =>
              guardas.find(
                (guarda) =>
                  Number(guarda.id) ===
                  Number(id)
              )
          )
          .filter(
            (
              guarda
            ): guarda is Guarda =>
              Boolean(guarda)
          ),
      [guardaIds, guardas]
    );

  async function salvarPatrulhamento() {
    if (!permissoes?.pode_criar) {
      alert(
        "Você não possui permissão para iniciar patrulhamentos."
      );
      return;
    }

    if (!data || !hora) {
      alert(
        "Informe a data e o horário."
      );
      return;
    }

    if (local.trim().length < 3) {
      alert(
        "Informe o local ou a finalidade do patrulhamento."
      );
      return;
    }

    if (
      guardaIds.length === 0
    ) {
      alert(
        "Selecione pelo menos um guarda."
      );
      return;
    }

    setSalvando(true);

    try {
      const coordenadas =
        await obterLocalizacaoInicial();

      const dados =
        await chamarApi("POST", {
          data,
          hora,
          local:
            local.trim(),
          observacao:
            observacao.trim(),
          guarnicao_id:
            guarnicaoId
              ? Number(
                  guarnicaoId
                )
              : null,
          viatura_id:
            viaturaId
              ? Number(
                  viaturaId
                )
              : null,
          guarda_ids:
            guardaIds,
          latitude:
            coordenadas.latitude,
          longitude:
            coordenadas.longitude,
          precisao:
            coordenadas.precisao,
          velocidade:
            coordenadas.velocidade,
        });

      const rastreamento =
        dados.rastreamento;

      const patrulhamentoId =
        Number(
          rastreamento
            ?.patrulhamento_id ||
            dados.patrulhamento?.id
        );

      const municipioId =
        Number(
          rastreamento
            ?.municipio_id ||
            dados.patrulhamento
              ?.municipio_id
        );

      if (
        !patrulhamentoId ||
        !municipioId
      ) {
        throw new Error(
          "O patrulhamento foi criado, mas o rastreamento não pôde ser iniciado."
        );
      }

      localStorage.setItem(
        "patrulhamentoAtivoId",
        String(
          patrulhamentoId
        )
      );

      try {
        iniciarGPSPatrulhamento({
          municipio_id:
            municipioId,
          patrulhamento_id:
            patrulhamentoId,
        });
      } catch (gpsError) {
        console.error(
          "Patrulhamento criado, mas o acompanhamento automático não iniciou:",
          gpsError
        );

        alert(
          "Patrulhamento iniciado. O ponto inicial foi salvo, mas o rastreamento automático não pôde ser ativado."
        );
      }

      router.push(
        `/sistema/patrulhamento/${patrulhamentoId}`
      );
      router.refresh();
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao iniciar patrulhamento.";

      console.error(
        "Erro ao iniciar patrulhamento:",
        {
          mensagem,
          error,
        }
      );

      alert(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <ProtecaoModulo modulo="patrulhamento">
        <div className="grid min-h-[70vh] place-items-center bg-slate-950 p-6 text-white">
          <div className="flex items-center gap-3 text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            Preparando novo patrulhamento...
          </div>
        </div>
      </ProtecaoModulo>
    );
  }

  return (
    <ProtecaoModulo modulo="patrulhamento">
      <main className="min-h-screen bg-slate-950 pb-24 text-white">
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_40%),linear-gradient(180deg,#07111f_0%,#020617_100%)]">
          <div className="w-full max-w-none px-4 py-6 md:px-6 md:py-8">
            <Link
              href="/sistema/patrulhamento"
              className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar à Central de Patrulhamento
            </Link>

            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10">
                  <Navigation className="h-7 w-7 text-cyan-300" />
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                      Operação em campo
                    </span>

                    {contexto?.usuario_nome && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                        {contexto.usuario_nome}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl font-black tracking-tight md:text-4xl">
                    Iniciar patrulhamento
                  </h1>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 md:text-base">
                    Defina a equipe, viatura e finalidade. O GPS inicial será capturado antes da criação.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void carregarDados(
                    data || hojeLocal(),
                    true
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar dados
              </button>
            </div>
          </div>
        </section>

        <div className="w-full max-w-none space-y-5 px-4 py-5 md:px-6">
          {erro && (
            <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5">
              <h2 className="font-bold text-red-100">
                Não foi possível carregar o formulário
              </h2>

              <p className="mt-2 text-sm text-red-100/75">
                {erro}
              </p>
            </section>
          )}

          {guarnicaoServicoId && (
            <section className="rounded-3xl border border-cyan-400/25 bg-cyan-400/[0.07] p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />

                <div>
                  <h2 className="font-black text-cyan-100">
                    Plantão identificado automaticamente
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-cyan-100/70">
                    A guarnição de serviço foi selecionada conforme a configuração operacional do município.
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <Bloco
                titulo="Dados do patrulhamento"
                descricao="Informe quando e onde a atividade será iniciada."
                icone={
                  <MapPin className="h-5 w-5" />
                }
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Campo
                    titulo="Data"
                    icone={
                      <CalendarDays className="h-4 w-4" />
                    }
                  >
                    <input
                      type="date"
                      value={data}
                      onChange={(event) =>
                        alterarData(
                          event.target.value
                        )
                      }
                      className="campo"
                    />
                  </Campo>

                  <Campo
                    titulo="Hora"
                    icone={
                      <Clock3 className="h-4 w-4" />
                    }
                  >
                    <input
                      type="time"
                      value={hora}
                      onChange={(event) =>
                        setHora(
                          event.target.value
                        )
                      }
                      className="campo"
                    />
                  </Campo>
                </div>

                <Campo
                  titulo="Local ou finalidade"
                  icone={
                    <MapPin className="h-4 w-4" />
                  }
                >
                  <input
                    type="text"
                    value={local}
                    onChange={(event) =>
                      setLocal(
                        event.target.value
                      )
                    }
                    maxLength={300}
                    placeholder="Ex.: Patrulhamento preventivo no Centro"
                    className="campo"
                  />
                </Campo>

                <Campo
                  titulo="Observação"
                  icone={
                    <Crosshair className="h-4 w-4" />
                  }
                >
                  <textarea
                    value={observacao}
                    onChange={(event) =>
                      setObservacao(
                        event.target.value
                      )
                    }
                    maxLength={3000}
                    rows={4}
                    placeholder="Informações complementares da operação"
                    className="campo resize-y"
                  />
                </Campo>
              </Bloco>

              <Bloco
                titulo="Composição da equipe"
                descricao="Selecione uma guarnição ou monte a equipe manualmente."
                icone={
                  <Users className="h-5 w-5" />
                }
              >
                <Campo
                  titulo="Guarnição"
                  icone={
                    <ShieldCheck className="h-4 w-4" />
                  }
                >
                  <select
                    value={guarnicaoId}
                    onChange={(event) =>
                      alterarGuarnicao(
                        event.target.value
                      )
                    }
                    className="campo"
                  >
                    <option value="">
                      Sem guarnição vinculada
                    </option>

                    {guarnicoes.map(
                      (guarnicao) => (
                        <option
                          key={guarnicao.id}
                          value={guarnicao.id}
                        >
                          {guarnicao.nome ||
                            `Guarnição ${guarnicao.id}`}
                          {guarnicao.id ===
                          guarnicaoServicoId
                            ? " — Plantão"
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </Campo>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                  <input
                    type="search"
                    value={buscaGuarda}
                    onChange={(event) =>
                      setBuscaGuarda(
                        event.target.value
                      )
                    }
                    placeholder="Buscar guarda, matrícula ou cargo..."
                    className="campo pl-12"
                  />
                </div>

                <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                  {guardasFiltrados.map(
                    (guarda) => {
                      const selecionado =
                        guardaIds.includes(
                          guarda.id
                        );

                      return (
                        <button
                          key={guarda.id}
                          type="button"
                          onClick={() =>
                            alternarGuarda(
                              guarda.id
                            )
                          }
                          className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                            selecionado
                              ? "border-cyan-400/40 bg-cyan-400/10"
                              : "border-white/10 bg-white/[0.03] hover:border-cyan-400/25"
                          }`}
                        >
                          <span
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${
                              selecionado
                                ? "border-cyan-400/40 bg-cyan-400 text-slate-950"
                                : "border-white/10 bg-slate-950 text-slate-500"
                            }`}
                          >
                            {selecionado ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Users className="h-4 w-4" />
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-bold text-slate-100">
                              {guarda.nome ||
                                `Guarda ${guarda.id}`}
                            </span>

                            <span className="mt-1 block truncate text-xs text-slate-500">
                              {[
                                guarda.matricula
                                  ? `Matrícula ${guarda.matricula}`
                                  : "",
                                guarda.cargo,
                              ]
                                .filter(Boolean)
                                .join(" • ") ||
                                "Sem detalhes adicionais"}
                            </span>
                          </span>
                        </button>
                      );
                    }
                  )}

                  {guardasFiltrados.length ===
                    0 && (
                    <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
                      Nenhum guarda encontrado.
                    </div>
                  )}
                </div>
              </Bloco>

              <Bloco
                titulo="Viatura"
                descricao="Vincule uma viatura operacional ou de reserva."
                icone={
                  <Car className="h-5 w-5" />
                }
              >
                <select
                  value={viaturaId}
                  onChange={(event) =>
                    setViaturaId(
                      event.target.value
                    )
                  }
                  className="campo"
                >
                  <option value="">
                    Patrulhamento sem viatura
                  </option>

                  {viaturas.map(
                    (viatura) => (
                      <option
                        key={viatura.id}
                        value={viatura.id}
                      >
                        {viatura.prefixo ||
                          `Viatura ${viatura.id}`}
                        {viatura.modelo
                          ? ` — ${viatura.modelo}`
                          : ""}
                        {viatura.placa
                          ? ` — ${viatura.placa}`
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </Bloco>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
              <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
                <h2 className="font-black">
                  Resumo da operação
                </h2>

                <div className="mt-4 space-y-3">
                  <ResumoLinha
                    titulo="Data"
                    valor={
                      data || "Não informada"
                    }
                  />

                  <ResumoLinha
                    titulo="Hora"
                    valor={
                      hora || "Não informada"
                    }
                  />

                  <ResumoLinha
                    titulo="Equipe"
                    valor={`${guardasSelecionados.length} guarda(s)`}
                  />

                  <ResumoLinha
                    titulo="Viatura"
                    valor={
                      viaturas.find(
                        (item) =>
                          String(
                            item.id
                          ) === viaturaId
                      )?.prefixo ||
                      "Sem viatura"
                    }
                  />
                </div>

                {guardasSelecionados.length >
                  0 && (
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Equipe selecionada
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {guardasSelecionados.map(
                        (guarda) => (
                          <span
                            key={guarda.id}
                            className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200"
                          >
                            {guarda.nome ||
                              `Guarda ${guarda.id}`}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-cyan-400/25 bg-cyan-400/[0.07] p-5">
                <div className="flex items-start gap-3">
                  <Crosshair className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />

                  <div>
                    <h2 className="font-black text-cyan-100">
                      GPS obrigatório
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-cyan-100/70">
                      Ao iniciar, o sistema capturará uma única localização, salvará o ponto inicial e ativará o rastreamento automático.
                    </p>
                  </div>
                </div>
              </section>

              <button
                type="button"
                disabled={
                  salvando ||
                  !permissoes?.pode_criar
                }
                onClick={() =>
                  void salvarPatrulhamento()
                }
                className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-cyan-500 px-5 py-4 text-base font-black text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {salvando ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Navigation className="h-5 w-5" />
                )}

                {salvando
                  ? "Capturando GPS e iniciando..."
                  : "Iniciar patrulhamento"}

                {!salvando && (
                  <ChevronRight className="h-5 w-5" />
                )}
              </button>
            </aside>
          </section>
        </div>

        <style jsx>{`
          .campo {
            width: 100%;
            border-radius: 1rem;
            border: 1px solid
              rgba(255, 255, 255, 0.1);
            background: rgba(
              2,
              6,
              23,
              0.72
            );
            padding: 0.875rem 1rem;
            color: white;
            outline: none;
            transition:
              border-color 160ms,
              box-shadow 160ms;
          }

          .campo::placeholder {
            color: rgb(71 85 105);
          }

          .campo:focus {
            border-color: rgba(
              34,
              211,
              238,
              0.62
            );
            box-shadow: 0 0 0 4px
              rgba(34, 211, 238, 0.1);
          }
        `}</style>
      </main>
    </ProtecaoModulo>
  );
}

function Bloco({
  titulo,
  descricao,
  icone,
  children,
}: {
  titulo: string;
  descricao: string;
  icone: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/10 md:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300">
          {icone}
        </div>

        <div>
          <h2 className="font-black">
            {titulo}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {descricao}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
}

function Campo({
  titulo,
  icone,
  children,
}: {
  titulo: string;
  icone: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-300">
        <span className="text-cyan-300">
          {icone}
        </span>
        {titulo}
      </span>

      {children}
    </label>
  );
}

function ResumoLinha({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <span className="text-sm text-slate-500">
        {titulo}
      </span>

      <span className="text-right text-sm font-bold text-slate-200">
        {valor}
      </span>
    </div>
  );
}