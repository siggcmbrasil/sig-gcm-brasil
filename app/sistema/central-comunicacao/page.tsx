"use client";

import {
  MessageCircle,
  Megaphone,
  CalendarDays,
  Bell,
  Newspaper,
  Globe,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";

const cards = [
  {
    titulo: "Chat Interno",
    href: "/sistema/chat",
    descricao: "Comunicação interna entre usuários e equipes.",
    icone: MessageCircle,
  },
  {
    titulo: "Agenda Institucional",
    href: "/sistema/agenda-institucional",
    descricao: "Agenda de compromissos e eventos oficiais.",
    icone: CalendarDays,
  },
  {
    titulo: "Avisos",
    href: "/sistema/avisos",
    descricao: "Publicação de avisos internos.",
    icone: Megaphone,
  },
  {
    titulo: "Notificações",
    href: "/sistema/notificacoes",
    descricao: "Alertas automáticos e notificações.",
    icone: Bell,
  },
  {
  titulo: "Feed SIG",
  icone: Newspaper,
  href: "/sistema/feed-sig",
  descricao: "Atualizações, notícias e comunicados do SIG-GCM Brasil.",
},
{
  titulo: "Feed Brasil",
  icone: Globe,
  href: "/sistema/feed-brasil",
  descricao: "Integração e compartilhamento entre municípios da rede SIG.",
},
{
  titulo: "Blog Operacional",
  icone: Newspaper,
  href: "/sistema/blog-operacional",
  descricao: "Publicações, orientações e conteúdos operacionais.",
},
];

export default function CentralComunicacaoPage() {
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central de Comunicação"
        descricao="Comunicação institucional, avisos, agenda e interação entre usuários."
        icone={MessageCircle}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {cards.map((card) => (
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