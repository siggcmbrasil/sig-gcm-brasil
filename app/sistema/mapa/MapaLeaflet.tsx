"use client";

import "leaflet/dist/leaflet.css";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const iconeViatura = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapaLeaflet() {
  return (
    <MapContainer
      center={[-11.607, -38.805]}
      zoom={14}
      style={{
        height: "700px",
        width: "100%",
      }}
    >
      <TileLayer
        attribution="OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={[-11.607, -38.805]} icon={iconeViatura}>
        <Popup>
          VTR-01
          <br />
          GCM Biritinga
        </Popup>
      </Marker>
    </MapContainer>
  );
}