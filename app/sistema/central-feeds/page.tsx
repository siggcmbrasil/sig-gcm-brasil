"use client";

import "../feeds-premium.css";

import Link from "next/link";
import {
  BarChart3,
  Bell,
  FileText,
  Globe,
  Megaphone,
  MessagesSquare,
  Newspaper,
  Radio,
  RefreshCw,
  Search,
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

type RegistroGenerico = Record<string, unknown>;

type PublicacaoFeed = {
  id: string;
  titulo: string;
  descricao: string;
  origem: string;
  data: string | null;
  municipio_id: number | null;
  href: string;
};

type TotaisFeeds = {
  feedSigLocal: number;
  feedBrasil: number;
  blog: number;
  avisos: number;
};

const cards = [
  {
    titulo: "Dashboard do Feed",
    href: "/sistema/feed-sig/dashboard",
    descricao:
      "Indicadores de participação, engajamento, hashtags e publicações em destaque.",
    icone: BarChart3,
    detalhe: "Abrir dashboard",
  },
  {
    titulo: "Chat Interno",
    href: "/sistema/feed-sig/chat",
    descricao:
      "Conversas privadas, de guarnição, plantão e município em tempo real.",
    icone: MessagesSquare,
    detalhe: "Abrir chat",
  },
  {
    titulo: "Feed SIG",
    href: "/sistema/feed-sig",
    descricao:
      "Publicações internas da Guarda Municipal do município ativo.",
    icone: Newspaper,
    detalhe: "Abrir Feed SIG",
  },
  {
    titulo: "Feed Brasil",
    href: "/sistema/feed-brasil",
    descricao:
      "Publicações compartilhadas pelas Guardas da rede SIG-GCM Brasil.",
    icone: Globe,
    detalhe: "Abrir Feed Brasil",
  },
  {
    titulo: "Blog Operacional",
    href: "/sistema/blog-operacional",
    descricao:
      "Orientações, doutrina, boas práticas e conteúdos operacionais.",
    icone: Radio,
    detalhe: "Abrir blog",
  },
  {
    titulo: "Avisos",
    href: "/sistema/avisos",
    descricao:
      "Comunicados internos e orientações institucionais.",
    icone: Bell,
    detalhe: "Abrir avisos",
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

function texto(valor: unknown, fallback = "") {
  const convertido = String(valor ?? "").trim();
  return convertido || fallback;
}

function numero(valor: unknown): number | null {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : null;
}

function obterId(
  item: RegistroGenerico,
  indice: number,
  origem: string
) {
  return `${origem}-${texto(item.id, String(indice))}`;
}

function obterData(item: RegistroGenerico) {
  return (
    texto(item.criado_em) ||
    texto(item.created_at) ||
    texto(item.data_publicacao) ||
    texto(item.data) ||
    null
  );
}

function normalizarPublicacao(
  item: RegistroGenerico,
  indice: number,
  origem: string,
  href: string
): PublicacaoFeed {
  const conteudo =
    texto(item.texto) ||
    texto(item.conteudo) ||
    texto(item.descricao) ||
    texto(item.mensagem) ||
    texto(item.resumo);

  const titulo =
    texto(item.titulo) ||
    texto(item.nome) ||
    conteudo.slice(0, 80) ||
    origem;

  return {
    id: obterId(item, indice, origem),
    titulo,
    descricao: conteudo || "Sem descrição informada.",
    origem,
    data: obterData(item),
    municipio_id: numero(item.municipio_id),
    href,
  };
}

function formatarData(valor: string | null) {
  if (!valor) return "Data não informada";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return data.toLocaleDateString("pt-BR");
}

export default function CentralFeedsPage() {
  const [totais, setTotais] = useState<TotaisFeeds>({
    feedSigLocal: 0,
    feedBrasil: 0,
    blog: 0,
    avisos: 0,
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

      const [
        municipioResposta,
        feedBrasilResposta,
        blogResposta,
        avisosResposta,
      ] = await Promise.all([
        supabase
          .from("municipios")
          .select("nome")
          .eq("id", municipioId)
          .maybeSingle(),

        supabase
          .from("feed_sig")
          .select("*")
          .order("id", { ascending: false })
          .limit(100),

        supabase
          .from("blog_operacional")
          .select("*")
          .eq("municipio_id", municipioId)
          .order("id", { ascending: false })
          .limit(30),

        supabase
          .from("avisos")
          .select("*")
          .eq("municipio_id", municipioId)
          .order("id", { ascending: false })
          .limit(30),
      ]);

      if (feedBrasilResposta.error) {
        throw feedBrasilResposta.error;
      }

      const feedBrasil =
        (feedBrasilResposta.data as RegistroGenerico[] | null) || [];

      const feedLocal = feedBrasil.filter(
        (item) => Number(item.municipio_id) === municipioId
      );

      const blog = blogResposta.error
        ? []
        : ((blogResposta.data as RegistroGenerico[] | null) || []);

      const avisos = avisosResposta.error
        ? []
        : ((avisosResposta.data as RegistroGenerico[] | null) || []);

      setMunicipioNome(
        String(
          municipioResposta.data?.nome ||
            contexto?.nome ||
            "Município"
        )
      );

      setTotais({
        feedSigLocal: feedLocal.length,
        feedBrasil: feedBrasil.length,
        blog: blog.length,
        avisos: avisos.length,
      });

      const lista = [
        ...feedBrasil.map((item, indice) =>
          normalizarPublicacao(
            item,
            indice,
            Number(item.municipio_id) === municipioId
              ? "Feed SIG"
              : "Feed Brasil",
            Number(item.municipio_id) === municipioId
              ? "/sistema/feed-sig"
              : "/sistema/feed-brasil"
          )
        ),
        ...blog.map((item, indice) =>
          normalizarPublicacao(
            item,
            indice,
            "Blog Operacional",
            "/sistema/blog-operacional"
          )
        ),
        ...avisos.map((item, indice) =>
          normalizarPublicacao(
            item,
            indice,
            "Aviso",
            "/sistema/avisos"
          )
        ),
      ].sort((a, b) => {
        const dataA = a.data ? new Date(a.data).getTime() : 0;
        const dataB = b.data ? new Date(b.data).getTime() : 0;
        return dataB - dataA;
      });

      setPublicacoes(lista);
    } catch (error) {
      console.error("Erro ao carregar Central de Feeds:", error);

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

  const publicacoesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return publicacoes;

    return publicacoes.filter((item) =>
      [
        item.titulo,
        item.descricao,
        item.origem,
      ]
        .join(" ")
        .toLowerCase()
        .includes(termo)
    );
  }, [busca, publicacoes]);

  const totalPublicacoes =
    totais.feedBrasil + totais.blog + totais.avisos;

  return (
    <ProtecaoModulo modulo="feed_sig">
      <main className="sig-page feedsPremium centralFeedsPremium">
        <div className="sig-page-content mx-auto w-full max-w-[1700px]">
          <SigPageHeader
            titulo="Central de Feeds"
            subtitulo={`${municipioNome} • Publicações internas, rede Brasil, blog operacional e avisos.`}
            detalhe="Comunicação institucional integrada"
            icone={Globe}
            acoes={
              <>
                <Link href="/sistema/feed-sig">
                  <SigButton
                    type="primary"
                    icon={Newspaper}
                    size="sm"
                  >
                    Publicar
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

          <section className="feedsStats grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <SigStatCard
              titulo="Publicações"
              valor={totalPublicacoes}
              subtitulo="Base integrada"
              icone={FileText}
              destaque="cyan"
            />

            <SigStatCard
              titulo="Feed SIG"
              valor={totais.feedSigLocal}
              subtitulo="Publicações locais"
              icone={Newspaper}
              destaque="blue"
            />

            <SigStatCard
              titulo="Feed Brasil"
              valor={totais.feedBrasil}
              subtitulo="Rede de Guardas"
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
              titulo="Avisos"
              valor={totais.avisos}
              subtitulo="Comunicados internos"
              icone={Megaphone}
              destaque="red"
            />
          </section>

          {carregando ? (
            <div className="sig-loading">
              Carregando publicações...
            </div>
          ) : (
            <>
              <section className="feedsMainGrid grid gap-4 xl:grid-cols-12">
                <SigCard className="feedsActivity xl:col-span-8">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                    <Newspaper className="h-6 w-6 text-cyan-300" />
                    <div>
                      <h2 className="font-black text-white">
                        Atividade recente
                      </h2>
                      <p className="text-xs text-slate-500">
                        Publicações integradas da rede SIG
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/45 px-4">
                    <Search className="h-5 w-5 text-cyan-300" />
                    <input
                      value={busca}
                      onChange={(evento) =>
                        setBusca(evento.target.value)
                      }
                      placeholder="Pesquisar publicação..."
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
                        .slice(0, 15)
                        .map((item) => (
                          <Link
                            key={item.id}
                            href={item.href}
                            className="block rounded-2xl border border-slate-800 bg-slate-950/45 p-4 transition hover:border-cyan-400/25"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-2 py-1 text-[10px] font-black uppercase text-cyan-300">
                                {item.origem}
                              </span>

                              <span className="text-xs text-slate-500">
                                {formatarData(item.data)}
                              </span>
                            </div>

                            <h3 className="mt-3 font-black text-white">
                              {item.titulo}
                            </h3>

                            <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">
                              {item.descricao}
                            </p>
                          </Link>
                        ))
                    )}
                  </div>
                </SigCard>

                <SigCard className="feedsNetwork xl:col-span-4" destaque>
                  <h2 className="font-black text-white">
                    Rede SIG Brasil
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    O Feed Brasil utiliza as publicações da tabela
                    <strong className="text-slate-200"> feed_sig</strong>,
                    exibindo registros de todos os municípios autorizados.
                  </p>

                  <div className="mt-5 space-y-3">
                    <Canal
                      titulo="Feed municipal"
                      descricao="Publicações internas do município ativo."
                    />

                    <Canal
                      titulo="Feed Brasil"
                      descricao="Publicações das Guardas integrantes da rede."
                    />

                    <Canal
                      titulo="Blog e avisos"
                      descricao="Conteúdo operacional e comunicação institucional."
                    />
                  </div>
                </SigCard>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-white">
                    Canais de Comunicação
                  </h2>
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
