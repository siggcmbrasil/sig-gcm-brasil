"use client";

import Link from "next/link";
import {
  Globe2,
  Heart,
  MessageCircle,
  MessageSquareText,
  Newspaper,
  ShieldCheck,
  UserCircle,
  Users,
  Wifi,
} from "lucide-react";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function FeedBrasilPage() {
  const posts = [
    {
      id: 1,
      municipio: "Biritinga-BA",
      autor: "Comando GCM",
      texto:
        "A Guarda Municipal de Biritinga iniciou a Operação São João Seguro com reforço do patrulhamento preventivo.",
      data: "29/06/2026 18:20",
      curtidas: 12,
      comentarios: 3,
    },
    {
      id: 2,
      municipio: "Serrinha-BA",
      autor: "GCM Serrinha",
      texto:
        "Novo projeto de Patrulha Escolar será iniciado no próximo mês em parceria com a Secretaria de Educação.",
      data: "29/06/2026 14:05",
      curtidas: 8,
      comentarios: 2,
    },
  ];

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Feed Brasil"
        subtitulo="Rede nacional de comunicação entre municípios do SIG-GCM Brasil."
        icone={Globe2}
      />

      <SigCard>
        <div className="grid md:grid-cols-3 gap-3">
          <Link href="/sistema/feed-brasil/perfil" className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 hover:border-yellow-500/50 transition">
            <UserCircle className="w-7 h-7 text-yellow-400 mb-2" />
            <h3 className="font-black text-white">Perfil</h3>
            <p className="text-sm text-slate-400">Meu perfil na Rede SIG.</p>
          </Link>

          <Link href="/sistema/feed-brasil/curtidas" className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 hover:border-yellow-500/50 transition">
            <Heart className="w-7 h-7 text-yellow-400 mb-2" />
            <h3 className="font-black text-white">Curtidas</h3>
            <p className="text-sm text-slate-400">Interações nas publicações.</p>
          </Link>

          <Link href="/sistema/feed-brasil/comentarios" className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 hover:border-yellow-500/50 transition">
            <MessageCircle className="w-7 h-7 text-yellow-400 mb-2" />
            <h3 className="font-black text-white">Comentários</h3>
            <p className="text-sm text-slate-400">Moderação e respostas.</p>
          </Link>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <Users className="w-8 h-8 text-yellow-400 mb-3" />
          <h3 className="text-lg font-black text-white">Municípios</h3>
          <p className="text-2xl font-black text-white mt-2">02</p>
        </SigCard>

        <SigCard>
          <MessageSquareText className="w-8 h-8 text-emerald-400 mb-3" />
          <h3 className="text-lg font-black text-white">Publicações</h3>
          <p className="text-2xl font-black text-white mt-2">{posts.length}</p>
        </SigCard>

        <SigCard>
          <Newspaper className="w-8 h-8 text-blue-400 mb-3" />
          <h3 className="text-lg font-black text-white">Notícias</h3>
          <p className="text-2xl font-black text-white mt-2">00</p>
        </SigCard>

        <SigCard>
          <Wifi className="w-8 h-8 text-orange-400 mb-3" />
          <h3 className="text-lg font-black text-white">Rede</h3>
          <p className="text-2xl font-black text-white mt-2">Online</p>
        </SigCard>
      </div>

      <SigCard>
        <h3 className="text-xl font-black text-white mb-5">
          Últimas Publicações
        </h3>

        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="font-black text-white">{post.municipio}</p>
                  <p className="text-sm text-slate-400">{post.autor}</p>
                </div>

                <p className="text-xs text-slate-500">{post.data}</p>
              </div>

              <p className="text-slate-300 mt-4 leading-relaxed">
                {post.texto}
              </p>

              <div className="mt-5 flex items-center gap-4 border-t border-slate-800 pt-4">
                <button className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-yellow-400">
                  <Heart className="w-5 h-5" />
                  {post.curtidas} curtidas
                </button>

                <button className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-yellow-400">
                  <MessageCircle className="w-5 h-5" />
                  {post.comentarios} comentários
                </button>
              </div>
            </div>
          ))}
        </div>
      </SigCard>

      <SigCard>
        <div className="flex items-start gap-4">
          <ShieldCheck className="w-10 h-10 text-yellow-400" />
          <div>
            <h3 className="text-lg font-black text-white">
              Funcionalidades Futuras
            </h3>
            <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm text-slate-400">
              <p>• Publicações entre municípios</p>
              <p>• Curtidas e comentários</p>
              <p>• Compartilhamento de projetos</p>
              <p>• Feed nacional de ocorrências relevantes</p>
              <p>• Fotos e vídeos</p>
              <p>• Moderação e auditoria</p>
            </div>
          </div>
        </div>
      </SigCard>
    </div>
  );
}