"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
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
  latitude: number | string | null;
  longitude: number | string | null;
  observacao: string | null;
  status: string | null;
  criado_em: string | null;
  finalizado_em: string | null;
};

type PontoGps = {
  id: string | number;
  municipio_id: number;
  patrulhamento_id: number;
  latitude: number | string;
  longitude: number | string;
  velocidade: number | string | null;
  precisao: number | string | null;
  criado_em: string;
  tipo: string | null;
  observacao: string | null;
};

type RespostaDetalhe = {
  ok?: boolean;
  erro?: string;
  contexto?: Contexto;
  permissoes?: Permissoes;
  patrulhamento?: Patrulhamento;
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

const CENTRO_PADRAO: [number, number] = [
  -11.621296322631357,
  -38.80684199142887,
];

const CHAVE_WATCH =
  "patrulhamento_v2_watch_id";

const CHAVE_ATIVO =
  "patrulhamentoAtivoId";

const CHAVE_ULTIMO =
  "patrulhamento_v2_ultimo_ponto";

const INTERVALO_MINIMO_MS = 8000;
const DISTANCIA_MINIMA_METROS = 8;
const PRECISAO_MAXIMA_METROS = 50;

type PontoFila = {
  latitude: number;
  longitude: number;
  precisao: number | null;
  velocidade: number | null;
  tipo: "AUTOMATICO";
  observacao: string;
  criado_em: string;
};

type EstadoGps =
  | "INATIVO"
  | "BUSCANDO"
  | "ATIVO"
  | "IMPRECISO"
  | "SEM_PERMISSAO"
  | "ERRO";

function chaveFila(patrulhamentoId: number) {
  return `sig_rastreamento_fila_${patrulhamentoId}`;
}

function lerFila(patrulhamentoId: number): PontoFila[] {
  try {
    const valor = localStorage.getItem(chaveFila(patrulhamentoId));
    if (!valor) return [];
    const fila = JSON.parse(valor);
    return Array.isArray(fila) ? fila : [];
  } catch {
    return [];
  }
}

function salvarFila(patrulhamentoId: number, fila: PontoFila[]) {
  localStorage.setItem(chaveFila(patrulhamentoId), JSON.stringify(fila.slice(-2000)));
}

function distanciaEntre(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) {
  const raio = 6371000;
  const p1 = (a.latitude * Math.PI) / 180;
  const p2 = (b.latitude * Math.PI) / 180;
  const dp = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dl = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h =
    Math.sin(dp / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return raio * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

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
    timeStyle: "medium",
  }).format(data);
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
    const anterior = pontos[indice - 1];
    const atual = pontos[indice];

    const latitudeAnterior =
      Number(anterior.latitude);

    const longitudeAnterior =
      Number(anterior.longitude);

    const latitudeAtual =
      Number(atual.latitude);

    const longitudeAtual =
      Number(atual.longitude);

    const raioTerra = 6371000;

    const deltaLatitude =
      ((latitudeAtual -
        latitudeAnterior) *
        Math.PI) /
      180;

    const deltaLongitude =
      ((longitudeAtual -
        longitudeAnterior) *
        Math.PI) /
      180;

    const calculo =
      Math.sin(deltaLatitude / 2) ** 2 +
      Math.cos(
        (latitudeAnterior *
          Math.PI) /
          180
      ) *
        Math.cos(
          (latitudeAtual *
            Math.PI) /
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

function formatarDistancia(metros: number) {
  if (metros >= 1000) {
    return `${(metros / 1000).toFixed(2)} km`;
  }

  return `${Math.round(metros)} m`;
}

function criarIcone(tipo: string | null) {
  if (typeof window === "undefined") {
    return undefined;
  }

  const Leaflet = require("leaflet");
  const tipoNormalizado = normalizar(tipo);

  const configuracao =
    tipoNormalizado === "INICIAL"
      ? {
          simbolo: "🚩",
          cor: "#16a34a",
        }
      : tipoNormalizado === "FINAL"
        ? {
            simbolo: "🏁",
            cor: "#dc2626",
          }
        : tipoNormalizado === "MANUAL"
          ? {
              simbolo: "📍",
              cor: "#d97706",
            }
          : {
              simbolo: "●",
              cor: "#0284c7",
            };

  return Leaflet.divIcon({
    className: "sig-ponto-gps",
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
  posicoes: [number, number][];
}) {
  const { useMap } =
    require("react-leaflet");

  const mapa = useMap();

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      mapa.invalidateSize();

      if (posicoes.length > 1) {
        mapa.fitBounds(posicoes, {
          padding: [50, 50],
        });
        return;
      }

      if (posicoes.length === 1) {
        mapa.setView(posicoes[0], 17);
      }
    }, 250);

    return () =>
      window.clearTimeout(temporizador);
  }, [mapa, posicoes]);

  return null;
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
          latitude:
            position.coords.latitude,
          longitude:
            position.coords.longitude,
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
          error.code ===
          error.PERMISSION_DENIED
            ? "A permissão de localização foi negada."
            : error.code ===
                error.TIMEOUT
              ? "O GPS demorou demais para responder."
              : "Não foi possível capturar o ponto GPS final.";

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

function limparMonitoramentoLocal(
  patrulhamentoId: number
) {
  const ativo = Number(
    localStorage.getItem(CHAVE_ATIVO) || 0
  );

  if (ativo !== patrulhamentoId) {
    return;
  }

  if (navigator.geolocation) {
    const watchId =
      localStorage.getItem(CHAVE_WATCH);

    if (watchId) {
      navigator.geolocation.clearWatch(
        Number(watchId)
      );
    }
  }

  localStorage.removeItem(CHAVE_WATCH);
  localStorage.removeItem(CHAVE_ATIVO);
  localStorage.removeItem(CHAVE_ULTIMO);
}

export default function DetalhePatrulhamentoPage() {
  const params = useParams();
  const router = useRouter();

  const parametroId = Array.isArray(
    params.id
  )
    ? params.id[0]
    : params.id;

  const id = Number(parametroId || 0);

  const requisicaoEmAndamento = useRef(false);
  const enviandoGpsRef = useRef(false);
  const ultimoPontoRef = useRef<PontoFila | null>(null);

  const [estadoGps, setEstadoGps] = useState<EstadoGps>("INATIVO");
  const [precisaoAtual, setPrecisaoAtual] = useState<number | null>(null);
  const [velocidadeAtual, setVelocidadeAtual] = useState<number | null>(null);
  const [pontosPendentes, setPontosPendentes] = useState(0);
  const [ultimaGravacao, setUltimaGravacao] = useState<string | null>(null);

  const [contexto, setContexto] =
    useState<Contexto | null>(null);

  const [permissoes, setPermissoes] =
    useState<Permissoes | null>(null);

  const [
    patrulhamento,
    setPatrulhamento,
  ] = useState<Patrulhamento | null>(
    null
  );

  const [pontos, setPontos] =
    useState<PontoGps[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [atualizando, setAtualizando] =
    useState(false);

  const [finalizando, setFinalizando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [
    pontosTruncados,
    setPontosTruncados,
  ] = useState(false);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setErro(
        "Identificador do patrulhamento inválido."
      );
      setCarregando(false);
      return;
    }

    void carregarDados(false);

    const intervalo = window.setInterval(() => {
      void carregarDados(true);
    }, 15000);

    return () =>
      window.clearInterval(intervalo);
  }, [id]);

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

  async function chamarApiDetalhe(
    silencioso: boolean
  ) {
    const accessToken =
      await obterAccessToken();

    const url = silencioso
      ? `/api/patrulhamento/${id}?silencioso=1`
      : `/api/patrulhamento/${id}`;

    const resposta = await fetch(url, {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const dados = (await resposta
      .json()
      .catch(
        () => null
      )) as RespostaDetalhe | null;

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
          "Não foi possível carregar o patrulhamento."
      );
    }

    return dados;
  }

  async function chamarApiFinalizacao(
    corpo: Record<string, unknown>
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
        body: JSON.stringify(corpo),
      }
    );

    const dados = (await resposta
      .json()
      .catch(
        () => null
      )) as RespostaFinalizacao | null;

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
          "Não foi possível finalizar o patrulhamento."
      );
    }

    return dados;
  }

  async function enviarFilaGps(patrulhamentoId: number) {
    if (enviandoGpsRef.current || !navigator.onLine) return;

    const fila = lerFila(patrulhamentoId);
    setPontosPendentes(fila.length);
    if (fila.length === 0) return;

    enviandoGpsRef.current = true;
    try {
      const accessToken = await obterAccessToken();
      const lote = fila.slice(0, 200);
      const resposta = await fetch("/api/patrulhamento/gps", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          patrulhamento_id: patrulhamentoId,
          pontos: lote,
        }),
      });

      const dados = await resposta.json().catch(() => null);
      if (!resposta.ok || !dados?.ok) {
        throw new Error(dados?.erro || "Falha ao sincronizar o GPS.");
      }

      const restante = fila.slice(lote.length);
      salvarFila(patrulhamentoId, restante);
      setPontosPendentes(restante.length);
      setUltimaGravacao(lote[lote.length - 1]?.criado_em || null);

      if (restante.length > 0) {
        window.setTimeout(() => void enviarFilaGps(patrulhamentoId), 300);
      } else {
        void carregarDados(true);
      }
    } catch (error) {
      console.error("Erro ao sincronizar fila GPS:", error);
    } finally {
      enviandoGpsRef.current = false;
    }
  }

  function adicionarPontoFila(patrulhamentoId: number, ponto: PontoFila) {
    const fila = lerFila(patrulhamentoId);
    fila.push(ponto);
    salvarFila(patrulhamentoId, fila);
    setPontosPendentes(fila.length);
    localStorage.setItem(CHAVE_ULTIMO, JSON.stringify(ponto));
    ultimoPontoRef.current = ponto;
    void enviarFilaGps(patrulhamentoId);
  }

  function processarPosicao(patrulhamentoId: number, position: GeolocationPosition) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const precisao = Number.isFinite(position.coords.accuracy)
      ? position.coords.accuracy
      : null;
    const velocidade = typeof position.coords.speed === "number" &&
      Number.isFinite(position.coords.speed)
      ? position.coords.speed
      : null;

    setPrecisaoAtual(precisao);
    setVelocidadeAtual(velocidade);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setEstadoGps("ERRO");
      return;
    }

    if (precisao !== null && precisao > PRECISAO_MAXIMA_METROS) {
      setEstadoGps("IMPRECISO");
      return;
    }

    setEstadoGps("ATIVO");

    const agora = Date.now();
    const anterior = ultimoPontoRef.current;
    const distancia = anterior
      ? distanciaEntre(anterior, { latitude, longitude })
      : Number.POSITIVE_INFINITY;
    const tempo = anterior
      ? agora - new Date(anterior.criado_em).getTime()
      : Number.POSITIVE_INFINITY;

    if (distancia < DISTANCIA_MINIMA_METROS && tempo < INTERVALO_MINIMO_MS) {
      return;
    }

    adicionarPontoFila(patrulhamentoId, {
      latitude,
      longitude,
      precisao,
      velocidade,
      tipo: "AUTOMATICO",
      observacao: navigator.onLine ? "Rastreamento automático" : "Capturado offline",
      criado_em: new Date(position.timestamp || agora).toISOString(),
    });
  }

  useEffect(() => {
    if (!patrulhamento || estaFinalizado(patrulhamento.status) || !permissoes?.pode_editar) {
      setEstadoGps("INATIVO");
      return;
    }

    if (!navigator.geolocation) {
      setEstadoGps("ERRO");
      return;
    }

    const patrulhamentoId = patrulhamento.id;
    const ultimoSalvo = localStorage.getItem(CHAVE_ULTIMO);
    if (ultimoSalvo) {
      try { ultimoPontoRef.current = JSON.parse(ultimoSalvo); } catch { ultimoPontoRef.current = null; }
    }

    setPontosPendentes(lerFila(patrulhamentoId).length);
    setEstadoGps("BUSCANDO");
    localStorage.setItem(CHAVE_ATIVO, String(patrulhamentoId));

    const watchId = navigator.geolocation.watchPosition(
      (position) => processarPosicao(patrulhamentoId, position),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) setEstadoGps("SEM_PERMISSAO");
        else setEstadoGps("ERRO");
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 }
    );

    localStorage.setItem(CHAVE_WATCH, String(watchId));
    const sincronizar = () => void enviarFilaGps(patrulhamentoId);
    window.addEventListener("online", sincronizar);
    const intervaloGps = window.setInterval(sincronizar, 10000);
    void enviarFilaGps(patrulhamentoId);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener("online", sincronizar);
      window.clearInterval(intervaloGps);
    };
  }, [patrulhamento?.id, patrulhamento?.status, permissoes?.pode_editar]);

  async function carregarDados(
    silencioso: boolean
  ) {
    if (
      requisicaoEmAndamento.current
    ) {
      return;
    }

    requisicaoEmAndamento.current =
      true;

    if (silencioso) {
      setAtualizando(true);
    } else {
      setCarregando(true);
      setErro("");
    }

    try {
      const dados =
        await chamarApiDetalhe(
          silencioso
        );

      setContexto(
        dados.contexto || null
      );

      setPermissoes(
        dados.permissoes || null
      );

      setPatrulhamento(
        dados.patrulhamento ||
          null
      );

      setPontos(
        dados.pontos || []
      );

      setPontosTruncados(
        Boolean(
          dados.pontos_truncados
        )
      );
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao carregar o patrulhamento.";

      console.error(
        "Erro no acompanhamento do patrulhamento:",
        {
          mensagem,
          error,
        }
      );

      if (!silencioso) {
        setErro(mensagem);
        setPatrulhamento(null);
        setPontos([]);
      }
    } finally {
      requisicaoEmAndamento.current =
        false;

      setCarregando(false);
      setAtualizando(false);
    }
  }

  async function finalizar() {
    if (
      !patrulhamento ||
      !permissoes?.pode_editar
    ) {
      alert(
        "Você não possui permissão para finalizar patrulhamentos."
      );
      return;
    }

    if (
      estaFinalizado(
        patrulhamento.status
      )
    ) {
      alert(
        "Este patrulhamento já foi finalizado."
      );
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
        await chamarApiFinalizacao({
          id: patrulhamento.id,
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
        });

      limparMonitoramentoLocal(
        patrulhamento.id
      );

      alert(
        dados.gps_final_registrado
          ? "Patrulhamento finalizado com ponto GPS registrado."
          : dados.mensagem ||
              "Patrulhamento finalizado."
      );

      await carregarDados(true);
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
      setFinalizando(false);
    }
  }

  const pontosValidos = useMemo(
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
            ponto.precisao === null
              ? null
              : Number(
                  ponto.precisao
                ),
          velocidade:
            ponto.velocidade === null
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
            ponto.latitude >= -90 &&
            ponto.latitude <= 90 &&
            ponto.longitude >= -180 &&
            ponto.longitude <= 180 &&
            !(
              ponto.latitude === 0 &&
              ponto.longitude === 0
            )
        ),
    [pontos]
  );

  const posicoes = useMemo(
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
          ] as [number, number]
      ),
    [pontosValidos]
  );

  const centro = useMemo<
    [number, number]
  >(() => {
    if (posicoes.length > 0) {
      return posicoes[
        posicoes.length - 1
      ];
    }

    const latitude = Number(
      patrulhamento?.latitude
    );

    const longitude = Number(
      patrulhamento?.longitude
    );

    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude !== 0 &&
      longitude !== 0
    ) {
      return [
        latitude,
        longitude,
      ];
    }

    return CENTRO_PADRAO;
  }, [
    posicoes,
    patrulhamento,
  ]);

  const distanciaTotal = useMemo(
    () =>
      calcularDistanciaMetros(
        pontosValidos
      ),
    [pontosValidos]
  );

  const ultimoPonto =
    pontosValidos[
      pontosValidos.length - 1
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

  if (carregando) {
    return (
      <ProtecaoModulo modulo="patrulhamento">
        <div className="grid min-h-[70vh] place-items-center bg-slate-950 p-6 text-white">
          <div className="flex items-center gap-3 text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            Carregando patrulhamento...
          </div>
        </div>
      </ProtecaoModulo>
    );
  }

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
                  <Navigation className="h-7 w-7 text-cyan-300" />
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                      Acompanhamento operacional
                    </span>

                    {contexto?.usuario_nome && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                        {contexto.usuario_nome}
                      </span>
                    )}

                    {atualizando && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Atualizando
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl font-black tracking-tight md:text-4xl">
                    Patrulhamento #{id}
                  </h1>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 md:text-base">
                    Acompanhe a rota, os pontos GPS e a situação da equipe em campo.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/sistema/patrulhamento/rotas?id=${id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                >
                  <Route className="h-4 w-4" />
                  Abrir rota completa
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    void carregarDados(true)
                  }
                  disabled={atualizando}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 disabled:opacity-50"
                >
                  {atualizando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Atualizar
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
                Não foi possível carregar o patrulhamento
              </h2>

              <p className="mt-2 text-sm text-red-100/75">
                {erro}
              </p>

              <Link
                href="/sistema/patrulhamento"
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-400/25 px-4 py-2.5 text-sm font-bold text-red-100 transition hover:bg-red-500/15"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </section>
          )}

          {pontosTruncados && (
            <section className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
              A rota atingiu o limite técnico de pontos exibidos.
            </section>
          )}

          {patrulhamento && (
            <>
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
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
                  titulo="GPS ao vivo"
                  valor={
                    estadoGps === "ATIVO" ? "Ativo" :
                    estadoGps === "BUSCANDO" ? "Buscando" :
                    estadoGps === "IMPRECISO" ? "Sinal fraco" :
                    estadoGps === "SEM_PERMISSAO" ? "Sem permissão" :
                    estadoGps === "ERRO" ? "Erro" : "Inativo"
                  }
                  subtitulo={`${precisaoAtual !== null ? `Precisão ${Math.round(precisaoAtual)} m` : "Sem precisão"} • ${velocidadeAtual !== null ? `${Math.round(velocidadeAtual * 3.6)} km/h` : "0 km/h"} • ${pontosPendentes} pendente(s)${ultimaGravacao ? ` • ${new Date(ultimaGravacao).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}`}
                  icone={<Crosshair className="h-5 w-5" />}
                />

                <StatCard
                  titulo="Distância"
                  valor={formatarDistancia(
                    distanciaTotal
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
                  subtitulo="Atualização GPS"
                  icone={
                    <Clock3 className="h-5 w-5" />
                  }
                />
              </section>

              <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
                <aside className="space-y-5">
                  <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
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
                        valor={
                          patrulhamento.hora ||
                          "Não informada"
                        }
                      />

                      <InfoLinha
                        titulo="Guarda"
                        valor={
                          patrulhamento.guarda ||
                          "Não informado"
                        }
                      />

                      <InfoLinha
                        titulo="Viatura"
                        valor={
                          patrulhamento.viatura ||
                          "Sem viatura"
                        }
                      />

                      <InfoLinha
                        titulo="Iniciado em"
                        valor={formatarDataHora(
                          patrulhamento.criado_em
                        )}
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
                      Estatísticas
                    </h2>

                    <div className="mt-4 space-y-3">
                      <InfoLinha
                        titulo="Distância total"
                        valor={formatarDistancia(
                          distanciaTotal
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
                          Atualização automática a cada 15 segundos.
                        </p>
                      </div>
                    </div>

                    {pontosValidos.length ===
                    0 ? (
                      <div className="grid h-[65vh] min-h-[420px] place-items-center rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-6 text-center">
                        <div>
                          <Crosshair className="mx-auto h-10 w-10 text-slate-600" />

                          <h3 className="mt-4 font-black">
                            Nenhum ponto GPS registrado
                          </h3>

                          <p className="mt-2 text-sm text-slate-500">
                            O mapa será atualizado quando novos pontos forem sincronizados.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-[65vh] min-h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
                        <MapContainer
                          center={centro}
                          zoom={16}
                          style={{
                            width: "100%",
                            height: "100%",
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
                                    {ponto.tipo || "GPS"}
                                  </strong>
                                  <br />
                                  Ordem:{" "}
                                  {indice + 1}
                                  <br />
                                  Horário:{" "}
                                  {formatarDataHora(
                                    ponto.criado_em
                                  )}
                                  <br />
                                  Precisão:{" "}
                                  {ponto.precisao
                                    ? `${Math.round(
                                        Number(
                                          ponto.precisao
                                        )
                                      )} m`
                                    : "Não informada"}
                                  {ponto.observacao && (
                                    <>
                                      <br />
                                      {ponto.observacao}
                                    </>
                                  )}
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
                          Últimos pontos
                        </h2>

                        <p className="text-sm text-slate-500">
                          Registros GPS mais recentes do patrulhamento.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 max-h-[420px] space-y-2 overflow-y-auto pr-1">
                      {[...pontosValidos]
                        .reverse()
                        .slice(0, 100)
                        .map(
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
                                  {ponto.tipo || "GPS"}
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
                                  Registro recente{" "}
                                  {indice + 1}
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