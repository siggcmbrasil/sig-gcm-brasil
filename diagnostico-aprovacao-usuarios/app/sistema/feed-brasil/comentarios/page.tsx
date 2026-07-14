"use client";

import {
  AlertTriangle,
  CheckCircle,
  MessageCircle,
  MessageSquareText,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import ProtecaoModulo from "@/components/ProtecaoModulo";

export default function ComentariosPage() {
  const comentarios = [
    {
      id: 1,
      autor: "GCM Biritinga",
      municipio: "Biritinga-BA",
      texto: "Excelente iniciativa. Esse tipo de operação fortalece a integração entre os municípios.",
      data: "29/06/2026 19:40",
      status: "Aprovado",
    },
    {
      id: 2,
      autor: "Comando Serrinha",
      municipio: "Serrinha-BA",
      texto: "Projeto importante para aproximar a Guarda Municipal da comunidade escolar.",
      data: "29/06/2026 17:12",
      status: "Pendente",
    },
  ];

  return (
  <ProtecaoModulo modulo="feed_brasil">
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Comentários"
        subtitulo="Moderação e acompanhamento de comentários do Feed Brasil."
        icone={MessageCircle}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <MessageSquareText className="w-8 h-8 text-yellow-400 mb-3" />
          <h3 className="text-lg font-black text-white">Comentários</h3>
          <p className="text-2xl font-black text-white mt-2">02</p>
        </SigCard>

        <SigCard>
          <CheckCircle className="w-8 h-8 text-emerald-400 mb-3" />
          <h3 className="text-lg font-black text-white">Aprovados</h3>
          <p className="text-2xl font-black text-white mt-2">01</p>
        </SigCard>

        <SigCard>
          <AlertTriangle className="w-8 h-8 text-orange-400 mb-3" />
          <h3 className="text-lg font-black text-white">Pendentes</h3>
          <p className="text-2xl font-black text-white mt-2">01</p>
        </SigCard>

        <SigCard>
          <Users className="w-8 h-8 text-blue-400 mb-3" />
          <h3 className="text-lg font-black text-white">Autores</h3>
          <p className="text-2xl font-black text-white mt-2">02</p>
        </SigCard>
      </div>

      <SigCard>
        <h3 className="text-xl font-black text-white mb-5">
          Comentários Recentes
        </h3>

        <div className="space-y-4">
          {comentarios.map((comentario) => (
            <div
              key={comentario.id}
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="font-black text-white">
                    {comentario.autor}
                  </p>

                  <p className="text-sm text-slate-400">
                    {comentario.municipio}
                  </p>
                </div>

                <span
                  className={
                    comentario.status === "Aprovado"
                      ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30"
                      : "rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400 border border-orange-500/30"
                  }
                >
                  {comentario.status}
                </span>
              </div>

              <p className="text-slate-300 mt-4 leading-relaxed">
                {comentario.texto}
              </p>

              <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <p className="text-xs text-slate-500">
                  {comentario.data}
                </p>

                <div className="flex gap-2">
                  <button className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 transition">
                    <CheckCircle className="w-4 h-4" />
                    Aprovar
                  </button>

                  <button className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 transition">
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </button>
                </div>
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
              Moderação do Feed Brasil
            </h3>

            <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm text-slate-400">
              <p>• Aprovar comentários</p>
              <p>• Remover comentários inadequados</p>
              <p>• Registrar auditoria da moderação</p>
              <p>• Identificar autor e município</p>
              <p>• Denúncia de conteúdo</p>
              <p>• Bloqueio por perfil</p>
              <p>• Comentários apenas para usuários autorizados</p>
              <p>• Integração com permissões do sistema</p>
            </div>
          </div>
        </div>
      </SigCard>
        </div>
  </ProtecaoModulo>
);
}