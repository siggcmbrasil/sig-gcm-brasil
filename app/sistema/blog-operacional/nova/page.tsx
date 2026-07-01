"use client";

import { Send, Newspaper } from "lucide-react";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigButton from "@/components/sig/SigButton";

export default function NovaPublicacaoPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <SigPageHeader
        titulo="Nova Publicação"
        subtitulo="Crie uma notícia, comunicado ou informativo operacional."
        icone={Newspaper}
      />

      <SigCard>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold">Título</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none"
              placeholder="Ex: Guarda Municipal realiza operação preventiva"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Categoria</label>
            <select className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none">
              <option>Operacional</option>
              <option>Comunicado</option>
              <option>Institucional</option>
              <option>Treinamento</option>
              <option>Legislação</option>
              <option>Evento</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Resumo</label>
            <textarea
              className="mt-1 min-h-24 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none"
              placeholder="Escreva um resumo curto da publicação..."
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Conteúdo da Publicação</label>
            <textarea
              className="mt-1 min-h-56 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none"
              placeholder="Digite aqui o texto completo da publicação..."
            />
          </div>

          <div className="flex justify-end">
            <SigButton icon={Send}>
              Publicar
            </SigButton>
          </div>
        </div>
      </SigCard>
    </div>
  );
}