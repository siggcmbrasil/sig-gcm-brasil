"use client";

import { useState } from "react";
import {
  MessageCircle,
  Search,
  User,
  Users,
  ShieldCheck,
  Clock,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function ConversasPage() {
  const [busca, setBusca] = useState("");
  const conversas = [
    {
      nome: "Comando GCM",
      tipo: "Individual",
      ultimaMensagem: "Verificar escala do próximo plantão.",
      horario: "08:40",
      status: "Online",
    },
    {
      nome: "Guarnição Alfa",
      tipo: "Grupo",
      ultimaMensagem: "Equipe em deslocamento para ronda preventiva.",
      horario: "07:15",
      status: "Ativo",
    },
    {
      nome: "Central de Comunicação",
      tipo: "Canal",
      ultimaMensagem: "Comunicado institucional publicado.",
      horario: "Ontem",
      status: "Informativo",
    },
  ];

  const conversasFiltradas = conversas.filter((conversa) =>
  `${conversa.nome} ${conversa.tipo} ${conversa.ultimaMensagem}`
    .toLowerCase()
    .includes(busca.toLowerCase())
);

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Conversas"
        subtitulo="Mensagens internas, grupos e canais do SIG-GCM Brasil."
        icone={MessageCircle}
      />

      <SigCard>
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-cyan-400" />

          <input
  type="text"
  placeholder="Buscar conversa..."
  className="input"
  value={busca}
  onChange={(e) => setBusca(e.target.value)}
/>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-3 gap-4">
        <SigCard>
          <MessageCircle className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-lg font-black text-white">Conversas</h3>
          <p className="text-2xl font-black text-white mt-2">{conversas.length}</p>
        </SigCard>

        <SigCard>
          <Users className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-lg font-black text-white">Grupos</h3>
          <p className="text-2xl font-black text-white mt-2">{conversas.filter((c) => c.tipo === "Grupo").length}</p>
        </SigCard>

        <SigCard>
          <ShieldCheck className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-lg font-black text-white">Canais</h3>
          <p className="text-2xl font-black text-white mt-2">{conversas.filter((c) => c.tipo === "Canal").length}</p>
        </SigCard>
      </div>

      <SigCard>
        <h3 className="text-xl font-black text-white mb-5">
          Últimas Conversas
        </h3>

        <div className="space-y-3">
          {conversasFiltradas.map((conversa) => (
            <div
              key={conversa.nome}
              className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-5 hover:border-cyan-400/50 transition"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                  {conversa.tipo === "Individual" ? (
                    <User className="w-7 h-7 text-cyan-400" />
                  ) : (
                    <Users className="w-7 h-7 text-cyan-400" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <h4 className="text-lg font-black text-white">
                        {conversa.nome}
                      </h4>

                      <p className="text-xs text-yellow-400 font-bold">
                        {conversa.tipo}
                      </p>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {conversa.horario}
                    </div>
                  </div>

                  <p className="text-sm text-slate-400 mt-3">
                    {conversa.ultimaMensagem}
                  </p>

                  <span className="inline-flex mt-3 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-400">
                    {conversa.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SigCard>
    </div>
  );
}