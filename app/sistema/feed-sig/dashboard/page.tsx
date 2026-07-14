"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  FileText,
  Hash,
  Heart,
  Loader2,
  MessageCircle,
  TrendingUp,
  Users,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigStatCard from "@/components/sig/SigStatCard";
import { supabase } from "@/lib/supabase";

type Usuario = {
  perfil?: string;
  municipio_id?: number;
};

type Post = {
  id: number;
  municipio_id: number;
  usuario_id: number | string | null;
  texto: string;
  titulo: string | null;
  criado_em: string;
};

function usuarioLocal(): Usuario {
  try {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  } catch {
    return {};
  }
}

export default function FeedDashboardPage() {
  const [usuario] = useState<Usuario>(() => usuarioLocal());
  const [posts, setPosts] = useState<Post[]>([]);
  const [reacoes, setReacoes] = useState<any[]>([]);
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);

    let postsQuery = supabase
      .from("feed_sig")
      .select("id,municipio_id,usuario_id,texto,titulo,criado_em")
      .eq("status", "PUBLICADO")
      .order("criado_em", { ascending: false })
      .limit(1000);

    if (
      String(usuario.perfil || "").toUpperCase() !== "DESENVOLVEDOR" &&
      usuario.municipio_id
    ) {
      postsQuery = postsQuery.eq("municipio_id", usuario.municipio_id);
    }

    const postsResposta = await postsQuery;
    const listaPosts = (postsResposta.data as Post[] | null) || [];
    const ids = listaPosts.map((post) => post.id);

    const [reacoesResposta, comentariosResposta] = await Promise.all([
      ids.length
        ? supabase.from("feed_sig_reacoes").select("id,post_id,usuario_id").in("post_id", ids)
        : Promise.resolve({ data: [] }),
      ids.length
        ? supabase.from("feed_sig_comentarios").select("id,post_id,usuario_id").in("post_id", ids)
        : Promise.resolve({ data: [] }),
    ]);

    setPosts(listaPosts);
    setReacoes(reacoesResposta.data || []);
    setComentarios(comentariosResposta.data || []);
    setCarregando(false);
  }

  useEffect(() => {
    void carregar();
  }, []);

  const estatisticas = useMemo(() => {
    const usuarios = new Set(posts.map((post) => String(post.usuario_id)));
    const municipios = new Set(posts.map((post) => post.municipio_id));

    const hashtags = new Map<string, number>();
    for (const post of posts) {
      const encontrados = `${post.titulo || ""} ${post.texto || ""}`.match(
        /#[A-Za-zÀ-ÿ0-9_]+/g
      );
      for (const tag of encontrados || []) {
        const chave = tag.toLowerCase();
        hashtags.set(chave, (hashtags.get(chave) || 0) + 1);
      }
    }

    const porPost = posts.map((post) => ({
      post,
      engajamento:
        reacoes.filter((item) => item.post_id === post.id).length +
        comentarios.filter((item) => item.post_id === post.id).length,
    }));

    porPost.sort((a, b) => b.engajamento - a.engajamento);

    return {
      usuarios: usuarios.size,
      municipios: municipios.size,
      hashtags: Array.from(hashtags.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      destaques: porPost.slice(0, 5),
    };
  }, [comentarios, posts, reacoes]);

  return (
    <ProtecaoModulo modulo="feed_sig">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Dashboard do Feed"
            subtitulo="Engajamento, participação e assuntos da Rede Interna SIG."
            detalhe="Inteligência de comunicação"
            icone={BarChart3}
            acoes={
              <Link
                href="/sistema/feed-sig"
                className="inline-flex min-h-10 items-center rounded-xl bg-cyan-600 px-4 text-sm font-black text-white"
              >
                Voltar ao Feed
              </Link>
            }
          />

          {carregando ? (
            <div className="sig-loading">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
            </div>
          ) : (
            <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                <SigStatCard titulo="Publicações" valor={posts.length} subtitulo="Base carregada" icone={FileText} destaque="cyan" />
                <SigStatCard titulo="Reações" valor={reacoes.length} subtitulo="Engajamentos" icone={Heart} destaque="red" />
                <SigStatCard titulo="Comentários" valor={comentarios.length} subtitulo="Interações" icone={MessageCircle} destaque="blue" />
                <SigStatCard titulo="Usuários ativos" valor={estatisticas.usuarios} subtitulo="Autores" icone={Users} destaque="green" />
                <SigStatCard titulo="Municípios" valor={estatisticas.municipios} subtitulo="Participantes" icone={Building2} destaque="amber" />
                <SigStatCard titulo="Hashtags" valor={estatisticas.hashtags.length} subtitulo="Assuntos em alta" icone={Hash} destaque="slate" />
              </section>

              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-7">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                    <TrendingUp className="h-6 w-6 text-cyan-300" />
                    <div>
                      <h2 className="font-black text-white">Publicações com maior engajamento</h2>
                      <p className="text-xs text-slate-500">Reações e comentários</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {estatisticas.destaques.map(({ post, engajamento }, indice) => (
                      <div key={post.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-black text-cyan-300">#{indice + 1}</p>
                            <h3 className="mt-1 truncate font-black text-white">
                              {post.titulo || post.texto.slice(0, 80) || `Publicação ${post.id}`}
                            </h3>
                          </div>
                          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-300">
                            {engajamento} interações
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </SigCard>

                <SigCard className="xl:col-span-5" destaque>
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                    <Hash className="h-6 w-6 text-cyan-300" />
                    <div>
                      <h2 className="font-black text-white">Hashtags em alta</h2>
                      <p className="text-xs text-slate-500">Assuntos mais publicados</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {estatisticas.hashtags.map(([tag, quantidade]) => (
                      <div key={tag} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                        <span className="font-black text-cyan-300">{tag}</span>
                        <span className="text-sm text-slate-400">{quantidade}</span>
                      </div>
                    ))}
                  </div>
                </SigCard>
              </section>
            </>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}
