"use client";

import "leaflet/dist/leaflet.css";

import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type OcorrenciaMapa = {
  id: number;
  protocolo: string;
  tipo: string;
  status: string;
  local: string;
  latitude: string | null;
  longitude: string | null;
};

export default function MapaOperacional({
  ocorrencias,
}: {
  ocorrencias: OcorrenciaMapa[];
}) {
  const ocorrenciasComGps = ocorrencias.filter(
    (o) => o.latitude && o.longitude
  );

  return (
    <MapContainer
      center={[-11.607, -38.805]}
      zoom={14}
      style={{
        height: "75vh",
        width: "100%",
        borderRadius: "16px",
      }}
    >
      <TileLayer
        attribution="OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {ocorrenciasComGps.map((ocorrencia) => (
        <Marker
          key={ocorrencia.id}
          position={[
            Number(ocorrencia.latitude),
            Number(ocorrencia.longitude),
          ]}
        >
          <Popup>
            <div>
              <strong>{ocorrencia.tipo}</strong>
              <br />
              {ocorrencia.protocolo}
              <br />
              {ocorrencia.local}
              <br />
              Status: {ocorrencia.status}
              <br />
              <br />
              <Link href={`/sistema/ocorrencias/${ocorrencia.id}`}>
                Abrir ocorrência
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}