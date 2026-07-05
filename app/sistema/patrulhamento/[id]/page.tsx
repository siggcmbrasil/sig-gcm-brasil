"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

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

type UsuarioLogado = {
  id: string;
  perfil: string;
  municipio_id: number;
};

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
  municipio_id: number;
  data: string;
  hora: string;
  local: string;
  guarda: string;
  equipe: string | null;
  viatura: string | null;
  observacao: string | null;
  status: string | null;
};

function obterUsuarioLogado(): UsuarioLogado | null {
  try {
    const salvo = localStorage.getItem("usuarioLogado");

    if (!salvo) return null;

    const usuario = JSON.parse(salvo);

    if (!usuario?.id || !usuario?.perfil || !usuario?.municipio_id) {
      return null;
    }

    return {
      id: String(usuario.id),
      perfil: usuario.perfil,
      municipio_id: Number(usuario.municipio_id),
    };
  } catch {
    return null;
  }
}

export default function RotaPatrulhamentoPage() {
  const params = useParams();
  const id = Number(params.id || 0);

  const [pontos, setPontos] = useState<PontoGps[]>([]);
  const [patrulhamento, setPatrulhamento] =
    useState<Patrulhamento | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregarDados() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      setPatrulhamento(null);
      setPontos([]);
      setCarregando(false);
      return;
    }

    if (!Number.isFinite(id) || id <= 0) {
      setPatrulhamento(null);
      setPontos([]);
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const { data: patrulhamentoData, error: erroPatrulhamento } =
      await supabase
        .from("patrulhamentos")
        .select(
          "id, municipio_id, data, hora, local, guarda, equipe, viatura, observacao, status"
        )
        .eq("id", id)
        .eq("municipio_id", usuario.municipio_id)
        .single();

    if (erroPatrulhamento || !patrulhamentoData) {
      console.error(erroPatrulhamento);

      await registrarAuditoria({
        modulo: "Patrulhamento",
        acao: "ERRO",
        descricao:
          "Tentativa de acessar rota de patrulhamento inexistente ou de outro município.",
        tabela: "patrulhamentos",
        registro_id: id,
        detalhes: {
          erro: erroPatrulhamento?.message,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      setPatrulhamento(null);
      setPontos([]);
      setCarregando(false);
      return;
    }

    await registrarAuditoria({
      modulo: "Patrulhamento",
      acao: "ACESSO",
      descricao: `Acessou a rota GPS do patrulhamento ${id}.`,
      tabela: "patrulhamentos",
      registro_id: id,
      detalhes: {
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
      },
    });

    const { data: pontosData, error: erroPontos } = await supabase
      .from("gps_patrulhamento")
      .select(
        "id, patrulhamento_id, latitude, longitude, tipo, observacao, criado_em"
      )
      .eq("patrulhamento_id", id)
      .order("criado_em", { ascending: true })
      .limit(500);

    if (erroPontos) {
      console.error(erroPontos);

      await registrarAuditoria({
        modulo: "Patrulhamento",
        acao: "ERRO",
        descricao: "Erro ao carregar pontos GPS do patrulhamento.",
        tabela: "gps_patrulhamento",
        registro_id: id,
        detalhes: {
          erro: erroPontos.message,
          municipio_id: usuario.municipio_id,
        },
      });

      alert("Erro ao carregar rota GPS.");
      setCarregando(false);
      return;
    }

    setPatrulhamento(patrulhamentoData);
    setPontos(pontosData || []);
    setCarregando(false);
  }

  useEffect(() => {
    void carregarDados();
  }, [id]);

  const pontosValidos = pontos.filter(
    (p: PontoGps) =>
      typeof p.latitude === "number" &&
      typeof p.longitude === "number" &&
      !Number.isNaN(p.latitude) &&
      !Number.isNaN(p.longitude)
  );

  const posicoes = pontosValidos.map((p: PontoGps) => [
    p.latitude,
    p.longitude,
  ]) as [number, number][];

  const centro =
    posicoes.length > 0
      ? posicoes[0]
      : ([-11.621296322631357, -38.80684199142887] as [
          number,
          number
        ]);

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
              {pontosValidos.length}
            </p>

            <p>
              <span className="text-slate-500">Status: </span>
              {patrulhamento.status || "-"}
            </p>
          </div>

          <div className="card xl:col-span-3">
            {pontosValidos.length === 0 ? (
              <p className="text-slate-400">
                Nenhum ponto GPS válido registrado para este patrulhamento.
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

                  {posicoes.length > 1 && (
                    <Polyline positions={posicoes} weight={5} />
                  )}

                  {pontosValidos.map((p: PontoGps, index: number) => (
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
                        {p.observacao && (
                          <>
                            <br />
                            Observação: {p.observacao}
                          </>
                        )}
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