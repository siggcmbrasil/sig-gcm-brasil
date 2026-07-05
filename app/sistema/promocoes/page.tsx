"use client";

import {
  Award,
  Star,
  Medal,
  Trophy,
  Shield,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function PromocoesPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Promoções"
        subtitulo="Gestão de promoções, progressões e reconhecimento profissional."
        icone={Award}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <Card
          titulo="Promoções"
          valor="0"
          icone={<Trophy className="w-8 h-8 text-yellow-400" />}
        />

        <Card
          titulo="Em análise"
          valor="0"
          icone={<Star className="w-8 h-8 text-blue-400" />}
        />

        <Card
          titulo="Concluídas"
          valor="0"
          icone={<Medal className="w-8 h-8 text-emerald-400" />}
        />

        <Card
          titulo="Elegíveis"
          valor="0"
          icone={<Shield className="w-8 h-8 text-cyan-400" />}
        />
      </div>

      <SigCard>
        <div className="text-center py-16">
          <Award className="w-20 h-20 mx-auto text-yellow-400 mb-5" />

          <h2 className="text-2xl font-black text-white">
            Módulo em Desenvolvimento
          </h2>

          <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
            Este módulo será responsável pelo gerenciamento de promoções,
            progressões funcionais, histórico de cargos, critérios de
            antiguidade e merecimento, além do acompanhamento completo da
            carreira do servidor.
          </p>
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Funcionalidades previstas
        </h2>

        <div className="grid md:grid-cols-2 gap-3">
          <Item texto="Controle de promoções por antiguidade." />
          <Item texto="Promoções por merecimento." />
          <Item texto="Histórico completo de cargos." />
          <Item texto="Controle de interstício." />
          <Item texto="Registro de atos de promoção." />
          <Item texto="Emissão de relatórios." />
          <Item texto="Integração com RH." />
          <Item texto="Linha do tempo profissional do guarda." />
        </div>
      </SigCard>
    </div>
  );
}

function Card({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: string;
  icone: React.ReactNode;
}) {
  return (
    <SigCard>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-slate-400 text-sm">{titulo}</p>
          <h2 className="text-3xl font-black text-white mt-2">
            {valor}
          </h2>
        </div>

        {icone}
      </div>
    </SigCard>
  );
}

function Item({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 text-slate-300">
      ✅ {texto}
    </div>
  );
}