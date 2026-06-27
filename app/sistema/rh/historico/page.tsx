"use client";

import Link from "next/link";

const itensHistorico = [
  { titulo: "Cursos", href: "/sistema/cursos", icone: "🎓" },
  { titulo: "Férias", href: "/sistema/ferias", icone: "🏖️" },
  { titulo: "Licenças", href: "/sistema/licencas", icone: "📄" },
  { titulo: "Atestados", href: "/sistema/atestados", icone: "🏥" },
  { titulo: "Elogios", href: "/sistema/elogios", icone: "🏅" },
  { titulo: "Advertências", href: "/sistema/advertencias", icone: "⚠️" },
  { titulo: "Banco de Horas", href: "/sistema/banco-horas", icone: "⏱️" },
  { titulo: "Registro de Ponto", href: "/sistema/registro-ponto", icone: "🕒" },
];

export default function RHHistoricoPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-3xl font-black">Histórico Funcional</h1>
        <p className="text-slate-400 mt-2">
          Central de consulta do histórico funcional dos guardas.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {itensHistorico.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="painel-premium p-5 hover:border-yellow-500/70 transition"
          >
            <p className="text-4xl">{item.icone}</p>
            <h2 className="text-xl font-black mt-4">{item.titulo}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}