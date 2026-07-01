"use client";

import { Globe, Newspaper, Radio } from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";

const cards = [
  {
    titulo: "Feed SIG",
    href: "/sistema/feed-sig",
    descricao: "Notícias, avisos e comunicados internos do SIG.",
    icone: Newspaper,
  },
  {
    titulo: "Feed Brasil",
    href: "/sistema/feed-brasil",
    descricao: "Integração e compartilhamento entre municípios da rede SIG.",
    icone: Globe,
  },
  {
    titulo: "Blog Operacional",
    href: "/sistema/blog-operacional",
    descricao: "Publicações, orientações e conteúdos operacionais.",
    icone: Radio,
  },
];

export default function CentralFeedsPage() {
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central de Feeds"
        descricao="Comunicação, notícias, publicações e integração da rede SIG-GCM Brasil."
        icone={Globe}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
  );
}