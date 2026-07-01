"use client";

import {
  Users,
  Building2,
  Shield,
  Settings,
  ClipboardCheck,
  Database,
  FolderSync,
  FileCog,
  MapPin,
  Cog,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";

const cards = [
  {
    titulo: "Usuários",
    icone: Users,
    href: "/sistema/usuarios",
    descricao:
      "Cadastro, gerenciamento e controle dos usuários do sistema.",
  },
  {
    titulo: "Municípios",
    icone: Building2,
    href: "/sistema/municipios",
    descricao:
      "Gerenciamento dos municípios cadastrados.",
  },
  {
    titulo: "Locais",
    icone: MapPin,
    href: "/sistema/locais",
    descricao:
      "Cadastro de ruas, bairros, escolas, órgãos públicos e pontos estratégicos.",
  },
  {
    titulo: "Permissões",
    icone: Shield,
    href: "/sistema/permissoes",
    descricao:
      "Controle de acesso por perfil e módulos.",
  },
  
  {
    titulo: "Auditoria",
    icone: ClipboardCheck,
    href: "/sistema/auditoria",
    descricao:
      "Registro de ações realizadas pelos usuários.",
  },
  {
    titulo: "Backup",
    icone: Database,
    href: "/sistema/backup",
    descricao:
      "Gerenciamento dos backups do sistema.",
  },
  {
    titulo: "Importador de Dados",
    icone: FolderSync,
    href: "/sistema/importador-dados",
    descricao:
      "Importação de dados externos para o SIG.",
  },
  {
    titulo: "Exportador de Dados",
    icone: FileCog,
    href: "/sistema/exportador-dados",
    descricao:
      "Exportação de dados e relatórios do sistema.",
  },
];

export default function CentralAdministrativaPage() {
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central Administrativa"
        descricao="Administração geral da plataforma SIG-GCM Brasil."
        icone={Cog}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {cards.map((card) => (
          <SigCentralCard
            key={card.href}
            titulo={card.titulo}
            descricao={card.descricao}
            href={card.href}
            icone={card.icone}
          />
        ))}
      </div>
    </section>
  );
}