"use client";

import {
  AlertTriangle,
  PhoneCall,
  CarFront,
  Shield,
  Users,
  Handshake,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";

const cards = [
  {
    titulo: "Central de Patrulhamento",
    icone: CarFront,
    href: "/sistema/patrulhamento",
    descricao: "Patrulhamentos, GPS, rotas, histórico e rastreamento.",
  },
  {
    titulo: "Visitas Preventivas",
    icone: Handshake,
    href: "/sistema/patrulhamento/visitas",
    descricao: "Pontos visitados, QR Code, check-in e visitas comunitárias.",
  },
  {
    titulo: "Consultas Operacionais",
    icone: Users,
    href: "/sistema/consultas",
    descricao: "Consulta de pessoas, veículos e informações operacionais.",
  },
  {
    titulo: "Central de Abordagens",
    icone: Users,
    href: "/sistema/abordagens",
    descricao: "Pessoas, veículos, consultas e histórico de abordagens.",
  },
  {
    titulo: "Operações Integradas",
    icone: Shield,
    href: "/sistema/operacoes",
    descricao:
      "Blitze, barreiras, operações especiais, escoltas e apoios em uma única central.",
  },
];

export default function OperacionalPage() {
  const usuario =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : {};

const perfil = usuario?.perfil || "";

const podeVerConsultas =
  perfil === "DESENVOLVEDOR" ||
  perfil === "ADMIN" ||
  perfil === "COMANDANTE" ||
  perfil === "DIRETOR" ||
  perfil === "CMT_GUARNICAO" ||
  perfil === "PLANTONISTA";

const cardsFiltrados = cards.filter((card) => {
  if (card.href === "/sistema/consultas") {
    return podeVerConsultas;
  }

  return true;
});
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Centro Operacional"
        descricao="Execução operacional, patrulhamento, visitas preventivas, consultas, apoios e operações."
        icone={Shield}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {cardsFiltrados.map((card) => (
          <SigCentralCard
            key={card.href}
            titulo={card.titulo}
            descricao={card.descricao}
            href={card.href}
            icone={card.icone}
          />
        ))}
      </div>
    </section>
  );
}