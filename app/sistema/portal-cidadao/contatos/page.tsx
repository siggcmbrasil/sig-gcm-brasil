"use client";

import {
  Building2,
  Phone,
  Shield,
  Ambulance,
  Users,
  Plus,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigActionCard from "@/components/sig/SigActionCard";
import SigCard from "@/components/sig/SigCard";

export default function ContatosPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Contatos"
        subtitulo="Agenda institucional e contatos operacionais."
        icone={Phone}
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <SigActionCard
          href="/sistema/portal-cidadao/contatos/telefones"
          titulo="Telefones Úteis"
          descricao="SAMU, PM, Polícia Civil, Bombeiros e outros."
          icone={Phone}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/contatos/orgaos"
          titulo="Órgãos Públicos"
          descricao="Prefeitura, Secretarias e demais órgãos."
          icone={Building2}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/contatos/emergencias"
          titulo="Emergência"
          descricao="Contatos rápidos para ocorrências."
          icone={Ambulance}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/contatos/parceiros"
          titulo="Instituições Parceiras"
          descricao="Conselho Tutelar, MP, Judiciário e outros."
          icone={Shield}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/contatos/guardas"
          titulo="Contatos Internos"
          descricao="Lista de guardas e servidores."
          icone={Users}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/contatos/cadastrar"
          titulo="Novo Contato"
          descricao="Cadastrar novo telefone ou instituição."
          icone={Plus}
        />
      </div>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Categorias sugeridas
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          <Item texto="🚔 Polícia Militar" />
          <Item texto="👮 Polícia Civil" />
          <Item texto="🚑 SAMU" />
          <Item texto="🚒 Corpo de Bombeiros" />
          <Item texto="🏥 Hospitais" />
          <Item texto="⚖️ Ministério Público" />
          <Item texto="👨‍⚖️ Poder Judiciário" />
          <Item texto="👶 Conselho Tutelar" />
          <Item texto="🏛️ Prefeitura" />
          <Item texto="🛣️ CIRETRAN" />
          <Item texto="📡 Defesa Civil" />
          <Item texto="☎️ Serviços Públicos" />
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