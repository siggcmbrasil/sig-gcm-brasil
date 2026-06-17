import Link from "next/link";

const cards = [
  {
    titulo: "Relatórios",
    icone: "📋",
    href: "/sistema/relatorios",
  },
  {
    titulo: "Estatísticas",
    icone: "📊",
    href: "/sistema/estatisticas",
  },
  {
    titulo: "Ofícios",
    icone: "📄",
    href: "/sistema/oficios",
  },
  {
    titulo: "Dossiês",
    icone: "👮",
    href: "/sistema/guardas",
  },
  {
    titulo: "Banco de Horas",
    icone: "⏱️",
    href: "/sistema/banco-horas",
  },
];

export default function GestaoPage() {
  return (
    <section className="p-6 text-white">
      <h1 className="text-3xl font-black mb-2">📊 Gestão</h1>
      <p className="text-slate-400 mb-6">
        Documentos, relatórios e controle administrativo-operacional.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="painel-premium p-6 hover:scale-105 transition"
          >
            <div className="text-5xl mb-4">{card.icone}</div>
            <h2 className="text-xl font-bold">{card.titulo}</h2>
          </Link>
        ))}
      </div>
    </section>
  );
}