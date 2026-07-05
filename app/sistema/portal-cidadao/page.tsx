"use client";

import {
  Bell,
  CalendarDays,
  FileText,
  MapPin,
  MessageSquare,
  MessageSquareWarning,
  Newspaper,
  PackageSearch,
  Phone,
  Search,
  Shield,
  Users,
  ClipboardList,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigActionCard from "@/components/sig/SigActionCard";
import SigCard from "@/components/sig/SigCard";

export default function PortalCidadaoPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Portal do Cidadão"
        subtitulo="Central de atendimento, comunicação e serviços digitais da Guarda Municipal."
        icone={Shield}
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <SigActionCard
          href="/sistema/portal-cidadao/achados-perdidos"
          titulo="Achados e Perdidos"
          descricao="Controle de objetos encontrados, perdidos ou devolvidos."
          icone={PackageSearch}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/comunicados"
          titulo="Comunicados"
          descricao="Avisos oficiais, campanhas e orientações à população."
          icone={Bell}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/contatos"
          titulo="Contatos"
          descricao="Telefones úteis, órgãos públicos, parceiros e emergência."
          icone={Phone}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/denuncias"
          titulo="Denúncias"
          descricao="Registro e acompanhamento de denúncias do cidadão."
          icone={MessageSquareWarning}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/eventos"
          titulo="Eventos"
          descricao="Agenda de eventos, ações comunitárias e atividades públicas."
          icone={CalendarDays}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/noticias"
          titulo="Notícias"
          descricao="Publicações, comunicados e informações oficiais."
          icone={Newspaper}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/ouvidoria"
          titulo="Ouvidoria"
          descricao="Canal de manifestações, reclamações, elogios e sugestões."
          icone={MessageSquare}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/programas"
          titulo="Projetos Sociais"
          descricao="Projetos e ações comunitárias da Guarda Municipal."
          icone={Users}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/protocolos"
          titulo="Protocolos"
          descricao="Consulta e acompanhamento de protocolos gerados."
          icone={FileText}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/consultas"
          titulo="Consultas"
          descricao="Consulta segura de protocolos e serviços registrados."
          icone={Search}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/solicitacoes"
          titulo="Solicitações"
          descricao="Pedidos de apoio, serviços e demandas do cidadão."
          icone={ClipboardList}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/unidades"
          titulo="Unidades e Telefones"
          descricao="Bases, canais oficiais, horários e mapa de unidades."
          icone={MapPin}
        />
      </div>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Módulos organizados
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          <Item texto="Achados e Perdidos" />
          <Item texto="Comunicados" />
          <Item texto="Contatos" />
          <Item texto="Denúncias" />
          <Item texto="Eventos" />
          <Item texto="Notícias" />
          <Item texto="Ouvidoria" />
          <Item texto="Protocolos" />
          <Item texto="Solicitações" />
          <Item texto="Projetos Sociais" />
          <Item texto="Consultas" />
          <Item texto="Unidades e Telefones" />
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Regras de segurança
        </h2>

        <div className="grid md:grid-cols-2 gap-3">
          <Regra texto="Todo atendimento deve gerar protocolo quando aplicável." />
          <Regra texto="Dados sensíveis devem permanecer separados por município." />
          <Regra texto="Denúncia anônima não deve expor identificação do cidadão." />
          <Regra texto="Acesso administrativo deve ser auditado." />
          <Regra texto="Consultas públicas devem exibir somente dados permitidos." />
          <Regra texto="Uploads futuros devem ter validação, limite e controle." />
        </div>
      </SigCard>
    </div>
  );
}

function Item({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 text-slate-200 font-semibold">
      ✅ {texto}
    </div>
  );
}

function Regra({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl bg-slate-950/70 border border-cyan-500/20 p-4 text-slate-300">
      🛡️ {texto}
    </div>
  );
}