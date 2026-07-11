"use client";

import {
  Bell,
  ClipboardList,
  FileText,
  MessageSquareWarning,
  Phone,
  Megaphone,
  Landmark,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";
import ProtecaoModulo from "@/components/ProtecaoModulo";

const modulos = [
  {
    titulo: "Denúncias",
    href: "/sistema/portal-cidadao/denuncias",
    descricao: "Registro e acompanhamento de denúncias.",
    icone: MessageSquareWarning,
  },
  {
    titulo: "Ouvidoria",
    href: "/sistema/portal-cidadao/ouvidoria",
    descricao: "Sugestões, elogios e reclamações.",
    icone: Megaphone,
  },
  {
    titulo: "Solicitações",
    href: "/sistema/portal-cidadao/solicitacoes",
    descricao: "Pedidos de apoio e serviços públicos.",
    icone: ClipboardList,
  },
  {
    titulo: "Protocolos",
    href: "/sistema/portal-cidadao/protocolos",
    descricao: "Consulta e controle de protocolos.",
    icone: FileText,
  },
  {
    titulo: "Eventos",
    href: "/sistema/portal-cidadao/eventos",
    descricao: "Eventos e ações institucionais.",
    icone: Bell,
  },
  {
    titulo: "Notícias",
    href: "/sistema/portal-cidadao/noticias",
    descricao: "Notícias e comunicados oficiais.",
    icone: Bell,
  },
  {
    titulo: "Contatos Úteis",
    href: "/sistema/portal-cidadao/contatos",
    descricao: "Telefones e contatos importantes.",
    icone: Phone,
  },
];

export default function CentralCidadaoPage() {
  return (
    <ProtecaoModulo modulo="portal_cidadao">
      <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central do Cidadão"
        descricao="Todos os serviços públicos disponíveis para o cidadão."
        icone={Landmark}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {modulos.map((modulo) => (
          <SigCentralCard
            key={modulo.href}
            titulo={modulo.titulo}
            descricao={modulo.descricao}
            href={modulo.href}
            icone={modulo.icone}
          />
        ))}
      </div>
          </section>
    </ProtecaoModulo>
  );
}