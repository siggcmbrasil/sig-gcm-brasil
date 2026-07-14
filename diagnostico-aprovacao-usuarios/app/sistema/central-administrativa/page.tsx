"use client";

import {
  Bell,
  Brain,
  Building2,
  CreditCard,
  Landmark,
  Settings,
  Shield,
  Users,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";

const cards = [
  {
    grupo: "Gestão Global do SIG",
    itens: [
      {
        titulo: "Municípios",
        icone: Building2,
        href: "/sistema/municipios",
        descricao:
          "Criar, configurar e administrar os municípios cadastrados no SIG-GCM Brasil.",
      },
      {
        titulo: "Usuários",
        icone: Users,
        href: "/sistema/usuarios",
        descricao:
          "Aprovar acessos, ajustar perfis e gerenciar usuários da plataforma.",
      },
      {
        titulo: "Permissões Globais",
        icone: Shield,
        href: "/sistema/usuarios/permissoes",
        descricao:
          "Controlar perfis, permissões e acessos aos módulos do sistema.",
      },
    ],
  },
  {
    grupo: "Planos e Plataforma",
    itens: [
      {
        titulo: "Planos e Assinaturas",
        icone: CreditCard,
        href: "/sistema/planos-assinaturas",
        descricao:
          "Controlar planos, vencimentos, limites e situação dos municípios.",
      },
      {
        titulo: "Créditos IA",
        icone: Brain,
        href: "/sistema/ia-creditos",
        descricao:
          "Gerenciar créditos, consumo e limites da inteligência artificial.",
      },
      {
        titulo: "Configurações Globais",
        icone: Settings,
        href: "/sistema/configuracoes",
        descricao:
          "Parâmetros gerais da plataforma SIG-GCM Brasil.",
      },
    ],
  },
  {
    grupo: "Institucional e Comunicação",
    itens: [
      {
        titulo: "Dados Institucionais",
        icone: Landmark,
        href: "/sistema/administracao/institucional",
        descricao:
          "Brasões, comandante, dados oficiais e identidade institucional.",
      },
      {
        titulo: "Avisos Globais",
        icone: Bell,
        href: "/sistema/avisos",
        descricao:
          "Comunicados oficiais enviados aos municípios e usuários.",
      },
      {
        titulo: "Notificações",
        icone: Bell,
        href: "/sistema/notificacoes",
        descricao:
          "Alertas, notificações internas e comunicação institucional.",
      },
    ],
  },
];

export default function CentralAdministrativaPage() {
  return (
    <ProtecaoModulo modulo="central_administrativa">
      <section className="p-4 md:p-6 pb-24 space-y-8">
        <SigCentralHeader
          titulo="Central Administrativa"
          descricao="Gestão global da plataforma SIG-GCM Brasil: municípios, usuários, planos, créditos IA e configurações institucionais."
          icone={Settings}
        />

        {cards.map((grupo) => (
          <div key={grupo.grupo} className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-white">
                {grupo.grupo}
              </h2>

              <p className="text-slate-400 text-sm mt-1">
                Área administrativa global da plataforma.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {grupo.itens.map((card) => (
                <SigCentralCard
                  key={card.href}
                  titulo={card.titulo}
                  descricao={card.descricao}
                  href={card.href}
                  icone={card.icone}
                />
              ))}
            </div>
          </div>
        ))}
      </section>
    </ProtecaoModulo>
  );
}