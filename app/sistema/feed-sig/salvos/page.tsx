"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bookmark,
  Building2,
  Loader2,
  MessageSquareText,
  Trash2,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import { supabase } from "@/lib/supabase";

type UsuarioLocal = {
  id?: number | string;
  municipio_id?: number;
  municipio_nome?: string;
};

type PostSalvo = {
  id: number;
  post_id: number;
};

type Post = {
  id: number;
  usuario_id: number | string | null;
  municipio_id: number;
  titulo: string | null;
  texto: string;
  imagem_url: string | null;
  criado_em: string;
};

function lerUsuario(): UsuarioLocal {
  try {
    return JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    ) as UsuarioLocal;
  } catch {
    return {};
  }
}

function formatarData(valor: string) {
  const data = new Date(valor);

  return Number.isNaN(data.getTime())
    ? valor
    : data.toLocaleString("pt-BR");
}

export default function FeedSalvosPage() {
  const [usuario] = useState<UsuarioLocal>(() => lerUsuario());
  const [salvos, setSalvos] = useState<PostSalvo[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [removendoId, setRemovendoId] = useState<number | null>(null);
  const [erro, setErro] = useState("");

  async function carregar() {
    if (!usuario.id) {
      setErro("Usuário não identificado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    const salvosResposta = await supabase
      .from("feed_sig_salvos")
      .select("id,post_id")
      .eq("usuario_id", usuario.id)
      .order("criado_em", { ascending: false });

    if (salvosResposta.error) {
      setErro(salvosResposta.error.message);
      setCarregando(false);
      return;
    }

    const listaSalvos =
      (salvosResposta.data as PostSalvo[] | null) || [];
    const idsPosts = listaSalvos.map((item) => item.post_id);

    if (idsPosts.length === 0) {
      setSalvos([]);
      setPosts([]);
      setCarregando(false);
      return;
    }

    const postsResposta = await supabase
      .from("feed_sig")
      .select(
        "id,usuario_id,municipio_id,titulo,texto,imagem_url,criado_em"
      )
      .in("id", idsPosts)
      .eq("status", "PUBLICADO");

    if (postsResposta.error) {
      setErro(postsResposta.error.message);
      setCarregando(false);
      return;
    }

    const mapaPosts = new Map(
      ((postsResposta.data as Post[] | null) || []).map((post) => [
        post.id,
        post,
      ])
    );

    setSalvos(listaSalvos);
    setPosts(
      idsPosts
        .map((id) => mapaPosts.get(id))
        .filter((post): post is Post => Boolean(post))
    );
    setCarregando(false);
  }

  useEffect(() => {
    void carregar();
  }, []);

  async function remover(postId: number) {
    if (!usuario.id) return;

    const salvo = salvos.find((item) => item.post_id === postId);

    if (!salvo) return;

    setRemovendoId(postId);

    const resposta = await supabase
      .from("feed_sig_salvos")
      .delete()
      .eq("id", salvo.id)
      .eq("usuario_id", usuario.id);

    if (resposta.error) {
      alert(resposta.error.message);
      setRemovendoId(null);
      return;
    }

    await carregar();
    setRemovendoId(null);
  }

  return (
    <ProtecaoModulo modulo="feed_sig">
      <main className="sig-page">
        <div className="sig-page-content mx-auto max-w-5xl">
          <SigPageHeader
            titulo="Publicações Salvas"
            subtitulo="Conteúdos que você marcou para consultar depois."
            detalhe={usuario.municipio_nome || "Rede Interna SIG"}
            icone={Bookmark}
            acoes={
              <Link
                href="/sistema/feed-sig"
                className="inline-flex min-h-10 items-center rounded-xl bg-cyan-600 px-4 text-sm font-black text-white"
              >
                Voltar ao Feed
              </Link>
            }
          />

          {erro ? <div className="sig-error">{erro}</div> : null}

          {carregando ? (
            <div className="sig-loading">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
            </div>
          ) : posts.length === 0 ? (
            <SigCard>
              <div className="py-14 text-center">
                <Bookmark className="mx-auto h-12 w-12 text-slate-600" />
                <h2 className="mt-4 text-lg font-black text-white">
                  Nenhuma publicação salva
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Use o botão Salvar nas publicações do Feed SIG.
                </p>
              </div>
            </SigCard>
          ) : (
            <section className="space-y-4">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/80 shadow-xl"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>Município #{post.municipio_id}</span>
                          <span>•</span>
                          <span>{formatarData(post.criado_em)}</span>
                        </div>

                        {post.titulo ? (
                          <h2 className="mt-4 text-xl font-black text-white">
                            {post.titulo}
                          </h2>
                        ) : null}

                        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-200">
                          {post.texto}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => void remover(post.id)}
                        disabled={removendoId === post.id}
                        className="rounded-xl border border-red-400/20 bg-red-400/[0.06] p-2 text-red-300 disabled:opacity-50"
                        aria-label="Remover dos salvos"
                      >
                        {removendoId === post.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {post.imagem_url ? (
                    <img
                      src={post.imagem_url}
                      alt="Imagem da publicação"
                      className="max-h-[620px] w-full bg-black object-contain"
                    />
                  ) : null}

                  <Link
                    href="/sistema/feed-sig"
                    className="flex min-h-12 items-center justify-center gap-2 border-t border-slate-800 text-sm font-black text-cyan-300"
                  >
                    <MessageSquareText className="h-5 w-5" />
                    Abrir no Feed
                  </Link>
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}
