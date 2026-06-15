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
const iconBase = L.divIcon({
  html: `<span class="map-dot map-dot-gray"></span>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const iconOcorrencia = L.divIcon({
  html: `<span class="map-dot map-dot-red"></span>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const iconChamado = L.divIcon({
  html: `<span class="map-dot map-dot-blue"></span>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const iconViatura = L.divIcon({
  html: `<span class="map-dot map-dot-green"></span>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const iconPatrulhamento = L.divIcon({
  html: `<span class="map-dot map-dot-purple"></span>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function MapaOperacional({
  ocorrencias,
}: {
  ocorrencias: OcorrenciaMapa[];
}) {
  const listaOcorrencias = ocorrencias || [];

  const ocorrenciasComCoordenadas = listaOcorrencias
    .map((o) => {
      const localRelacionado = Array.isArray(o.locais)
        ? o.locais[0]
        : o.locais;

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

  console.log("OCORRENCIAS RECEBIDAS NO MAPA:", listaOcorrencias);
  console.log("OCORRENCIAS COM COORDENADAS:", ocorrenciasComCoordenadas);

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
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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