"use client";

import {
  CarFront,
  FileSearch,
  Plus,
  Users,
} from "lucide-react";

import SigCentralCard from "@/components/sig/SigCentralCard";
import SigCentralHeader from "@/components/sig/SigCentralHeader";

const cards = [
  {
    titulo: "Pessoas Abordadas",
    descricao:
      "Consulta e histórico de pessoas abordadas.",
    href: "/sistema/pessoas",
    icone: Users,
  },
  {
    titulo: "Nova Pessoa",
    descricao:
      "Cadastrar uma nova pessoa abordada.",
    href: "/sistema/pessoas/nova",
    icone: Plus,
  },
  {
    titulo: "Veículos Abordados",
    descricao:
      "Consulta e histórico de veículos abordados.",
    href: "/sistema/veiculos",
    icone: CarFront,
  },
  {
    titulo: "Novo Veículo",
    descricao:
      "Cadastrar um novo veículo abordado.",
    href: "/sistema/veiculos/novo",
    icone: Plus,
  },
  {
    titulo: "Consultas Operacionais",
    descricao:
      "Pesquisar pessoas, veículos e informações operacionais.",
    href: "/sistema/consultas",
    icone: FileSearch,
  },
];

export default function CentralAbordagensPage() {
  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(
          localStorage.getItem("usuarioLogado") ||
            "{}"
        )
      : {};

  const perfil = usuario?.perfil || "";

  const podeVerConsultas =
    perfil === "DESENVOLVEDOR" ||
    perfil === "ADMIN" ||
    perfil === "COMANDANTE" ||
    perfil === "DIRETOR" ||
    perfil === "CMT_GUARNICAO" ||
    perfil === "PLANTONISTA";

  const cardsFiltrados = cards.filter(
    (card) => {
      if (
        card.href ===
        "/sistema/consultas"
      ) {
        return podeVerConsultas;
      }

      return true;
    }
  );

  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central de Abordagens"
        descricao="Pessoas, veículos e consultas operacionais."
        icone={Users}
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