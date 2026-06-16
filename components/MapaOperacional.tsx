"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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

function obterIconeOcorrencia(status: string) {
  if (status === "Finalizada") return iconVerde;
  if (status === "Em andamento") return iconAmarelo;
  return iconVermelho;
}

export default function MapaOperacional({
  ocorrencias,
  viaturas = [],
  localizacoes = [],
}: {
  ocorrencias: OcorrenciaMapa[];
  viaturas?: ViaturaMapa[];
  localizacoes?: LocalizacaoGPS[];
}) {
  const ocorrenciasComCoordenadas = (ocorrencias || []).map((o) => {
    const localRelacionado = Array.isArray(o.locais) ? o.locais[0] : o.locais;
    return { ...o, localRelacionado };
  });

  const viaturasComCoordenadas = viaturas.filter(
    (v) => v.latitude && v.longitude
  );

  return (
    <MapContainer
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

        return (
          <Marker
            key={`ocorrencia-${o.id}`}
            position={[
              Number(o.localRelacionado.latitude),
              Number(o.localRelacionado.longitude),
            ]}
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

      {localizacoes.map((loc) => (
        <Marker
          key={`gps-${loc.id}`}
          position={[Number(loc.latitude), Number(loc.longitude)]}
          icon={iconGPS}
        >
          <Popup>
            <strong>🚓 {loc.nome}</strong>
            <br />
            GPS em tempo real
            <br />
            {new Date(loc.atualizado_em).toLocaleString("pt-BR")}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}