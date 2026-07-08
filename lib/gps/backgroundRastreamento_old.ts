import { Capacitor, registerPlugin } from "@capacitor/core";
import type { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";
import { supabase } from "@/lib/supabase";

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");

// Tipagens mais rigorosas
export type DadosRastreamento = {
  municipio_id: number;
  usuario_id?: string;
  patrulhamento_id?: number | null;
  guarnicao_id?: number | null;
  viatura_id?: number | null;
};

type PontoGPS = {
  municipio_id: number;
  patrulhamento_id: number | null;
  guarda_id: string | null; // Ajustado conforme seu db
  viatura_id: number | null;
  latitude: number;
  longitude: number;
  precisao: number | null;
  velocidade: number | null;
  tipo: string;
  observacao: string | null;
  criado_em: string;
  online?: boolean;
  sincronizado?: boolean;
};

const CHAVE_OFFLINE = "rastreamento_offline_sig";
const CHAVE_WATCHER = "rastreamento_background_watcher_id";
const CHAVE_ULTIMO_PONTO = "ultimo_ponto_gps_sig";
const DISTANCIA_MINIMA_METROS = 5;

function navegadorDisponivel(): boolean {
  return typeof window !== "undefined" && typeof navigator !== "undefined";
}

function calcularDistanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

function deveSalvar(latitude: number, longitude: number): boolean {
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

function salvarOffline(ponto: PontoGPS) {
  if (!navegadorDisponivel()) return;

  const atual: PontoGPS[] = JSON.parse(localStorage.getItem(CHAVE_OFFLINE) || "[]");
  
  atual.push({
    ...ponto,
    online: false,
    sincronizado: false,
  });

  localStorage.setItem(CHAVE_OFFLINE, JSON.stringify(atual));
}

export async function sincronizarPontosOffline() {
  if (!navegadorDisponivel() || !navigator.onLine) return;

  const pontos: PontoGPS[] = JSON.parse(localStorage.getItem(CHAVE_OFFLINE) || "[]");
  if (!pontos.length) return;

  const qtdEnviada = pontos.length;

  const { error } = await supabase.from("gps_patrulhamento").insert(pontos);

  if (!error) {
    // CORREÇÃO DA RACE CONDITION: Lê novamente o storage para ver se novos pontos entraram durante o await
    const estadoAtual: PontoGPS[] = JSON.parse(localStorage.getItem(CHAVE_OFFLINE) || "[]");
    
    // Como os itens sempre entram no final da fila (push), podemos apenas remover a quantidade que enviamos do início da array.
    const pontosRestantes = estadoAtual.slice(qtdEnviada);
    
    if (pontosRestantes.length === 0) {
      localStorage.removeItem(CHAVE_OFFLINE);
    } else {
      localStorage.setItem(CHAVE_OFFLINE, JSON.stringify(pontosRestantes));
    }
  } else {
    console.error("Erro ao sincronizar pontos GPS offline:", error);
  }
}

async function salvarPonto(dados: DadosRastreamento, location: { latitude: number, longitude: number, accuracy?: number | null, speed?: number | null }) {
  if (!navegadorDisponivel()) return;

  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);

  if (!latitude || !longitude) return;
  if (!deveSalvar(latitude, longitude)) return;

  const pontoGps: PontoGPS = {
    municipio_id: Number(dados.municipio_id),
    patrulhamento_id: dados.patrulhamento_id ? Number(dados.patrulhamento_id) : null,
    guarda_id: null,
    viatura_id: null,
    latitude,
    longitude,
    precisao: location.accuracy ?? null,
    velocidade: location.speed ?? null,
    tipo: "AUTOMATICO",
    observacao: null,
    criado_em: new Date().toISOString(),
  };

  if (!navigator.onLine) {
    salvarOffline(pontoGps);
    atualizarUltimoPonto(latitude, longitude);
    return;
  }

  const { data, error } = await supabase
  .from("gps_patrulhamento")
  .insert([pontoGps])
  .select();

console.log("INSERT GPS:", data);

if (error) {
  console.error("ERRO INSERT:", error);
  salvarOffline(pontoGps);
}

  if (error) {
    console.error("Erro ao salvar GPS do patrulhamento:", error);
    salvarOffline(pontoGps);
  }
  
  // Independentemente de erro ou sucesso na inserção imediata, o ponto é o último registrado
  atualizarUltimoPonto(latitude, longitude);
}

export async function iniciarBackgroundRastreamento(dados: DadosRastreamento) {
  if (!navegadorDisponivel()) return null;

  await sincronizarPontosOffline();

  const watcherExistente = localStorage.getItem(CHAVE_WATCHER);

  if (watcherExistente) {
    if (Capacitor.isNativePlatform()) {
      try {
        await BackgroundGeolocation.removeWatcher({ id: watcherExistente });
      } catch (e) {
        console.warn("Falha ao remover watcher antigo nativo", e);
      }
    } else {
        navigator.geolocation.clearWatch(Number(watcherExistente));
    }
  }

  if (Capacitor.isNativePlatform()) {
    console.log("INICIANDO BACKGROUND GPS...");

let watcherId: string;

try {
  watcherId = await BackgroundGeolocation.addWatcher(
    {
      backgroundTitle: "SIG-GCM Brasil",
      backgroundMessage: "Patrulhamento em andamento",
      requestPermissions: true,
      stale: false,
      distanceFilter: DISTANCIA_MINIMA_METROS,
    },
    async (location: any, error: any) => {

      console.log("CALLBACK EXECUTOU");

      if (error) {
        console.error("ERRO CALLBACK:", error);
        return;
      }

      console.log("LOCALIZAÇÃO:", location);

      if (!location) return;

      await salvarPonto(dados, location);
    }
  );

  console.log("WATCHER ID:", watcherId);

} catch (e) {

  console.error("ERRO AO CRIAR WATCHER:", e);

  return null;
}

localStorage.setItem(CHAVE_WATCHER, watcherId);

return watcherId;
  }

  // WEB / PWA
  const id = navigator.geolocation.watchPosition(
    async (position) => {
      await salvarPonto(dados, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed,
      });
    },
    (erro) => {
      console.error("GPS:", erro);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    }
  );

  localStorage.setItem(CHAVE_WATCHER, String(id));
  return id;
}

export async function pararBackgroundRastreamento() {
  if (!navegadorDisponivel()) return;

  const watcherId = localStorage.getItem(CHAVE_WATCHER);
  if (!watcherId) return;

  if (Capacitor.isNativePlatform()) {
    try {
      await BackgroundGeolocation.removeWatcher({ id: watcherId });
    } catch {}
  } else {
    navigator.geolocation.clearWatch(Number(watcherId));
  }

  localStorage.removeItem(CHAVE_WATCHER);
  localStorage.removeItem(CHAVE_ULTIMO_PONTO);
}

export function limparUltimoPontoGPS() {
  if (!navegadorDisponivel()) return;
  localStorage.removeItem(CHAVE_ULTIMO_PONTO);
}