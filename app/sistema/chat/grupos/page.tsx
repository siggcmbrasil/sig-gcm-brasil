"use client";

import {
  MessageCircle,
  Users,
  ShieldCheck,
  PlusCircle,
  Radio,
  Lock,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function GruposChatPage() {
  const grupos = [
    {
      nome: "Plantão Atual",
      tipo: "Operacional",
      membros: 8,
      status: "Ativo",
    },
    {
      nome: "Guarnição Alfa",
      tipo: "Guarnição",
      membros: 4,
      status: "Ativo",
    },
    {
      nome: "Comando",
      tipo: "Administrativo",
      membros: 3,
      status: "Restrito",
    },
  ];

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Grupos"
        subtitulo="Grupos de comunicação interna do SIG-GCM Brasil."
        icone={MessageCircle}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <Users className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-lg font-black text-white">Grupos</h3>
          <p className="text-2xl font-black text-white mt-2">03</p>
        </SigCard>

        <SigCard>
          <Radio className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-lg font-black text-white">Operacionais</h3>
          <p className="text-2xl font-black text-white mt-2">02</p>
        </SigCard>

        <SigCard>
          <Lock className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-lg font-black text-white">Restritos</h3>
          <p className="text-2xl font-black text-white mt-2">01</p>
        </SigCard>

        <SigCard>
          <ShieldCheck className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-lg font-black text-white">Segurança</h3>
          <p className="text-sm text-yellow-400 mt-2">Com auditoria</p>
        </SigCard>
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h3 className="text-xl font-black text-white">
              Grupos Disponíveis
            </h3>

            <p className="text-sm text-slate-400 mt-1">
              Lista demonstrativa dos grupos de comunicação.
            </p>
          </div>

          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-400 transition">
            <PlusCircle className="w-5 h-5" />
            Novo Grupo
          </button>
        </div>

        <div className="space-y-4">
          {grupos.map((grupo) => (
            <div
              key={grupo.nome}
              className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-5"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h4 className="text-xl font-black text-white">
                    {grupo.nome}
                  </h4>

                  <p className="text-sm text-yellow-400 mt-1">
                    {grupo.tipo} • {grupo.membros} membros
                  </p>
                </div>

                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-400">
                  {grupo.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </SigCard>
    </div>
  );
}