"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  BookOpen,
  Bot,
  ChevronDown,
  CircleHelp,
  Download,
  ExternalLink,
  FileText,
  Gavel,
  Library,
  Loader2,
  Newspaper,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  montarUrlComMunicipioContexto,
} from "@/lib/contextoMunicipio";
import { supabase } from "@/lib/supabase";

type UsuarioLocal = {
  id?: number | string;
  nome?: string;
  perfil?: string;
  municipio_id?: number;
};

type Institucional = {
  municipio_id: number;
  municipio_nome: string;
  estado: string;
  nome_guarda: string;
};

type Resumo = {
  legislacoes: number;
  favoritos: number;
  atualizacoes: number;
  downloads: number;
};

type Atualizacao = {
  id: number;
  titulo: string;
  resumo: string | null;
  categoria: string | null;
  tipo: string | null;
  fonte: string | null;
  url: string | null;
  data_publicacao: string | null;
};

type LegislacaoDestaque = {
  id: number;
  titulo: string;
  categoria: string | null;
  descricao: string | null;
  artigo: string | null;
  aplicacao_operacional: string | null;
};

type ResultadoPesquisa = {
  id: number;
  titulo: string;
  categoria: string | null;
  descricao: string | null;
  artigo: string | null;
  texto_lei: string | null;
  aplicacao_operacional: string | null;
  palavras_chave: string | null;
};

type RespostaCentral = {
  ok?: boolean;
  erro?: string;
  institucional?: Institucional;
  resumo?: Resumo;
  atualizacoes?: Atualizacao[];
  destaques?: LegislacaoDestaque[];
  resultados?: ResultadoPesquisa[];
  termo?: string;
};

type AcessoPrincipal = {
  titulo: string;
  descricao: string;
  explicacao: string;
  href: string;
  icone: typeof BookOpen;
  acao: string;
};

const acessosPrincipais: AcessoPrincipal[] = [
  {
    titulo: "Biblioteca Jurídica",
    descricao:
      "Consulte leis, decretos, artigos e normas cadastradas.",
    explicacao:
      "Use quando já souber qual norma deseja ler ou quando precisar navegar por categorias.",
    href: "/sistema/legislacao",
    icone: Library,
    acao: "Abrir biblioteca",
  },
  {
    titulo: "Pesquisa Jurídica",
    descricao:
      "Encontre conteúdos por lei, número, artigo, tema ou palavra-chave.",
    explicacao:
      "Ideal para localizar rapidamente uma base legal antes ou depois de uma atuação.",
    href: "/sistema/legislacao/pesquisa",
    icone: Search,
    acao: "Pesquisar normas",
  },
  {
    titulo: "IA Jurídica",
    descricao:
      "Receba apoio para compreender uma norma e sua aplicação prática.",
    explicacao:
      "A IA oferece orientação inicial, mas a fonte oficial deve ser confirmada em casos sensíveis.",
    href: "/sistema/ia-juridica",
    icone: Bot,
    acao: "Perguntar à IA",
  },
  {
    titulo: "Atualizações Jurídicas",
    descricao:
      "Acompanhe alterações legislativas, decisões e novos materiais.",
    explicacao:
      "Use para verificar mudanças recentes que possam afetar a atividade da Guarda Municipal.",
    href: "/sistema/central-legislacao/atualizacoes",
    icone: Gavel,
    acao: "Ver atualizações",
  },
];

const recursosSecundarios = [
  {
    titulo: "Favoritos",
    descricao:
      "Normas e conteúdos salvos para consulta rápida.",
    href: "/sistema/central-legislacao/favoritos",
    icone: Star,
  },
  {
    titulo: "Downloads",
    descricao:
      "Cartilhas, POPs, modelos e materiais institucionais.",
    href: "/sistema/central-legislacao/downloads",
    icone: Download,
  },
  {
    titulo: "Notícias Jurídicas",
    descricao:
      "Conteúdos relacionados à segurança pública e decisões relevantes.",
    href: "/sistema/central-legislacao/noticias",
    icone: Newspaper,
  },
];

const temasRapidos = [
  "Guarda Municipal",
  "Abordagem",
  "Trânsito",
  "Maria da Penha",
  "ECA",
  "Uso da força",
];

function lerUsuarioLocal():
  | UsuarioLocal
  | null {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  try {
    const salvo =
      localStorage.getItem(
        "usuarioLogado"
      );

    if (!salvo) {
      return null;
    }

    return JSON.parse(
      salvo
    ) as UsuarioLocal;
  } catch {
    return null;
  }
}

function texto(
  valor: unknown,
  fallback = "-"
) {
  const convertido =
    String(valor ?? "").trim();

  return convertido || fallback;
}

function formatarData(
  valor: string | null
) {
  if (!valor) {
    return "Data não informada";
  }

  const correspondencia =
    valor.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

  if (correspondencia) {
    return (
      `${correspondencia[3]}/` +
      `${correspondencia[2]}/` +
      `${correspondencia[1]}`
    );
  }

  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return valor;
  }

  return data.toLocaleDateString(
    "pt-BR"
  );
}

async function obterToken() {
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
      "Sessão inválida ou expirada."
    );
  }

  return session.access_token;
}

export default function CentralLegislacaoPage() {
  const [usuario] =
    useState<UsuarioLocal | null>(
      () =>
        lerUsuarioLocal()
    );

  const [
    institucional,
    setInstitucional,
  ] =
    useState<Institucional | null>(
      null
    );

  const [
    resumo,
    setResumo,
  ] = useState<Resumo>({
    legislacoes: 0,
    favoritos: 0,
    atualizacoes: 0,
    downloads: 0,
  });

  const [
    atualizacoes,
    setAtualizacoes,
  ] = useState<Atualizacao[]>(
    []
  );

  const [
    destaques,
    setDestaques,
  ] =
    useState<
      LegislacaoDestaque[]
    >([]);

  const [
    resultados,
    setResultados,
  ] =
    useState<
      ResultadoPesquisa[]
    >([]);

  const [
    busca,
    setBusca,
  ] = useState("");

  const [
    termoPesquisado,
    setTermoPesquisado,
  ] = useState("");

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    pesquisando,
    setPesquisando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  const resultadosRef =
    useRef<HTMLElement | null>(
      null
    );

  function montarUrl(
    termo = ""
  ) {
    const parametros =
      new URLSearchParams();

    if (termo.trim()) {
      parametros.set(
        "q",
        termo.trim()
      );
    }

    const caminho =
      `/api/legislacao/central${
        parametros.size
          ? `?${parametros.toString()}`
          : ""
      }`;

    return montarUrlComMunicipioContexto({
      url: caminho,
      perfil:
        usuario?.perfil,
      municipioIdUsuario:
        usuario?.municipio_id,
    });
  }

  async function carregarCentral(
    termo = "",
    somentePesquisa = false
  ) {
    if (
      !usuario?.perfil
    ) {
      setErro(
        "Usuário não identificado."
      );

      setCarregando(false);
      setPesquisando(false);
      return;
    }

    if (somentePesquisa) {
      setPesquisando(true);
    } else {
      setCarregando(true);
    }

    setErro("");

    try {
      const token =
        await obterToken();

      const resposta =
        await fetch(
          montarUrl(termo),
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

      const retorno =
        (await resposta
          .json()
          .catch(() => ({}))) as
          RespostaCentral;

      if (
        !resposta.ok ||
        !retorno.ok
      ) {
        throw new Error(
          retorno.erro ||
          "Não foi possível carregar a Central de Legislação."
        );
      }

      if (
        retorno.institucional
      ) {
        setInstitucional(
          retorno.institucional
        );
      }

      if (retorno.resumo) {
        setResumo(
          retorno.resumo
        );
      }

      if (
        Array.isArray(
          retorno.atualizacoes
        )
      ) {
        setAtualizacoes(
          retorno.atualizacoes
        );
      }

      if (
        Array.isArray(
          retorno.destaques
        )
      ) {
        setDestaques(
          retorno.destaques
        );
      }

      setResultados(
        Array.isArray(
          retorno.resultados
        )
          ? retorno.resultados
          : []
      );

      setTermoPesquisado(
        retorno.termo || ""
      );

      await registrarAuditoria({
        modulo:
          "Central de Legislação",
        acao:
          termo.trim()
            ? "PESQUISAR"
            : "ACESSO",
        descricao:
          termo.trim()
            ? `Pesquisou na Central de Legislação: ${termo.trim()}.`
            : "Acessou a Central de Legislação.",
        tabela:
          "legislacoes",
        detalhes: {
          municipio_id:
            retorno.institucional
              ?.municipio_id,
          termo:
            termo.trim() ||
            null,
          resultados:
            retorno.resultados
              ?.length || 0,
        },
      });
    } catch (error) {
      console.error(
        "Erro na Central de Legislação:",
        {
          message:
            error instanceof Error
              ? error.message
              : "Erro desconhecido",
        }
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar a Central de Legislação."
      );
    } finally {
      setCarregando(false);
      setPesquisando(false);
    }
  }

  useEffect(() => {
    void carregarCentral();
  }, []);

  useEffect(() => {
    if (
      termoPesquisado &&
      resultadosRef.current
    ) {
      resultadosRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [termoPesquisado]);

  function pesquisar(
    evento?:
      React.FormEvent
  ) {
    evento?.preventDefault();

    const termo =
      busca.trim();

    if (!termo) {
      setResultados([]);
      setTermoPesquisado("");
      return;
    }

    void carregarCentral(
      termo,
      true
    );
  }

  function pesquisarTema(
    tema: string
  ) {
    setBusca(tema);

    void carregarCentral(
      tema,
      true
    );
  }

  const identificacao =
    useMemo(() => {
      if (!institucional) {
        return "Identificação institucional em carregamento";
      }

      return (
        `${institucional.nome_guarda} — ` +
        `${institucional.municipio_nome}/${institucional.estado}`
      );
    }, [institucional]);

  return (
    <ProtecaoModulo modulo="legislacao">
      <main className="space-y-6 p-4 pb-24 md:p-6">
        <section className="rounded-[30px] border border-blue-500/20 bg-slate-950/75 p-6 shadow-[0_0_35px_rgba(14,165,233,0.08)] md:p-8">
          <div className="grid gap-7 xl:grid-cols-[1.4fr_0.6fr] xl:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                <Scale className="h-4 w-4" />
                Central jurídica institucional
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight text-white md:text-5xl">
                Central de Legislação
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                Este espaço reúne pesquisa jurídica, biblioteca de normas, atualizações e apoio da IA para auxiliar o guarda na consulta e compreensão da legislação aplicável ao serviço.
              </p>

              <p className="mt-3 text-sm font-bold text-cyan-300">
                {identificacao}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Etapa
                  numero="1"
                  titulo="Pesquise"
                  texto="Informe a lei, o artigo ou o tema da dúvida."
                />

                <Etapa
                  numero="2"
                  titulo="Leia a fonte"
                  texto="Confira o texto legal e a aplicação operacional cadastrada."
                />

                <Etapa
                  numero="3"
                  titulo="Confirme"
                  texto="Em situações sensíveis, valide a vigência e a fonte oficial."
                />
              </div>
            </div>

            <div className="rounded-3xl border border-violet-500/25 bg-violet-500/10 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-violet-500/30 bg-violet-500/15 p-3 text-violet-300">
                  <Sparkles className="h-7 w-7" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-violet-300">
                    Apoio inteligente
                  </p>

                  <h2 className="mt-1 text-xl font-black text-white">
                    IA Jurídica
                  </h2>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-300">
                Use a IA para entender uma norma, comparar conceitos ou receber uma explicação inicial. A resposta não substitui a leitura da lei nem a orientação jurídica oficial.
              </p>

              <Link
                href="/sistema/ia-juridica"
                className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 font-black text-white transition hover:bg-violet-500"
              >
                Perguntar à IA Jurídica
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="painel-premium p-5 md:p-6">
          <div className="grid gap-5 xl:grid-cols-[0.72fr_0.28fr] xl:items-end">
            <div>
              <div className="mb-4">
                <p className="text-xs font-black uppercase tracking-wider text-cyan-300">
                  Consulta rápida
                </p>

                <h2 className="mt-1 text-2xl font-black text-white">
                  O que o senhor deseja localizar?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Digite o número de uma lei, um artigo, uma expressão jurídica ou uma situação prática, como “abordagem”, “uso da força” ou “prisão em flagrante”.
                </p>
              </div>

              <form
                onSubmit={pesquisar}
                className="flex flex-col gap-3 md:flex-row"
              >
                <div className="flex min-h-14 flex-1 items-center gap-3 rounded-2xl border border-blue-500/25 bg-slate-950/70 px-4">
                  <Search className="h-5 w-5 shrink-0 text-cyan-300" />

                  <input
                    value={busca}
                    onChange={(evento) =>
                      setBusca(
                        evento.target.value
                      )
                    }
                    placeholder="Ex.: Lei 13.022, abordagem, trânsito..."
                    className="h-14 w-full bg-transparent text-white outline-none placeholder:text-slate-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={pesquisando}
                  className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-7 font-black text-white transition hover:bg-cyan-500 disabled:opacity-60"
                >
                  {pesquisando ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}

                  {pesquisando
                    ? "Pesquisando..."
                    : "Pesquisar"}
                </button>
              </form>

              <div className="mt-4 flex flex-wrap gap-2">
                {temasRapidos.map(
                  (tema) => (
                    <button
                      key={tema}
                      type="button"
                      onClick={() =>
                        pesquisarTema(
                          tema
                        )
                      }
                      className="rounded-full border border-slate-700 bg-slate-900/65 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-300"
                    >
                      {tema}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="flex items-start gap-3">
                <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />

                <div>
                  <p className="font-black text-white">
                    Dica de pesquisa
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Pesquise primeiro pelo assunto. Depois refine usando o número da lei ou o artigo desejado.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {erro ? (
          <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {erro}
          </section>
        ) : null}

        {carregando ? (
          <section className="painel-premium flex min-h-44 items-center justify-center gap-3 p-8 text-slate-300">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
            Carregando informações jurídicas...
          </section>
        ) : (
          <>
            <section
              ref={resultadosRef}
              className={
                termoPesquisado
                  ? "scroll-mt-6"
                  : "hidden"
              }
            >
              {termoPesquisado ? (
                <div className="painel-premium p-5 md:p-6">
                  <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-cyan-300">
                        Resultado da pesquisa
                      </p>

                      <h2 className="mt-1 text-2xl font-black text-white">
                        “{termoPesquisado}”
                      </h2>

                      <p className="mt-2 text-sm text-slate-400">
                        Leia o resumo abaixo e abra a biblioteca para consultar o conteúdo completo quando necessário.
                      </p>
                    </div>

                    <span className="w-fit rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-black text-cyan-300">
                      {resultados.length} resultado(s)
                    </span>
                  </div>

                  {resultados.length ===
                  0 ? (
                    <EstadoVazio
                      texto="Nenhuma legislação encontrada. Tente outro termo ou use a Pesquisa Jurídica avançada."
                    />
                  ) : (
                    <div className="grid gap-3 xl:grid-cols-2">
                      {resultados.map(
                        (item) => (
                          <ResultadoCard
                            key={item.id}
                            item={item}
                          />
                        )
                      )}
                    </div>
                  )}

                  <Link
                    href="/sistema/legislacao/pesquisa"
                    className="mt-5 flex w-fit items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-300 transition hover:bg-cyan-500/15"
                  >
                    Abrir pesquisa avançada
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : null}
            </section>

            <section>
              <div className="mb-4">
                <p className="text-xs font-black uppercase tracking-wider text-cyan-300">
                  Principais ferramentas
                </p>

                <h2 className="mt-1 text-2xl font-black text-white">
                  Escolha como deseja consultar
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                  Cada ferramenta atende a uma necessidade diferente. Use a biblioteca para leitura, a pesquisa para localização rápida, a IA para explicações e as atualizações para acompanhar mudanças recentes.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {acessosPrincipais.map(
                  (item) => (
                    <AcessoPrincipalCard
                      key={item.href}
                      item={item}
                    />
                  )
                )}
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-12">
              <div className="painel-premium p-5 xl:col-span-7 md:p-6">
                <div className="mb-5">
                  <p className="text-xs font-black uppercase tracking-wider text-cyan-300">
                    Conteúdo recente
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-white">
                    Atualizações legislativas
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Consulte alterações, publicações e decisões cadastradas para manter a atuação institucional alinhada com a legislação atual.
                  </p>
                </div>

                {atualizacoes.length ===
                0 ? (
                  <EstadoVazio
                    texto="Nenhuma atualização legislativa foi cadastrada para este município."
                  />
                ) : (
                  <div className="space-y-3">
                    {atualizacoes
                      .slice(0, 3)
                      .map(
                        (item) => (
                          <AtualizacaoCard
                            key={item.id}
                            item={item}
                          />
                        )
                      )}
                  </div>
                )}

                <Link
                  href="/sistema/central-legislacao/atualizacoes"
                  className="mt-4 flex w-fit items-center gap-2 text-sm font-black text-cyan-300 hover:text-cyan-200"
                >
                  Ver todas as atualizações
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="painel-premium p-5 xl:col-span-5 md:p-6">
                <div className="mb-5">
                  <p className="text-xs font-black uppercase tracking-wider text-violet-300">
                    Consulta recomendada
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-white">
                    Conteúdos em destaque
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Normas selecionadas pela relevância para a atividade operacional e administrativa.
                  </p>
                </div>

                {destaques.length ===
                0 ? (
                  <EstadoVazio
                    texto="Nenhum conteúdo foi marcado como destaque."
                  />
                ) : (
                  <div className="space-y-3">
                    {destaques
                      .slice(0, 3)
                      .map(
                        (item) => (
                          <DestaqueCard
                            key={item.id}
                            item={item}
                          />
                        )
                      )}
                  </div>
                )}

                <Link
                  href="/sistema/legislacao"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 py-3 font-black text-white transition hover:bg-blue-600"
                >
                  <Library className="h-5 w-5" />
                  Abrir biblioteca completa
                </Link>
              </div>
            </section>

            <section className="painel-premium overflow-hidden">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 md:p-6">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Recursos complementares
                    </p>

                    <h2 className="mt-1 text-xl font-black text-white">
                      Favoritos, downloads e notícias
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                      Abra esta seção quando precisar acessar materiais auxiliares.
                    </p>
                  </div>

                  <ChevronDown className="h-6 w-6 shrink-0 text-slate-400 transition group-open:rotate-180" />
                </summary>

                <div className="grid gap-3 border-t border-slate-800 p-5 md:grid-cols-3 md:p-6">
                  {recursosSecundarios.map(
                    (item) => (
                      <RecursoSecundario
                        key={item.href}
                        item={item}
                      />
                    )
                  )}
                </div>
              </details>
            </section>

            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <IndicadorCompacto
                titulo="Legislações"
                valor={resumo.legislacoes}
                icone={BookOpen}
              />

              <IndicadorCompacto
                titulo="Favoritos"
                valor={resumo.favoritos}
                icone={Star}
              />

              <IndicadorCompacto
                titulo="Atualizações"
                valor={resumo.atualizacoes}
                icone={FileText}
              />

              <IndicadorCompacto
                titulo="Materiais"
                valor={resumo.downloads}
                icone={Download}
              />
            </section>

            <section className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5 md:p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3 text-amber-300">
                  <ShieldCheck className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-black text-white">
                    Uso responsável da informação jurídica
                  </h2>

                  <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
                    A Central de Legislação é uma ferramenta de consulta e apoio. Antes de fundamentar uma ação sensível, confirme a vigência da norma, consulte a fonte oficial e siga os protocolos e orientações institucionais do município.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </ProtecaoModulo>
  );
}

function Etapa({
  numero,
  titulo,
  texto: descricao,
}: {
  numero: string;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 text-sm font-black text-cyan-300">
          {numero}
        </span>

        <p className="font-black text-white">
          {titulo}
        </p>
      </div>

      <p className="mt-3 text-sm leading-5 text-slate-400">
        {descricao}
      </p>
    </div>
  );
}

function AcessoPrincipalCard({
  item,
}: {
  item: AcessoPrincipal;
}) {
  const Icone =
    item.icone;

  return (
    <Link
      href={item.href}
      className="group rounded-3xl border border-slate-800 bg-slate-950/60 p-5 transition hover:-translate-y-0.5 hover:border-cyan-500/40"
    >
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 p-3 text-blue-300">
          <Icone className="h-7 w-7" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-black text-white">
            {item.titulo}
          </h3>

          <p className="mt-2 text-sm font-semibold text-slate-300">
            {item.descricao}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {item.explicacao}
          </p>

          <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-cyan-300">
            {item.acao}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function RecursoSecundario({
  item,
}: {
  item: {
    titulo: string;
    descricao: string;
    href: string;
    icone: typeof Star;
  };
}) {
  const Icone =
    item.icone;

  return (
    <Link
      href={item.href}
      className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4 transition hover:border-blue-500/40"
    >
      <Icone className="h-6 w-6 text-blue-300" />

      <h3 className="mt-3 font-black text-white">
        {item.titulo}
      </h3>

      <p className="mt-1 text-sm leading-5 text-slate-400">
        {item.descricao}
      </p>
    </Link>
  );
}

function IndicadorCompacto({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: number;
  icone: typeof BookOpen;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
      <div className="flex items-center justify-between gap-3">
        <Icone className="h-5 w-5 text-cyan-300" />

        <span className="text-2xl font-black text-white">
          {valor}
        </span>
      </div>

      <p className="mt-3 text-xs font-black uppercase tracking-wider text-slate-400">
        {titulo}
      </p>
    </div>
  );
}

function ResultadoCard({
  item,
}: {
  item: ResultadoPesquisa;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300">
          {texto(
            item.categoria,
            "Sem categoria"
          )}
        </span>

        {item.artigo ? (
          <span className="rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-300">
            {item.artigo}
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 text-lg font-black text-white">
        {item.titulo}
      </h3>

      <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-400">
        {texto(
          item.aplicacao_operacional ||
            item.descricao ||
            item.texto_lei,
          "Conteúdo jurídico disponível na biblioteca."
        )}
      </p>

      {item.palavras_chave ? (
        <p className="mt-3 text-xs text-cyan-300">
          Palavras-chave: {item.palavras_chave}
        </p>
      ) : null}
    </article>
  );
}

function AtualizacaoCard({
  item,
}: {
  item: Atualizacao;
}) {
  const conteudo = (
    <div className="group flex gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-cyan-500/35">
      <div className="mt-1 h-fit rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-2 text-cyan-300">
        <Gavel className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
            {texto(
              item.tipo,
              "ATUALIZAÇÃO"
            )}
          </span>

          <span className="text-xs text-slate-500">
            {formatarData(
              item.data_publicacao
            )}
          </span>
        </div>

        <h3 className="mt-1 font-black text-white">
          {item.titulo}
        </h3>

        <p className="mt-1 line-clamp-2 text-sm text-slate-400">
          {texto(
            item.resumo,
            "Sem resumo cadastrado."
          )}
        </p>
      </div>

      {item.url ? (
        <ExternalLink className="h-5 w-5 shrink-0 text-slate-600 transition group-hover:text-cyan-300" />
      ) : null}
    </div>
  );

  if (item.url) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
      >
        {conteudo}
      </a>
    );
  }

  return conteudo;
}

function DestaqueCard({
  item,
}: {
  item: LegislacaoDestaque;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 fill-amber-300 text-amber-300" />

        <span className="text-xs font-black uppercase tracking-wider text-amber-300">
          {texto(
            item.categoria,
            "Legislação"
          )}
        </span>
      </div>

      <h3 className="mt-2 font-black text-white">
        {item.titulo}
      </h3>

      {item.artigo ? (
        <p className="mt-1 text-xs font-bold text-violet-300">
          {item.artigo}
        </p>
      ) : null}

      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">
        {texto(
          item.aplicacao_operacional ||
            item.descricao,
          "Conteúdo disponível na biblioteca jurídica."
        )}
      </p>
    </div>
  );
}

function EstadoVazio({
  texto: descricao,
}: {
  texto: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/35 p-8 text-center">
      <BookOpen className="mx-auto h-10 w-10 text-slate-600" />

      <p className="mt-3 text-sm leading-6 text-slate-400">
        {descricao}
      </p>
    </div>
  );
}
