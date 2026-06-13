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
  locais?: any;
};

const iconOcorrencia = L.divIcon({
  html: "🚨",
  className: "text-3xl",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const iconViatura = L.divIcon({
  html: "🚓",
  className: "text-3xl",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const iconChamado = L.divIcon({
  html: "📞",
  className: "text-3xl",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const iconBase = L.divIcon({
  html: "🏢",
  className: "text-3xl",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function MapaOperacional({
  ocorrencias = [],
}: {
  ocorrencias?: OcorrenciaMapa[];
}) {
  const ocorrenciasComCoordenadas = ocorrencias
    .map((o) => {
      const localRelacionado = Array.isArray(o.locais) ? o.locais[0] : o.locais;

      return {
        ...o,
        localRelacionado,
      };
    })
    .filter(
      (o) =>
        o.localRelacionado &&
        o.localRelacionado.latitude !== null &&
        o.localRelacionado.longitude !== null
    );

  console.log("OCORRENCIAS RECEBIDAS NO MAPA:", ocorrencias);
  console.log("OCORRENCIAS COM COORDENADAS:", ocorrenciasComCoordenadas);

  return (
    <MapContainer
  key={ocorrencias.length}
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
  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
  attribution="OpenStreetMap"
/>

      <Marker position={[-11.621296, -38.806841]} icon={iconBase}>
        <Popup>🏢 Base GCM Biritinga</Popup>
      </Marker>

      {ocorrenciasComCoordenadas.map((o) => (
        <Marker
          key={o.id}
          position={[
            Number(o.localRelacionado.latitude),
            Number(o.localRelacionado.longitude),
          ]}
          icon={iconOcorrencia}
        >
          <Popup>
            <strong>🚨 {o.tipo}</strong>
            <br />
            Protocolo: {o.protocolo || "Sem protocolo"}
            <br />
            Local: {o.localRelacionado.nome || o.local}
            <br />
            Status: {o.status}
            <br />
            Hora: {o.hora || "--:--"}
          </Popup>
        </Marker>
      ))}

      <Marker position={[-11.622, -38.805]} icon={iconViatura}>
        <Popup>🚓 VTR-01 Patrulhamento</Popup>
      </Marker>

      <Marker position={[-11.623, -38.808]} icon={iconChamado}>
        <Popup>📞 Chamado Recebido</Popup>
      </Marker>
    </MapContainer>
  );
}