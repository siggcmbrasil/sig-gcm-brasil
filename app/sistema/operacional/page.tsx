import Link from "next/link";

const cards = [
  {
    titulo: "Ocorrências",
    icone: "🚨",
    href: "/sistema/ocorrencias",
  },
  {
    titulo: "Chamados",
    icone: "📞",
    href: "/sistema/chamados",
  },
  {
    titulo: "Patrulhamento",
    icone: "🚔",
    href: "/sistema/patrulhamento",
  },
  {
    titulo: "Mapa Operacional",
    icone: "🗺️",
    href: "/sistema/mapa-operacional",
  },
  {
    titulo: "Patrulhamento GPS",
    icone: "📍",
    href: "/sistema/localizacao",
  },
  {
    titulo: "Plano de Rondas",
    icone: "🚓",
    href: "/sistema/rondas",
  },
  {
    titulo: "IA Operacional",
    icone: "🤖",
    href: "/sistema/ia",
  },
  {
    titulo: "Legislação",
    icone: "⚖️",
    href: "/sistema/legislacao",
  },
];

export default function OperacionalPage() {
  return (
    <section className="p-6">
      <h1 className="text-3xl font-black text-white mb-6">
        🚔 Centro Operacional
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="painel-premium p-6 hover:scale-105 transition"
          >
            <div className="text-5xl mb-4">
              {card.icone}
            </div>

            <h2 className="text-xl font-bold text-white">
              {card.titulo}
            </h2>
          </Link>
        ))}
      </div>
    </section>
  );
}