"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  RefreshCw,
  ShieldAlert,
  X,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import { supabase } from "@/lib/supabase";
import { montarUrlComMunicipioContexto } from "@/lib/contextoMunicipio";

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

type UsuarioCentral = {
  id: number;
  nome: string | null;
  perfil: string;
  municipio_id: number | null;
};

type RespostaListaSOS = {
  ok?: boolean;
  erro?: string;
  alertas?: AlertaSOS[];
  usuario?: UsuarioCentral;
};

type RespostaAcaoSOS = {
  ok?: boolean;
  erro?: string;
  mensagem?: string;
  alerta?: AlertaSOS;
  alterado?: boolean;
};

async function obterAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error(
      "Sua sessão expirou. Entre novamente no sistema."
    );
  }

  return session.access_token;
}


function obterUrlSOS() {
  try {
    const salvo =
      localStorage.getItem("usuarioLogado");

    const usuario =
      salvo
        ? (JSON.parse(salvo) as {
            perfil?: string;
            municipio_id?: number;
          })
        : null;

    return montarUrlComMunicipioContexto({
      url: "/api/sos",
      perfil: usuario?.perfil,
      municipioIdUsuario:
        usuario?.municipio_id,
    });
  } catch {
    return "/api/sos";
  }
}

async function lerResposta<T>(resposta: Response): Promise<T> {
  const texto = await resposta.text();

  if (!texto) {
    return {} as T;
  }

  try {
    return JSON.parse(texto) as T;
  } catch {
    throw new Error(
      "O servidor retornou uma resposta inválida."
    );
  }
}

export default function CentralSOSPage() {
  const [usuario, setUsuario] = useState<UsuarioCentral | null>(null);
  const [latitudeAtual, setLatitudeAtual] = useState<number | null>(null);
  const [longitudeAtual, setLongitudeAtual] = useState<number | null>(null);
  const [alertas, setAlertas] = useState<AlertaSOS[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroTela, setErroTela] = useState("");
  const [novoAlertaId, setNovoAlertaId] = useState<number | null>(null);
  const [modalSOS, setModalSOS] = useState<AlertaSOS | null>(null);
  const [atualizandoId, setAtualizandoId] = useState<number | null>(null);

  const primeiraCargaConcluida = useRef(false);
  const alertasConhecidos = useRef<Set<number>>(new Set());

  const tocarAlerta = useCallback(async (alerta: AlertaSOS) => {
    setNovoAlertaId(alerta.id);
    setModalSOS(alerta);

    try {
      const audio = new Audio("/sounds/sos.mp3");
      await audio.play();
    } catch {
      // Alguns navegadores bloqueiam áudio sem interação prévia.
    }

    navigator.vibrate?.([500, 300, 500, 300, 500]);

    if (
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification("🚨 Novo SOS", {
        body: `${alerta.nome_usuario || "Um guarda"} acionou um SOS.`,
        icon: "/icons/icon-192.png",
      });
    }

    window.setTimeout(() => {
      setNovoAlertaId((atual) =>
        atual === alerta.id ? null : atual
      );
    }, 30000);
  }, []);

  const carregarAlertas = useCallback(
    async (silencioso = false) => {
      if (!silencioso) {
        setCarregando(true);
      }

      setErroTela("");

      try {
        const accessToken = await obterAccessToken();

        const resposta = await fetch(obterUrlSOS(), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });

        const corpo = await lerResposta<RespostaListaSOS>(resposta);

        if (resposta.status === 401) {
          localStorage.removeItem("usuarioLogado");
          window.location.replace("/login");
          return;
        }

        if (!resposta.ok || !corpo.ok) {
          throw new Error(
            corpo.erro || "Não foi possível carregar os alertas SOS."
          );
        }

        const lista = corpo.alertas || [];

        setUsuario(corpo.usuario || null);
        setAlertas(lista);

        const idsAbertos = new Set(
          lista
            .filter(
              (alerta) =>
                String(alerta.status).toUpperCase() === "ABERTO"
            )
            .map((alerta) => alerta.id)
        );

        if (primeiraCargaConcluida.current) {
          const novoAlerta = lista.find(
            (alerta) =>
              idsAbertos.has(alerta.id) &&
              !alertasConhecidos.current.has(alerta.id)
          );

          if (novoAlerta) {
            await tocarAlerta(novoAlerta);
          }
        } else {
          primeiraCargaConcluida.current = true;
        }

        alertasConhecidos.current = new Set(
          lista.map((alerta) => alerta.id)
        );
      } catch (error) {
        const mensagem =
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao carregar a Central SOS.";

        console.error("Erro ao carregar Central SOS:", mensagem);
        setErroTela(mensagem);
      } finally {
        if (!silencioso) {
          setCarregando(false);
        }
      }
    },
    [tocarAlerta]
  );

  useEffect(() => {
    void carregarAlertas(false);

    if ("Notification" in window) {
      void Notification.requestPermission();
    }

    void registrarAuditoria({
      modulo: "CENTRAL_SOS",
      acao: "ACESSAR",
      descricao: "Acessou a Central SOS.",
    });

    let watchId: number | null = null;

    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (posicao) => {
          setLatitudeAtual(posicao.coords.latitude);
          setLongitudeAtual(posicao.coords.longitude);
        },
        () => {},
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 20000,
        }
      );
    }

    const intervalo = window.setInterval(() => {
      void carregarAlertas(true);
    }, 10000);

    return () => {
      window.clearInterval(intervalo);

      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [carregarAlertas]);

  async function executarAcao(
    alerta: AlertaSOS,
    acao: "ATENDER" | "FINALIZAR",
    observacao = ""
  ) {
    setAtualizandoId(alerta.id);

    try {
      const accessToken = await obterAccessToken();

      const resposta = await fetch(obterUrlSOS(), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: alerta.id,
          acao,
          observacao,
        }),
      });

      const corpo = await lerResposta<RespostaAcaoSOS>(resposta);

      if (resposta.status === 401) {
        localStorage.removeItem("usuarioLogado");
        window.location.replace("/login");
        return;
      }

      if (!resposta.ok || !corpo.ok) {
        throw new Error(
          corpo.erro || "Não foi possível atualizar o SOS."
        );
      }

      setModalSOS(null);
      await carregarAlertas(true);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao atualizar o SOS.";

      console.error("Erro ao atualizar SOS:", mensagem);
      alert(mensagem);
    } finally {
      setAtualizandoId(null);
    }
  }

  async function atenderAlerta(alerta: AlertaSOS) {
    await executarAcao(alerta, "ATENDER");
  }

  async function finalizarAlerta(alerta: AlertaSOS) {
    const observacao = prompt(
      "Informe uma observação final para este SOS:"
    );

    if (observacao === null) {
      return;
    }

    await executarAcao(alerta, "FINALIZAR", observacao);
  }

  function abrirMapa(alerta: AlertaSOS) {
    if (!alerta.latitude || !alerta.longitude) {
      alert("Este SOS não possui localização.");
      return;
    }

    void registrarAuditoria({
      modulo: "CENTRAL_SOS",
      acao: "ABRIR_MAPA",
      descricao: `Abriu a rota do SOS ${alerta.id}.`,
      registro_id: String(alerta.id),
    });

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${alerta.latitude},${alerta.longitude}`,
      "_blank",
      "noopener,noreferrer"
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
    const raioTerraKm = 6371;
    const diferencaLatitude = ((lat2 - lat1) * Math.PI) / 180;
    const diferencaLongitude = ((lon2 - lon1) * Math.PI) / 180;

    const calculo =
      Math.sin(diferencaLatitude / 2) *
        Math.sin(diferencaLatitude / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(diferencaLongitude / 2) *
        Math.sin(diferencaLongitude / 2);

    return (
      raioTerraKm *
      (2 * Math.atan2(Math.sqrt(calculo), Math.sqrt(1 - calculo)))
    );
  }

  function textoDistancia(alerta: AlertaSOS) {
    if (
      latitudeAtual === null ||
      longitudeAtual === null ||
      !alerta.latitude ||
      !alerta.longitude
    ) {
      return null;
    }

    const distancia = calcularDistancia(
      latitudeAtual,
      longitudeAtual,
      Number(alerta.latitude),
      Number(alerta.longitude)
    );

    if (distancia < 0.05) {
      return "Muito próximo";
    }

    if (distancia < 1) {
      return `${Math.round(distancia * 1000)} m`;
    }

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
    <ProtecaoModulo modulo="sos_central">
      <main className="min-h-screen bg-[#02060f] p-4 pb-24 text-white md:p-6">
        {modalSOS && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-lg animate-pulse rounded-3xl border border-red-500 bg-red-950 p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-white">
                    🚨 SOS RECEBIDO
                  </h2>

                  <p className="mt-2 text-red-100">
                    Guarda:{" "}
                    <strong>
                      {modalSOS.nome_usuario || "Não informado"}
                    </strong>
                  </p>

                  <p className="mt-2 text-sm text-red-200">
                    {new Date(modalSOS.criado_em).toLocaleString(
                      "pt-BR"
                    )}
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
                  aria-label="Fechar alerta SOS"
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

                {modalSOS.status === "ABERTO" && (
                  <button
                    type="button"
                    disabled={atualizandoId === modalSOS.id}
                    onClick={() => void atenderAlerta(modalSOS)}
                    className="rounded-2xl bg-yellow-600 px-4 py-4 font-black disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    👮 Atender SOS
                  </button>
                )}

                {modalSOS.status !== "FINALIZADO" && (
                  <button
                    type="button"
                    disabled={atualizandoId === modalSOS.id}
                    onClick={() => void finalizarAlerta(modalSOS)}
                    className="rounded-2xl bg-green-700 px-4 py-4 font-black disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    ✅ Finalizar SOS
                  </button>
                )}
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
              <h1 className="text-2xl font-black md:text-3xl">
                Central SOS
              </h1>

              {usuario && (
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                  {usuario.nome || "Usuário"} · {usuario.perfil}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void carregarAlertas(false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold hover:bg-blue-800"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar agora
                </button>

                <button
                  type="button"
                  onClick={() => void testarSomSOS()}
                  className="rounded-xl bg-red-700 px-4 py-2 text-sm font-bold hover:bg-red-800"
                >
                  Testar som SOS
                </button>
              </div>
            </div>
          </div>
        </header>

        {erroTela && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-red-200">
            {erroTela}
          </div>
        )}

        <section className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Resumo
            titulo="Abertos"
            valor={
              alertas.filter((alerta) => alerta.status === "ABERTO")
                .length
            }
            classe="text-red-400"
          />
          <Resumo
            titulo="Em atendimento"
            valor={
              alertas.filter(
                (alerta) => alerta.status === "EM_ATENDIMENTO"
              ).length
            }
            classe="text-yellow-400"
          />
          <Resumo
            titulo="Finalizados"
            valor={
              alertas.filter(
                (alerta) => alerta.status === "FINALIZADO"
              ).length
            }
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
                    ? "animate-pulse border-red-500 bg-red-950/40"
                    : alerta.status === "ABERTO"
                      ? "border-red-900 bg-slate-900"
                      : "border-slate-800 bg-slate-900"
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${corStatus(
                        alerta.status
                      )}`}
                    >
                      {alerta.status}
                    </span>

                    <h2 className="mt-3 text-xl font-black">
                      🚨 SOS #{alerta.id}
                    </h2>

                    <p className="mt-1 text-slate-300">
                      Guarda:{" "}
                      <strong>
                        {alerta.nome_usuario || "Não informado"}
                      </strong>
                    </p>

                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-400">
                      <Clock className="h-4 w-4" />
                      {new Date(alerta.criado_em).toLocaleString(
                        "pt-BR"
                      )}
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

                  <div className="flex min-w-[180px] flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => abrirMapa(alerta)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-bold hover:bg-blue-800"
                    >
                      <MapPin className="h-5 w-5" />
                      Ver rota
                    </button>

                    {alerta.status === "ABERTO" && (
                      <button
                        type="button"
                        disabled={atualizandoId === alerta.id}
                        onClick={() => void atenderAlerta(alerta)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-600 px-4 py-3 font-bold hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Clock className="h-5 w-5" />
                        Atender
                      </button>
                    )}

                    {alerta.status !== "FINALIZADO" && (
                      <button
                        type="button"
                        disabled={atualizandoId === alerta.id}
                        onClick={() => void finalizarAlerta(alerta)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 font-bold hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
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
    </ProtecaoModulo>
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