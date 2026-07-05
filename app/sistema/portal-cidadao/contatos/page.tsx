"use client";

import {
  Ambulance,
  Building2,
  Phone,
  Plus,
  Shield,
  Users,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigActionCard from "@/components/sig/SigActionCard";
import SigCard from "@/components/sig/SigCard";

export default function ContatosPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Contatos"
        subtitulo="Agenda pública e institucional com telefones úteis, órgãos parceiros e canais de emergência."
        icone={Phone}
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <SigActionCard
          href="/sistema/portal-cidadao/contatos/telefones"
          titulo="Telefones Úteis"
          descricao="SAMU, Polícia Militar, Polícia Civil, Bombeiros, hospitais e serviços essenciais."
          icone={Phone}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/contatos/orgaos"
          titulo="Órgãos Públicos"
          descricao="Prefeitura, secretarias, departamentos e repartições municipais."
          icone={Building2}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/contatos/emergencias"
          titulo="Emergência"
          descricao="Canais rápidos para atendimento em situações urgentes."
          icone={Ambulance}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/contatos/parceiros"
          titulo="Instituições Parceiras"
          descricao="Conselho Tutelar, Ministério Público, Judiciário e rede de proteção."
          icone={Shield}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/contatos/guardas"
          titulo="Contatos Internos"
          descricao="Contatos administrativos e operacionais autorizados."
          icone={Users}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/contatos/cadastrar"
          titulo="Novo Contato"
          descricao="Cadastrar novo telefone, órgão ou instituição."
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

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Regras de publicação
        </h2>

        <div className="grid md:grid-cols-2 gap-3">
          <Regra texto="Exibir ao cidadão somente contatos autorizados." />
          <Regra texto="Não publicar telefones pessoais sem autorização." />
          <Regra texto="Separar contatos públicos de contatos internos." />
          <Regra texto="Manter telefones de emergência sempre visíveis." />
        </div>
      </SigCard>
    </div>
  );
}

function Item({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 text-slate-200 font-semibold">
      {texto}
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