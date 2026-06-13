"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import L from "leaflet";

type OcorrenciaMapa = {
  id: number;
  protocolo: string;
  tipo: string;
  local: string;
  status: string;
  hora: string;
  locais?: {
    nome: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
};

const iconOcorrencia = L.divIcon({
  html: "🚨",
  className: "",
  iconSize: [30, 30],
});

const iconViatura = L.divIcon({
  html: "🚓",
  className: "",
  iconSize: [30, 30],
});

const iconChamado = L.divIcon({
  html: "📞",
  className: "",
  iconSize: [30, 30],
});

const iconBase = L.divIcon({
  html: "🏢",
  className: "",
  iconSize: [30, 30],
});

export default function MapaOperacional({
  ocorrencias = [],
}: {
  ocorrencias?: OcorrenciaMapa[];
}) {
  const ocorrenciasComCoordenadas = ocorrencias.filter(
    (o) => o.locais?.latitude && o.locais?.longitude
  );
console.log("OCORRENCIAS MAPA", ocorrencias);
  return (
    <MapContainer
      center={[-11.621296322631357, -38.80684199142887]}
      zoom={15}
      scrollWheelZoom={true}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "100%",
      }}
      className="rounded-2xl z-0"
    >
      <TileLayer
  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  attribution="&copy; OpenStreetMap &copy; CARTO"
/>

      <Marker position={[-11.621296, -38.806841]} icon={iconBase}>
        <Popup>🏢 Base GCM Biritinga</Popup>
      </Marker>

      {ocorrenciasComCoordenadas.map((o) => (
        <Marker
          key={o.id}
          position={[
            Number(o.locais?.latitude),
            Number(o.locais?.longitude),
          ]}
          icon={iconOcorrencia}
        >
          <Popup>
            <strong>🚨 {o.tipo}</strong>
            <br />
            Protocolo: {o.protocolo}
            <br />
            Local: {o.locais?.nome || o.local}
            <br />
            Status: {o.status}
            <br />
            Hora: {o.hora || "--:--"}
          </Popup>
        </Marker>
      ))}

      <Marker position={[-11.622000, -38.805000]} icon={iconViatura}>
        <Popup>🚓 VTR-01 Patrulhamento</Popup>
      </Marker>

      <Marker position={[-11.623000, -38.808000]} icon={iconChamado}>
        <Popup>📞 Chamado Recebido</Popup>
      </Marker>
    </MapContainer>
  );
}