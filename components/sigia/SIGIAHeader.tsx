"use client";

import { BadgeCheck, Bot, Cpu, Sparkles } from "lucide-react";

type Usuario = {
  nome?: string;
  perfil?: string;
  municipio_id?: number;
};

export default function SIGIAHeader({
  usuario,
}: {
  usuario: Usuario | null;
}) {
  return (
    <div className="relative overflow-hidden border-b border-cyan-400/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.14),transparent_34%),linear-gradient(135deg,#08172f,#040d1d)] px-4 py-5 md:px-6 md:py-6">
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" />
            Super IA do SIG-GCM Brasil
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/10 text-cyan-200">
              <Bot className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-[-0.04em] text-white md:text-3xl">
                SIGIA Intelligence
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Assistente operacional, jurídico e estratégico em experiência premium.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[540px]">
          <InfoChip titulo="Status" valor="Online" icone={BadgeCheck} destaque="emerald" />
          <InfoChip titulo="Motor" valor="IA Avançada" icone={Cpu} destaque="cyan" />
          <InfoChip
            titulo="Contexto"
            valor={usuario?.perfil || "Assistente"}
            icone={Sparkles}
            destaque="blue"
          />
        </div>
      </div>

      {usuario ? (
        <div className="relative mt-5 grid gap-3 rounded-[24px] border border-white/10 bg-white/[.04] p-4 md:grid-cols-3">
          <Dados titulo="Usuário" valor={usuario.nome || "Não identificado"} />
          <Dados titulo="Perfil" valor={usuario.perfil || "Não informado"} destaque />
          <Dados titulo="Município" valor={String(usuario.municipio_id ?? "—")} />
        </div>
      ) : null}
    </div>
  );
}

function InfoChip({
  titulo,
  valor,
  icone: Icone,
  destaque,
}: {
  titulo: string;
  valor: string;
  icone: typeof Bot;
  destaque: "emerald" | "cyan" | "blue";
}) {
  const classes = {
    emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
    blue: "border-blue-400/20 bg-blue-400/10 text-blue-300",
  }[destaque];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.03] p-3">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${classes}`}>
          <Icone className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{titulo}</p>
          <p className="truncate text-sm font-black text-white">{valor}</p>
        </div>
      </div>
    </div>
  );
}

function Dados({ titulo, valor, destaque = false }: { titulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#020817]/65 p-4">
      <p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{titulo}</p>
      <p className={`mt-2 text-sm font-black ${destaque ? 'text-cyan-300' : 'text-white'}`}>{valor}</p>
    </div>
  );
}
