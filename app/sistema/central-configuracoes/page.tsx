"use client";

import {
  Settings,
  Building2,
  Shield,
  Bell,
  SlidersHorizontal,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";
import ProtecaoModulo from "@/components/ProtecaoModulo";

const itens = [
  {
    titulo: "Configurações",
    href: "/sistema/configuracoes",
    descricao: "Parâmetros gerais e configurações institucionais.",
    icone: Settings,
  },
  {
    titulo: "Municípios",
    href: "/sistema/municipios",
    descricao: "Gerenciamento dos municípios cadastrados.",
    icone: Building2,
  },
  {
    titulo: "Permissões",
    href: "/sistema/usuarios/permissoes",
    descricao: "Controle de acesso por perfis e módulos.",
    icone: Shield,
  },
  {
    titulo: "Notificações",
    href: "/sistema/notificacoes",
    descricao: "Gerenciamento de avisos e notificações do sistema.",
    icone: Bell,
  },
];

export default function ConfiguracoesCentralPage() {
  return (
    <ProtecaoModulo modulo="configuracoes">
      <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central de Configurações"
        descricao="Parâmetros gerais, permissões e configurações institucionais do SIG-GCM Brasil."
        icone={SlidersHorizontal}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {itens.map((item) => (
          <SigCentralCard
            key={item.href}
            titulo={item.titulo}
            descricao={item.descricao}
            href={item.href}
            icone={item.icone}
          />
        ))}
      </div>
          </section>
    </ProtecaoModulo>
  );
}
