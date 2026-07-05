"use client";

import Link from "next/link";
import {
  BookOpen,
  Scale,
  Search,
  Gavel,
  FileText,
  ShieldCheck,
  Brain,
  Library,
} from "lucide-react";

export default function LegislacaoPage() {
  const cards = [
    {
      titulo: "Constituição Federal",
      descricao: "Direitos, deveres e segurança pública.",
      href: "/sistema/legislacao/constituicao",
      icone: Scale,
    },
    {
      titulo: "Leis da Guarda Municipal",
      descricao: "Estatuto Geral e legislação específica.",
      href: "/sistema/legislacao/guardas",
      icone: ShieldCheck,
    },
    {
      titulo: "Código Penal",
      descricao: "Principais crimes e infrações penais.",
      href: "/sistema/legislacao/codigo-penal",
      icone: Gavel,
    },
    {
      titulo: "Código de Trânsito",
      descricao: "Leis e infrações de trânsito.",
      href: "/sistema/legislacao/ctb",
      icone: FileText,
    },
    {
      titulo: "Legislação Municipal",
      descricao: "Leis, decretos e normas locais.",
      href: "/sistema/legislacao/municipal",
      icone: Library,
    },
    {
      titulo: "Pesquisa Jurídica",
      descricao: "Pesquise artigos e legislações.",
      href: "/sistema/legislacao/pesquisa",
      icone: Search,
    },
    {
      titulo: "IA Jurídica",
      descricao: "Assistente inteligente para consultas.",
      href: "/sistema/ia-juridica",
      icone: Brain,
    },
    {
  titulo: "Legislação em Áudio",
  descricao: "Leis, artigos e resumos jurídicos em formato de áudio.",
  href: "/sistema/legislacao/audio",
  icone: BookOpen,
},
{
  titulo: "Flashcards",
  descricao: "Perguntas e respostas rápidas para revisão.",
  href: "/sistema/legislacao/flashcards",
  icone: Brain,
},
{
  titulo: "Mapas Mentais",
  descricao: "Resumos visuais para estudo jurídico e operacional.",
  href: "/sistema/legislacao/mapas-mentais",
  icone: Library,
},
{
  titulo: "Banco de Questões",
  descricao: "Questões objetivas para estudo e capacitação.",
  href: "/sistema/legislacao/questoes",
  icone: FileText,
},
{
  titulo: "Simulados",
  descricao: "Provas, treinamentos e preparação para concursos.",
  href: "/sistema/legislacao/simulados",
  icone: Scale,
},
  ];

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">

      <div className="painel-premium p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-cyan-400" />
          </div>

          <div>
            <p className="text-cyan-400 font-bold uppercase tracking-widest text-xs">
              Biblioteca Jurídica
            </p>

            <h1 className="text-3xl md:text-4xl font-black text-white">
              SIG Legislação
            </h1>

            <p className="text-slate-400 mt-2">
              Consulta rápida de leis, códigos, estatutos,
              legislação municipal e inteligência jurídica.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {cards.map((card) => {
          const Icone = card.icone;

          return (
            <Link
              key={card.titulo}
              href={card.href}
              className="
                painel-premium
                p-6
                hover:scale-[1.02]
                hover:border-cyan-500/40
                transition-all
              "
            >
              <div
                className="
                  w-16 h-16
                  rounded-2xl
                  bg-cyan-500/10
                  border border-cyan-500/20
                  flex items-center justify-center
                  mb-5
                "
              >
                <Icone className="w-8 h-8 text-cyan-400" />
              </div>

              <h2 className="text-xl font-black text-white">
                {card.titulo}
              </h2>

              <p className="text-slate-400 text-sm mt-2">
                {card.descricao}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="painel-premium p-6">
        <h2 className="text-xl font-black text-white mb-4">
          🚀 Futuro do SIG Legislação
        </h2>

        <ul className="space-y-2 text-slate-400">
          <li>• Pesquisa por artigo e palavra-chave.</li>
          <li>• Leis em áudio.</li>
          <li>• Favoritos.</li>
          <li>• Marcações e anotações.</li>
          <li>• Banco de questões.</li>
          <li>• Simulados.</li>
          <li>• Flashcards.</li>
          <li>• IA Jurídica integrada.</li>
          <li>• Atualização automática de leis.</li>
        </ul>
      </div>
    </div>
  );
}