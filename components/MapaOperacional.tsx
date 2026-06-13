"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup
} from "react-leaflet";

export default function MapaOperacional() {
  return (
    <MapContainer
      center={[-11.621296322631357, -38.80684199142887]}
      zoom={15}
      scrollWheelZoom={true}
      className="w-full h-full rounded-2xl"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker
        position={[-11.621296322631357, -38.80684199142887]}
      >
        <Popup>
          Base da GCM Biritinga
        </Popup>
      </Marker>
    </MapContainer>
  );
}