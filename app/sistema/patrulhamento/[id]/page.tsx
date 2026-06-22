"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";

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

const Polyline = dynamic(
  () => import("react-leaflet").then((m) => m.Polyline),
  { ssr: false }
);

type PontoGps = {
  id: string;
  patrulhamento_id: number;
  latitude: number;
  longitude: number;
  tipo: string;
  observacao: string | null;
  criado_em: string;
};

type Patrulhamento = {
  id: number;
  data: string;
  hora: string;
  local: string;
  guarda: string;
  equipe: string | null;
  viatura: string | null;
  observacao: string | null;
  status: string | null;
};

export default function RotaPatrulhamentoPage() {
  const params = useParams();
  const id = Number(params.id);

  const [pontos, setPontos] = useState<PontoGps[]>([]);
  const [patrulhamento, setPatrulhamento] =
    useState<Patrulhamento | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregarDados() {
    setCarregando(true);

    const { data: patrulhamentoData } = await supabase
      .from("patrulhamentos")
      .select("*")
      .eq("id", id)
      .single();

    const { data: pontosData, error } = await supabase
  .from("gps_patrulhamento")
  .select("*")
  .eq("patrulhamento_id", id)
  .order("criado_em", { ascending: true });

    if (error) {
      console.error(error);
      alert("Erro ao carregar rota GPS.");
      setCarregando(false);
      return;
    }

    setPatrulhamento(patrulhamentoData);
    setPontos(pontosData || []);
    setCarregando(false);
  }

  useEffect(() => {
    if (id) carregarDados();
  }, [id]);

  const pontosValidos = pontos.filter(
  (p) =>
    typeof p.latitude === "number" &&
    typeof p.longitude === "number" &&
    !isNaN(p.latitude) &&
    !isNaN(p.longitude)
);

const posicoes = pontosValidos.map((p) => [
  p.latitude,
  p.longitude,
]) as [number, number][];

  const centro =
    posicoes.length > 0
      ? posicoes[0]
      : ([-11.621296322631357, -38.80684199142887] as [number, number]);

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="mb-6 border-b border-slate-800 pb-5">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
          Rota do Patrulhamento
        </h1>

        <p className="text-slate-400 text-base md:text-lg mt-1">
          Visualização dos pontos GPS e trajeto percorrido pela equipe.
        </p>
      </header>

      {carregando ? (
        <p className="text-slate-400">Carregando rota...</p>
      ) : !patrulhamento ? (
        <p className="text-slate-400">Patrulhamento não encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <div className="card xl:col-span-1 space-y-3">
            <h2 className="text-xl font-bold">Dados da Ronda</h2>

            <p>
              <span className="text-slate-500">Data: </span>
              {patrulhamento.data}
            </p>

            <p>
              <span className="text-slate-500">Hora: </span>
              {patrulhamento.hora}
            </p>

            <p>
              <span className="text-slate-500">Local: </span>
              {patrulhamento.local}
            </p>

            <p>
              <span className="text-slate-500">Viatura: </span>
              {patrulhamento.viatura || "-"}
            </p>

            <p>
              <span className="text-slate-500">Guarda: </span>
              {patrulhamento.guarda}
            </p>

            <p>
              <span className="text-slate-500">Pontos GPS: </span>
              {pontos.length}
            </p>

            <p>
              <span className="text-slate-500">Status: </span>
              {patrulhamento.status}
            </p>
          </div>

          <div className="card xl:col-span-3">
            {pontos.length === 0 ? (
              <p className="text-slate-400">
                Nenhum ponto GPS registrado para este patrulhamento.
              </p>
            ) : (
              <div className="h-[70vh] rounded-2xl overflow-hidden border border-slate-800">
                <MapContainer
                  center={centro}
                  zoom={16}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <Polyline positions={posicoes} weight={5} />

                  {pontosValidos.map((p, index) => (
                    <Marker key={p.id} position={[p.latitude, p.longitude]}>
                      <Popup>
                        <strong>
                          {p.tipo === "MANUAL"
                            ? "Ponto manual"
                            : "Ponto automático"}
                        </strong>
                        <br />
                        Ordem: {index + 1}
                        <br />
                        Data/Hora:{" "}
                        {new Date(p.criado_em).toLocaleString("pt-BR")}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}