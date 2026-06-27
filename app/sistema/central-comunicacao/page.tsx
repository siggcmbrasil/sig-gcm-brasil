import Link from "next/link";
import {
  MessageCircle,
  Megaphone,
  CalendarDays,
  Bell,
  Newspaper,
  Radio,
  Mail,
  Users,
} from "lucide-react";

const cards = [
  {
    titulo: "Chat Interno",
    icone: MessageCircle,
    href: "/sistema/chat",
    descricao: "Comunicação interna entre usuários e equipes.",
  },
  {
    titulo: "Comunicação",
    icone: Radio,
    href: "/sistema/comunicacao",
    descricao: "Central de comunicação institucional e operacional.",
  },
  {
    titulo: "Agenda Institucional",
    icone: CalendarDays,
    href: "/sistema/agenda-institucional",
    descricao: "Agenda de compromissos, eventos e atividades oficiais.",
  },
  {
    titulo: "Avisos",
    icone: Megaphone,
    href: "/sistema/avisos",
    descricao: "Publicação de avisos internos e comunicados.",
  },
  {
    titulo: "Notificações",
    icone: Bell,
    href: "/sistema/notificacoes",
    descricao: "Alertas automáticos e notificações importantes.",
  },
  {
    titulo: "Feed SIG",
    icone: Newspaper,
    href: "/sistema/feed-sig",
    descricao: "Atualizações, notícias e comunicados do SIG-GCM Brasil.",
  },
  {
    titulo: "Blog Operacional",
    icone: Newspaper,
    href: "/sistema/blog-operacional",
    descricao: "Conteúdos, orientações e informativos operacionais.",
  },
  {
    titulo: "Mensagens",
    icone: Mail,
    href: "/sistema/chat",
    descricao: "Mensagens internas e troca de informações.",
  },
];

export default function CentralComunicacaoPage() {
  return (
    <section className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-4xl font-black text-white">
          📢 Central de Comunicação
        </h1>

        <p className="text-slate-400 mt-2">
          Comunicação institucional, avisos, mensagens, agenda e notificações.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card) => {
          const Icone = card.icone;

          return (
            <Link
              key={card.href + card.titulo}
              href={card.href}
              className="painel-premium p-6 hover:scale-[1.02] hover:border-blue-500/40 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Icone className="w-9 h-9 text-cyan-400" />
                </div>

                <span className="text-green-400 text-xs font-black">
                  ONLINE
                </span>
              </div>

              <h2 className="text-2xl font-black text-white">
                {card.titulo}
              </h2>

              <p className="text-slate-400 text-sm mt-2">
                {card.descricao}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}