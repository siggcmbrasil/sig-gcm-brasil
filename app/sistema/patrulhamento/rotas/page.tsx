"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Crosshair,
  Gauge,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Timer,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { supabase } from "@/lib/supabase";

const MapContainer = dynamic(
  () =>
    import("react-leaflet").then(
      (modulo) => modulo.MapContainer
    ),
  { ssr: false }
);

const TileLayer = dynamic(
  () =>
    import("react-leaflet").then(
      (modulo) => modulo.TileLayer
    ),
  { ssr: false }
);

const Marker = dynamic(
  () =>
    import("react-leaflet").then(
      (modulo) => modulo.Marker
    ),
  { ssr: false }
);

const Popup = dynamic(
  () =>
    import("react-leaflet").then(
      (modulo) => modulo.Popup
    ),
  { ssr: false }
);

const Polyline = dynamic(
  () =>
    import("react-leaflet").then(
      (modulo) => modulo.Polyline
    ),
  { ssr: false }
);

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

type Patrulhamento = {
  id: number;
  municipio_id: number;
  data: string | null;
  hora: string | null;
  local: string | null;
  guarda: string | null;
  equipe: string | null;
  viatura: string | null;
  observacao: string | null;
  status: string | null;
  finalizado_em: string | null;
  criado_em: string | null;
};

type PontoGps = {
  id: string | number;
  municipio_id: number;
  patrulhamento_id: number;
  latitude: number | string;
  longitude: number | string;
  velocidade: number | string | null;
  precisao: number | string | null;
  tipo:
    | "INICIAL"
    | "AUTOMATICO"
    | "MANUAL"
    | "FINAL"
    | string;
  observacao: string | null;
  criado_em: string;
};

type RespostaRotas = {
  ok?: boolean;
  erro?: string;
  contexto?: Contexto;
  permissoes?: Permissoes;
  patrulhamentos?: Patrulhamento[];
  patrulhamento?: Patrulhamento | null;
  pontos?: PontoGps[];
  pontos_truncados?: boolean;
  limite_pontos?: number;
};

type RespostaFinalizacao = {
  ok?: boolean;
  erro?: string;
  mensagem?: string;
  gps_final_registrado?: boolean;
};

type Coordenadas = {
  latitude: number;
  longitude: number;
  precisao: number | null;
  velocidade: number | null;
};

const CHAVE_WATCH =
  "patrulhamento_v2_watch_id";
const CHAVE_ATIVO =
  "patrulhamentoAtivoId";
const CHAVE_ULTIMO =
  "patrulhamento_v2_ultimo_ponto";

function texto(valor: unknown) {
  return String(valor ?? "").trim();
}

function normalizar(valor: unknown) {
  return texto(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function estaFinalizado(valor: unknown) {
  return normalizar(valor) === "FINALIZADO";
}

function formatarData(valor?: string | null) {
  if (!valor) {
    return "Não informada";
  }

  const data = new Date(`${valor}T12:00:00`);

  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return new Intl.DateTimeFormat(
    "pt-BR"
  ).format(data);
}

function formatarDataHora(
  valor?: string | null
) {
  if (!valor) {
    return "Não informado";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
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

function calcularDistanciaMetros(
  pontos: PontoGps[]
) {
  let total = 0;

  for (
    let indice = 1;
    indice < pontos.length;
    indice += 1
  ) {
    const anterior =
      pontos[indice - 1];

    const atual =
      pontos[indice];

    const lat1 = Number(
      anterior.latitude
    );

    const lon1 = Number(
      anterior.longitude
    );

    const lat2 = Number(
      atual.latitude
    );

    const lon2 = Number(
      atual.longitude
    );

    const raioTerra = 6371000;

    const deltaLatitude =
      ((lat2 - lat1) *
        Math.PI) /
      180;

    const deltaLongitude =
      ((lon2 - lon1) *
        Math.PI) /
      180;

    const calculo =
      Math.sin(
        deltaLatitude / 2
      ) **
        2 +
      Math.cos(
        (lat1 * Math.PI) /
          180
      ) *
        Math.cos(
          (lat2 * Math.PI) /
            180
        ) *
        Math.sin(
          deltaLongitude / 2
        ) **
          2;

    total +=
      raioTerra *
      (2 *
        Math.atan2(
          Math.sqrt(calculo),
          Math.sqrt(1 - calculo)
        ));
  }

  return total;
}

function formatarDistancia(
  metros: number
) {
  if (metros >= 1000) {
    return `${(
      metros / 1000
    ).toFixed(2)} km`;
  }

  return `${Math.round(
    metros
  )} m`;
}

function criarIcone(tipo: string) {
  if (
    typeof window === "undefined"
  ) {
    return undefined;
  }

  const Leaflet =
    require("leaflet");

  const tipoNormalizado =
    normalizar(tipo);

  const configuracao =
    tipoNormalizado === "INICIAL"
      ? {
          simbolo: "🚩",
          cor: "#16a34a",
        }
      : tipoNormalizado ===
          "FINAL"
        ? {
            simbolo: "🏁",
            cor: "#dc2626",
          }
        : tipoNormalizado ===
            "MANUAL"
          ? {
              simbolo: "📍",
              cor: "#d97706",
            }
          : {
              simbolo: "●",
              cor: "#0284c7",
            };

  return Leaflet.divIcon({
    className:
      "sig-ponto-gps",
    html: `
      <div
        style="
          width:30px;
          height:30px;
          border-radius:999px;
          background:${configuracao.cor};
          border:3px solid white;
          display:flex;
          align-items:center;
          justify-content:center;
          color:white;
          font-size:14px;
          font-weight:900;
          box-shadow:0 8px 22px rgba(0,0,0,.35);
        "
      >
        ${configuracao.simbolo}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function MapController({
  posicoes,
}: {
  posicoes: [
    number,
    number,
  ][];
}) {
  const { useMap } =
    require("react-leaflet");

  const mapa = useMap();

  useEffect(() => {
    const temporizador =
      window.setTimeout(() => {
        mapa.invalidateSize();

        if (
          posicoes.length > 1
        ) {
          mapa.fitBounds(
            posicoes,
            {
              padding: [
                50,
                50,
              ],
            }
          );
          return;
        }

        if (
          posicoes.length === 1
        ) {
          mapa.setView(
            posicoes[0],
            17
          );
        }
      }, 250);

    return () =>
      window.clearTimeout(
        temporizador
      );
  }, [mapa, posicoes]);

  return null;
}

function obterLocalizacaoFinal(): Promise<Coordenadas> {
  return new Promise(
    (resolve, reject) => {
      if (
        !navigator.geolocation
      ) {
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
            latitude:
              position.coords
                .latitude,
            longitude:
              position.coords
                .longitude,
            precisao:
              Number.isFinite(
                position.coords
                  .accuracy
              )
                ? position.coords
                    .accuracy
                : null,
            velocidade:
              typeof position.coords
                .speed ===
                "number" &&
              Number.isFinite(
                position.coords
                  .speed
              )
                ? position.coords
                    .speed
                : null,
          });
        },
        (error) => {
          const mensagem =
            error.code ===
            error.PERMISSION_DENIED
              ? "A permissão de localização foi negada."
              : error.code ===
                  error.TIMEOUT
                ? "O GPS demorou demais para responder."
                : "Não foi possível capturar o ponto GPS final.";

          reject(
            new Error(
              mensagem
            )
          );
        },
        {
          enableHighAccuracy:
            true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    }
  );
}

function limparMonitoramentoLocal(
  patrulhamentoId: number
) {
  const ativo = Number(
    localStorage.getItem(
      CHAVE_ATIVO
    ) || 0
  );

  if (
    ativo !== patrulhamentoId
  ) {
    return;
  }

  if (
    navigator.geolocation
  ) {
    const watchId =
      localStorage.getItem(
        CHAVE_WATCH
      );

    if (watchId) {
      navigator.geolocation.clearWatch(
        Number(watchId)
      );
    }
  }

  localStorage.removeItem(
    CHAVE_WATCH
  );

  localStorage.removeItem(
    CHAVE_ATIVO
  );

  localStorage.removeItem(
    CHAVE_ULTIMO
  );
}

export default function RotasPatrulhamentoPage() {
  const router = useRouter();

  const [contexto, setContexto] =
    useState<Contexto | null>(
      null
    );

  const [permissoes, setPermissoes] =
    useState<Permissoes | null>(
      null
    );

  const [
    patrulhamentos,
    setPatrulhamentos,
  ] = useState<
    Patrulhamento[]
  >([]);

  const [
    patrulhamento,
    setPatrulhamento,
  ] = useState<
    Patrulhamento | null
  >(null);

  const [pontos, setPontos] =
    useState<PontoGps[]>([]);

  const [
    patrulhamentoId,
    setPatrulhamentoId,
  ] = useState("");

  const [busca, setBusca] =
    useState("");

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    finalizando,
    setFinalizando,
  ] = useState(false);

  const [erro, setErro] =
    useState("");

  const [
    pontosTruncados,
    setPontosTruncados,
  ] = useState(false);

  useEffect(() => {
    const parametro =
      new URLSearchParams(
        window.location.search
      ).get("id");

    const idInicial =
      Number(parametro || 0);

    void carregarDados(
      idInicial > 0
        ? idInicial
        : undefined
    );
  }, []);

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

  async function chamarApiRotas(
    id?: number
  ) {
    const accessToken =
      await obterAccessToken();

    const url = id
      ? `/api/patrulhamento/rotas?id=${encodeURIComponent(
          String(id)
        )}`
      : "/api/patrulhamento/rotas";

    const resposta = await fetch(
      url,
      {
        method: "GET",
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const dados = (await resposta
      .json()
      .catch(
        () => null
      )) as RespostaRotas | null;

    if (
      resposta.status === 401
    ) {
      localStorage.removeItem(
        "usuarioLogado"
      );

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
          "Não foi possível carregar a rota."
      );
    }

    return dados;
  }

  async function chamarApiFinalizacao(
    corpo: Record<
      string,
      unknown
    >
  ) {
    const accessToken =
      await obterAccessToken();

    const resposta = await fetch(
      "/api/patrulhamento",
      {
        method: "PATCH",
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
          "Content-Type":
            "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(
          corpo
        ),
      }
    );

    const dados = (await resposta
      .json()
      .catch(
        () => null
      )) as RespostaFinalizacao | null;

    if (
      resposta.status === 401
    ) {
      localStorage.removeItem(
        "usuarioLogado"
      );

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
          "Não foi possível finalizar o patrulhamento."
      );
    }

    return dados;
  }

  async function carregarDados(
    id?: number
  ) {
    setCarregando(true);
    setErro("");

    try {
      const dados =
        await chamarApiRotas(
          id
        );

      const lista =
        dados.patrulhamentos ||
        [];

      const selecionado =
        dados.patrulhamento ||
        null;

      setContexto(
        dados.contexto ||
          null
      );

      setPermissoes(
        dados.permissoes ||
          null
      );

      setPatrulhamentos(
        lista
      );

      setPatrulhamento(
        selecionado
      );

      setPontos(
        dados.pontos || []
      );

      setPontosTruncados(
        Boolean(
          dados.pontos_truncados
        )
      );

      setPatrulhamentoId(
        selecionado
          ? String(
              selecionado.id
            )
          : ""
      );
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao carregar rota.";

      console.error(
        "Erro ao carregar rotas:",
        {
          mensagem,
          error,
        }
      );

      setErro(mensagem);
      setPatrulhamento(null);
      setPontos([]);
    } finally {
      setCarregando(false);
    }
  }

  function selecionarPatrulhamento(
    valor: string
  ) {
    setPatrulhamentoId(
      valor
    );

    const id = Number(
      valor
    );

    if (!id) {
      return;
    }

    router.replace(
      `/sistema/patrulhamento/rotas?id=${id}`
    );

    void carregarDados(id);
  }

  async function finalizar() {
    if (
      !patrulhamento ||
      !permissoes?.pode_editar
    ) {
      return;
    }

    const confirmar =
      window.confirm(
        `Finalizar o patrulhamento ${patrulhamento.id}?\n\nO sistema tentará registrar o ponto GPS final.`
      );

    if (!confirmar) {
      return;
    }

    setFinalizando(true);

    try {
      let coordenadas:
        Coordenadas | null = null;

      try {
        coordenadas =
          await obterLocalizacaoFinal();
      } catch (gpsError) {
        const mensagem =
          gpsError instanceof Error
            ? gpsError.message
            : "Não foi possível capturar o GPS.";

        const continuar =
          window.confirm(
            `${mensagem}\n\nDeseja finalizar mesmo sem o ponto GPS final?`
          );

        if (!continuar) {
          return;
        }
      }

      const dados =
        await chamarApiFinalizacao(
          {
            id:
              patrulhamento.id,
            latitude:
              coordenadas?.latitude ??
              null,
            longitude:
              coordenadas?.longitude ??
              null,
            precisao:
              coordenadas?.precisao ??
              null,
            velocidade:
              coordenadas?.velocidade ??
              null,
          }
        );

      limparMonitoramentoLocal(
        patrulhamento.id
      );

      alert(
        dados.gps_final_registrado
          ? "Patrulhamento finalizado com ponto GPS registrado."
          : dados.mensagem ||
              "Patrulhamento finalizado."
      );

      await carregarDados(
        patrulhamento.id
      );
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao finalizar patrulhamento.";

      console.error(
        "Erro ao finalizar pela rota:",
        {
          mensagem,
          error,
        }
      );

      alert(mensagem);
    } finally {
      setFinalizando(false);
    }
  }

  const patrulhamentosFiltrados =
    useMemo(() => {
      const termo =
        normalizar(busca);

      if (!termo) {
        return patrulhamentos;
      }

      return patrulhamentos.filter(
        (item) =>
          normalizar(
            [
              item.id,
              item.data,
              item.hora,
              item.local,
              item.guarda,
              item.equipe,
              item.viatura,
              item.status,
            ].join(" ")
          ).includes(termo)
      );
    }, [
      patrulhamentos,
      busca,
    ]);

  const pontosValidos =
    useMemo(
      () =>
        pontos
          .map((ponto) => ({
            ...ponto,
            latitude: Number(
              ponto.latitude
            ),
            longitude: Number(
              ponto.longitude
            ),
            precisao:
              ponto.precisao ===
                null
                ? null
                : Number(
                    ponto.precisao
                  ),
            velocidade:
              ponto.velocidade ===
                null
                ? null
                : Number(
                    ponto.velocidade
                  ),
          }))
          .filter(
            (ponto) =>
              Number.isFinite(
                ponto.latitude
              ) &&
              Number.isFinite(
                ponto.longitude
              ) &&
              ponto.latitude >=
                -90 &&
              ponto.latitude <=
                90 &&
              ponto.longitude >=
                -180 &&
              ponto.longitude <=
                180
          ),
      [pontos]
    );

  const posicoes =
    useMemo(
      () =>
        pontosValidos.map(
          (ponto) =>
            [
              Number(
                ponto.latitude
              ),
              Number(
                ponto.longitude
              ),
            ] as [
              number,
              number,
            ]
        ),
      [pontosValidos]
    );

  const distancia =
    useMemo(
      () =>
        calcularDistanciaMetros(
          pontosValidos
        ),
      [pontosValidos]
    );

  const ultimoPonto =
    pontosValidos[
      pontosValidos.length -
        1
    ];

  const automaticos =
    pontosValidos.filter(
      (ponto) =>
        normalizar(
          ponto.tipo
        ) === "AUTOMATICO"
    ).length;

  const manuais =
    pontosValidos.filter(
      (ponto) =>
        normalizar(
          ponto.tipo
        ) === "MANUAL"
    ).length;

  const precisaoMedia =
    pontosValidos.length > 0
      ? Math.round(
          pontosValidos.reduce(
            (
              acumulado,
              ponto
            ) =>
              acumulado +
              Number(
                ponto.precisao ||
                  0
              ),
            0
          ) /
            pontosValidos.length
        )
      : 0;

  return (
    <ProtecaoModulo modulo="patrulhamento">
      <main className="min-h-screen bg-slate-950 pb-24 text-white">
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_40%),linear-gradient(180deg,#07111f_0%,#020617_100%)]">
          <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8">
            <Link
              href="/sistema/patrulhamento"
              className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar à Central de Patrulhamento
            </Link>

            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10">
                  <Route className="h-7 w-7 text-cyan-300" />
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                      Rastreamento operacional
                    </span>

                    {contexto?.usuario_nome && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                        {contexto.usuario_nome}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl font-black tracking-tight md:text-4xl">
                    Rotas de patrulhamento
                  </h1>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 md:text-base">
                    Consulte trajetos, pontos GPS, distância percorrida e histórico operacional.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    void carregarDados(
                      patrulhamento
                        ?.id
                    )
                  }
                  disabled={carregando}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 disabled:opacity-50"
                >
                  {carregando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Atualizar rota
                </button>

                {patrulhamento &&
                  !estaFinalizado(
                    patrulhamento.status
                  ) &&
                  permissoes?.pode_editar && (
                    <button
                      type="button"
                      onClick={() =>
                        void finalizar()
                      }
                      disabled={finalizando}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {finalizando ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5" />
                      )}
                      Finalizar
                    </button>
                  )}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1600px] space-y-5 px-4 py-5 md:px-6">
          {erro && (
            <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5">
              <h2 className="font-bold text-red-100">
                Não foi possível carregar a rota
              </h2>

              <p className="mt-2 text-sm text-red-100/75">
                {erro}
              </p>
            </section>
          )}

          {pontosTruncados && (
            <section className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
              A rota atingiu o limite técnico de pontos exibidos. Os pontos mais antigos até o limite retornado foram carregados.
            </section>
          )}

          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-xl shadow-black/20 md:p-5">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                <input
                  type="search"
                  value={busca}
                  onChange={(event) =>
                    setBusca(
                      event.target.value
                    )
                  }
                  placeholder="Filtrar patrulhamentos por local, guarda, viatura ou data..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                />
              </div>

              <select
                value={
                  patrulhamentoId
                }
                onChange={(event) =>
                  selecionarPatrulhamento(
                    event.target.value
                  )
                }
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-white outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
              >
                <option value="">
                  Selecione um patrulhamento
                </option>

                {patrulhamentosFiltrados.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      #{item.id} — {formatarData(item.data)} — {item.local || "Sem local"}
                    </option>
                  )
                )}
              </select>
            </div>
          </section>

          {carregando ? (
            <section className="grid min-h-[55vh] place-items-center rounded-3xl border border-white/10 bg-slate-900/50">
              <div className="flex items-center gap-3 text-slate-300">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                Carregando rota...
              </div>
            </section>
          ) : !patrulhamento ? (
            <section className="rounded-3xl border border-dashed border-white/10 bg-slate-900/40 p-10 text-center">
              <Route className="mx-auto h-10 w-10 text-slate-600" />

              <h2 className="mt-4 text-lg font-black">
                Nenhum patrulhamento selecionado
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Selecione um patrulhamento para visualizar a rota GPS.
              </p>
            </section>
          ) : (
            <>
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard
                  titulo="Pontos GPS"
                  valor={String(
                    pontosValidos.length
                  )}
                  subtitulo="Total registrado"
                  icone={
                    <MapPin className="h-5 w-5" />
                  }
                />

                <StatCard
                  titulo="Distância"
                  valor={formatarDistancia(
                    distancia
                  )}
                  subtitulo="Trajeto calculado"
                  icone={
                    <Route className="h-5 w-5" />
                  }
                />

                <StatCard
                  titulo="Status"
                  valor={
                    patrulhamento.status ||
                    "Não informado"
                  }
                  subtitulo="Situação atual"
                  icone={
                    <Timer className="h-5 w-5" />
                  }
                />

                <StatCard
                  titulo="Precisão média"
                  valor={
                    precisaoMedia
                      ? `${precisaoMedia} m`
                      : "Não informada"
                  }
                  subtitulo="Quanto menor, melhor"
                  icone={
                    <Gauge className="h-5 w-5" />
                  }
                />

                <StatCard
                  titulo="Último ponto"
                  valor={
                    ultimoPonto
                      ? formatarDataHora(
                          ultimoPonto.criado_em
                        )
                      : "Não registrado"
                  }
                  subtitulo="Última atualização"
                  icone={
                    <Clock3 className="h-5 w-5" />
                  }
                />
              </section>

              <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
                <aside className="space-y-5">
                  <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-cyan-300">
                          Patrulhamento #{patrulhamento.id}
                        </p>

                        <h2 className="mt-1 text-xl font-black">
                          {patrulhamento.local || "Sem local informado"}
                        </h2>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${
                          estaFinalizado(
                            patrulhamento.status
                          )
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                            : "border-cyan-500/30 bg-cyan-500/10 text-cyan-200"
                        }`}
                      >
                        {patrulhamento.status || "EM_ANDAMENTO"}
                      </span>
                    </div>

                    <div className="mt-5 space-y-3">
                      <InfoLinha
                        titulo="Data"
                        valor={formatarData(
                          patrulhamento.data
                        )}
                      />

                      <InfoLinha
                        titulo="Hora"
                        valor={patrulhamento.hora || "Não informada"}
                      />

                      <InfoLinha
                        titulo="Guarda"
                        valor={patrulhamento.guarda || "Não informado"}
                      />

                      <InfoLinha
                        titulo="Viatura"
                        valor={patrulhamento.viatura || "Sem viatura"}
                      />

                      <InfoLinha
                        titulo="Finalizado em"
                        valor={
                          patrulhamento.finalizado_em
                            ? formatarDataHora(
                                patrulhamento.finalizado_em
                              )
                            : "Em andamento"
                        }
                      />
                    </div>

                    <div className="mt-5 border-t border-white/10 pt-4">
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        Equipe
                      </div>

                      <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-6 text-slate-300">
                        {patrulhamento.equipe || "Não informada"}
                      </pre>
                    </div>

                    {patrulhamento.observacao && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                        <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                          Observação
                        </div>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                          {patrulhamento.observacao}
                        </p>
                      </div>
                    )}
                  </section>

                  <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                    <h2 className="font-black">
                      Estatísticas da rota
                    </h2>

                    <div className="mt-4 space-y-3">
                      <InfoLinha
                        titulo="Distância total"
                        valor={formatarDistancia(
                          distancia
                        )}
                      />

                      <InfoLinha
                        titulo="Pontos automáticos"
                        valor={String(
                          automaticos
                        )}
                      />

                      <InfoLinha
                        titulo="Pontos manuais"
                        valor={String(
                          manuais
                        )}
                      />

                      <InfoLinha
                        titulo="Pontos registrados"
                        valor={String(
                          pontosValidos.length
                        )}
                      />
                    </div>
                  </section>
                </aside>

                <div className="space-y-5">
                  <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-xl shadow-black/20">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300">
                        <Navigation className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="font-black">
                          Mapa da rota
                        </h2>

                        <p className="text-sm text-slate-500">
                          Trajeto formado pelos pontos GPS em ordem cronológica.
                        </p>
                      </div>
                    </div>

                    {pontosValidos.length ===
                    0 ? (
                      <div className="grid h-[62vh] min-h-[420px] place-items-center rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-6 text-center">
                        <div>
                          <Crosshair className="mx-auto h-10 w-10 text-slate-600" />

                          <h3 className="mt-4 font-black">
                            Nenhum ponto GPS registrado
                          </h3>

                          <p className="mt-2 text-sm text-slate-500">
                            A rota aparecerá quando existirem pontos válidos.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-[62vh] min-h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
                        <MapContainer
                          center={
                            posicoes[0]
                          }
                          zoom={16}
                          style={{
                            width:
                              "100%",
                            height:
                              "100%",
                          }}
                        >
                          <TileLayer
                            attribution="&copy; OpenStreetMap contributors"
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />

                          <MapController
                            posicoes={
                              posicoes
                            }
                          />

                          {posicoes.length >
                            1 && (
                            <Polyline
                              positions={
                                posicoes
                              }
                              pathOptions={{
                                color:
                                  "#0284c7",
                                weight: 6,
                                opacity:
                                  0.88,
                              }}
                            />
                          )}

                          {pontosValidos.map(
                            (
                              ponto,
                              indice
                            ) => (
                              <Marker
                                key={
                                  ponto.id
                                }
                                position={[
                                  Number(
                                    ponto.latitude
                                  ),
                                  Number(
                                    ponto.longitude
                                  ),
                                ]}
                                icon={criarIcone(
                                  ponto.tipo
                                )}
                              >
                                <Popup>
                                  <strong>
                                    {ponto.tipo}
                                  </strong>
                                  <br />
                                  Ordem:{" "}
                                  {indice +
                                    1}
                                  <br />
                                  {formatarDataHora(
                                    ponto.criado_em
                                  )}
                                  <br />
                                  Precisão:{" "}
                                  {ponto.precisao
                                    ? `${ponto.precisao} m`
                                    : "Não informada"}
                                </Popup>
                              </Marker>
                            )
                          )}
                        </MapContainer>
                      </div>
                    )}
                  </section>

                  <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300">
                        <Clock3 className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="font-black">
                          Linha do tempo
                        </h2>

                        <p className="text-sm text-slate-500">
                          Pontos organizados do início ao fim.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 max-h-[420px] space-y-2 overflow-y-auto pr-1">
                      {pontosValidos.map(
                        (
                          ponto,
                          indice
                        ) => (
                          <article
                            key={
                              ponto.id
                            }
                            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <div className="font-black">
                                {indice +
                                  1}
                                .{" "}
                                {ponto.tipo}
                              </div>

                              <p className="mt-1 text-sm text-slate-500">
                                {ponto.observacao || "Ponto GPS do patrulhamento"}
                              </p>
                            </div>

                            <div className="text-sm sm:text-right">
                              <p className="font-semibold text-slate-300">
                                {formatarDataHora(
                                  ponto.criado_em
                                )}
                              </p>

                              <p className="mt-1 text-slate-500">
                                Precisão:{" "}
                                {ponto.precisao
                                  ? `${ponto.precisao} m`
                                  : "Não informada"}
                              </p>
                            </div>
                          </article>
                        )
                      )}

                      {pontosValidos.length ===
                        0 && (
                        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
                          Nenhum ponto disponível.
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function StatCard({
  titulo,
  valor,
  subtitulo,
  icone,
}: {
  titulo: string;
  valor: string;
  subtitulo: string;
  icone: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-lg shadow-black/10">
      <div className="flex items-center justify-between gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300">
          {icone}
        </div>

        <ShieldCheck className="h-4 w-4 text-slate-700" />
      </div>

      <div className="mt-3 break-words text-xl font-black">
        {valor}
      </div>

      <div className="mt-1 text-sm font-semibold text-slate-400">
        {titulo}
      </div>

      <div className="mt-1 text-xs text-slate-600">
        {subtitulo}
      </div>
    </article>
  );
}

function InfoLinha({
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