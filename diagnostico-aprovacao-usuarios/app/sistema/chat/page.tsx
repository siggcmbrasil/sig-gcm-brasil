"use client";

import {
  MessageCircle,
  Send,
  Users,
  Shield,
  Radio,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function ChatPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Chat Institucional"
        subtitulo="Comunicação interna entre equipes, guarnições e setores."
        icone={MessageCircle}
      />

      <div className="grid md:grid-cols-3 gap-6">
        <SigCard>
          <Users className="w-10 h-10 text-cyan-400 mb-4" />

          <h2 className="text-xl font-black text-white">
            Conversas
          </h2>

          <p className="text-slate-400 mt-2">
            Chats entre usuários, equipes e grupos.
          </p>
        </SigCard>

        <SigCard>
          <Radio className="w-10 h-10 text-cyan-400 mb-4" />

          <h2 className="text-xl font-black text-white">
            Grupos Operacionais
          </h2>

          <p className="text-slate-400 mt-2">
            Guarnições, plantões e setores administrativos.
          </p>
        </SigCard>

        <SigCard>
          <Shield className="w-10 h-10 text-cyan-400 mb-4" />

          <h2 className="text-xl font-black text-white">
            Comunicação Segura
          </h2>

          <p className="text-slate-400 mt-2">
            Histórico, auditoria e controle de acesso.
          </p>
        </SigCard>
      </div>

      <SigCard>
        <div className="h-[500px] rounded-2xl border border-slate-800 bg-slate-950/70 flex flex-col">
          <div className="border-b border-slate-800 p-4">
            <h3 className="font-black text-white">
              Em desenvolvimento
            </h3>

            <p className="text-sm text-slate-400 mt-1">
              O chat institucional será integrado futuramente.
            </p>
          </div>

          <div className="flex-1 flex items-center justify-center text-slate-500">
            Nenhuma conversa iniciada.
          </div>

          <div className="border-t border-slate-800 p-4 flex gap-3">
            <input
              disabled
              placeholder="Digite uma mensagem..."
              className="input flex-1 opacity-60"
            />

            <button
              disabled
              className="sig-btn opacity-60"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </SigCard>
    </div>
  );
}