"use client";

import Link from "next/link";
import {
  Award,
  BadgeCheck,
  ClipboardCheck,
  Medal,
  ShieldCheck,
  Star,
  TriangleAlert,
  UserCheck,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

const itens = [
  {
    nome: "Elogios",
    descricao: "Registros positivos, reconhecimentos e destaques funcionais.",
    rota: "/sistema/elogios",
    icone: Award,
    cor: "text-yellow-400",
  },
  {
    nome: "Advertências",
    descricao: "Controle de advertências e registros disciplinares.",
    rota: "/sistema/advertencias",
    icone: TriangleAlert,
    cor: "text-red-400",
  },
  {
    nome: "Promoções",
    descricao: "Progressões, promoções e evolução na carreira.",
    rota: "/sistema/promocoes",
    icone: BadgeCheck,
    cor: "text-emerald-400",
  },
  {
    nome: "Avaliações",
    descricao: "Avaliações funcionais, desempenho e acompanhamento.",
    rota: "/sistema/avaliacoes",
    icone: ClipboardCheck,
    cor: "text-blue-400",
  },
  {
    nome: "Condecorações",
    descricao: "Medalhas, honrarias, méritos e homenagens institucionais.",
    rota: "/sistema/condecoracoes",
    icone: Medal,
    cor: "text-orange-400",
  },
  {
    nome: "Histórico Funcional",
    descricao: "Linha do tempo completa da vida funcional do servidor.",
    rota: "/sistema/rh/historico",
    icone: UserCheck,
    cor: "text-cyan-400",
  },
];

export default function GestaoFuncionalPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Gestão Funcional"
        subtitulo="Controle de elogios, advertências, promoções, avaliações, condecorações e histórico funcional."
        icone={ShieldCheck}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <ResumoCard titulo="Elogios" valor="0" />
        <ResumoCard titulo="Advertências" valor="0" />
        <ResumoCard titulo="Promoções" valor="0" />
        <ResumoCard titulo="Avaliações" valor="0" />
      </div>

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-3xl bg-yellow-500/10 border border-yellow-500/30 p-4">
            <Star className="w-10 h-10 text-yellow-400" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-black">
              Recursos Humanos
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Vida Funcional do Servidor
            </h2>

            <p className="text-slate-400 mt-2 max-w-4xl leading-relaxed">
              Área preparada para acompanhar registros positivos,
              disciplinares, promoções, avaliações de desempenho,
              condecorações e histórico funcional completo do guarda.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {itens.map((item) => {
          const Icone = item.icone;

          return (
            <Link key={item.nome} href={item.rota}>
              <SigCard className="h-full hover:border-yellow-500/40 hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                <Icone className={`w-11 h-11 ${item.cor} mb-4`} />

                <h2 className="text-xl font-black text-white">
                  {item.nome}
                </h2>

                <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                  {item.descricao}
                </p>
              </SigCard>
            </Link>
          );
        })}
      </div>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Funcionalidades previstas
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          <Item texto="Linha do tempo funcional" />
          <Item texto="Registro de elogios" />
          <Item texto="Registro de advertências" />
          <Item texto="Avaliação de desempenho" />
          <Item texto="Promoção por antiguidade" />
          <Item texto="Promoção por merecimento" />
          <Item texto="Condecorações e medalhas" />
          <Item texto="Relatórios disciplinares" />
          <Item texto="PDF do histórico funcional" />
        </div>
      </SigCard>
    </div>
  );
}

function ResumoCard({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <SigCard>
      <p className="text-slate-400 text-sm">{titulo}</p>

      <h2 className="text-3xl font-black text-white mt-2">
        {valor}
      </h2>

      <p className="text-slate-500 text-xs mt-1">
        Em organização
      </p>
    </SigCard>
  );
}

function Item({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 text-slate-300 font-semibold">
      ✅ {texto}
    </div>
  );
}