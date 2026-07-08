import { salvarPontoGPS } from "./gpsService";

const CHAVE_WATCH = "patrulhamento_v2_watch_id";
const CHAVE_ATIVO = "patrulhamentoAtivoId";
const CHAVE_ULTIMO = "patrulhamento_v2_ultimo_ponto";

function distanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return r * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function deveSalvar(latitude: number, longitude: number) {
  const salvo = localStorage.getItem(CHAVE_ULTIMO);
  if (!salvo) return true;

  const ultimo = JSON.parse(salvo);
  const distancia = distanciaMetros(
    Number(ultimo.latitude),
    Number(ultimo.longitude),
    latitude,
    longitude
  );

  return distancia >= 5;
}

function atualizarUltimo(latitude: number, longitude: number) {
  localStorage.setItem(
    CHAVE_ULTIMO,
    JSON.stringify({
      latitude,
      longitude,
      data: new Date().toISOString(),
    })
  );
}

export function iniciarGPSPatrulhamento({
  municipio_id,
  patrulhamento_id,
}: {
  municipio_id: number;
  patrulhamento_id: number;
}) {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("GPS não disponível neste dispositivo.");
  }

  const antigo = localStorage.getItem(CHAVE_WATCH);
  if (antigo) {
    navigator.geolocation.clearWatch(Number(antigo));
  }

  localStorage.setItem(CHAVE_ATIVO, String(patrulhamento_id));

  const watchId = navigator.geolocation.watchPosition(
    async (pos) => {
      const latitude = Number(pos.coords.latitude);
      const longitude = Number(pos.coords.longitude);

      if (!latitude || !longitude) return;
      if (!deveSalvar(latitude, longitude)) return;

      await salvarPontoGPS({
        municipio_id,
        patrulhamento_id,
        latitude,
        longitude,
        precisao: pos.coords.accuracy ?? null,
        velocidade: pos.coords.speed ?? null,
        tipo: "AUTOMATICO",
        observacao: "Ponto automático do patrulhamento",
      });

      atualizarUltimo(latitude, longitude);
    },
    (erro) => {
      console.error("Erro GPS patrulhamento:", erro);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
    }
  );

  localStorage.setItem(CHAVE_WATCH, String(watchId));

  return watchId;
}