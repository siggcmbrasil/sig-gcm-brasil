import { Capacitor, registerPlugin } from "@capacitor/core";
import type {
  BackgroundGeolocationPlugin,
} from "@capacitor-community/background-geolocation";
import { supabase } from "@/lib/supabase";

const BackgroundGeolocation =
  registerPlugin<BackgroundGeolocationPlugin>(
    "BackgroundGeolocation"
  );

type DadosRastreamento = {
  municipio_id: number;
  usuario_id?: string;
  patrulhamento_id?: number | null;
  guarnicao_id?: number | null;
  viatura_id?: number | null;
};

const CHAVE_OFFLINE = "rastreamento_offline_sig";
const CHAVE_WATCHER = "rastreamento_background_watcher_id";
const CHAVE_ULTIMO_PONTO = "ultimo_ponto_gps_sig";
const DISTANCIA_MINIMA_METROS = 5;

function navegadorDisponivel() {
  return typeof window !== "undefined" && typeof navigator !== "undefined";
}

function calcularDistanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number) {
  const raio = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return raio * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function deveSalvar(latitude: number, longitude: number) {
  if (!navegadorDisponivel()) return false;

  const ultimo = JSON.parse(localStorage.getItem(CHAVE_ULTIMO_PONTO) || "null");
  if (!ultimo) return true;

  const distancia = calcularDistanciaMetros(
    Number(ultimo.latitude),
    Number(ultimo.longitude),
    latitude,
    longitude
  );

  return distancia >= DISTANCIA_MINIMA_METROS;
}

function atualizarUltimoPonto(latitude: number, longitude: number) {
  if (!navegadorDisponivel()) return;

  localStorage.setItem(
    CHAVE_ULTIMO_PONTO,
    JSON.stringify({
      latitude,
      longitude,
      atualizado_em: new Date().toISOString(),
    })
  );
}

function salvarOffline(ponto: any) {
  if (!navegadorDisponivel()) return;

  const atual = JSON.parse(localStorage.getItem(CHAVE_OFFLINE) || "[]");

  atual.push({
    ...ponto,
    online: false,
    sincronizado: false,
  });

  localStorage.setItem(CHAVE_OFFLINE, JSON.stringify(atual));
}

export async function sincronizarPontosOffline() {
  if (!navegadorDisponivel() || !navigator.onLine) return;

  const pontos = JSON.parse(localStorage.getItem(CHAVE_OFFLINE) || "[]");
  if (!pontos.length) return;

  const { error } = await supabase.from("rastreamento_tempo_real").insert(
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

async function salvarPonto(dados: DadosRastreamento, location: any) {
  if (!navegadorDisponivel()) return;

  const latitude = location.latitude;
  const longitude = location.longitude;

  if (!latitude || !longitude) return;
  if (!deveSalvar(latitude, longitude)) return;

  const ponto = {
    municipio_id: dados.municipio_id,
    usuario_id: dados.usuario_id || null,
    patrulhamento_id: dados.patrulhamento_id || null,
    guarnicao_id: dados.guarnicao_id || null,
    viatura_id: dados.viatura_id || null,

    latitude,
    longitude,
    precisao: location.accuracy || null,
    velocidade: location.speed || null,
    direcao: location.bearing || location.heading || null,

    bateria: null,
    online: navigator.onLine,
    sincronizado: navigator.onLine,
    origem: "GPS_BACKGROUND",
    criado_em: new Date().toISOString(),
  };

  if (!navigator.onLine) {
    salvarOffline(ponto);
    atualizarUltimoPonto(latitude, longitude);
    return;
  }

  const { error } = await supabase.from("rastreamento_tempo_real").insert([ponto]);

  if (error) {
    console.error("Erro ao salvar GPS:", error);
    salvarOffline(ponto);
    atualizarUltimoPonto(latitude, longitude);
    return;
  }

  atualizarUltimoPonto(latitude, longitude);
}

export async function iniciarBackgroundRastreamento(dados: DadosRastreamento) {
  if (!navegadorDisponivel()) return null;

  if (!Capacitor.isNativePlatform()) {
    console.log("Background GPS funciona apenas no app Android/iOS.");
    return null;
  }

  await sincronizarPontosOffline();

  const watcherId = await BackgroundGeolocation.addWatcher(
    {
      backgroundTitle: "SIG-GCM Brasil",
      backgroundMessage: "Rastreamento operacional em andamento.",
      requestPermissions: true,
      stale: false,
      distanceFilter: 5,
    },
    async (location: any, error: any) => {
      if (error) {
        console.error("Erro Background GPS:", error);
        return;
      }

      if (!location) return;

      await sincronizarPontosOffline();
      await salvarPonto(dados, location);
    }
  );

  localStorage.setItem(CHAVE_WATCHER, watcherId);

  return watcherId;
}

export async function pararBackgroundRastreamento() {
  if (!navegadorDisponivel()) return;

  const watcherId = localStorage.getItem(CHAVE_WATCHER);

  if (watcherId && Capacitor.isNativePlatform()) {
    await BackgroundGeolocation.removeWatcher({
      id: watcherId,
    });
  }

  localStorage.removeItem(CHAVE_WATCHER);
  localStorage.removeItem(CHAVE_ULTIMO_PONTO);
}

export function limparUltimoPontoGPS() {
  if (!navegadorDisponivel()) return;

  localStorage.removeItem(CHAVE_ULTIMO_PONTO);
}