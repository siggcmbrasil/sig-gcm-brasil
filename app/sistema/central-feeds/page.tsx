"use client";

import Link from "next/link";
import {
  Bell,
  CalendarDays,
  FileText,
  Globe,
  Megaphone,
  Newspaper,
  Radio,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigActionCard from "@/components/sig/SigActionCard";
import SigButton from "@/components/sig/SigButton";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigStatCard from "@/components/sig/SigStatCard";

import {
  lerMunicipioContextoLocal,
  obterMunicipioIdEfetivo,
} from "@/lib/contextoMunicipio";
import { supabase } from "@/lib/supabase";

type UsuarioLocal = {
  perfil?: string;
  municipio_id?: number;
};

type PublicacaoFeed = {
  id: number;
  titulo: string | null;
  resumo: string | null;
  descricao: string | null;
  conteudo: string | null;
  categoria: string | null;
  tipo: string | null;
  criado_em: string | null;
  created_at: string | null;
  municipio_id: number | null;
  origem: string;
  href: string;
};

type TotaisFeeds = {
  feedSig: number;
  feedBrasil: number;
  blog: number;
  noticias: number;
  comunicados: number;
  avisos: number;
  eventos: number;
  atualizacoes: number;
};

const cards = [
  {
    titulo: "Feed SIG",
    href: "/sistema/feed-sig",
    descricao:
      "Notícias, avisos, atualizações e comunicados internos do SIG.",
    icone: Newspaper,
    detalhe: "Abrir Feed SIG",
  },
  {
    titulo: "Feed Brasil",
    href: "/sistema/feed-brasil",
    descricao:
      "Integração e compartilhamento institucional entre municípios da rede.",
    icone: Globe,
    detalhe: "Abrir Feed Brasil",
  },
  {
    titulo: "Blog Operacional",
    href: "/sistema/blog-operacional",
    descricao:
      "Publicações, orientações, doutrina e conteúdos operacionais.",
    icone: Radio,
    detalhe: "Abrir blog",
  },
  {
    titulo: "Notícias",
    href: "/sistema/portal-cidadao/noticias",
    descricao:
      "Notícias institucionais e informações oficiais à comunidade.",
    icone: Newspaper,
    detalhe: "Abrir notícias",
  },
  {
    titulo: "Comunicados",
    href: "/sistema/portal-cidadao/comunicados",
    descricao:
      "Comunicados oficiais, campanhas e orientações públicas.",
    icone: Megaphone,
    detalhe: "Abrir comunicados",
  },
  {
    titulo: "Avisos",
    href: "/sistema/avisos",
    descricao:
      "Avisos internos e orientações destinadas aos usuários.",
    icone: Bell,
    detalhe: "Abrir avisos",
  },
  {
    titulo: "Eventos",
    href: "/sistema/portal-cidadao/eventos",
    descricao:
      "Agenda de eventos, ações comunitárias e atividades institucionais.",
    icone: CalendarDays,
    detalhe: "Abrir eventos",
  },
  {
    titulo: "Atualizações",
    href: "/sistema/atualizacoes",
    descricao:
      "Novidades, melhorias e mudanças publicadas no SIG-GCM Brasil.",
    icone: RefreshCw,
    detalhe: "Abrir atualizações",
  },
];

function obterUsuarioLocal(): UsuarioLocal | null {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(
      localStorage.getItem("usuarioLogado") || "null"
    ) as UsuarioLocal | null;
  } catch {
    return null;
  }
}

function obterData(item: PublicacaoFeed) {
  return item.criado_em || item.created_at;
}

function formatarData(valor: string | null) {
  if (!valor) return "Data não informada";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return data.toLocaleDateString("pt-BR");
}

async function contarTabela(
  tabela: string,
  municipioId?: number
): Promise<number> {
  let consulta = supabase
    .from(tabela)
    .select("id", { count: "exact", head: true });

  if (municipioId) {
    consulta = consulta.eq("municipio_id", municipioId);
  }

  const resposta = await consulta;

  if (resposta.error) {
    console.warn(
      `Falha parcial em ${tabela}:`,
      resposta.error.message
    );
    return 0;
  }

  return resposta.count || 0;
}

async function buscarPublicacoes(
  tabela: string,
  origem: string,
  href: string,
  municipioId?: number,
  global = false
): Promise<PublicacaoFeed[]> {
  const campos =
    "id,titulo,resumo,descricao,conteudo,categoria,tipo,criado_em,created_at,municipio_id";

  let consulta = supabase
    .from(tabela)
    .select(campos)
    .order("id", { ascending: false })
    .limit(20);

  if (municipioId && !global) {
    consulta = consulta.eq("municipio_id", municipioId);
  }

  const resposta = await consulta;

  if (resposta.error) {
    console.warn(
      `Falha parcial em ${tabela}:`,
      resposta.error.message
    );
    return [];
  }

  return ((resposta.data || []) as Omit<
    PublicacaoFeed,
    "origem" | "href"
  >[]).map((item) => ({
    ...item,
    origem,
    href,
  }));
}

export default function CentralFeedsPage() {
  const [totais, setTotais] = useState<TotaisFeeds>({
    feedSig: 0,
    feedBrasil: 0,
    blog: 0,
    noticias: 0,
    comunicados: 0,
    avisos: 0,
    eventos: 0,
    atualizacoes: 0,
  });

  const [publicacoes, setPublicacoes] = useState<
    PublicacaoFeed[]
  >([]);
  const [busca, setBusca] = useState("");
  const [municipioNome, setMunicipioNome] =
    useState("Município");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");

    try {
      const usuario = obterUsuarioLocal();

      if (!usuario?.perfil) {
        throw new Error("Usuário não identificado.");
      }

      const contexto = lerMunicipioContextoLocal();

      const municipioId = obterMunicipioIdEfetivo({
        perfil: usuario.perfil,
        municipioIdUsuario: usuario.municipio_id,
      });

      if (!municipioId) {
        throw new Error("Município não identificado.");
      }

      const municipioResposta = await supabase
        .from("municipios")
        .select("nome")
        .eq("id", municipioId)
        .maybeSingle();

      if (municipioResposta.error) {
        console.warn(
          "Falha parcial em municipios:",
          municipioResposta.error.message
        );
      }

      const [
        feedSig,
        feedBrasil,
        blog,
        noticias,
        comunicados,
        avisos,
        eventos,
        atualizacoes,
        publicacoesFeedSig,
        publicacoesFeedBrasil,
        publicacoesBlog,
        publicacoesNoticias,
        publicacoesComunicados,
        publicacoesAvisos,
        publicacoesAtualizacoes,
      ] = await Promise.all([
        contarTabela("feed_sig", municipioId),
        contarTabela("feed_brasil"),
        contarTabela("blog_operacional", municipioId),
        contarTabela("noticias", municipioId),
        contarTabela("comunicados", municipioId),
        contarTabela("avisos", municipioId),
        contarTabela("eventos", municipioId),
        contarTabela("atualizacoes", municipioId),

        buscarPublicacoes(
          "feed_sig",
          "Feed SIG",
          "/sistema/feed-sig",
          municipioId
        ),
        buscarPublicacoes(
          "feed_brasil",
          "Feed Brasil",
          "/sistema/feed-brasil",
          undefined,
          true
        ),
        buscarPublicacoes(
          "blog_operacional",
          "Blog Operacional",
          "/sistema/blog-operacional",
          municipioId
        ),
        buscarPublicacoes(
          "noticias",
          "Notícia",
          "/sistema/portal-cidadao/noticias",
          municipioId
        ),
        buscarPublicacoes(
          "comunicados",
          "Comunicado",
          "/sistema/portal-cidadao/comunicados",
          municipioId
        ),
        buscarPublicacoes(
          "avisos",
          "Aviso",
          "/sistema/avisos",
          municipioId
        ),
        buscarPublicacoes(
          "atualizacoes",
          "Atualização",
          "/sistema/atualizacoes",
          municipioId
        ),
      ]);

      setMunicipioNome(
        String(
          municipioResposta.data?.nome ||
            contexto?.nome ||
            "Município"
        )
      );

      setTotais({
        feedSig,
        feedBrasil,
        blog,
        noticias,
        comunicados,
        avisos,
        eventos,
        atualizacoes,
      });

      setPublicacoes(
        [
          ...publicacoesFeedSig,
          ...publicacoesFeedBrasil,
          ...publicacoesBlog,
          ...publicacoesNoticias,
          ...publicacoesComunicados,
          ...publicacoesAvisos,
          ...publicacoesAtualizacoes,
        ]
          .sort((a, b) => {
            const dataA = obterData(a)
              ? new Date(obterData(a) as string).getTime()
              : 0;

            const dataB = obterData(b)
              ? new Date(obterData(b) as string).getTime()
              : 0;

            return dataB - dataA;
          })
          .slice(0, 30)
      );
    } catch (error) {
      console.error(
        "Erro ao carregar Central de Feeds:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a Central de Feeds."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const totalPublicacoes = useMemo(
    () =>
      totais.feedSig +
      totais.feedBrasil +
      totais.blog +
      totais.noticias +
      totais.comunicados +
      totais.avisos +
      totais.atualizacoes,
    [totais]
  );

  const publicacoesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) {
      return publicacoes;
    }

    return publicacoes.filter((item) => {
      const texto = [
        item.titulo,
        item.resumo,
        item.descricao,
        item.conteudo,
        item.categoria,
        item.tipo,
        item.origem,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });
  }, [busca, publicacoes]);

  return (
    <ProtecaoModulo modulo="feed_sig">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Central de Feeds"
            subtitulo={`${municipioNome} • Comunicação, notícias, publicações e integração da rede SIG-GCM Brasil.`}
            detalhe="Conteúdo institucional integrado"
            icone={Globe}
            acoes={
              <>
                <Link href="/sistema/feed-sig">
                  <SigButton
                    type="primary"
                    icon={Newspaper}
                    size="sm"
                  >
                    Feed SIG
                  </SigButton>
                </Link>

                <SigButton
                  type="cyan"
                  icon={RefreshCw}
                  size="sm"
                  loading={carregando}
                  onClick={() => void carregar()}
                >
                  Atualizar
                </SigButton>
              </>
            }
          />

          {erro ? <div className="sig-error">{erro}</div> : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
            <SigStatCard
              titulo="Publicações"
              valor={totalPublicacoes}
              subtitulo="Base consolidada"
              icone={FileText}
              destaque="cyan"
            />

            <SigStatCard
              titulo="Feed SIG"
              valor={totais.feedSig}
              subtitulo="Publicações internas"
              icone={Newspaper}
              destaque="blue"
            />

            <SigStatCard
              titulo="Feed Brasil"
              valor={totais.feedBrasil}
              subtitulo="Rede de municípios"
              icone={Globe}
              destaque="green"
            />

            <SigStatCard
              titulo="Blog"
              valor={totais.blog}
              subtitulo="Conteúdo operacional"
              icone={Radio}
              destaque="amber"
            />

            <SigStatCard
              titulo="Notícias"
              valor={totais.noticias}
              subtitulo="Publicações oficiais"
              icone={Newspaper}
              destaque="slate"
            />

            <SigStatCard
              titulo="Comunicados"
              valor={totais.comunicados}
              subtitulo="Orientações públicas"
              icone={Megaphone}
              destaque="red"
            />

            <SigStatCard
              titulo="Avisos"
              valor={totais.avisos}
              subtitulo="Comunicação interna"
              icone={Bell}
              destaque="cyan"
            />

            <SigStatCard
              titulo="Atualizações"
              valor={totais.atualizacoes}
              subtitulo="Novidades do sistema"
              icone={RefreshCw}
              destaque="blue"
            />
          </section>

          {carregando ? (
            <div className="sig-loading">
              <div>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />

                <p className="mt-4 text-slate-400">
                  Carregando publicações...
                </p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-8">
                  <CabecalhoSecao
                    titulo="Atividade recente"
                    subtitulo="Publicações integradas da rede SIG"
                    icone={Newspaper}
                  />

                  <div className="mt-5 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/45 px-4">
                    <Search className="h-5 w-5 shrink-0 text-cyan-300" />

                    <input
                      value={busca}
                      onChange={(evento) =>
                        setBusca(evento.target.value)
                      }
                      placeholder="Pesquisar publicação, categoria ou origem..."
                      className="h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                    />
                  </div>

                  <div className="mt-5 space-y-3">
                    {publicacoesFiltradas.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-500">
                        Nenhuma publicação encontrada.
                      </div>
                    ) : (
                      publicacoesFiltradas
                        .slice(0, 12)
                        .map((item) => (
                          <Link
                            key={`${item.origem}-${item.id}`}
                            href={item.href}
                            className="block rounded-2xl border border-slate-800 bg-slate-950/45 p-4 transition hover:border-cyan-400/25"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-300">
                                <Newspaper className="h-5 w-5" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate font-black text-white">
                                    {item.titulo ||
                                      "Publicação sem título"}
                                  </p>

                                  <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black uppercase text-slate-400">
                                    {item.origem}
                                  </span>
                                </div>

                                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-400">
                                  {item.resumo ||
                                    item.descricao ||
                                    item.conteudo ||
                                    "Sem resumo informado."}
                                </p>

                                <p className="mt-2 text-xs text-slate-500">
                                  {formatarData(obterData(item))}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))
                    )}
                  </div>
                </SigCard>

                <SigCard className="xl:col-span-4" destaque>
                  <CabecalhoSecao
                    titulo="Canais integrados"
                    subtitulo="Conteúdo local, nacional e operacional"
                    icone={Globe}
                  />

                  <div className="mt-5 space-y-3">
                    <Canal
                      titulo="Conteúdo municipal"
                      descricao="Feed SIG, notícias, comunicados, avisos e eventos do município."
                    />

                    <Canal
                      titulo="Rede SIG Brasil"
                      descricao="Compartilhamento institucional entre municípios integrantes."
                    />

                    <Canal
                      titulo="Conteúdo operacional"
                      descricao="Orientações, doutrina, boas práticas e publicações técnicas."
                    />

                    <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-300" />
                        <h3 className="font-black text-white">
                          Curadoria institucional
                        </h3>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Publicações devem respeitar município, autoria,
                        permissão e auditoria.
                      </p>
                    </div>
                  </div>
                </SigCard>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-white">
                    Ferramentas de Conteúdo
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Acesse os canais de publicação e integração.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {cards.map((card) => (
                    <SigActionCard
                      key={card.href}
                      titulo={card.titulo}
                      descricao={card.descricao}
                      href={card.href}
                      icone={card.icone}
                      detalhe={card.detalhe}
                    />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function CabecalhoSecao({
  titulo,
  subtitulo,
  icone: Icone,
}: {
  titulo: string;
  subtitulo: string;
  icone: typeof Globe;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300">
        <Icone className="h-5 w-5" />
      </div>

      <div>
        <h2 className="font-black text-white">{titulo}</h2>

        <p className="mt-0.5 text-xs text-slate-500">
          {subtitulo}
        </p>
      </div>
    </div>
  );
}

function Canal({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4">
      <h3 className="font-black text-white">{titulo}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {descricao}
      </p>
    </div>
  );
}
