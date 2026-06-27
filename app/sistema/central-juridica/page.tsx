import Link from "next/link";
import {
  Scale,
  Bot,
  FileText,
  ScrollText,
  FileCheck,
  Handshake,
  BookOpen,
  ShieldCheck,
} from "lucide-react";

const cards = [
  {
    titulo: "Legislação",
    icone: Scale,
    href: "/sistema/legislacao",
    descricao: "Consulta de leis, normas, códigos e regulamentos.",
  },
  {
    titulo: "IA Jurídica",
    icone: Bot,
    href: "/sistema/ia-juridica",
    descricao: "Assistente jurídico para apoio às decisões administrativas.",
  },
  {
    titulo: "Ofícios",
    icone: FileText,
    href: "/sistema/oficios",
    descricao: "Emissão e controle de ofícios institucionais.",
  },
  {
    titulo: "Ofícios Recebidos",
    icone: ScrollText,
    href: "/sistema/oficios-recebidos",
    descricao: "Controle de documentos oficiais recebidos.",
  },
  {
    titulo: "Termos",
    icone: FileCheck,
    href: "/sistema/termos",
    descricao: "Modelos de termos e documentos administrativos.",
  },
  {
    titulo: "Convênios",
    icone: Handshake,
    href: "/sistema/convenios",
    descricao: "Controle de convênios e parcerias institucionais.",
  },
  {
    titulo: "SIG Legislação",
    icone: BookOpen,
    href: "/sistema/sig-legislacao",
    descricao: "Módulo avançado de legislação e estudos.",
  },
  {
    titulo: "Apoio Legal",
    icone: ShieldCheck,
    href: "/sistema/ia-juridica",
    descricao: "Apoio jurídico operacional e administrativo.",
  },
];

export default function CentralJuridicaPage() {
  return (
    <section className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-4xl font-black text-white">
          ⚖️ Central Jurídica
        </h1>

        <p className="text-slate-400 mt-2">
          Legislação, documentos oficiais, IA jurídica, termos, convênios e apoio legal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card, index) => {
          const Icone = card.icone;

          return (
            <Link
              key={`${card.titulo}-${index}`}
              href={card.href}
              className="painel-premium p-6 hover:scale-[1.02] hover:border-blue-500/40 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Icone className="w-9 h-9 text-cyan-400" />
                </div>

                <span className="text-green-400 text-xs font-black">
                  ONLINE
                </span>
              </div>

              <h2 className="text-2xl font-black text-white">
                {card.titulo}
              </h2>

              <p className="text-slate-400 text-sm mt-2">
                {card.descricao}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}