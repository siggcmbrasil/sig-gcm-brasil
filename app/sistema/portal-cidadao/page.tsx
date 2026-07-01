"use client";

import {
  Bell,
  FileText,
  MessageSquareWarning,
  Search,
  Shield,
  Users,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigActionCard from "@/components/sig/SigActionCard";
import SigCard from "@/components/sig/SigCard";

export default function PortalCidadaoPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Portal do Cidadão"
        subtitulo="Serviços digitais para interação entre a Guarda Municipal e a população."
        icone={Shield}
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <SigActionCard
          href="/sistema/portal-cidadao/denuncias"
          titulo="Denúncias"
          descricao="Receba denúncias da população."
          icone={MessageSquareWarning}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/protocolos"
          titulo="Protocolos"
          descricao="Acompanhar solicitações e protocolos."
          icone={FileText}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/consultas"
          titulo="Consultas"
          descricao="Consultar protocolos e serviços."
          icone={Search}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/comunicados"
          titulo="Comunicados"
          descricao="Avisos e notícias da Guarda Municipal."
          icone={Bell}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/programas"
          titulo="Projetos Sociais"
          descricao="Projetos e ações comunitárias."
          icone={Users}
        />
      </div>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-3">
          Funcionalidades previstas
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          <Item texto="Denúncia anônima" />
          <Item texto="Solicitação de apoio" />
          <Item texto="Achados e perdidos" />
          <Item texto="Consulta de protocolos" />
          <Item texto="Acompanhamento de denúncias" />
          <Item texto="Botão de emergência" />
          <Item texto="Ouvidoria" />
          <Item texto="Envio de fotos e vídeos" />
          <Item texto="Notificações push" />
          <Item texto="Mapa de unidades" />
          <Item texto="Agenda de eventos" />
          <Item texto="Educação para o trânsito" />
        </div>
      </SigCard>
    </div>
  );
}

function Item({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 text-slate-200">
      {texto}
    </div>
  );
}