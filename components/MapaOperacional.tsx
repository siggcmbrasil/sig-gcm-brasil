"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

type OcorrenciaMapa = {
  id: number;
  protocolo?: string;
  tipo: string;
  local: string;
  status: string;
  hora?: string;
  data?: string;
  locais?: any;
};

type ViaturaMapa = {
  id: number;
  prefixo: string;
  modelo?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
};

type LocalizacaoGPS = {
  id: number;
  nome: string;
  latitude: number;
  longitude: number;
  atualizado_em: string;
  status?: string;
  observacao?: string;
};

type BlitzMapa = {
  id: string;
  nome?: string;
  tipo?: string;
  local?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
};

type BarreiraMapa = BlitzMapa;

type OperacaoEspecialMapa = {
  id: string;
  nome?: string;
  tipo?: string;
  local?: string;
  status?: string;
  data?: string;
  comandante?: string;
  efetivo?: number;
  latitude?: number;
  longitude?: number;
};

type AlertaSOSMapa = {
  id: number;
  nome_usuario: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  precisao?: string | number | null;
  status: string;
  criado_em: string;
};

const iconBase = L.divIcon({
  html: `<span class="map-dot map-dot-gray"></span>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const iconVermelho = L.divIcon({
  html: `<div style="width:18px;height:18px;background:red;border:3px solid white;border-radius:50%;box-shadow:0 0 12px black;"></div>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const iconAmarelo = L.divIcon({
  html: `<span class="map-dot map-dot-yellow"></span>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const iconVerde = L.divIcon({
  html: `<span class="map-dot map-dot-green"></span>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const iconGPS = L.divIcon({
  html: `<div style="font-size:28px">🚓</div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const iconPe = L.divIcon({
  html: `<div style="font-size:28px">🚶</div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const iconMoto = L.divIcon({
  html: `<div style="font-size:28px">🏍️</div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const iconBlitz = L.divIcon({
  html: `<div style="font-size:28px">🚧</div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const iconBarreira = L.divIcon({
  html: `<div style="font-size:28px">🛡️</div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const iconOperacaoEspecial = L.divIcon({
  html: `<div style="font-size:28px">⭐</div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const iconSOS = L.divIcon({
  html: `
    <style>
      @keyframes sosPulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.25); opacity: .75; }
        100% { transform: scale(1); opacity: 1; }
      }
    </style>
    <div style="
      font-size:34px;
      animation:sosPulse 0.8s infinite;
      filter: drop-shadow(0 0 10px red);
    ">
      🚨
    </div>
  `,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function obterIconeGPS(status?: string) {
  if (status === "A_PE") return iconPe;
  if (status === "MOTO") return iconMoto;
  return iconGPS;
}

function obterIconeOcorrencia(status: string) {
  if (status === "Finalizada") return iconVerde;
  if (status === "Em andamento") return iconAmarelo;
  return iconVermelho;
}

function CentralizarMapa({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([latitude, longitude], 18, {
      animate: true,
      duration: 2,
    });
  }, [latitude, longitude, map]);

  return null;
}

export default function MapaOperacional({
  ocorrencias,
  viaturas = [],
  localizacoes = [],
  blitzes = [],
  barreiras = [],
  operacoesEspeciais = [],
  alertasSOS = [],
}: {
  ocorrencias: OcorrenciaMapa[];
  viaturas?: ViaturaMapa[];
  localizacoes?: LocalizacaoGPS[];
  blitzes?: BlitzMapa[];
  barreiras?: BarreiraMapa[];
  operacoesEspeciais?: OperacaoEspecialMapa[];
  alertasSOS?: AlertaSOSMapa[];
}) {
  const [pronto, setPronto] = useState(false);
  const [ultimoSOS, setUltimoSOS] = useState(0);
  const [latitudeAtual, setLatitudeAtual] = useState<number | null>(null);
  const [longitudeAtual, setLongitudeAtual] = useState<number | null>(null);

  const mapaKey = useMemo(() => `mapa-operacional-${Date.now()}`, []);

  const ocorrenciasComCoordenadas = (ocorrencias || []).map((o) => {
    const localRelacionado = Array.isArray(o.locais) ? o.locais[0] : o.locais;
    return { ...o, localRelacionado };
  });

  const viaturasComCoordenadas = viaturas.filter(
    (v) => Number(v.latitude) && Number(v.longitude)
  );

  const localizacoesComCoordenadas = localizacoes.filter(
    (loc) => Number(loc.latitude) && Number(loc.longitude)
  );

  const blitzesComCoordenadas = blitzes.filter(
    (b) => Number(b.latitude) && Number(b.longitude)
  );

  const barreirasComCoordenadas = barreiras.filter(
    (b) => Number(b.latitude) && Number(b.longitude)
  );

  const operacoesComCoordenadas = operacoesEspeciais.filter(
    (o) => Number(o.latitude) && Number(o.longitude)
  );

  const alertasSOSComCoordenadas = alertasSOS.filter((s) => {
    const latitude = Number(s.latitude);
    const longitude = Number(s.longitude);

    return (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      s.status !== "FINALIZADO"
    );
  });

  useEffect(() => {
    setPronto(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitudeAtual(pos.coords.latitude);
          setLongitudeAtual(pos.coords.longitude);
        },
        () => {},
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    }
  }, []);

  useEffect(() => {
    if (alertasSOSComCoordenadas.length > ultimoSOS) {
      const audio = new Audio("/sons/sirene.mp3");
      audio.play().catch(() => {});

      navigator.vibrate?.([500, 200, 500]);

      setUltimoSOS(alertasSOSComCoordenadas.length);
    }
  }, [alertasSOSComCoordenadas.length, ultimoSOS]);

  function calcularDistancia(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  function textoDistancia(sos: AlertaSOSMapa) {
    if (!latitudeAtual || !longitudeAtual || !sos.latitude || !sos.longitude) {
      return null;
    }

    const distancia = calcularDistancia(
      latitudeAtual,
      longitudeAtual,
      Number(sos.latitude),
      Number(sos.longitude)
    );

    if (distancia < 0.05) return "Muito próximo";
    if (distancia < 1) return `${Math.round(distancia * 1000)} m`;
    return `${distancia.toFixed(2)} km`;
  }

  if (!pronto) {
    return (
      <div className="h-full w-full rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
        Carregando mapa...
      </div>
    );
  }

  const sosMaisRecente = alertasSOSComCoordenadas[0];

  return (
    <MapContainer
      key={mapaKey}
      center={[-11.621296322631357, -38.80684199142887]}
      zoom={15}
      scrollWheelZoom={true}
      style={{ width: "100%", height: "100%", minHeight: "100%" }}
      className="rounded-2xl z-0"
    >
      {sosMaisRecente && (
        <CentralizarMapa
          latitude={Number(sosMaisRecente.latitude)}
          longitude={Number(sosMaisRecente.longitude)}
        />
      )}

      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="OpenStreetMap"
      />

      <Marker
        position={[-11.620667881728922, -38.8051351858178]}
        icon={iconBase}
      >
        <Popup>Base GCM Biritinga</Popup>
      </Marker>

      {ocorrenciasComCoordenadas.map((o) => {
        if (!o.localRelacionado) return null;

        const latitude = Number(o.localRelacionado.latitude);
        const longitude = Number(o.localRelacionado.longitude);

        if (!latitude || !longitude) return null;

        return (
          <Marker
            key={`ocorrencia-${o.id}`}
            position={[latitude, longitude]}
            icon={obterIconeOcorrencia(o.status)}
          >
            <Popup>
              <div style={{ minWidth: "240px" }}>
                <strong>🚨 {o.tipo}</strong>
                <hr style={{ margin: "8px 0" }} />
                <div>📄 {o.protocolo || "Sem protocolo"}</div>
                <div>📍 {o.localRelacionado.nome || o.local}</div>
                <div>📌 {o.status}</div>
                <div>⏰ {o.hora || "--:--"}</div>
                {o.data && <div>📅 {o.data}</div>}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {viaturasComCoordenadas.map((v) => (
        <Marker
          key={`viatura-${v.id}`}
          position={[Number(v.latitude), Number(v.longitude)]}
          icon={iconVerde}
        >
          <Popup>
            <strong>🚓 {v.prefixo}</strong>
            <div>Modelo: {v.modelo || "-"}</div>
            <div>Status: {v.status || "-"}</div>
          </Popup>
        </Marker>
      ))}

      {localizacoesComCoordenadas.map((loc) => (
        <Marker
          key={`gps-${loc.id}`}
          position={[Number(loc.latitude), Number(loc.longitude)]}
          icon={obterIconeGPS(loc.status)}
        >
          <Popup>
            <div style={{ minWidth: "230px" }}>
              <strong>
                {loc.status === "A_PE"
                  ? "🚶"
                  : loc.status === "MOTO"
                  ? "🏍️"
                  : "🚓"}{" "}
                {loc.nome}
              </strong>

              <hr style={{ margin: "8px 0" }} />

              <div>
                Tipo:{" "}
                {loc.status === "A_PE"
                  ? "Patrulhamento a pé"
                  : loc.status === "MOTO"
                  ? "Patrulhamento de moto"
                  : "Patrulhamento de viatura"}
              </div>

              {loc.observacao && <div>📝 {loc.observacao}</div>}

              <div>
                🕒 {new Date(loc.atualizado_em).toLocaleString("pt-BR")}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {blitzesComCoordenadas.map((b) => (
        <Marker
          key={`blitz-${b.id}`}
          position={[Number(b.latitude), Number(b.longitude)]}
          icon={iconBlitz}
        >
          <Popup>
            <div style={{ minWidth: "220px" }}>
              <strong>🚧 Blitz</strong>
              <hr style={{ margin: "8px 0" }} />
              <div>📌 {b.nome}</div>
              <div>📍 {b.local}</div>
              <div>📋 {b.tipo}</div>
              <div>🚦 {b.status}</div>
            </div>
          </Popup>
        </Marker>
      ))}

      {barreirasComCoordenadas.map((b) => (
        <Marker
          key={`barreira-${b.id}`}
          position={[Number(b.latitude), Number(b.longitude)]}
          icon={iconBarreira}
        >
          <Popup>
            <div style={{ minWidth: "220px" }}>
              <strong>🛡️ Barreira</strong>
              <hr style={{ margin: "8px 0" }} />
              <div>📌 {b.nome}</div>
              <div>📍 {b.local}</div>
              <div>📋 {b.tipo}</div>
              <div>🚦 {b.status}</div>
            </div>
          </Popup>
        </Marker>
      ))}

      {alertasSOSComCoordenadas.map((sos) => (
        <Marker
          key={`sos-${sos.id}`}
          position={[Number(sos.latitude), Number(sos.longitude)]}
          icon={iconSOS}
        >
          <Popup>
            <div style={{ minWidth: "250px" }}>
              <strong style={{ color: "#ef4444", fontSize: "18px" }}>
                🚨 ALERTA SOS
              </strong>

              <hr style={{ margin: "8px 0" }} />

              <div>👮 Guarda: {sos.nome_usuario || "Não informado"}</div>
              <div>🚦 Status: {sos.status}</div>

              {sos.precisao && (
                <div>📍 Precisão: {sos.precisao} metros</div>
              )}

              {textoDistancia(sos) && (
                <div>📏 Distância: {textoDistancia(sos)}</div>
              )}

              <div>
                🕒 {new Date(sos.criado_em).toLocaleString("pt-BR")}
              </div>

              <br />

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${sos.latitude},${sos.longitude}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "block",
                  background: "#1d4ed8",
                  color: "white",
                  padding: "8px",
                  borderRadius: "8px",
                  textAlign: "center",
                  marginBottom: "8px",
                  fontWeight: "bold",
                }}
              >
                🧭 Traçar Rota
              </a>

              <a
                href={`/sistema/central-sos?id=${sos.id}`}
                style={{
                  display: "block",
                  background: "#ca8a04",
                  color: "white",
                  padding: "8px",
                  borderRadius: "8px",
                  textAlign: "center",
                  marginBottom: "8px",
                  fontWeight: "bold",
                }}
              >
                👮 Atender SOS
              </a>

              <a
                href="/sistema/central-sos"
                style={{
                  display: "block",
                  background: "#16a34a",
                  color: "white",
                  padding: "8px",
                  borderRadius: "8px",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                ✅ Finalizar / Central SOS
              </a>
            </div>
          </Popup>
        </Marker>
      ))}

      {operacoesComCoordenadas.map((o) => (
        <Marker
          key={`operacao-especial-${o.id}`}
          position={[Number(o.latitude), Number(o.longitude)]}
          icon={iconOperacaoEspecial}
        >
          <Popup>
            <div style={{ minWidth: "230px" }}>
              <strong>⭐ Operação Especial</strong>
              <hr style={{ margin: "8px 0" }} />
              <div>📌 {o.nome}</div>
              <div>📍 {o.local}</div>
              <div>📋 {o.tipo}</div>
              <div>👮 Comandante: {o.comandante || "-"}</div>
              <div>👥 Efetivo: {o.efetivo || 0}</div>
              <div>🚦 {o.status}</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}