"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  RefreshCw,
  ShieldAlert,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

type AlertaSOS = {
  id: number;
  municipio_id: number;
  usuario_id: string | number | null;
  nome_usuario: string | null;
  latitude: string | null;
  longitude: string | null;
  precisao: string | null;
  status: string;
  observacao: string | null;
  criado_em: string;
  atendido_por: string | number | null;
  atendido_em: string | null;
};

const perfisPermitidos = [
  "DESENVOLVEDOR",
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
  "CMT_GUARNICAO",
  "PLANTONISTA",
];

export default function CentralSOSPage() {
  const [usuario, setUsuario] = useState<any>(null);
  const [latitudeAtual, setLatitudeAtual] = useState<number | null>(null);
  const [longitudeAtual, setLongitudeAtual] = useState<number | null>(null);
  const [alertas, setAlertas] = useState<AlertaSOS[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [novoAlertaId, setNovoAlertaId] = useState<number | null>(null);
  const [modalSOS, setModalSOS] = useState<AlertaSOS | null>(null);

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

    if (!perfisPermitidos.includes(dados.perfil)) {
      alert("Seu perfil não tem permissão para acessar a Central SOS.");
      window.location.href = "/sistema";
      return;
    }

    setUsuario(dados);
    carregarAlertas(dados);

    if ("Notification" in window) {
      Notification.requestPermission();
    }

    let watchId: number | null = null;

    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLatitudeAtual(pos.coords.latitude);
          setLongitudeAtual(pos.coords.longitude);
        },
        () => {},
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 20000,
        }
      );
    }

    void registrarAuditoria({
      modulo: "CENTRAL_SOS",
      acao: "ACESSAR",
      descricao: "Acessou a Central SOS.",
      registro_id: String(dados.id),
    });

    const canal = supabase
      .channel(`central-sos-${dados.municipio_id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "alertas_sos",
          filter: `municipio_id=eq.${dados.municipio_id}`,
        },
        async (payload) => {
          await carregarAlertas(dados);

          if (
            payload.eventType === "INSERT" &&
            (payload.new as AlertaSOS).status === "ABERTO"
          ) {
            const novo = payload.new as AlertaSOS;

            setNovoAlertaId(novo.id);
            setModalSOS(novo);

            try {
              const audio = new Audio("/sounds/sos.mp3");
              await audio.play();

              navigator.vibrate?.([500, 300, 500, 300, 500]);

              if (Notification.permission === "granted") {
                new Notification("🚨 Novo SOS", {
                  body: `${novo.nome_usuario || "Um guarda"} acionou um SOS.`,
                  icon: "/icons/icon-192.png",
                });
              }
            } catch {}

            setTimeout(() => {
              setNovoAlertaId(null);
            }, 30000);
          }
        }
      )
      .subscribe();

    const intervalo = setInterval(() => {
      carregarAlertas(dados);
    }, 30000);

    return () => {
      supabase.removeChannel(canal);
      clearInterval(intervalo);

      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  async function carregarAlertas(usuarioAtual: any) {
    setCarregando(true);

    const { data, error } = await supabase
      .from("alertas_sos")
      .select("*")
      .eq("municipio_id", usuarioAtual.municipio_id)
      .order("criado_em", { ascending: false })
      .limit(100);

    if (error) {
      console.error(error);
      setCarregando(false);
      return;
    }

    const ordenados = [...(data || [])].sort((a, b) => {
      const prioridade: any = {
        ABERTO: 1,
        EM_ATENDIMENTO: 2,
        FINALIZADO: 3,
      };

      const pa = prioridade[a.status] || 99;
      const pb = prioridade[b.status] || 99;

      if (pa !== pb) return pa - pb;

      return (
        new Date(b.criado_em).getTime() -
        new Date(a.criado_em).getTime()
      );
    });

    setAlertas(ordenados);
    setCarregando(false);
  }

  async function atenderAlerta(alerta: AlertaSOS) {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Usuário inválido ou sem município.");
      return;
    }

    const { error } = await supabase
      .from("alertas_sos")
      .update({
        status: "EM_ATENDIMENTO",
        atendido_por: usuario.id,
        atendido_em: new Date().toISOString(),
      })
      .eq("id", alerta.id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      alert("Erro ao atender SOS.");
      return;
    }

    await registrarAuditoria({
      modulo: "CENTRAL_SOS",
      acao: "ATENDER",
      descricao: `Atendeu o SOS de ${alerta.nome_usuario || "usuário"}.`,
      registro_id: String(alerta.id),
    });

    setModalSOS(null);
    await carregarAlertas(usuario);
  }

  async function finalizarAlerta(alerta: AlertaSOS) {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Usuário inválido ou sem município.");
      return;
    }

    const observacao = prompt("Informe uma observação final para este SOS:");

    const { error } = await supabase
      .from("alertas_sos")
      .update({
        status: "FINALIZADO",
        observacao: observacao || "",
      })
      .eq("id", alerta.id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      alert("Erro ao finalizar SOS.");
      return;
    }

    await registrarAuditoria({
      modulo: "CENTRAL_SOS",
      acao: "FINALIZAR",
      descricao: `Finalizou o SOS de ${alerta.nome_usuario || "usuário"}.`,
      registro_id: String(alerta.id),
    });

    setModalSOS(null);
    await carregarAlertas(usuario);
  }

  function abrirMapa(alerta: AlertaSOS) {
    if (!alerta.latitude || !alerta.longitude) {
      alert("Este SOS não possui localização.");
      return;
    }

    void registrarAuditoria({
      modulo: "CENTRAL_SOS",
      acao: "ABRIR_MAPA",
      descricao: `Abriu rota do SOS ${alerta.id}.`,
      registro_id: String(alerta.id),
    });

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${alerta.latitude},${alerta.longitude}`,
      "_blank"
    );
  }

  async function testarSomSOS() {
    try {
      const audio = new Audio("/sounds/sos.mp3");
      await audio.play();
      navigator.vibrate?.([300, 200, 300]);
    } catch {
      alert("Verifique se existe public/sounds/sos.mp3");
    }
  }

  function calcularDistancia(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  function textoDistancia(alerta: AlertaSOS) {
    if (!latitudeAtual || !longitudeAtual || !alerta.latitude || !alerta.longitude) {
      return null;
    }

    const distancia = calcularDistancia(
      latitudeAtual,
      longitudeAtual,
      Number(alerta.latitude),
      Number(alerta.longitude)
    );

    if (distancia < 0.05) return "Muito próximo";
    if (distancia < 1) return `${Math.round(distancia * 1000)} m`;

    return `${distancia.toFixed(2)} km`;
  }

  function corStatus(status: string) {
    if (status === "ABERTO") {
      return "text-red-400 bg-red-500/10 border-red-500/30";
    }

    if (status === "EM_ATENDIMENTO") {
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    }

    return "text-green-400 bg-green-500/10 border-green-500/30";
  }

  return (
    <main className="min-h-screen bg-[#02060f] text-white p-4 md:p-6 pb-24">
      {modalSOS && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border border-red-500 bg-red-950 p-6 shadow-2xl animate-pulse">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-white">
                  🚨 SOS RECEBIDO
                </h2>

                <p className="mt-2 text-red-100">
                  Guarda:{" "}
                  <strong>{modalSOS.nome_usuario || "Não informado"}</strong>
                </p>

                <p className="mt-2 text-sm text-red-200">
                  {new Date(modalSOS.criado_em).toLocaleString("pt-BR")}
                </p>

                {textoDistancia(modalSOS) && (
                  <p className="mt-2 text-sm font-bold text-cyan-300">
                    Distância: {textoDistancia(modalSOS)}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setModalSOS(null)}
                className="rounded-xl bg-black/30 p-2"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => abrirMapa(modalSOS)}
                className="rounded-2xl bg-blue-700 px-4 py-4 font-black"
              >
                🧭 Traçar rota
              </button>

              <button
                type="button"
                onClick={() => atenderAlerta(modalSOS)}
                className="rounded-2xl bg-yellow-600 px-4 py-4 font-black"
              >
                👮 Atender SOS
              </button>

              <button
                type="button"
                onClick={() => finalizarAlerta(modalSOS)}
                className="rounded-2xl bg-green-700 px-4 py-4 font-black"
              >
                ✅ Finalizar SOS
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="mb-6 rounded-3xl border border-red-500/20 bg-slate-950 p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/20">
            <ShieldAlert className="h-8 w-8 text-red-400" />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-black">Central SOS</h1>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => usuario && carregarAlertas(usuario)}
                className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold hover:bg-blue-800 inline-flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar agora
              </button>

              <button
                type="button"
                onClick={testarSomSOS}
                className="rounded-xl bg-red-700 px-4 py-2 text-sm font-bold hover:bg-red-800"
              >
                Testar som SOS
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Resumo
          titulo="Abertos"
          valor={alertas.filter((a) => a.status === "ABERTO").length}
          classe="text-red-400"
        />
        <Resumo
          titulo="Em atendimento"
          valor={alertas.filter((a) => a.status === "EM_ATENDIMENTO").length}
          classe="text-yellow-400"
        />
        <Resumo
          titulo="Finalizados"
          valor={alertas.filter((a) => a.status === "FINALIZADO").length}
          classe="text-green-400"
        />
      </section>

      {carregando ? (
        <p className="text-slate-400">Carregando alertas SOS...</p>
      ) : alertas.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 h-14 w-14 text-slate-500" />
          <h2 className="text-xl font-black">Nenhum SOS registrado</h2>
          <p className="mt-2 text-slate-400">
            Quando um guarda acionar o botão SOS, aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alertas.map((alerta) => (
            <div
              key={alerta.id}
              className={`rounded-3xl border p-5 shadow-xl ${
                novoAlertaId === alerta.id
                  ? "border-red-500 bg-red-950/40 animate-pulse"
                  : alerta.status === "ABERTO"
                  ? "border-red-900 bg-slate-900"
                  : "border-slate-800 bg-slate-900"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${corStatus(
                      alerta.status
                    )}`}
                  >
                    {alerta.status}
                  </span>

                  <h2 className="mt-3 text-xl font-black">🚨 SOS #{alerta.id}</h2>

                  <p className="mt-1 text-slate-300">
                    Guarda:{" "}
                    <strong>{alerta.nome_usuario || "Não informado"}</strong>
                  </p>

                  <p className="mt-1 text-sm text-slate-400 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(alerta.criado_em).toLocaleString("pt-BR")}
                  </p>

                  <p className="text-xs text-slate-500">
                    Há{" "}
                    {Math.max(
                      0,
                      Math.floor(
                        (Date.now() -
                          new Date(alerta.criado_em).getTime()) /
                          60000
                      )
                    )}{" "}
                    minutos
                  </p>

                  {textoDistancia(alerta) && (
                    <p className="mt-1 text-xs text-cyan-400">
                      Distância aproximada: {textoDistancia(alerta)}
                    </p>
                  )}

                  {alerta.precisao && (
                    <p className="mt-1 text-xs text-slate-500">
                      Precisão GPS: {alerta.precisao} metros
                    </p>
                  )}

                  {alerta.atendido_por && (
                    <p className="mt-2 text-xs text-yellow-400">
                      👮 Atendimento iniciado
                    </p>
                  )}

                  {alerta.observacao && (
                    <p className="mt-3 rounded-xl bg-slate-950 p-3 text-sm text-slate-300">
                      {alerta.observacao}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 min-w-[180px]">
                  <button
                    type="button"
                    onClick={() => abrirMapa(alerta)}
                    className="rounded-xl bg-blue-700 px-4 py-3 font-bold hover:bg-blue-800 inline-flex items-center justify-center gap-2"
                  >
                    <MapPin className="h-5 w-5" />
                    Ver rota
                  </button>

                  {alerta.status === "ABERTO" && (
                    <button
                      type="button"
                      onClick={() => atenderAlerta(alerta)}
                      className="rounded-xl bg-yellow-600 px-4 py-3 font-bold hover:bg-yellow-700 inline-flex items-center justify-center gap-2"
                    >
                      <Clock className="h-5 w-5" />
                      Atender
                    </button>
                  )}

                  {alerta.status !== "FINALIZADO" && (
                    <button
                      type="button"
                      onClick={() => finalizarAlerta(alerta)}
                      className="rounded-xl bg-green-700 px-4 py-3 font-bold hover:bg-green-800 inline-flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-5 w-5" />
                      Finalizar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function Resumo({
  titulo,
  valor,
  classe,
}: {
  titulo: string;
  valor: number;
  classe: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs uppercase text-slate-400">{titulo}</p>
      <h2 className={`mt-2 text-3xl font-black ${classe}`}>{valor}</h2>
    </div>
  );
}