"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, Flame, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import MobileBottomNav from "@/components/MobileBottomNav";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

type Ocorrencia = {
  id: number;
  tipo: string | null;
  local: string | null;
  latitude: number | null;
  longitude: number | null;
  data: string | null;
  municipio_id: number;
};

export default function ManchaCriminalPage() {
  const [usuario, setUsuario] = useState<any>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const salvo = localStorage.getItem("usuarioLogado");

    if (!salvo) {
      window.location.href = "/login";
      return;
    }

    const dados = JSON.parse(salvo);

    if (!dados?.id || !dados?.municipio_id) {
      window.location.href = "/login";
      return;
    }

    setUsuario(dados);
    carregarOcorrencias(dados.municipio_id);
  }, []);

  async function carregarOcorrencias(municipioId: number) {
    setCarregando(true);

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("id, tipo, local, latitude, longitude, data, municipio_id")
      .eq("municipio_id", municipioId)
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("id", { ascending: false })
      .limit(100);

    if (error) {
      console.error(error);
      alert("Erro ao carregar dados da mancha criminal.");
      setCarregando(false);
      return;
    }

    setOcorrencias(data || []);
    setCarregando(false);
  }

  const pontosValidos = ocorrencias.filter((o) => {
    const latitude = Number(o.latitude);
    const longitude = Number(o.longitude);

    return (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  });

  const centro =
    pontosValidos.length > 0
      ? ([Number(pontosValidos[0].latitude), Number(pontosValidos[0].longitude)] as [
          number,
          number
        ])
      : ([-11.621296322631357, -38.80684199142887] as [number, number]);

  return (
    <main className="min-h-screen bg-[#02060f] text-white p-5 pb-28">
      <Link
        href="/sistema/mobile"
        className="inline-flex items-center gap-2 mb-5 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl active:scale-95"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </Link>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 mb-5">
        <p className="text-xs text-blue-400 font-bold">
          {usuario?.municipio_nome || "SIG-GCM Brasil"}
        </p>

        <h1 className="text-3xl font-black mt-1 flex items-center gap-2">
          <Flame className="w-8 h-8 text-orange-400" />
          Mancha Criminal
        </h1>

        <p className="text-slate-400 mt-2">
          Pontos de maior concentração de ocorrências do município.
        </p>
      </section>

      {carregando ? (
        <p className="text-slate-400">Carregando mapa criminal...</p>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <p className="text-slate-400 text-xs">Pontos mapeados</p>
              <h2 className="text-3xl font-black">{pontosValidos.length}</h2>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <p className="text-slate-400 text-xs">Ocorrências</p>
              <h2 className="text-3xl font-black">{ocorrencias.length}</h2>
            </div>
          </section>

          <section className="mb-6">
            <div className="h-[60vh] rounded-3xl overflow-hidden border border-slate-800">
              <MapContainer
                center={centro}
                zoom={14}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {pontosValidos.map((item) => (
                  <Marker
                    key={item.id}
                    position={[Number(item.latitude), Number(item.longitude)]}
                  >
                    <Popup>
                      <strong>{item.tipo || "Ocorrência"}</strong>
                      <br />
                      {item.local || "Local não informado"}
                      <br />
                      {item.data || ""}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </section>

          <section className="space-y-3">
            {pontosValidos.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-center">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                <p className="font-bold">Nenhum ponto mapeado.</p>
                <p className="text-sm text-slate-400 mt-1">
                  As ocorrências com GPS aparecerão aqui.
                </p>
              </div>
            ) : (
              pontosValidos.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4"
                >
                  <h2 className="font-black">{item.tipo || "Ocorrência"}</h2>

                  <p className="text-slate-400 text-sm mt-1">
                    {item.local || "Local não informado"}
                  </p>

                  <p className="text-blue-400 text-xs mt-2">
                    {item.latitude}, {item.longitude}
                  </p>
                </div>
              ))
            )}
          </section>
        </>
      )}

      <MobileBottomNav />
    </main>
  );
}