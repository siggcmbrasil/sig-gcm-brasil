import Link from "next/link";

const cards = [
  {
    titulo: "IA Operacional",
    icone: "🤖",
    href: "/sistema/ia",
  },
  {
    titulo: "IA Jurídica",
    icone: "⚖️",
    href: "/sistema/ia-juridica",
  },
  {
    titulo: "IA Legislação",
    icone: "📚",
    href: "/sistema/legislacao",
  },
  {
    titulo: "IA Relatórios",
    icone: "📄",
    href: "/sistema/relatorios",
  },
  {
    titulo: "IA Estatística",
    icone: "📊",
    href: "/sistema/estatisticas",
  },
];

export default function InteligenciaPage() {
  return (
    <section className="p-6 text-white">
      <h1 className="text-3xl font-black mb-2">
        🧠 Central de Inteligência
      </h1>

      <p className="text-slate-400 mb-6">
        Ferramentas inteligentes do SIG-GCM Brasil.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="painel-premium p-6 hover:scale-105 transition"
          >
            <div className="text-5xl mb-4">{card.icone}</div>

            <h2 className="text-xl font-bold">
              {card.titulo}
            </h2>
          </Link>
        ))}
      </div>
    </section>
  );
}