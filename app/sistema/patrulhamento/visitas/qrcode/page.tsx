"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";

import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Crosshair,
  Loader2,
  MapPin,
  Printer,
  QrCode,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
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

type LocalCadastrado = {
  id: number;
  nome: string;
  tipo: string | null;
  endereco: string | null;
  referencia: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  raio_metros: number | string | null;
};

type Municipio = {
  id: number;
  nome: string;
  brasao_guarda: string;
  brasao_municipio: string;
};

type PontoVisita = {
  id: number;
  municipio_id: number;
  nome_local: string;
  latitude: number | string;
  longitude: number | string;
  ordem: number | null;
  obrigatorio: boolean | null;
  plano_id: number | null;
};

type RespostaQrCode = {
  ok?: boolean;
  erro?: string;
  mensagem?: string;
  contexto?: Contexto;
  permissoes?: Permissoes;
  locais?: LocalCadastrado[];
  municipio?: Municipio;
  ponto?: PontoVisita | null;
  url_checkin?: string;
};

function texto(valor: unknown) {
  return String(valor ?? "").trim();
}

function normalizar(valor: unknown) {
  return texto(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function numeroValido(valor: unknown) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : null;
}

function escaparHtml(valor: unknown) {
  return texto(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function validarUrlImagem(valor: unknown) {
  const url = texto(valor);

  if (!url) {
    return "";
  }

  try {
    const analisada = new URL(
      url,
      window.location.origin
    );

    if (
      analisada.protocol !== "http:" &&
      analisada.protocol !== "https:"
    ) {
      return "";
    }

    return analisada.toString();
  } catch {
    return "";
  }
}

export default function QrCodeVisitaPage() {
  const router = useRouter();

  const [contexto, setContexto] =
    useState<Contexto | null>(null);

  const [permissoes, setPermissoes] =
    useState<Permissoes | null>(null);

  const [municipio, setMunicipio] =
    useState<Municipio | null>(null);

  const [locais, setLocais] =
    useState<LocalCadastrado[]>([]);

  const [localId, setLocalId] =
    useState<number | null>(null);

  const [nomeLocal, setNomeLocal] =
    useState("");

  const [latitude, setLatitude] =
    useState("");

  const [longitude, setLongitude] =
    useState("");

  const [ordem, setOrdem] =
    useState("1");

  const [obrigatorio, setObrigatorio] =
    useState(true);

  const [pontoId, setPontoId] =
    useState<number | null>(null);

  const [urlCheckin, setUrlCheckin] =
    useState("");

  const [busca, setBusca] =
    useState("");

  const [carregando, setCarregando] =
    useState(true);

  const [atualizando, setAtualizando] =
    useState(false);

  const [capturando, setCapturando] =
    useState(false);

  const [salvando, setSalvando] =
    useState(false);

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

    void carregarDados(
      id > 0 ? id : undefined,
      false
    );
  }, []);

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
    id?: number
  ) {
    const accessToken =
      await obterAccessToken();

    const url = id
      ? `/api/patrulhamento/visitas/qrcode?ponto=${encodeURIComponent(
          String(id)
        )}`
      : "/api/patrulhamento/visitas/qrcode";

    const resposta = await fetch(
      url,
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
      )) as RespostaQrCode | null;

    if (resposta.status === 401) {
      localStorage.removeItem(
        "usuarioLogado"
      );

      router.replace("/login");

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
          "Não foi possível carregar o gerador de QR Code."
      );
    }

    return dados;
  }

  async function chamarApiPost(
    corpo: Record<string, unknown>
  ) {
    const accessToken =
      await obterAccessToken();

    const resposta = await fetch(
      "/api/patrulhamento/visitas/qrcode",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
          "Content-Type":
            "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(corpo),
      }
    );

    const dados = (await resposta
      .json()
      .catch(
        () => null
      )) as RespostaQrCode | null;

    if (resposta.status === 401) {
      localStorage.removeItem(
        "usuarioLogado"
      );

      router.replace("/login");

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
          "Não foi possível salvar o ponto de visita."
      );
    }

    return dados;
  }

  async function carregarDados(
    id?: number,
    somenteAtualizar = false
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
        dados.contexto || null
      );

      setPermissoes(
        dados.permissoes || null
      );

      setMunicipio(
        dados.municipio || null
      );

      setLocais(
        dados.locais || []
      );

      if (dados.ponto) {
        setPontoId(
          Number(
            dados.ponto.id
          )
        );

        setNomeLocal(
          dados.ponto.nome_local ||
            ""
        );

        setLatitude(
          String(
            dados.ponto.latitude ??
              ""
          )
        );

        setLongitude(
          String(
            dados.ponto.longitude ??
              ""
          )
        );

        setOrdem(
          String(
            dados.ponto.ordem ||
              1
          )
        );

        setObrigatorio(
          Boolean(
            dados.ponto
              .obrigatorio
          )
        );

        setUrlCheckin(
          dados.url_checkin ||
            ""
        );
      }
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao carregar o gerador.";

      console.error(
        "Erro ao carregar QR Code de visita:",
        {
          mensagem,
          error,
        }
      );

      if (!somenteAtualizar) {
        setErro(mensagem);
      }
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  function usarLocal(
    local: LocalCadastrado
  ) {
    setLocalId(local.id);
    setNomeLocal(
      local.nome || ""
    );

    setLatitude(
      local.latitude !== null &&
        local.latitude !== undefined
        ? String(local.latitude)
        : ""
    );

    setLongitude(
      local.longitude !== null &&
        local.longitude !== undefined
        ? String(local.longitude)
        : ""
    );

    setPontoId(null);
    setUrlCheckin("");

    const lat =
      numeroValido(
        local.latitude
      );

    const lon =
      numeroValido(
        local.longitude
      );

    if (
      lat === null ||
      lon === null
    ) {
      alert(
        "Este local não possui coordenadas válidas. Capture a localização antes de gerar o QR Code."
      );
    }
  }

  function limparFormulario() {
    setLocalId(null);
    setNomeLocal("");
    setLatitude("");
    setLongitude("");
    setOrdem("1");
    setObrigatorio(true);
    setPontoId(null);
    setUrlCheckin("");

    router.replace(
      "/sistema/patrulhamento/visitas/qrcode"
    );
  }

  function pegarLocalizacao() {
    if (!navigator.geolocation) {
      alert(
        "Geolocalização não disponível neste dispositivo."
      );
      return;
    }

    setCapturando(true);

    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        setLatitude(
          String(
            posicao.coords
              .latitude
          )
        );

        setLongitude(
          String(
            posicao.coords
              .longitude
          )
        );

        setCapturando(false);
      },
      (error) => {
        setCapturando(false);

        const mensagem =
          error.code ===
          error.PERMISSION_DENIED
            ? "A permissão de localização foi negada."
            : error.code ===
                error.TIMEOUT
              ? "O GPS demorou demais para responder."
              : "Não foi possível obter a localização.";

        alert(mensagem);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  async function salvarPonto() {
    if (
      !permissoes?.pode_criar
    ) {
      alert(
        "Você não possui permissão para cadastrar pontos de visita."
      );
      return;
    }

    const latitudeNumero =
      numeroValido(latitude);

    const longitudeNumero =
      numeroValido(longitude);

    const ordemNumero =
      Number(ordem);

    if (
      nomeLocal.trim().length < 2
    ) {
      alert(
        "Informe o nome do local."
      );
      return;
    }

    if (
      latitudeNumero === null ||
      latitudeNumero < -90 ||
      latitudeNumero > 90
    ) {
      alert(
        "Informe uma latitude válida."
      );
      return;
    }

    if (
      longitudeNumero === null ||
      longitudeNumero < -180 ||
      longitudeNumero > 180
    ) {
      alert(
        "Informe uma longitude válida."
      );
      return;
    }

    if (
      !Number.isSafeInteger(
        ordemNumero
      ) ||
      ordemNumero < 1
    ) {
      alert(
        "Informe uma ordem válida."
      );
      return;
    }

    setSalvando(true);

    try {
      const dados =
        await chamarApiPost({
          local_id:
            localId || null,
          nome_local:
            nomeLocal.trim(),
          latitude:
            latitudeNumero,
          longitude:
            longitudeNumero,
          ordem:
            ordemNumero,
          obrigatorio,
        });

      const ponto =
        dados.ponto;

      if (!ponto?.id) {
        throw new Error(
          "A API não retornou o ponto cadastrado."
        );
      }

      const novoId =
        Number(ponto.id);

      setPontoId(novoId);

      setUrlCheckin(
        dados.url_checkin ||
          `${window.location.origin}/sistema/patrulhamento/visitas/checkin?ponto=${novoId}`
      );

      router.replace(
        `/sistema/patrulhamento/visitas/qrcode?ponto=${novoId}`
      );

      alert(
        dados.mensagem ||
          "Ponto salvo. QR Code gerado."
      );
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao salvar o ponto.";

      console.error(
        "Erro ao salvar ponto de visita:",
        {
          mensagem,
          error,
        }
      );

      alert(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  function imprimirQrCode() {
    const canvas =
      document.querySelector(
        ".qr-preview canvas"
      ) as HTMLCanvasElement | null;

    if (
      !canvas ||
      !pontoId ||
      !urlCheckin
    ) {
      alert(
        "Gere o QR Code antes de imprimir."
      );
      return;
    }

    const qrImagem =
      canvas.toDataURL(
        "image/png"
      );

    const janela =
      window.open(
        "",
        "_blank",
        "width=900,height=1200"
      );

    if (!janela) {
      alert(
        "Permita pop-ups para imprimir o QR Code."
      );
      return;
    }

    const origem =
      window.location.origin;

    const logoSig =
      `${origem}/brasoes/sig-gcm-logo.png`;

    const brasaoGuarda =
      validarUrlImagem(
        municipio
          ?.brasao_guarda
      );

    const brasaoMunicipio =
      validarUrlImagem(
        municipio
          ?.brasao_municipio
      );

    const imagensTopo = [
      logoSig,
      brasaoMunicipio,
      brasaoGuarda,
    ]
      .filter(Boolean)
      .map(
        (imagem) =>
          `<img src="${escaparHtml(
            imagem
          )}" alt="" />`
      )
      .join("");

    janela.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>QR Code SIG-GCM Brasil</title>

          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              width: 210mm;
              min-height: 297mm;
              background: white;
              color: #0f172a;
              font-family: Arial, sans-serif;
            }

            .pagina {
              position: relative;
              display: flex;
              width: 210mm;
              min-height: 297mm;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              padding: 18mm;
              text-align: center;
            }

            .marca {
              position: absolute;
              inset: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              opacity: 0.045;
            }

            .marca img {
              width: 118mm;
              height: 118mm;
              object-fit: contain;
            }

            .conteudo {
              position: relative;
              z-index: 2;
              width: 100%;
            }

            .topo {
              display: flex;
              min-height: 28mm;
              align-items: center;
              justify-content: center;
              gap: 18px;
              margin-bottom: 8mm;
            }

            .topo img {
              width: 24mm;
              height: 24mm;
              object-fit: contain;
            }

            h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 900;
            }

            h2 {
              margin: 3mm 0 8mm;
              font-size: 15px;
            }

            .qr {
              width: 95mm;
              height: 95mm;
              object-fit: contain;
            }

            .local {
              margin-top: 8mm;
              font-size: 18px;
              font-weight: 900;
            }

            .municipio {
              margin-top: 2mm;
              font-size: 12px;
              font-weight: 700;
              color: #334155;
            }

            .url {
              max-width: 170mm;
              margin: 4mm auto 0;
              word-break: break-all;
              font-size: 8px;
              color: #475569;
            }

            .rodape {
              position: absolute;
              bottom: 12mm;
              left: 18mm;
              right: 18mm;
              border-top: 1px solid #cbd5e1;
              padding-top: 4mm;
              font-size: 9px;
              color: #64748b;
            }
          </style>
        </head>

        <body>
          <div class="pagina">
            <div class="marca">
              <img
                src="${escaparHtml(
                  logoSig
                )}"
                alt=""
              />
            </div>

            <div class="conteudo">
              <div class="topo">
                ${imagensTopo}
              </div>

              <h1>SIG-GCM Brasil</h1>
              <h2>QR Code de Check-in de Visita</h2>

              <img
                class="qr"
                src="${escaparHtml(
                  qrImagem
                )}"
                alt="QR Code"
              />

              <div class="local">
                ${escaparHtml(
                  nomeLocal
                )}
              </div>

              <div class="municipio">
                ${escaparHtml(
                  municipio?.nome ||
                    ""
                )}
              </div>

              <div class="url">
                ${escaparHtml(
                  urlCheckin
                )}
              </div>
            </div>

            <div class="rodape">
              Documento institucional gerado pelo SIG-GCM Brasil.
            </div>
          </div>

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);

    janela.document.close();
  }

  const locaisFiltrados =
    useMemo(() => {
      const termo =
        normalizar(busca);

      if (!termo) {
        return locais.slice(
          0,
          30
        );
      }

      return locais
        .filter((local) =>
          normalizar(
            [
              local.nome,
              local.tipo,
              local.endereco,
              local.referencia,
            ].join(" ")
          ).includes(termo)
        )
        .slice(0, 50);
    }, [
      busca,
      locais,
    ]);

  if (carregando) {
    return (
      <ProtecaoModulo modulo="patrulhamento">
        <div className="grid min-h-[70vh] place-items-center bg-slate-950 p-6 text-white">
          <div className="flex items-center gap-3 text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            Carregando gerador de QR Code...
          </div>
        </div>
      </ProtecaoModulo>
    );
  }

  return (
    <ProtecaoModulo modulo="patrulhamento">
      <main className="min-h-screen bg-slate-950 pb-24 text-white">
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_40%),linear-gradient(180deg,#07111f_0%,#020617_100%)]">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
            <Link
              href="/sistema/patrulhamento/visitas"
              className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Visitas
            </Link>

            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10">
                  <QrCode className="h-7 w-7 text-cyan-300" />
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                      Identificação operacional
                    </span>

                    {contexto?.usuario_nome && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                        {contexto.usuario_nome}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl font-black tracking-tight md:text-4xl">
                    Cadastrar ponto e gerar QR Code
                  </h1>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 md:text-base">
                    Selecione um local, confirme as coordenadas e gere a identificação para check-in de visita.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void carregarDados(
                    pontoId ||
                      undefined,
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
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 md:px-6">
          {erro && (
            <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5">
              <h2 className="font-bold text-red-100">
                Não foi possível carregar o gerador
              </h2>

              <p className="mt-2 text-sm text-red-100/75">
                {erro}
              </p>
            </section>
          )}

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.9fr)]">
            <div className="space-y-5">
              <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300">
                    <Building2 className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-black">
                      Locais cadastrados
                    </h2>

                    <p className="text-sm text-slate-500">
                      Use um local já existente no município.
                    </p>
                  </div>
                </div>

                <div className="relative mb-4">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                  <input
                    type="search"
                    value={busca}
                    onChange={(event) =>
                      setBusca(
                        event.target.value
                      )
                    }
                    placeholder="Pesquisar escola, órgão, povoado ou comércio..."
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                  />
                </div>

                <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
                  {locaisFiltrados.map(
                    (local) => {
                      const selecionado =
                        local.id ===
                        localId;

                      return (
                        <button
                          key={local.id}
                          type="button"
                          onClick={() =>
                            usarLocal(
                              local
                            )
                          }
                          className={`w-full rounded-2xl border p-4 text-left transition ${
                            selecionado
                              ? "border-cyan-400/60 bg-cyan-400/10"
                              : "border-white/10 bg-slate-950/60 hover:border-cyan-400/30 hover:bg-cyan-400/5"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300">
                              <Building2 className="h-5 w-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className="font-black text-white">
                                  {local.nome}
                                </p>

                                {selecionado && (
                                  <CheckCircle2 className="h-5 w-5 shrink-0 text-cyan-300" />
                                )}
                              </div>

                              <p className="mt-1 text-xs text-slate-500">
                                {local.tipo ||
                                  "Tipo não informado"}
                              </p>

                              <p className="mt-2 text-sm text-slate-300">
                                {local.endereco ||
                                  local.referencia ||
                                  "Sem endereço"}
                              </p>

                              <p className="mt-2 text-xs text-slate-500">
                                Raio informado:{" "}
                                {numeroValido(
                                  local.raio_metros
                                ) || 200}
                                m
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    }
                  )}

                  {locaisFiltrados.length ===
                    0 && (
                    <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
                      Nenhum local encontrado.
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-black">
                      Dados do ponto
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Confirme as informações antes de gerar o QR Code.
                    </p>
                  </div>

                  {pontoId && (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-200">
                      Ponto #{pontoId}
                    </span>
                  )}
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="text-sm font-bold text-slate-300">
                      Nome do local
                    </label>

                    <input
                      value={nomeLocal}
                      onChange={(event) => {
                        setNomeLocal(
                          event.target.value
                        );
                        setPontoId(null);
                        setUrlCheckin("");
                      }}
                      placeholder="Ex.: Escola Municipal João Paulo"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-bold text-slate-300">
                        Latitude
                      </label>

                      <input
                        inputMode="decimal"
                        value={latitude}
                        onChange={(event) => {
                          setLatitude(
                            event.target.value
                          );
                          setPontoId(null);
                          setUrlCheckin("");
                        }}
                        placeholder="-11.621296"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-300">
                        Longitude
                      </label>

                      <input
                        inputMode="decimal"
                        value={longitude}
                        onChange={(event) => {
                          setLongitude(
                            event.target.value
                          );
                          setPontoId(null);
                          setUrlCheckin("");
                        }}
                        placeholder="-38.806842"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-bold text-slate-300">
                        Ordem
                      </label>

                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={ordem}
                        onChange={(event) => {
                          setOrdem(
                            event.target.value
                          );
                          setPontoId(null);
                          setUrlCheckin("");
                        }}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-white outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                      />
                    </div>

                    <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={obrigatorio}
                        onChange={(event) => {
                          setObrigatorio(
                            event.target.checked
                          );
                          setPontoId(null);
                          setUrlCheckin("");
                        }}
                        className="h-5 w-5 accent-cyan-400"
                      />

                      <span className="text-sm font-bold text-slate-300">
                        Visita obrigatória
                      </span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={pegarLocalizacao}
                    disabled={capturando}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3.5 font-bold text-cyan-200 transition hover:bg-cyan-400/15 disabled:opacity-50"
                  >
                    {capturando ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Crosshair className="h-5 w-5" />
                    )}
                    {capturando
                      ? "Capturando localização..."
                      : "Usar localização atual"}
                  </button>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={limparFormulario}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 font-bold text-slate-300 transition hover:bg-white/10"
                    >
                      <RefreshCw className="h-5 w-5" />
                      Limpar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void salvarPonto()
                      }
                      disabled={
                        salvando ||
                        !permissoes?.pode_criar
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3.5 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {salvando ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Save className="h-5 w-5" />
                      )}
                      {salvando
                        ? "Salvando..."
                        : "Salvar e gerar QR Code"}
                    </button>
                  </div>
                </div>
              </section>

              <section className="qr-preview relative overflow-hidden rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-xl shadow-black/20">
                {!pontoId ||
                !urlCheckin ? (
                  <div className="grid min-h-[430px] place-items-center text-center">
                    <div>
                      <QrCode className="mx-auto h-16 w-16 text-slate-300" />

                      <h2 className="mt-5 text-xl font-black">
                        QR Code ainda não gerado
                      </h2>

                      <p className="mt-2 max-w-sm text-sm text-slate-500">
                        Preencha os dados e salve o ponto para gerar a identificação.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex min-h-[430px] flex-col items-center justify-center text-center">
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]">
                      <img
                        src="/brasoes/sig-gcm-logo.png"
                        alt=""
                        className="h-[280px] w-[280px] object-contain"
                      />
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                      <div className="mb-5 flex flex-wrap items-center justify-center gap-4">
                        <img
                          src="/brasoes/sig-gcm-logo.png"
                          alt="SIG-GCM Brasil"
                          className="h-20 w-20 object-contain"
                        />

                        {municipio?.brasao_municipio && (
                          <img
                            src={municipio.brasao_municipio}
                            alt="Brasão do município"
                            className="h-20 w-20 object-contain"
                          />
                        )}

                        {municipio?.brasao_guarda && (
                          <img
                            src={municipio.brasao_guarda}
                            alt="Brasão da Guarda Municipal"
                            className="h-20 w-20 object-contain"
                          />
                        )}
                      </div>

                      <h2 className="text-xl font-black">
                        SIG-GCM Brasil
                      </h2>

                      <p className="mb-4 mt-1 text-sm font-bold">
                        QR Code de Check-in de Visita
                      </p>

                      <QRCodeCanvas
                        value={urlCheckin}
                        size={220}
                        level="H"
                        includeMargin
                      />

                      <p className="mt-4 max-w-md break-words text-base font-black">
                        {nomeLocal}
                      </p>

                      {municipio?.nome && (
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {municipio.nome}
                        </p>
                      )}

                      <p className="mt-3 max-w-md break-all text-xs text-slate-500">
                        {urlCheckin}
                      </p>

                      <button
                        type="button"
                        onClick={imprimirQrCode}
                        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800"
                      >
                        <Printer className="h-5 w-5" />
                        Imprimir QR Code
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </section>

          <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />

              <div>
                <h2 className="font-bold text-cyan-100">
                  Geração segura
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-400">
                  O município, as permissões e o vínculo do ponto são validados pelo servidor. O QR Code contém apenas a URL necessária para abrir o check-in.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </ProtecaoModulo>
  );
}