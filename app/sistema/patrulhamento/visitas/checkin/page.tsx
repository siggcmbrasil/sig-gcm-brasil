"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Crosshair,
  ImageIcon,
  Loader2,
  MapPin,
  MapPinCheck,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { supabase } from "@/lib/supabase";

type Contexto = {
  usuario_id: number;
  usuario_nome: string | null;
  perfil: string;
  municipio_id: number;
};

type Permissoes = {
  pode_ver: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
};

type PontoVisita = {
  id: number;
  municipio_id: number;
  plano_id: number | null;
  latitude: number | string | null;
  longitude: number | string | null;
  nome_local: string | null;
  ordem: number | null;
  obrigatorio: boolean | null;
};

type CheckinHoje = {
  id: number;
  criado_em: string;
};

type RespostaCheckin = {
  ok?: boolean;
  erro?: string;
  mensagem?: string;
  contexto?: Contexto;
  permissoes?: Permissoes;
  ponto?: PontoVisita;
  raio_permitido_metros?: number;
  precisao_maxima_metros?: number;
  checkin_realizado_hoje?: boolean;
  ultimo_checkin_hoje?: CheckinHoje | null;
  distancia_metros?: number;
  checkin?: {
    id: number;
    criado_em: string;
    ponto_id: number;
    ponto_nome: string | null;
    distancia_metros: number;
    foto_url: string | null;
  };
};

type Coordenadas = {
  latitude: number;
  longitude: number;
  precisao: number;
};

const TAMANHO_MAXIMO_FOTO =
  5 * 1024 * 1024;

const TIPOS_FOTO_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function formatarDataHora(
  valor?: string | null
) {
  if (!valor) {
    return "Não informado";
  }

  const data = new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return valor;
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "medium",
    }
  ).format(data);
}

function obterLocalizacao(): Promise<Coordenadas> {
  return new Promise(
    (resolve, reject) => {
      if (
        !navigator.geolocation
      ) {
        reject(
          new Error(
            "GPS não disponível neste dispositivo."
          )
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const precisao =
            Number(
              position.coords
                .accuracy
            );

          if (
            !Number.isFinite(
              precisao
            ) ||
            precisao <= 0
          ) {
            reject(
              new Error(
                "O GPS não retornou uma precisão válida."
              )
            );
            return;
          }

          resolve({
            latitude:
              position.coords
                .latitude,
            longitude:
              position.coords
                .longitude,
            precisao,
          });
        },
        (error) => {
          const mensagem =
            error.code ===
            error.PERMISSION_DENIED
              ? "A permissão de localização foi negada."
              : error.code ===
                  error.TIMEOUT
                ? "O GPS demorou demais para responder."
                : "Não foi possível obter a localização.";

          reject(
            new Error(
              mensagem
            )
          );
        },
        {
          enableHighAccuracy:
            true,
          timeout: 20000,
          maximumAge: 0,
        }
      );
    }
  );
}

export default function CheckinVisitaPage() {
  const router = useRouter();

  const [pontoId, setPontoId] =
    useState<number | null>(
      null
    );

  const [contexto, setContexto] =
    useState<Contexto | null>(
      null
    );

  const [permissoes, setPermissoes] =
    useState<Permissoes | null>(
      null
    );

  const [ponto, setPonto] =
    useState<PontoVisita | null>(
      null
    );

  const [
    raioPermitido,
    setRaioPermitido,
  ] = useState(200);

  const [
    precisaoMaxima,
    setPrecisaoMaxima,
  ] = useState(200);

  const [
    checkinHoje,
    setCheckinHoje,
  ] = useState(false);

  const [
    ultimoCheckin,
    setUltimoCheckin,
  ] = useState<CheckinHoje | null>(
    null
  );

  const [
    observacao,
    setObservacao,
  ] = useState("");

  const [foto, setFoto] =
    useState<File | null>(
      null
    );

  const [
    previewFoto,
    setPreviewFoto,
  ] = useState("");

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    atualizando,
    setAtualizando,
  ] = useState(false);

  const [
    enviando,
    setEnviando,
  ] = useState(false);

  const [status, setStatus] =
    useState("");

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    const parametro =
      new URLSearchParams(
        window.location.search
      ).get("ponto");

    const id = Number(
      parametro || 0
    );

    if (
      !Number.isSafeInteger(id) ||
      id <= 0
    ) {
      setErro(
        "Identificador do ponto de visita inválido."
      );
      setCarregando(false);
      return;
    }

    setPontoId(id);
    void carregarPonto(
      id,
      false
    );
  }, []);

  useEffect(() => {
    if (!foto) {
      setPreviewFoto("");
      return;
    }

    const url =
      URL.createObjectURL(
        foto
      );

    setPreviewFoto(url);

    return () =>
      URL.revokeObjectURL(url);
  }, [foto]);

  const nomePonto =
    useMemo(
      () =>
        ponto?.nome_local ||
        (ponto
          ? `Ponto ${ponto.id}`
          : "Ponto de visita"),
      [ponto]
    );

  async function obterAccessToken() {
    const {
      data: { session },
      error,
    } =
      await supabase.auth.getSession();

    if (
      error ||
      !session?.access_token
    ) {
      throw new Error(
        "Sua sessão expirou. Entre novamente no sistema."
      );
    }

    return session.access_token;
  }

  async function chamarApiGet(
    id: number
  ) {
    const accessToken =
      await obterAccessToken();

    const resposta = await fetch(
      `/api/patrulhamento/visitas/checkin?ponto=${encodeURIComponent(
        String(id)
      )}`,
      {
        method: "GET",
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const dados = (await resposta
      .json()
      .catch(
        () => null
      )) as RespostaCheckin | null;

    if (
      resposta.status === 401
    ) {
      localStorage.removeItem(
        "usuarioLogado"
      );

      router.replace(
        "/login"
      );

      throw new Error(
        "Sessão expirada."
      );
    }

    if (
      !resposta.ok ||
      !dados?.ok
    ) {
      throw new Error(
        dados?.erro ||
          "Não foi possível carregar o ponto de visita."
      );
    }

    return dados;
  }

  async function chamarApiPost(
    formData: FormData
  ) {
    const accessToken =
      await obterAccessToken();

    const resposta = await fetch(
      "/api/patrulhamento/visitas/checkin",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
        cache: "no-store",
        body: formData,
      }
    );

    const dados = (await resposta
      .json()
      .catch(
        () => null
      )) as RespostaCheckin | null;

    if (
      resposta.status === 401
    ) {
      localStorage.removeItem(
        "usuarioLogado"
      );

      router.replace(
        "/login"
      );

      throw new Error(
        "Sessão expirada."
      );
    }

    if (
      !resposta.ok ||
      !dados?.ok
    ) {
      throw new Error(
        dados?.erro ||
          "Não foi possível registrar o check-in."
      );
    }

    return dados;
  }

  async function carregarPonto(
    id: number,
    somenteAtualizar: boolean
  ) {
    if (somenteAtualizar) {
      setAtualizando(true);
    } else {
      setCarregando(true);
      setErro("");
    }

    try {
      const dados =
        await chamarApiGet(id);

      setContexto(
        dados.contexto ||
          null
      );

      setPermissoes(
        dados.permissoes ||
          null
      );

      setPonto(
        dados.ponto ||
          null
      );

      setRaioPermitido(
        Number(
          dados.raio_permitido_metros ||
            200
        )
      );

      setPrecisaoMaxima(
        Number(
          dados.precisao_maxima_metros ||
            200
        )
      );

      setCheckinHoje(
        Boolean(
          dados.checkin_realizado_hoje
        )
      );

      setUltimoCheckin(
        dados.ultimo_checkin_hoje ||
          null
      );
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao carregar o ponto.";

      console.error(
        "Erro ao carregar check-in de visita:",
        {
          mensagem,
          error,
        }
      );

      if (!somenteAtualizar) {
        setErro(mensagem);
        setPonto(null);
      }
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  function selecionarFoto(
    arquivo: File | null
  ) {
    if (!arquivo) {
      setFoto(null);
      return;
    }

    if (
      !TIPOS_FOTO_PERMITIDOS.includes(
        arquivo.type
      )
    ) {
      alert(
        "Use uma imagem JPG, PNG ou WEBP."
      );
      return;
    }

    if (
      arquivo.size >
      TAMANHO_MAXIMO_FOTO
    ) {
      alert(
        "A foto deve ter no máximo 5 MB."
      );
      return;
    }

    setFoto(arquivo);
  }

  async function fazerCheckin() {
    if (
      enviando ||
      !pontoId
    ) {
      return;
    }

    if (
      !permissoes?.pode_criar
    ) {
      alert(
        "Você não possui permissão para registrar check-ins de visita."
      );
      return;
    }

    if (checkinHoje) {
      alert(
        "Você já realizou check-in neste ponto hoje."
      );
      return;
    }

    setEnviando(true);
    setErro("");

    try {
      setStatus(
        "Obtendo localização GPS..."
      );

      const coordenadas =
        await obterLocalizacao();

      setStatus(
        "Validando distância e registrando check-in..."
      );

      const formData =
        new FormData();

      formData.append(
        "ponto_id",
        String(pontoId)
      );

      formData.append(
        "latitude",
        String(
          coordenadas.latitude
        )
      );

      formData.append(
        "longitude",
        String(
          coordenadas.longitude
        )
      );

      formData.append(
        "precisao",
        String(
          coordenadas.precisao
        )
      );

      formData.append(
        "observacao",
        observacao.trim() ||
          "Check-in via QR Code"
      );

      if (foto) {
        formData.append(
          "foto",
          foto
        );
      }

      const dados =
        await chamarApiPost(
          formData
        );

      setStatus(
        dados.mensagem ||
          "Check-in registrado com sucesso."
      );

      setCheckinHoje(true);

      setUltimoCheckin(
        dados.checkin
          ? {
              id:
                dados.checkin.id,
              criado_em:
                dados.checkin
                  .criado_em,
            }
          : null
      );

      setObservacao("");
      setFoto(null);

      alert(
        dados.mensagem ||
          "Check-in registrado com sucesso."
      );
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao registrar check-in.";

      console.error(
        "Erro ao registrar check-in de visita:",
        {
          mensagem,
          error,
        }
      );

      setStatus(mensagem);
      alert(mensagem);
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <ProtecaoModulo modulo="patrulhamento">
        <div className="grid min-h-[70vh] place-items-center bg-slate-950 p-6 text-white">
          <div className="flex items-center gap-3 text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            Carregando ponto de visita...
          </div>
        </div>
      </ProtecaoModulo>
    );
  }

  return (
    <ProtecaoModulo modulo="patrulhamento">
      <main className="min-h-screen bg-slate-950 pb-24 text-white">
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.15),transparent_42%),linear-gradient(180deg,#07111f_0%,#020617_100%)]">
          <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
            <Link
              href="/sistema/patrulhamento/visitas"
              className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Visitas
            </Link>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10">
                  <MapPinCheck className="h-7 w-7 text-emerald-300" />
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
                      Confirmação de presença
                    </span>

                    {contexto?.usuario_nome && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                        {contexto.usuario_nome}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl font-black tracking-tight md:text-4xl">
                    Check-in de visita
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-slate-400 md:text-base">
                    O servidor validará o ponto, a distância, a precisão do GPS e a duplicidade.
                  </p>
                </div>
              </div>

              {pontoId && (
                <button
                  type="button"
                  onClick={() =>
                    void carregarPonto(
                      pontoId,
                      true
                    )
                  }
                  disabled={atualizando}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 disabled:opacity-50"
                >
                  {atualizando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Atualizar
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-4xl space-y-5 px-4 py-5 md:px-6">
          {erro && (
            <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5">
              <h2 className="font-bold text-red-100">
                Não foi possível abrir o check-in
              </h2>

              <p className="mt-2 text-sm text-red-100/75">
                {erro}
              </p>
            </section>
          )}

          {ponto && (
            <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                    Ponto #{ponto.id}
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    {nomePonto}
                  </h2>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-400">
                      Raio: {raioPermitido} m
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-400">
                      Precisão máxima: {precisaoMaxima} m
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-400">
                      {ponto.obrigatorio
                        ? "Visita obrigatória"
                        : "Visita opcional"}
                    </span>
                  </div>
                </div>

                <div
                  className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                    checkinHoje
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                      : "border-cyan-500/30 bg-cyan-500/10 text-cyan-200"
                  }`}
                >
                  {checkinHoje
                    ? "Check-in realizado hoje"
                    : "Aguardando check-in"}
                </div>
              </div>

              {ultimoCheckin && (
                <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-100">
                  Último check-in de hoje:{" "}
                  <strong>
                    {formatarDataHora(
                      ultimoCheckin.criado_em
                    )}
                  </strong>
                </div>
              )}
            </section>
          )}

          <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />

              <div>
                <h2 className="font-bold text-cyan-100">
                  Validação operacional
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-400">
                  O check-in só será aceito dentro de {raioPermitido} metros do ponto e com precisão GPS de até {precisaoMaxima} metros.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
            <div className="space-y-5">
              <div>
                <label className="text-sm font-bold text-slate-300">
                  Observação
                </label>

                <textarea
                  value={observacao}
                  maxLength={1000}
                  onChange={(event) =>
                    setObservacao(
                      event.target.value
                    )
                  }
                  placeholder="Ex.: local verificado, sem alterações."
                  className="mt-2 min-h-[130px] w-full resize-y rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                />

                <p className="mt-2 text-right text-xs text-slate-600">
                  {observacao.length}/1000
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-300">
                  <Camera className="h-4 w-4" />
                  Foto opcional do local
                </label>

                <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950/50 p-6 text-center transition hover:border-cyan-400/40 hover:bg-cyan-400/5">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    className="sr-only"
                    onChange={(event) =>
                      selecionarFoto(
                        event.target
                          .files?.[0] ||
                          null
                      )
                    }
                  />

                  <ImageIcon className="h-8 w-8 text-slate-600" />

                  <span className="mt-3 font-bold text-slate-300">
                    Tirar ou selecionar foto
                  </span>

                  <span className="mt-1 text-xs text-slate-600">
                    JPG, PNG ou WEBP — máximo 5 MB
                  </span>
                </label>

                {foto && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
                    {previewFoto && (
                      <img
                        src={previewFoto}
                        alt="Pré-visualização da foto"
                        className="max-h-72 w-full object-cover"
                      />
                    )}

                    <div className="flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-300">
                          {foto.name}
                        </p>

                        <p className="text-xs text-slate-600">
                          {(foto.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setFoto(null)
                        }
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200 transition hover:bg-red-500/15"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remover
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {status && (
            <section
              className={`rounded-3xl border p-5 font-bold ${
                checkinHoje
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-100"
              }`}
            >
              {status}
            </section>
          )}

          <button
            type="button"
            onClick={() =>
              void fazerCheckin()
            }
            disabled={
              enviando ||
              !ponto ||
              checkinHoje ||
              !permissoes?.pode_criar
            }
            className="inline-flex w-full items-center justify-center gap-3 rounded-3xl bg-emerald-500 px-6 py-5 text-lg font-black text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                Registrando check-in...
              </>
            ) : checkinHoje ? (
              <>
                <CheckCircle2 className="h-6 w-6" />
                Check-in já realizado hoje
              </>
            ) : (
              <>
                <Crosshair className="h-6 w-6" />
                Capturar GPS e fazer check-in
              </>
            )}
          </button>

          <section className="rounded-3xl border border-white/10 bg-slate-900/50 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />

              <p className="text-sm leading-6 text-slate-500">
                A página envia apenas as coordenadas capturadas pelo dispositivo. A validação do usuário, município, ponto, distância, precisão, duplicidade, foto e auditoria acontece no servidor.
              </p>
            </div>
          </section>
        </div>
      </main>
    </ProtecaoModulo>
  );
}