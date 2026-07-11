"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MapPin,
  Navigation,
  QrCode,
  RefreshCw,
  Search,
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
  nome_local: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  ordem: number | null;
  obrigatorio: boolean | null;
};

type RespostaPontos = {
  ok?: boolean;
  erro?: string;
  mensagem?: string;
  contexto?: Contexto;
  permissoes?: Permissoes;
  pontos?: PontoVisita[];
  id?: number;
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

function formatarCoordenada(
  valor: number | string | null
) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "Não informada";
  }

  return numero.toFixed(6);
}

export default function PontosVisitaPage() {
  const router = useRouter();

  const [contexto, setContexto] =
    useState<Contexto | null>(null);

  const [permissoes, setPermissoes] =
    useState<Permissoes | null>(null);

  const [pontos, setPontos] =
    useState<PontoVisita[]>([]);

  const [busca, setBusca] =
    useState("");

  const [carregando, setCarregando] =
    useState(true);

  const [atualizando, setAtualizando] =
    useState(false);

  const [
    excluindoId,
    setExcluindoId,
  ] = useState<number | null>(null);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    void carregarPontos(false);
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

  async function chamarApi(
    metodo: "GET" | "DELETE",
    corpo?: Record<string, unknown>
  ) {
    const accessToken =
      await obterAccessToken();

    const resposta = await fetch(
      "/api/patrulhamento/visitas/pontos",
      {
        method: metodo,
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
          ...(corpo
            ? {
                "Content-Type":
                  "application/json",
              }
            : {}),
        },
        cache: "no-store",
        body: corpo
          ? JSON.stringify(corpo)
          : undefined,
      }
    );

    const dados = (await resposta
      .json()
      .catch(
        () => null
      )) as RespostaPontos | null;

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
          "Não foi possível concluir a operação."
      );
    }

    return dados;
  }

  async function carregarPontos(
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
        await chamarApi("GET");

      setContexto(
        dados.contexto || null
      );

      setPermissoes(
        dados.permissoes || null
      );

      setPontos(
        dados.pontos || []
      );
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao carregar os pontos de visita.";

      console.error(
        "Erro ao carregar pontos de visita:",
        {
          mensagem,
          error,
        }
      );

      if (!somenteAtualizar) {
        setErro(mensagem);
        setPontos([]);
      }
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  async function excluirPonto(
    ponto: PontoVisita
  ) {
    if (
      !permissoes?.pode_excluir
    ) {
      alert(
        "Você não possui permissão para excluir pontos de visita."
      );
      return;
    }

    const nome =
      ponto.nome_local ||
      `Ponto ${ponto.id}`;

    const confirmar =
      window.confirm(
        `Deseja realmente excluir o ponto de visita?\n\n${nome}\n\nEsta ação será auditada.`
      );

    if (!confirmar) {
      return;
    }

    const motivo =
      window.prompt(
        "Informe o motivo da exclusão:",
        ""
      );

    if (motivo === null) {
      return;
    }

    const motivoTratado =
      motivo.trim();

    if (motivoTratado.length < 5) {
      alert(
        "Informe um motivo com pelo menos 5 caracteres."
      );
      return;
    }

    setExcluindoId(ponto.id);

    try {
      const dados =
        await chamarApi(
          "DELETE",
          {
            id: ponto.id,
            motivo:
              motivoTratado,
          }
        );

      setPontos((lista) =>
        lista.filter(
          (item) =>
            item.id !== ponto.id
        )
      );

      alert(
        dados.mensagem ||
          "Ponto de visita excluído com sucesso."
      );
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao excluir ponto de visita.";

      console.error(
        "Erro ao excluir ponto de visita:",
        {
          mensagem,
          ponto_id: ponto.id,
          error,
        }
      );

      alert(mensagem);
    } finally {
      setExcluindoId(null);
    }
  }

  const pontosFiltrados =
    useMemo(() => {
      const termo =
        normalizar(busca);

      if (!termo) {
        return pontos;
      }

      return pontos.filter(
        (ponto) =>
          normalizar(
            [
              ponto.id,
              ponto.nome_local,
              ponto.ordem,
              ponto.obrigatorio
                ? "OBRIGATORIO"
                : "OPCIONAL",
              ponto.latitude,
              ponto.longitude,
            ].join(" ")
          ).includes(termo)
      );
    }, [
      pontos,
      busca,
    ]);

  const obrigatorios =
    useMemo(
      () =>
        pontos.filter(
          (ponto) =>
            Boolean(
              ponto.obrigatorio
            )
        ).length,
      [pontos]
    );

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
                  <MapPin className="h-7 w-7 text-cyan-300" />
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                      Pontos operacionais
                    </span>

                    {contexto?.usuario_nome && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                        {contexto.usuario_nome}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl font-black tracking-tight md:text-4xl">
                    Pontos de visita
                  </h1>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 md:text-base">
                    Consulte locais vinculados ao patrulhamento, acesse o QR Code e realize check-ins operacionais.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void carregarPontos(true)
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
                Não foi possível carregar os pontos
              </h2>

              <p className="mt-2 text-sm text-red-100/75">
                {erro}
              </p>
            </section>
          )}

          <section className="grid gap-3 sm:grid-cols-3">
            <ResumoCard
              titulo="Total de pontos"
              valor={String(
                pontos.length
              )}
              icone={
                <MapPin className="h-5 w-5" />
              }
            />

            <ResumoCard
              titulo="Obrigatórios"
              valor={String(
                obrigatorios
              )}
              icone={
                <CheckCircle2 className="h-5 w-5" />
              }
            />

            <ResumoCard
              titulo="Com acesso ao QR"
              valor={String(
                pontos.length
              )}
              icone={
                <QrCode className="h-5 w-5" />
              }
            />
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-xl shadow-black/20">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

              <input
                type="search"
                value={busca}
                onChange={(event) =>
                  setBusca(
                    event.target.value
                  )
                }
                placeholder="Pesquisar por nome, ID, ordem ou coordenada..."
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
              />
            </div>
          </section>

          {carregando ? (
            <section className="grid min-h-[45vh] place-items-center rounded-3xl border border-white/10 bg-slate-900/50">
              <div className="flex items-center gap-3 text-slate-300">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                Carregando pontos...
              </div>
            </section>
          ) : pontosFiltrados.length ===
            0 ? (
            <section className="rounded-3xl border border-dashed border-white/10 bg-slate-900/40 p-10 text-center">
              <MapPin className="mx-auto h-10 w-10 text-slate-600" />

              <h2 className="mt-4 text-lg font-black">
                Nenhum ponto encontrado
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Não existem pontos de visita que correspondam ao filtro informado.
              </p>
            </section>
          ) : (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pontosFiltrados.map(
                (ponto) => {
                  const nome =
                    ponto.nome_local ||
                    `Ponto ${ponto.id}`;

                  const excluindo =
                    excluindoId ===
                    ponto.id;

                  return (
                    <article
                      key={ponto.id}
                      className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-xl shadow-black/10"
                    >
                      <div className="border-b border-white/10 bg-gradient-to-br from-cyan-400/10 to-transparent p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                              Ponto #{ponto.id}
                            </p>

                            <h2 className="mt-2 break-words text-xl font-black">
                              {nome}
                            </h2>
                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
                              ponto.obrigatorio
                                ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-200"
                                : "border-white/10 bg-white/5 text-slate-400"
                            }`}
                          >
                            {ponto.obrigatorio
                              ? "Obrigatório"
                              : "Opcional"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4 p-5">
                        <div className="grid grid-cols-2 gap-3">
                          <InfoBloco
                            titulo="Ordem"
                            valor={
                              ponto.ordem !==
                              null
                                ? String(
                                    ponto.ordem
                                  )
                                : "Não definida"
                            }
                          />

                          <InfoBloco
                            titulo="Município"
                            valor={String(
                              ponto.municipio_id
                            )}
                          />
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-300">
                            <Navigation className="h-4 w-4 text-cyan-300" />
                            Coordenadas
                          </div>

                          <div className="grid gap-2 text-xs text-slate-500">
                            <p>
                              Latitude:{" "}
                              <strong className="text-slate-300">
                                {formatarCoordenada(
                                  ponto.latitude
                                )}
                              </strong>
                            </p>

                            <p>
                              Longitude:{" "}
                              <strong className="text-slate-300">
                                {formatarCoordenada(
                                  ponto.longitude
                                )}
                              </strong>
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href={`/sistema/patrulhamento/visitas/qrcode?ponto=${ponto.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-3 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                          >
                            <QrCode className="h-4 w-4" />
                            Ver QR Code
                          </Link>

                          <Link
                            href={`/sistema/patrulhamento/visitas/checkin?ponto=${ponto.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-bold text-white transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Check-in
                          </Link>
                        </div>

                        {permissoes?.pode_excluir && (
                          <button
                            type="button"
                            onClick={() =>
                              void excluirPonto(
                                ponto
                              )
                            }
                            disabled={excluindo}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/15 disabled:opacity-50"
                          >
                            {excluindo ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            {excluindo
                              ? "Excluindo..."
                              : "Excluir ponto"}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                }
              )}
            </section>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function ResumoCard({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: string;
  icone: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300">
          {icone}
        </div>

        <ShieldCheck className="h-4 w-4 text-slate-700" />
      </div>

      <div className="mt-3 text-2xl font-black">
        {valor}
      </div>

      <div className="mt-1 text-sm text-slate-500">
        {titulo}
      </div>
    </article>
  );
}

function InfoBloco({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
        {titulo}
      </div>

      <div className="mt-1 text-sm font-bold text-slate-200">
        {valor}
      </div>
    </div>
  );
}