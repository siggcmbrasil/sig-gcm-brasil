"use client";

import Link from "next/link";

const documentos = [
  {
    titulo: "Documentos do Guarda",
    descricao: "RG, CPF, CNH, certificados e documentos pessoais.",
    href: "/sistema/guardas",
    icone: "🪪",
  },
  {
    titulo: "Cursos",
    descricao: "Certificados e capacitações.",
    href: "/sistema/cursos",
    icone: "🎓",
  },
  {
    titulo: "Atestados",
    descricao: "Documentos médicos e afastamentos.",
    href: "/sistema/atestados",
    icone: "🏥",
  },
  {
    titulo: "Licenças",
    descricao: "Documentos referentes às licenças.",
    href: "/sistema/licencas",
    icone: "📄",
  },
  {
    titulo: "Férias",
    descricao: "Controle documental das férias.",
    href: "/sistema/ferias",
    icone: "🏖️",
  },
  {
    titulo: "Advertências",
    descricao: "Documentos disciplinares.",
    href: "/sistema/advertencias",
    icone: "⚠️",
  },
  {
    titulo: "Elogios",
    descricao: "Reconhecimentos e homenagens.",
    href: "/sistema/elogios",
    icone: "🏅",
  },
  {
    titulo: "Histórico Funcional",
    descricao: "Consulta completa do servidor.",
    href: "/sistema/rh/historico",
    icone: "📚",
  },
];

export default function RHDocumentosPage() {
  return (
    <div className="p-6 space-y-6">

      <div className="painel-premium p-6">
        <h1 className="text-3xl font-black">
          Central de Documentos
        </h1>

        <p className="text-slate-400 mt-2">
          Acesso rápido aos documentos e registros funcionais dos servidores.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {documentos.map((doc) => (
          <Link
            key={doc.href}
            href={doc.href}
            className="painel-premium p-5 hover:border-yellow-500/70 transition"
          >
            <p className="text-4xl">{doc.icone}</p>

            <h2 className="text-xl font-black mt-4">
              {doc.titulo}
            </h2>

            <p className="text-slate-400 text-sm mt-2">
              {doc.descricao}
            </p>
          </Link>
        ))}
      </div>

    </div>
  );
}