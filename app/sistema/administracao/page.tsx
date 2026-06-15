import Link from "next/link";

const cards = [
  { titulo: "Usuários", icone: "👤", href: "/sistema/usuarios" },
  { titulo: "Municípios", icone: "🏛️", href: "/sistema/municipios" },
  { titulo: "Painel Desenvolvedor", icone: "🧠", href: "/sistema/desenvolvedor" },
  { titulo: "Configurações", icone: "⚙️", href: "/sistema/configuracoes" },
  { titulo: "Meu Perfil", icone: "👤", href: "/sistema/perfil" },
  { titulo: "Sobre o Sistema", icone: "ℹ️", href: "/sistema/sobre" },
];

export default function AdministracaoPage() {
  return (
    <section className="p-6 text-white">
      <h1 className="text-3xl font-black mb-2">
        ⚙️ Administração
      </h1>

      <p className="text-slate-400 mb-6">
        Configurações e gerenciamento do sistema.
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