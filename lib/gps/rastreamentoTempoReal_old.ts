import { supabase } from "@/lib/supabase";

type DadosRastreamento = {
  municipio_id: number;
  usuario_id?: string;
  patrulhamento_id?: number | null;
  guarnicao_id?: number | null;
  viatura_id?: number | null;
};

const CHAVE_OFFLINE = "rastreamento_offline_sig";
const CHAVE_ULTIMO_PONTO = "ultimo_ponto_gps_sig";
const DISTANCIA_MINIMA_METROS = 5;

function salvarOffline(ponto: any) {
  const atual = JSON.parse(localStorage.getItem(CHAVE_OFFLINE) || "[]");

  atual.push({
    ...ponto,
    online: false,
    sincronizado: false,
  });

  localStorage.setItem(CHAVE_OFFLINE, JSON.stringify(atual));
}

export async function sincronizarPontosOffline() {
  if (typeof navigator === "undefined" || !navigator.onLine) return;

  const pontos = JSON.parse(localStorage.getItem(CHAVE_OFFLINE) || "[]");

  if (!pontos.length) return;

  const { error } = await supabase
    .from("rastreamento_tempo_real")
    .insert(
      pontos.map((p: any) => ({
        ...p,
        online: false,
        sincronizado: true,
      }))
    );

  if (!error) {
    localStorage.removeItem(CHAVE_OFFLINE);
  }
}

function calcularDistanciaMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const raioTerra = 6371000;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return raioTerra * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function deveSalvarPonto(posicao: GeolocationPosition) {
  const ultimo = JSON.parse(localStorage.getItem(CHAVE_ULTIMO_PONTO) || "null");

  if (!ultimo) return true;

  const distancia = calcularDistanciaMetros(
    Number(ultimo.latitude),
    Number(ultimo.longitude),
    posicao.coords.latitude,
    posicao.coords.longitude
  );

  return distancia >= DISTANCIA_MINIMA_METROS;
}

function atualizarUltimoPonto(posicao: GeolocationPosition) {
  localStorage.setItem(
    CHAVE_ULTIMO_PONTO,
    JSON.stringify({
      latitude: posicao.coords.latitude,
      longitude: posicao.coords.longitude,
      atualizado_em: new Date().toISOString(),
    })
  );
}

async function salvarPonto(dados: DadosRastreamento, posicao: GeolocationPosition) {
  if (!deveSalvarPonto(posicao)) return;

  const ponto = {
    municipio_id: dados.municipio_id,
    usuario_id: dados.usuario_id || null,
    patrulhamento_id: dados.patrulhamento_id || null,
    guarnicao_id: dados.guarnicao_id || null,
    viatura_id: dados.viatura_id || null,

    latitude: posicao.coords.latitude,
    longitude: posicao.coords.longitude,
    precisao: posicao.coords.accuracy,
    velocidade: posicao.coords.speed,
    direcao: posicao.coords.heading,

    bateria: null,
    online: navigator.onLine,
    sincronizado: navigator.onLine,
    origem: "GPS_CELULAR",
    criado_em: new Date().toISOString(),
  };

  if (!navigator.onLine) {
    salvarOffline(ponto);
    atualizarUltimoPonto(posicao);
    return;
  }

  const { error } = await supabase.from("rastreamento_tempo_real").insert([ponto]);

  if (error) {
    console.error("Erro Supabase GPS:", error);

    salvarOffline({
      ...ponto,
      online: false,
      sincronizado: false,
    });

    atualizarUltimoPonto(posicao);
    return;
  }

  atualizarUltimoPonto(posicao);
}

export function iniciarRastreamentoTempoReal(dados: DadosRastreamento) {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("GPS não disponível neste dispositivo.");
  }

  void sincronizarPontosOffline();

  const watchId = navigator.geolocation.watchPosition(
    async (posicao) => {
      try {
        await sincronizarPontosOffline();
        await salvarPonto(dados, posicao);
      } catch (error) {
        console.error("Erro ao salvar GPS:", error);
      }
    },
    (erro) => {
      console.error("Erro GPS:", erro);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000,
    }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}

export function limparUltimoPontoGPS() {
  localStorage.removeItem(CHAVE_ULTIMO_PONTO);
}