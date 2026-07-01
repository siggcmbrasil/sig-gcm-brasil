"use client";

import {
  BarChart3,
  Heart,
  HeartHandshake,
  MessageSquareText,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function CurtidasPage() {
  const curtidas = [
    {
      id: 1,
      autor: "GCM Biritinga",
      municipio: "Biritinga-BA",
      publicacao: "Operação São João Seguro",
      data: "29/06/2026 20:10",
    },
    {
      id: 2,
      autor: "Comando Serrinha",
      municipio: "Serrinha-BA",
      publicacao: "Patrulha Escolar",
      data: "29/06/2026 18:45",
    },
  ];

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Curtidas"
        subtitulo="Acompanhamento de interações nas publicações do Feed Brasil."
        icone={Heart}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <Heart className="w-8 h-8 text-yellow-400 mb-3" />
          <h3 className="text-lg font-black text-white">Curtidas</h3>
          <p className="text-2xl font-black text-white mt-2">02</p>
        </SigCard>

        <SigCard>
          <Users className="w-8 h-8 text-emerald-400 mb-3" />
          <h3 className="text-lg font-black text-white">Usuários</h3>
          <p className="text-2xl font-black text-white mt-2">02</p>
        </SigCard>

        <SigCard>
          <MessageSquareText className="w-8 h-8 text-blue-400 mb-3" />
          <h3 className="text-lg font-black text-white">Publicações</h3>
          <p className="text-2xl font-black text-white mt-2">02</p>
        </SigCard>

        <SigCard>
          <TrendingUp className="w-8 h-8 text-orange-400 mb-3" />
          <h3 className="text-lg font-black text-white">Engajamento</h3>
          <p className="text-2xl font-black text-white mt-2">Alto</p>
        </SigCard>
      </div>

      <SigCard>
        <h3 className="text-xl font-black text-white mb-5">
          Últimas Curtidas
        </h3>

        <div className="space-y-4">
          {curtidas.map((curtida) => (
            <div
              key={curtida.id}
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-3">
                  <Heart className="w-6 h-6 text-yellow-400" />
                </div>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <p className="font-black text-white">
                        {curtida.autor}
                      </p>

                      <p className="text-sm text-slate-400">
                        {curtida.municipio}
                      </p>
                    </div>

                    <p className="text-xs text-slate-500">
                      {curtida.data}
                    </p>
                  </div>

                  <p className="text-slate-300 mt-3">
                    Curtiu a publicação:
                    <span className="font-bold text-yellow-400">
                      {" "}
                      {curtida.publicacao}
                    </span>
                  </p>
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
              Regras das Curtidas
            </h3>

            <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm text-slate-400">
              <p>• Curtidas apenas por usuários logados</p>
              <p>• Uma curtida por usuário em cada publicação</p>
              <p>• Registro de usuário e município</p>
              <p>• Controle contra duplicidade</p>
              <p>• Auditoria das interações</p>
              <p>• Integração com Feed Brasil</p>
              <p>• Métricas de engajamento</p>
              <p>• Ranking de publicações mais curtidas</p>
            </div>
          </div>
        </div>
      </SigCard>

      <SigCard>
        <div className="flex items-start gap-4">
          <BarChart3 className="w-10 h-10 text-slate-500" />

          <div>
            <h3 className="text-lg font-black text-white">
              Estatísticas Futuras
            </h3>

            <p className="text-slate-400 mt-2">
              Esta área poderá exibir gráficos de engajamento, publicações mais
              curtidas, municípios mais ativos e participação dos usuários na
              Rede SIG-GCM Brasil.
            </p>
          </div>
        </div>
      </SigCard>
    </div>
  );
}