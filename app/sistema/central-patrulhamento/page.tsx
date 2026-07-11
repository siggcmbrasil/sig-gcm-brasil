"use client";

import {
  Activity,
  CarFront,
  ClipboardList,
  History,
  Map,
  Route,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";
import ProtecaoModulo from "@/components/ProtecaoModulo";

const cards = [
  {
    titulo: "Novo Patrulhamento",
    descricao: "Inicie um novo patrulhamento e ative o rastreamento GPS.",
    href: "/sistema/patrulhamento/novo",
    icone: Route,
  },
  {
    titulo: "Histórico de Patrulhamentos",
    descricao: "Consulte patrulhamentos realizados, horários, equipes e status.",
    href: "/sistema/patrulhamento/historico",
    icone: History,
  },
  {
    titulo: "Mapa de Patrulhamento",
    descricao: "Visualização geográfica das equipes, rotas e pontos registrados.",
    href: "/sistema/patrulhamento/rotas",
    icone: Map,
  },
  {
    titulo: "Rastreamento em Tempo Real",
    descricao: "Monitoramento das equipes em serviço pelo GPS.",
    href: "/sistema/localizacao",
    icone: Activity,
  },
  {
    titulo: "Visitas e QR Code",
    descricao: "Pontos visitados, check-in, QR Code e presença preventiva.",
    href: "/sistema/patrulhamento/visitas",
    icone: ClipboardList,
  },
  {
    titulo: "Gerar QR Code",
    descricao: "Cadastrar ponto de visita e gerar QR Code institucional.",
    href: "/sistema/patrulhamento/visitas/qrcode",
    icone: ClipboardList,
  },
];

export default function CentralPatrulhamentoPage() {
  return (
    <ProtecaoModulo modulo="patrulhamento">
      <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central de Patrulhamento"
        descricao="Controle dos patrulhamentos, equipes, rastreamento, histórico e visitas preventivas."
        icone={CarFront}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {cards.map((card) => (
          <SigCentralCard
            key={`${card.href}-${card.titulo}`}
            titulo={card.titulo}
            descricao={card.descricao}
            href={card.href}
            icone={card.icone}
          />
        ))}
      </div>
          </section>
    </ProtecaoModulo>
  );
}