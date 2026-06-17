import Link from "next/link";

const cards = [
  {
    titulo: "Guardas",
    icone: "👮",
    href: "/sistema/guardas",
  },
  {
    titulo: "Viaturas",
    icone: "🚓",
    href: "/sistema/viatura",
  },
  {
    titulo: "Guarnições",
    icone: "👥",
    href: "/sistema/guarnicoes",
  },
  {
    titulo: "Locais",
    icone: "📍",
    href: "/sistema/locais",
  },
  {
    titulo: "Pessoas",
    icone: "👤",
    href: "/sistema/pessoas",
  },
  {
    titulo: "Veículos",
    icone: "🚗",
    href: "/sistema/veiculos",
  },
  {
    titulo: "Equipamentos",
    icone: "🦺",
    href: "/sistema/equipamentos",
  },
  {
    titulo: "Aniversariantes",
    icone: "🎂",
    href: "/sistema/aniversariantes",
  },
];

export default function CadastrosPage() {
  return (
    <section className="p-6 text-white">
      <h1 className="text-3xl font-black mb-2">
        👥 Cadastros
      </h1>

      <p className="text-slate-400 mb-6">
        Cadastros gerais do sistema.
      </p>

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

            <h2 className="text-xl font-bold">
              {card.titulo}
            </h2>
          </Link>
        ))}
      </div>
    </section>
  );
}