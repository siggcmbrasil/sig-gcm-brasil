"use client";

import {
  Brain,
  Car,
  CheckCircle2,
  Clock,
  Database,
  FileCheck,
  FileText,
  Globe,
  Mail,
  MapPinned,
  MonitorCog,
  Network,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigInfo from "@/components/sig/SigInfo";

export default function SobrePage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Sobre o SIG-GCM Brasil"
        subtitulo="Plataforma integrada para gestão, operação e inteligência das Guardas Municipais."
        icone={ShieldCheck}
      />

      <SigCard>
        <div className="grid xl:grid-cols-[160px_1fr] gap-8 items-center">
          <div className="flex justify-center">
            <img
              src="/logo.png"
              alt="SIG-GCM Brasil"
              className="w-36 h-36 object-contain drop-shadow-[0_0_25px_rgba(59,130,246,0.35)]"
            />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.30em] text-blue-400 font-black">
              Sistema Integrado de Gestão
            </p>

            <h2 className="text-3xl md:text-5xl font-black text-white mt-3 leading-tight">
              Tecnologia, controle e inteligência para a segurança pública municipal.
            </h2>

            <p className="text-slate-400 mt-5 leading-relaxed max-w-5xl">
              O SIG-GCM Brasil foi desenvolvido para modernizar a rotina das
              Guardas Municipais, centralizando informações operacionais,
              administrativas, patrimoniais e estratégicas em uma única
              plataforma segura, responsiva e preparada para múltiplos
              municípios.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <MiniInfo titulo="Versão" valor="1.0.0" />
              <MiniInfo titulo="Arquitetura" valor="Multi-município" />
              <MiniInfo titulo="Acesso" valor="Web e Mobile" />
              <MiniInfo titulo="Inteligência" valor="SIGIA" />
            </div>
          </div>
        </div>
      </SigCard>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <MiniInfo titulo="Módulos" valor="30+" />
  <MiniInfo titulo="Centrais" valor="12" />
  <MiniInfo titulo="IA" valor="SIGIA" />
  <MiniInfo titulo="Versão" valor="1.0" />
</div>

      <div className="grid md:grid-cols-3 gap-4">
        <Valor
          titulo="Missão"
          texto="Organizar, fortalecer e modernizar a gestão das Guardas Municipais por meio da tecnologia."
        />

        <Valor
          titulo="Visão"
          texto="Ser referência nacional em sistema de gestão operacional e administrativa para Guardas Municipais."
        />

        <Valor
          titulo="Compromisso"
          texto="Entregar uma plataforma segura, prática, escalável e alinhada à realidade operacional das corporações."
        />
      </div>

      <SigCard>
        <h2 className="text-2xl font-black text-white mb-2">
          O que o SIG-GCM Brasil entrega
        </h2>

        <p className="text-slate-400 mb-5">
          Um ambiente único para registrar, acompanhar, consultar, auditar e
          transformar dados em decisões.
        </p>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Entrega icone={ShieldCheck} titulo="Operação" texto="Ocorrências, chamados, patrulhamento, mapa operacional e guarnições." />
          <Entrega icone={Users} titulo="Gestão de Pessoal" texto="Guardas, escalas, banco de horas, férias, licenças e histórico funcional." />
          <Entrega icone={Car} titulo="Recursos" texto="Viaturas, equipamentos, armamentos, cautelas, manutenção e inventário." />
          <Entrega icone={Brain} titulo="Inteligência" texto="SIGIA, relatórios inteligentes, busca unificada e apoio operacional." />
        </div>
      </SigCard>

      <div className="grid md:grid-cols-2 gap-4">
        <Bloco
          titulo="Centrais do Sistema"
          itens={[
            [MonitorCog, "Centro de Comando — visão geral e indicadores"],
            [ShieldCheck, "Central Operacional — ocorrências, rondas e chamados"],
            [Users, "Central de RH — guardas, escalas e guarnições"],
            [Car, "Central de Frota — viaturas, abastecimentos e manutenção"],
            [ShieldCheck, "Central de Armamentos — armaria, munições e cautelas"],
            [FileText, "Central de Relatórios — documentos e estatísticas"],
          ]}
        />

        <Bloco
          titulo="Recursos Estratégicos"
          itens={[
            [MapPinned, "Mapa operacional e georreferenciamento"],
            [Clock, "Rastreamento GPS em tempo real"],
            [Database, "Base de dados separada por município"],
            [Network, "Integração entre módulos"],
            [Smartphone, "Uso em computador, tablet e celular"],
            [Brain, "Assistência com inteligência artificial"],
          ]}
        />
      </div>

      <SigCard>
        <h2 className="text-2xl font-black text-white mb-2">
          Segurança, controle e rastreabilidade
        </h2>

        <p className="text-slate-400 mb-5">
          O sistema foi pensado para proteger dados institucionais e manter a
          separação entre municípios, usuários e permissões.
        </p>

        <div className="grid md:grid-cols-3 gap-3">
          <SigInfo titulo="Controle de acesso" valor="Permissões por perfil" />
          <SigInfo titulo="Multi-município" valor="Dados separados por cidade" />
          <SigInfo titulo="Auditoria" valor="Histórico de ações e consultas" />
          <SigInfo titulo="Rastreabilidade" valor="Registros com data, hora e usuário" />
          <SigInfo titulo="Padronização" valor="Relatórios e telas institucionais" />
          <SigInfo titulo="Escalabilidade" valor="Preparado para expansão" />
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-2xl font-black text-white mb-2">
          Módulos e funcionalidades
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 mt-5">
          {[
            "Ocorrências",
            "Patrulhamento",
            "Chamados",
            "Mapa Operacional",
            "Guarnições",
            "Escalas",
            "Guardas",
            "Dossiê Funcional",
            "Viaturas",
            "Equipamentos",
            "Armamentos",
            "Munições",
            "Cautelas",
            "Relatórios",
            "SIGIA",
            "Legislação",
            "Ofícios",
            "Portal do Cidadão",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="font-bold text-slate-200">{item}</span>
            </div>
          ))}
        </div>
      </SigCard>

      <SigCard>
  <h2 className="text-2xl font-black text-white mb-4">
    Roadmap Oficial
  </h2>

  <div className="space-y-3">
    <p className="text-slate-300">
      ✅ Fase 1 - Gestão Operacional e Administrativa
    </p>

    <p className="text-slate-300">
      🚧 Fase 2 - Inteligência Operacional e Georreferenciamento
    </p>

    <p className="text-slate-300">
      🚀 Fase 3 - Ecossistema SIG-GCM Brasil
    </p>
  </div>
</SigCard>

<SigCard>
  <h2 className="text-2xl font-black text-white mb-4">
    Tecnologias Utilizadas
  </h2>

  <div className="grid md:grid-cols-3 gap-3">
    <SigInfo titulo="Frontend" valor="Next.js + React" />
    <SigInfo titulo="Banco de Dados" valor="Supabase" />
    <SigInfo titulo="Aplicativo" valor="Capacitor Android" />
    <SigInfo titulo="Mapas" valor="Leaflet + OpenStreetMap" />
    <SigInfo titulo="IA" valor="Gemini + SIGIA" />
    <SigInfo titulo="Hospedagem" valor="Vercel" />
  </div>
</SigCard>

      <SigCard>
        <h2 className="text-2xl font-black text-white mb-4">
          Suporte e contato
        </h2>

        <div className="grid md:grid-cols-3 gap-3">
          <Contato icone={Mail} titulo="Suporte" valor="suporte@siggcmbrasil.com" />
          <Contato icone={Mail} titulo="Comercial" valor="comercial@siggcmbrasil.com" />
          <Contato icone={Globe} titulo="Site" valor="siggcmbrasil.com" />
        </div>
      </SigCard>

      <div className="text-center">
  <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/30 px-4 py-2">
    <ShieldCheck className="w-5 h-5 text-green-400" />
    <span className="text-green-300 font-bold">
      Sistema Oficial SIG-GCM Brasil
    </span>
  </div>
</div>

      <div className="painel-premium p-6 text-center">
        <p className="font-black text-white text-lg">
          SIG-GCM Brasil v1.0.0
        </p>

        <p className="text-slate-400 mt-1">
          Sistema Integrado de Gestão para Guardas Municipais
        </p>

        <p className="text-slate-500 text-sm mt-3">
          © 2026 SIG-GCM Brasil. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}

function MiniInfo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-blue-900/40 bg-blue-950/20 p-4">
      <p className="text-slate-500 text-xs">{titulo}</p>
      <p className="text-white font-black">{valor}</p>
    </div>
  );
}

function Valor({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <SigCard>
      <h2 className="text-xl font-black text-white mb-3">{titulo}</h2>
      <p className="text-slate-400 leading-relaxed">{texto}</p>
    </SigCard>
  );
}

function Entrega({
  icone: Icon,
  titulo,
  texto,
}: {
  icone: any;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="w-12 h-12 rounded-2xl border border-blue-500/30 bg-blue-500/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-blue-400" />
      </div>

      <h3 className="text-lg font-black text-white">{titulo}</h3>

      <p className="text-slate-400 text-sm mt-2 leading-relaxed">{texto}</p>
    </div>
  );
}

function Bloco({
  titulo,
  itens,
}: {
  titulo: string;
  itens: [any, string][];
}) {
  return (
    <SigCard>
      <h2 className="text-xl font-black text-white mb-4">{titulo}</h2>

      <div className="grid gap-3">
        {itens.map(([Icon, texto]) => (
          <div
            key={texto}
            className="flex items-center gap-3 rounded-2xl bg-slate-900/70 border border-slate-800 p-4"
          >
            <Icon className="w-5 h-5 text-yellow-400" />
            <span className="text-slate-200 font-bold">{texto}</span>
          </div>
        ))}
      </div>
    </SigCard>
  );
}

function Contato({
  icone: Icon,
  titulo,
  valor,
}: {
  icone: any;
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 flex items-center gap-3">
      <Icon className="w-5 h-5 text-blue-400" />

      <div>
        <p className="text-slate-500 text-xs">{titulo}</p>
        <p className="text-slate-200 font-bold">{valor}</p>
      </div>
    </div>
  );
}