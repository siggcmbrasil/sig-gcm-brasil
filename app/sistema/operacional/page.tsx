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
    titulo: "Legislação",
    icone: "⚖️",
    href: "/sistema/legislacao",
  },
  {
    titulo: "IA Operacional",
    icone: "🤖",
    href: "/sistema/ia",
  },
  {
    titulo: "IA Jurídica",
    icone: "📚",
    href: "/sistema/legislacao/ia",
  },
];

export default function OperacionalPage() {
  return (
    <section className="p-6">
      <h1 className="text-3xl font-black text-white mb-6">
        🚔 Centro Operacional
      </h1>

      <div className="grid md:grid-cols-3 gap-5">
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