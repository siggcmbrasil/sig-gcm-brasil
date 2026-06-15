import Link from "next/link";

const cards = [
  { titulo: "Escalas", icone: "📅", href: "/sistema/escalas" },
  { titulo: "Escala Mensal", icone: "🗓️", href: "/sistema/escala-mensal" },
  { titulo: "Modelos", icone: "⚙️", href: "/sistema/escalas/modelos" },
  { titulo: "Configuração", icone: "🧭", href: "/sistema/escalas/configuracao" },
  { titulo: "Permutas", icone: "🔁", href: "/sistema/escalas/permutas" },
  { titulo: "Guarnições", icone: "👥", href: "/sistema/guarnicoes" },
];

export default function EscalasMenuPage() {
  return (
    <section className="p-6 text-white">
      <h1 className="text-3xl font-black mb-2">
        📅 Escalas
      </h1>

      <p className="text-slate-400 mb-6">
        Gestão completa das escalas operacionais.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="painel-premium p-6 hover:scale-105 transition"
          >
            <div className="text-5xl mb-4">
              {card.icone}
            </div>

            <h2 className="text-xl font-bold">
              {card.titulo}
            </h2>
          </Link>
        ))}
      </div>
    </section>
  );
}