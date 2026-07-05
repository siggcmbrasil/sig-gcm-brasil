"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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

export default function MapaOperacional({
  ocorrencias,
  viaturas = [],
  localizacoes = [],
  blitzes = [],
  barreiras = [],
  operacoesEspeciais = [],
}: {
  ocorrencias: OcorrenciaMapa[];
  viaturas?: ViaturaMapa[];
  localizacoes?: LocalizacaoGPS[];
  blitzes?: BlitzMapa[];
  barreiras?: BarreiraMapa[];
  operacoesEspeciais?: OperacaoEspecialMapa[];
}) {
  const ocorrenciasComCoordenadas = (ocorrencias || []).map((o) => {
    const localRelacionado = Array.isArray(o.locais) ? o.locais[0] : o.locais;
    return { ...o, localRelacionado };
  });

  const viaturasComCoordenadas = viaturas.filter(
  (v) =>
    Number(v.latitude) &&
    Number(v.longitude)
);

const localizacoesComCoordenadas = localizacoes.filter(
  (loc) =>
    Number(loc.latitude) &&
    Number(loc.longitude)
);

const blitzesComCoordenadas = blitzes.filter(
  (b) =>
    Number(b.latitude) &&
    Number(b.longitude)
);

const barreirasComCoordenadas = barreiras.filter(
  (b) =>
    Number(b.latitude) &&
    Number(b.longitude)
);

const operacoesComCoordenadas = operacoesEspeciais.filter(
  (o) => Number(o.latitude) && Number(o.longitude)
);

const [pronto, setPronto] = useState(false);

const mapaKey = useMemo(
  () => `mapa-operacional-${Date.now()}`,
  []
);

useEffect(() => {
  setPronto(true);
}, []);

if (!pronto) {
  return (
    <div className="h-full w-full rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
      Carregando mapa...
    </div>
  );
}

  return (
  <MapContainer
  key={mapaKey}
  center={[-11.621296322631357, -38.80684199142887]}
      zoom={15}
      scrollWheelZoom={true}
      style={{ width: "100%", height: "100%", minHeight: "100%" }}
      className="rounded-2xl z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="OpenStreetMap"
      />

      <Marker position={[-11.620667881728922, -38.8051351858178]} icon={iconBase}>
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
          {loc.status === "A_PE" ? "🚶" : loc.status === "MOTO" ? "🏍️" : "🚓"}{" "}
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
    position={[
      Number(b.latitude),
      Number(b.longitude),
    ]}
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
    position={[
      Number(b.latitude),
      Number(b.longitude),
    ]}
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