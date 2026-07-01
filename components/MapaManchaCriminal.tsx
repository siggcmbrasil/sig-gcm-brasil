"use client";

import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Ocorrencia = {
  id: number;
  protocolo: string | null;
  tipo: string | null;
  local: string | null;
  data: string | null;
  status: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
};

export default function MapaManchaCriminal({
  ocorrencias,
}: {
  ocorrencias: Ocorrencia[];
}) {
  const pontos = ocorrencias
    .map((o) => ({
      ...o,
      lat: Number(o.latitude),
      lng: Number(o.longitude),
    }))
    .filter((o) => !Number.isNaN(o.lat) && !Number.isNaN(o.lng));

  const centro =
    pontos.length > 0
      ? ([pontos[0].lat, pontos[0].lng] as [number, number])
      : ([-11.621296322631357, -38.80684199142887] as [number, number]);

  return (
    <MapContainer
      center={centro}
      zoom={14}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {pontos.map((o) => (
        <CircleMarker
          key={o.id}
          center={[o.lat, o.lng]}
          radius={12}
          pathOptions={{
            color: "#ef4444",
            fillColor: "#ef4444",
            fillOpacity: 0.45,
          }}
        >
          <Popup>
            <div>
              <strong>{o.tipo || "Ocorrência"}</strong>
              <br />
              Protocolo: {o.protocolo || "-"}
              <br />
              Local: {o.local || "-"}
              <br />
              Data: {o.data || "-"}
              <br />
              Status: {o.status || "-"}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}