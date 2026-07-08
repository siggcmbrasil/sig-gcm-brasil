"use client";

import Link from "next/link";
import {
  FileText,
  Package,
  Download,
  Handshake,
  RotateCcw,
  Shield,
  CircleAlert,
  ClipboardCheck,
  Car,
  UserCheck,
  Archive,
} from "lucide-react";

const termos = [
  {
    titulo: "Termo de Apreensão",
    descricao: "Registro de objetos ou materiais apreendidos.",
    href: "/sistema/termos/apreensao",
    icone: Package,
  },
  {
    titulo: "Termo de Entrega",
    descricao: "Entrega de objetos ou documentos.",
    href: "/sistema/termos/entrega",
    icone: Handshake,
  },
  {
    titulo: "Termo de Recebimento",
    descricao: "Registro de recebimento de objetos e documentos.",
    href: "/sistema/termos/recebimento",
    icone: Download,
  },
  {
    titulo: "Termo de Devolução",
    descricao: "Devolução de bens ao proprietário.",
    href: "/sistema/termos/devolucao",
    icone: RotateCcw,
  },
  {
    titulo: "Termo de Restituição",
    descricao: "Restituição de materiais e objetos.",
    href: "/sistema/termos/restituicao",
    icone: ClipboardCheck,
  },
  {
    titulo: "Guarda e Depósito",
    descricao: "Objetos sob guarda institucional.",
    href: "/sistema/termos/deposito",
    icone: Archive,
  },
  {
    titulo: "Termo de Responsabilidade",
    descricao: "Responsabilidade pelo recebimento de bens.",
    href: "/sistema/termos/responsabilidade",
    icone: Shield,
  },
  {
    titulo: "Termo de Recusa",
    descricao: "Registro de recusa de recebimento.",
    href: "/sistema/termos/recusa",
    icone: CircleAlert,
  },
  {
    titulo: "Recolhimento de Veículo",
    descricao: "Registro de remoção e recolhimento.",
    href: "/sistema/termos/veiculo",
    icone: Car,
  },
  {
    titulo: "Entrega de Menor",
    descricao: "Entrega ao responsável legal.",
    href: "/sistema/termos/menor",
    icone: UserCheck,
  },
];

export default function TermosPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-4xl font-black text-white">
          📄 Central de Termos
        </h1>

        <p className="text-slate-400 mt-2">
          Geração e gerenciamento de termos operacionais da Guarda Municipal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {termos.map((item) => {
          const Icone = item.icone;

          return (
            <Link
              key={item.titulo}
              href={item.href}
              className="
                painel-premium
                p-6
                hover:scale-[1.02]
                transition-all
              "
            >
              <Icone className="w-10 h-10 text-cyan-400 mb-4" />

              <h2 className="text-xl font-black text-white">
                {item.titulo}
              </h2>

              <p className="text-slate-400 text-sm mt-2">
                {item.descricao}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}