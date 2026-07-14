"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Archive,
  Boxes,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  FileSearch,
  Filter,
  Hash,
  Loader2,
  PackageSearch,
  RefreshCw,
  Search,
  ShieldCheck,
  Tag,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";

type ContextoObjetos = {
  usuario_id: number;
  usuario_nome: string | null;
  perfil: string;
  municipio_id: number;
};

type ObjetoApreendido = {
  id: string;
  ocorrencia_id: number;
  protocolo: string;
  data: string;
  tipo_ocorrencia: string;
  categoria: string;
  subcategoria: string;
  descricao: string;
  marca: string;
  modelo: string;
  cor: string;
  numeracao: string;
  quantidade: string;
  situacao: string;
  procedencia: string;
  observacao: string;
};

type RespostaObjetos = {
  ok?: boolean;
  erro?: string;
  contexto?: ContextoObjetos;
  objetos?: ObjetoApreendido[];
};

function formatarData(valor: string) {
  if (!valor) {
    return "Data não informada";
  }

  const data = new Date(
    `${valor}T12:00:00`
  );

  if (
    Number.isNaN(data.getTime())
  ) {
    return valor;
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  ).format(data);
}

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase();
}

function corSituacao(situacao: string) {
  const valor = normalizar(
    situacao
  );

  if (
    valor.includes("apreendid") ||
    valor.includes("recolhid")
  ) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }

  if (
    valor.includes("devolvid") ||
    valor.includes("restituid")
  ) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }

  if (
    valor.includes("encaminhad") ||
    valor.includes("custodia")
  ) {
    return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";
  }

  return "border-slate-600/40 bg-slate-800/70 text-slate-300";
}

export default function ObjetosApreendidosPage() {
  const [objetos, setObjetos] =
    useState<ObjetoApreendido[]>(
      []
    );

  const [contexto, setContexto] =
    useState<ContextoObjetos | null>(
      null
    );

  const [busca, setBusca] =
    useState("");

  const [
    categoriaSelecionada,
    setCategoriaSelecionada,
  ] = useState("TODAS");

  const [
    situacaoSelecionada,
    setSituacaoSelecionada,
  ] = useState("TODAS");

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    void carregarObjetos();
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

  async function carregarObjetos() {
    setCarregando(true);
    setErro("");

    try {
      const accessToken =
        await obterAccessToken();

      const resposta = await fetch(
        "/api/ocorrencias/objetos",
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
        )) as RespostaObjetos | null;

      if (resposta.status === 401) {
        localStorage.removeItem(
          "usuarioLogado"
        );
        window.location.href =
          "/login";
        return;
      }

      if (
        !resposta.ok ||
        !dados?.ok
      ) {
        throw new Error(
          dados?.erro ||
            "Não foi possível carregar os objetos apreendidos."
        );
      }

      setContexto(
        dados.contexto || null
      );

      setObjetos(
        Array.isArray(
          dados.objetos
        )
          ? dados.objetos
          : []
      );
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao carregar objetos apreendidos.";

      console.error(
        "Erro ao carregar objetos apreendidos:",
        {
          mensagem,
          error,
        }
      );

      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  const categorias = useMemo(
    () =>
      Array.from(
        new Set(
          objetos
            .map(
              (item) =>
                item.categoria.trim()
            )
            .filter(Boolean)
        )
      ).sort((a, b) =>
        a.localeCompare(
          b,
          "pt-BR"
        )
      ),
    [objetos]
  );

  const situacoes = useMemo(
    () =>
      Array.from(
        new Set(
          objetos
            .map(
              (item) =>
                item.situacao.trim()
            )
            .filter(Boolean)
        )
      ).sort((a, b) =>
        a.localeCompare(
          b,
          "pt-BR"
        )
      ),
    [objetos]
  );

  const filtrados = useMemo(
    () => {
      const termo =
        normalizar(busca.trim());

      return objetos.filter(
        (item) => {
          const texto = normalizar(
            [
              item.protocolo,
              item.tipo_ocorrencia,
              item.categoria,
              item.subcategoria,
              item.descricao,
              item.marca,
              item.modelo,
              item.cor,
              item.numeracao,
              item.quantidade,
              item.situacao,
              item.procedencia,
              item.observacao,
            ].join(" ")
          );

          const atendeBusca =
            !termo ||
            texto.includes(termo);

          const atendeCategoria =
            categoriaSelecionada ===
              "TODAS" ||
            item.categoria ===
              categoriaSelecionada;

          const atendeSituacao =
            situacaoSelecionada ===
              "TODAS" ||
            item.situacao ===
              situacaoSelecionada;

          return (
            atendeBusca &&
            atendeCategoria &&
            atendeSituacao
          );
        }
      );
    },
    [
      objetos,
      busca,
      categoriaSelecionada,
      situacaoSelecionada,
    ]
  );

  const resumo = useMemo(
    () => {
      const ocorrenciasDistintas =
        new Set(
          objetos.map(
            (item) =>
              item.ocorrencia_id
          )
        ).size;

      const comNumeracao =
        objetos.filter(
          (item) =>
            Boolean(
              item.numeracao.trim()
            )
        ).length;

      const comProcedencia =
        objetos.filter(
          (item) =>
            Boolean(
              item.procedencia.trim()
            )
        ).length;

      return {
        total: objetos.length,
        ocorrenciasDistintas,
        categorias:
          categorias.length,
        comNumeracao,
        comProcedencia,
      };
    },
    [objetos, categorias]
  );

  const filtrosAtivos =
    Boolean(busca.trim()) ||
    categoriaSelecionada !==
      "TODAS" ||
    situacaoSelecionada !==
      "TODAS";

  function limparFiltros() {
    setBusca("");
    setCategoriaSelecionada(
      "TODAS"
    );
    setSituacaoSelecionada(
      "TODAS"
    );
  }

  if (carregando) {
    return (
      <ProtecaoModulo modulo="ocorrencias">
        <div className="grid min-h-[70vh] place-items-center p-6">
          <div className="flex items-center gap-3 text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            Carregando objetos apreendidos...
          </div>
        </div>
      </ProtecaoModulo>
    );
  }

  return (
    <ProtecaoModulo modulo="ocorrencias">
      <main className="min-h-screen bg-slate-950 pb-24 text-white">
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_38%),linear-gradient(180deg,#07111f_0%,#020617_100%)]">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-9">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_35px_rgba(34,211,238,0.12)]">
                  <Archive className="h-7 w-7 text-cyan-300" />
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                      Central de Ocorrências
                    </span>

                    {contexto?.usuario_nome && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                        {contexto.usuario_nome}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl font-black tracking-tight md:text-4xl">
                    Objetos Apreendidos
                  </h1>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 md:text-base">
                    Consulte objetos vinculados às ocorrências, com identificação, procedência, situação e acesso ao registro de origem.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void carregarObjetos()
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-200"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </button>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 md:px-6">
          {erro && (
            <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />

                <div className="flex-1">
                  <h2 className="font-bold text-red-100">
                    Não foi possível carregar os objetos
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-red-100/75">
                    {erro}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void carregarObjetos()
                  }
                  className="rounded-xl border border-red-400/25 px-3 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/15"
                >
                  Tentar novamente
                </button>
              </div>
            </section>
          )}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <ResumoCard
              titulo="Total de objetos"
              valor={resumo.total}
              icone={
                <Boxes className="h-5 w-5" />
              }
            />

            <ResumoCard
              titulo="Ocorrências"
              valor={
                resumo.ocorrenciasDistintas
              }
              icone={
                <FileSearch className="h-5 w-5" />
              }
            />

            <ResumoCard
              titulo="Categorias"
              valor={resumo.categorias}
              icone={
                <Tag className="h-5 w-5" />
              }
            />

            <ResumoCard
              titulo="Com numeração"
              valor={
                resumo.comNumeracao
              }
              icone={
                <Hash className="h-5 w-5" />
              }
            />

            <ResumoCard
              titulo="Com procedência"
              valor={
                resumo.comProcedencia
              }
              icone={
                <ShieldCheck className="h-5 w-5" />
              }
            />
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/20 md:p-5">
            <div className="mb-4 flex items-center gap-3">
              <Filter className="h-5 w-5 text-cyan-300" />

              <div>
                <h2 className="font-bold">
                  Filtros
                </h2>

                <p className="text-sm text-slate-500">
                  Localize por protocolo, categoria, descrição, marca, modelo ou numeração.
                </p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px_240px_auto]">
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
                  placeholder="Buscar objetos apreendidos..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                />
              </div>

              <select
                value={
                  categoriaSelecionada
                }
                onChange={(event) =>
                  setCategoriaSelecionada(
                    event.target.value
                  )
                }
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-white outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
              >
                <option value="TODAS">
                  Todas as categorias
                </option>

                {categorias.map(
                  (categoria) => (
                    <option
                      key={categoria}
                      value={categoria}
                    >
                      {categoria}
                    </option>
                  )
                )}
              </select>

              <select
                value={
                  situacaoSelecionada
                }
                onChange={(event) =>
                  setSituacaoSelecionada(
                    event.target.value
                  )
                }
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-white outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
              >
                <option value="TODAS">
                  Todas as situações
                </option>

                {situacoes.map(
                  (situacao) => (
                    <option
                      key={situacao}
                      value={situacao}
                    >
                      {situacao}
                    </option>
                  )
                )}
              </select>

              {filtrosAtivos && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="rounded-2xl border border-white/10 px-4 py-3.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="mt-3 text-sm text-slate-500">
              {filtrados.length} de{" "}
              {objetos.length} objeto(s)
            </div>
          </section>

          {filtrados.length === 0 ? (
            <section className="rounded-3xl border border-dashed border-white/10 bg-slate-900/40 p-10 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white/5">
                <PackageSearch className="h-8 w-8 text-slate-500" />
              </div>

              <h2 className="mt-5 text-lg font-bold">
                Nenhum objeto encontrado
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Não existem objetos cadastrados com os filtros selecionados.
              </p>

              {filtrosAtivos && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="mt-5 rounded-xl bg-cyan-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-400"
                >
                  Limpar filtros
                </button>
              )}
            </section>
          ) : (
            <section className="grid gap-4 lg:grid-cols-2">
              {filtrados.map(
                (objeto) => (
                  <article
                    key={objeto.id}
                    className="group overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:border-cyan-400/25"
                  >
                    <div className="border-b border-white/10 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
                              {objeto.categoria ||
                                "Sem categoria"}
                            </span>

                            {objeto.situacao && (
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${corSituacao(
                                  objeto.situacao
                                )}`}
                              >
                                {
                                  objeto.situacao
                                }
                              </span>
                            )}
                          </div>

                          <h2 className="mt-3 truncate text-lg font-black text-white">
                            {objeto.descricao ||
                              [
                                objeto.marca,
                                objeto.modelo,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(" ") ||
                              objeto.subcategoria ||
                              "Objeto sem descrição"}
                          </h2>

                          {objeto.subcategoria && (
                            <p className="mt-1 text-sm text-slate-500">
                              {
                                objeto.subcategoria
                              }
                            </p>
                          )}
                        </div>

                        <div className="rounded-2xl bg-white/5 p-3 text-cyan-300">
                          <Archive className="h-5 w-5" />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 p-5 sm:grid-cols-2">
                      <Info
                        rotulo="Protocolo"
                        valor={
                          objeto.protocolo ||
                          "Não informado"
                        }
                      />

                      <Info
                        rotulo="Data"
                        valor={formatarData(
                          objeto.data
                        )}
                      />

                      <Info
                        rotulo="Marca / modelo"
                        valor={
                          [
                            objeto.marca,
                            objeto.modelo,
                          ]
                            .filter(Boolean)
                            .join(" ") ||
                          "Não informado"
                        }
                      />

                      <Info
                        rotulo="Quantidade"
                        valor={
                          objeto.quantidade ||
                          "1"
                        }
                      />

                      <Info
                        rotulo="Numeração"
                        valor={
                          objeto.numeracao ||
                          "Não informada"
                        }
                      />

                      <Info
                        rotulo="Procedência"
                        valor={
                          objeto.procedencia ||
                          "Não informada"
                        }
                      />
                    </div>

                    {objeto.observacao && (
                      <div className="mx-5 mb-5 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                        <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                          Observação
                        </div>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                          {
                            objeto.observacao
                          }
                        </p>
                      </div>
                    )}

                    <Link
                      href={`/sistema/ocorrencias/${objeto.ocorrencia_id}`}
                      className="flex items-center justify-between border-t border-white/10 px-5 py-4 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/[0.06]"
                    >
                      <span>
                        Abrir ocorrência de origem
                      </span>

                      <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </Link>
                  </article>
                )
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
  valor: number;
  icone: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-lg shadow-black/10">
      <div className="flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300">
          {icone}
        </div>

        <span className="text-2xl font-black text-white">
          {valor}
        </span>
      </div>

      <div className="mt-3 text-sm text-slate-500">
        {titulo}
      </div>
    </div>
  );
}

function Info({
  rotulo,
  valor,
}: {
  rotulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        {rotulo}
      </div>

      <div className="mt-1 break-words text-sm font-semibold text-slate-200">
        {valor}
      </div>
    </div>
  );
}