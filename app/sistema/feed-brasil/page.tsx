"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Globe2,
  Heart,
  Loader2,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  ThumbsUp,
  UserRound,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import { supabase } from "@/lib/supabase";

type UsuarioLocal = {
  id?: number | string;
  nome?: string;
  municipio_id?: number;
  municipio_nome?: string;
};

type Post = {
  id: number;
  usuario_id: number | string | null;
  municipio_id: number;
  titulo: string | null;
  texto: string;
  imagem_url: string | null;
  arquivo_url: string | null;
  criado_em: string;
};

type Municipio = {
  id: number;
  nome: string | null;
  uf?: string | null;
  estado?: string | null;
};

type Reacao = {
  id: number;
  post_id: number;
  usuario_id: number | string;
  tipo: "CURTIR" | "APOIAR" | "IMPORTANTE";
};

type Comentario = {
  id: number;
  post_id: number;
  usuario_id: number | string;
  comentario: string;
  criado_em: string;
};

type PessoaMapa = {
  nome: string;
};

function lerUsuario(): UsuarioLocal {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    ) as UsuarioLocal;
  } catch {
    return {};
  }
}

function tempoRelativo(valor: string) {
  const data = new Date(valor);
  const minutos = Math.max(
    0,
    Math.floor((Date.now() - data.getTime()) / 60000)
  );

  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;

  return data.toLocaleDateString("pt-BR");
}

export default function FeedBrasilPage() {
  const [usuario] = useState<UsuarioLocal>(() => lerUsuario());
  const [posts, setPosts] = useState<Post[]>([]);
  const [municipios, setMunicipios] = useState<Record<number, Municipio>>(
    {}
  );
  const [pessoas, setPessoas] = useState<Record<string, PessoaMapa>>({});
  const [reacoes, setReacoes] = useState<Reacao[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [comentariosAbertos, setComentariosAbertos] = useState<Set<number>>(
    new Set()
  );
  const [comentariosTexto, setComentariosTexto] = useState<
    Record<number, string>
  >({});
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");

    const [postsResposta, municipiosResposta] = await Promise.all([
      supabase
        .from("feed_sig")
        .select(
          "id,usuario_id,municipio_id,titulo,texto,imagem_url,arquivo_url,criado_em"
        )
        .eq("status", "PUBLICADO")
        .eq("compartilhar_brasil", true)
        .order("criado_em", { ascending: false })
        .limit(150),

      supabase.from("municipios").select("id,nome,uf,estado"),
    ]);

    if (postsResposta.error) {
      setErro(postsResposta.error.message);
      setPosts([]);
      setCarregando(false);
      return;
    }

    const listaPosts = (postsResposta.data as Post[] | null) || [];
    const idsPosts = listaPosts.map((post) => post.id);
    const idsUsuarios = Array.from(
      new Set(
        listaPosts
          .map((post) => post.usuario_id)
          .filter((id): id is number | string => id !== null)
      )
    );

    const [reacoesResposta, comentariosResposta, usuariosResposta] =
      await Promise.all([
        idsPosts.length
          ? supabase
              .from("feed_sig_reacoes")
              .select("id,post_id,usuario_id,tipo")
              .in("post_id", idsPosts)
          : Promise.resolve({ data: [], error: null }),

        idsPosts.length
          ? supabase
              .from("feed_sig_comentarios")
              .select("id,post_id,usuario_id,comentario,criado_em")
              .in("post_id", idsPosts)
              .order("criado_em", { ascending: true })
          : Promise.resolve({ data: [], error: null }),

        idsUsuarios.length
          ? supabase
              .from("usuarios")
              .select("id,nome")
              .in("id", idsUsuarios)
          : Promise.resolve({ data: [], error: null }),
      ]);

    const mapaMunicipios: Record<number, Municipio> = {};

    for (const municipio of
      (municipiosResposta.data as Municipio[] | null) || []) {
      mapaMunicipios[municipio.id] = municipio;
    }

    const mapaPessoas: Record<string, PessoaMapa> = {};

    for (const pessoa of (usuariosResposta.data || []) as Array<{
      id: number | string;
      nome: string | null;
    }>) {
      mapaPessoas[String(pessoa.id)] = {
        nome: pessoa.nome || "Integrante da Guarda",
      };
    }

    setPosts(listaPosts);
    setMunicipios(mapaMunicipios);
    setPessoas(mapaPessoas);
    setReacoes((reacoesResposta.data as Reacao[] | null) || []);
    setComentarios(
      (comentariosResposta.data as Comentario[] | null) || []
    );
    setCarregando(false);
  }

  useEffect(() => {
    void carregar();

    const canal = supabase
      .channel("feed-brasil-social")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feed_sig" },
        () => void carregar()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feed_sig_reacoes" },
        () => void carregar()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feed_sig_comentarios" },
        () => void carregar()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(canal);
    };
  }, []);

  async function reagir(postId: number, tipo: Reacao["tipo"]) {
    if (!usuario.id || !usuario.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    const existente = reacoes.find(
      (reacao) =>
        reacao.post_id === postId &&
        String(reacao.usuario_id) === String(usuario.id)
    );

    if (existente?.tipo === tipo) {
      await supabase
        .from("feed_sig_reacoes")
        .delete()
        .eq("id", existente.id);
    } else if (existente) {
      await supabase
        .from("feed_sig_reacoes")
        .update({ tipo })
        .eq("id", existente.id);
    } else {
      await supabase.from("feed_sig_reacoes").insert({
        post_id: postId,
        usuario_id: usuario.id,
        municipio_id: usuario.municipio_id,
        tipo,
      });
    }

    await carregar();
  }

  async function comentar(postId: number) {
    if (!usuario.id || !usuario.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    const comentario = (comentariosTexto[postId] || "").trim();

    if (!comentario) return;

    const resposta = await supabase
      .from("feed_sig_comentarios")
      .insert({
        post_id: postId,
        usuario_id: usuario.id,
        municipio_id: usuario.municipio_id,
        comentario,
      });

    if (resposta.error) {
      alert(resposta.error.message);
      return;
    }

    setComentariosTexto((atual) => ({
      ...atual,
      [postId]: "",
    }));

    await carregar();
  }

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return posts;

    return posts.filter((post) => {
      const municipio = municipios[post.municipio_id];
      const autor = pessoas[String(post.usuario_id)]?.nome;

      return [
        post.titulo,
        post.texto,
        municipio?.nome,
        municipio?.uf,
        municipio?.estado,
        autor,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(termo);
    });
  }, [busca, municipios, pessoas, posts]);

  return (
    <ProtecaoModulo modulo="feed_sig">
      <main className="sig-page">
        <div className="sig-page-content mx-auto max-w-5xl">
          <SigPageHeader
            titulo="Feed Brasil"
            subtitulo="Rede institucional das Guardas Municipais que utilizam o SIG."
            detalhe="Publicações compartilhadas nacionalmente"
            icone={Globe2}
          />

          <SigCard>
            <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4">
              <Search className="h-5 w-5 text-cyan-300" />

              <input
                value={busca}
                onChange={(evento) =>
                  setBusca(evento.target.value)
                }
                placeholder="Pesquisar publicação, autor ou município..."
                className="h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
              />
            </div>
          </SigCard>

          {erro ? <div className="sig-error">{erro}</div> : null}

          <section className="space-y-5">
            {carregando ? (
              <div className="sig-loading">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
              </div>
            ) : filtrados.length === 0 ? (
              <SigCard>
                <div className="py-12 text-center text-slate-500">
                  Nenhuma publicação compartilhada no Feed Brasil.
                </div>
              </SigCard>
            ) : (
              filtrados.map((post) => {
                const municipio = municipios[post.municipio_id];
                const autor =
                  pessoas[String(post.usuario_id)]?.nome ||
                  "Integrante da Guarda";

                const reacoesPost = reacoes.filter(
                  (reacao) => reacao.post_id === post.id
                );

                const comentariosPost = comentarios.filter(
                  (comentario) => comentario.post_id === post.id
                );

                const minhaReacao = reacoesPost.find(
                  (reacao) =>
                    String(reacao.usuario_id) === String(usuario.id)
                );

                return (
                  <article
                    key={post.id}
                    className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/80 shadow-xl"
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/10">
                          <UserRound className="h-6 w-6 text-blue-300" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-black text-white">
                            {autor}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {municipio?.nome || "Município"}
                              {municipio?.uf
                                ? `/${municipio.uf}`
                                : ""}
                            </span>

                            <span>•</span>

                            <span>
                              {tempoRelativo(post.criado_em)}
                            </span>
                          </div>
                        </div>

                        <ShieldCheck className="h-5 w-5 text-cyan-300" />
                      </div>

                      {post.titulo ? (
                        <h2 className="mt-5 text-xl font-black text-white">
                          {post.titulo}
                        </h2>
                      ) : null}

                      <p className="mt-4 whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-200">
                        {post.texto}
                      </p>
                    </div>

                    {post.imagem_url ? (
                      <img
                        src={post.imagem_url}
                        alt="Imagem da publicação"
                        className="max-h-[620px] w-full bg-black object-contain"
                      />
                    ) : null}

                    <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3 text-xs text-slate-500">
                      <span>
                        {reacoesPost.length} reações
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setComentariosAbertos((atual) => {
                            const novo = new Set(atual);

                            if (novo.has(post.id)) {
                              novo.delete(post.id);
                            } else {
                              novo.add(post.id);
                            }

                            return novo;
                          })
                        }
                      >
                        {comentariosPost.length} comentários
                      </button>
                    </div>

                    <div className="grid grid-cols-3 border-t border-slate-800">
                      <Acao
                        ativo={minhaReacao?.tipo === "CURTIR"}
                        icone={Heart}
                        titulo="Curtir"
                        onClick={() =>
                          void reagir(post.id, "CURTIR")
                        }
                      />

                      <Acao
                        ativo={minhaReacao?.tipo === "APOIAR"}
                        icone={ThumbsUp}
                        titulo="Apoiar"
                        onClick={() =>
                          void reagir(post.id, "APOIAR")
                        }
                      />

                      <Acao
                        ativo={comentariosAbertos.has(post.id)}
                        icone={MessageCircle}
                        titulo="Comentar"
                        onClick={() =>
                          setComentariosAbertos((atual) => {
                            const novo = new Set(atual);

                            if (novo.has(post.id)) {
                              novo.delete(post.id);
                            } else {
                              novo.add(post.id);
                            }

                            return novo;
                          })
                        }
                      />
                    </div>

                    {comentariosAbertos.has(post.id) ? (
                      <div className="border-t border-slate-800 bg-slate-950/60 p-5">
                        <div className="space-y-3">
                          {comentariosPost.map((comentario) => {
                            const autorComentario =
                              pessoas[
                                String(comentario.usuario_id)
                              ]?.nome ||
                              (String(comentario.usuario_id) ===
                              String(usuario.id)
                                ? usuario.nome || "Usuário"
                                : "Integrante da Guarda");

                            return (
                              <div
                                key={comentario.id}
                                className="flex items-start gap-3"
                              >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                                  <UserRound className="h-4 w-4 text-cyan-300" />
                                </div>

                                <div className="min-w-0 flex-1 rounded-2xl bg-slate-900 p-3">
                                  <p className="text-xs font-black text-white">
                                    {autorComentario}
                                  </p>

                                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                                    {comentario.comentario}
                                  </p>

                                  <p className="mt-1 text-[10px] text-slate-600">
                                    {tempoRelativo(
                                      comentario.criado_em
                                    )}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                          <input
                            value={
                              comentariosTexto[post.id] || ""
                            }
                            onChange={(evento) =>
                              setComentariosTexto(
                                (atual) => ({
                                  ...atual,
                                  [post.id]:
                                    evento.target.value,
                                })
                              )
                            }
                            onKeyDown={(evento) => {
                              if (evento.key === "Enter") {
                                evento.preventDefault();
                                void comentar(post.id);
                              }
                            }}
                            placeholder="Escreva um comentário..."
                            className="h-11 min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 text-sm text-white outline-none placeholder:text-slate-600"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              void comentar(post.id)
                            }
                            className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-600 text-white"
                            aria-label="Enviar comentário"
                          >
                            <Send className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </section>
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Acao({
  ativo,
  icone: Icone,
  titulo,
  onClick,
}: {
  ativo: boolean;
  icone: typeof Heart;
  titulo: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-12 items-center justify-center gap-2 border-r border-slate-800 text-sm font-bold last:border-r-0 ${
        ativo
          ? "bg-cyan-400/10 text-cyan-300"
          : "text-slate-400 hover:bg-slate-900 hover:text-white"
      }`}
    >
      <Icone
        className={`h-5 w-5 ${
          ativo ? "fill-current" : ""
        }`}
      />
      {titulo}
    </button>
  );
}
