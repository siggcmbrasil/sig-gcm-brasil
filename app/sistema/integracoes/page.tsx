"use client";

import {
  Cable,
  CheckCircle,
  Database,
  Globe,
  KeyRound,
  Link2,
  RadioTower,
  ShieldCheck,
} from "lucide-react";

import SigActionCard from "@/components/sig/SigActionCard";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function IntegracoesPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Integrações"
        subtitulo="Central de integrações externas e serviços conectados do SIG-GCM Brasil."
        icone={Cable}
      />

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4">
            <Link2 className="w-10 h-10 text-yellow-400" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-bold">
              Módulo do Desenvolvedor
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Central de Integrações
            </h2>

            <p className="text-slate-400 mt-2 max-w-3xl leading-relaxed">
              Área reservada para configuração futura de APIs, serviços externos,
              convênios oficiais, consultas autorizadas, notificações e conexões
              seguras entre módulos do SIG.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <SigActionCard
          href="#"
          titulo="APIs Oficiais"
          descricao="Integrações futuras com bases autorizadas e convênios institucionais."
          icone={Globe}
        />

        <SigActionCard
          href="#"
          titulo="Chaves de Acesso"
          descricao="Gerenciamento de tokens, credenciais e permissões de integração."
          icone={KeyRound}
        />

        <SigActionCard
          href="#"
          titulo="Webhooks"
          descricao="Envio e recebimento de eventos entre sistemas conectados."
          icone={RadioTower}
        />

        <SigActionCard
          href="#"
          titulo="Banco Interno"
          descricao="Conexão segura com dados internos e módulos do SIG."
          icone={Database}
        />
      </div>

      <SigCard>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-yellow-400" />
              Integrações Planejadas
            </h3>

            <div className="mt-4 space-y-3 text-sm text-slate-400">
              <p>• Consulta de placas/veículos apenas por convênio oficial autorizado</p>
              <p>• Consulta global CPF/placa entre municípios</p>
              <p>• Notificações push</p>
              <p>• Portal do Cidadão</p>
              <p>• Instagram institucional</p>
              <p>• Backup em nuvem</p>
              <p>• Inteligência artificial operacional</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              Regras de Segurança
            </h3>

            <div className="mt-4 space-y-3 text-sm text-slate-400">
              <p>• Apenas perfil DESENVOLVEDOR</p>
              <p>• Registro obrigatório em auditoria</p>
              <p>• Controle por município</p>
              <p>• Chaves protegidas</p>
              <p>• Permissões por perfil</p>
              <p>• Conformidade com LGPD</p>
              <p>• Nenhuma fonte irregular de consulta</p>
            </div>
          </div>
        </div>
      </SigCard>

      <SigCard>
        <div className="text-center py-10">
          <Cable className="w-16 h-16 mx-auto text-slate-600 mb-4" />

          <h3 className="text-xl font-black text-white">
            Módulo em Desenvolvimento
          </h3>

          <p className="text-slate-400 mt-2 max-w-2xl mx-auto">
            Esta área será usada para preparar o SIG-GCM Brasil para integrações
            oficiais, seguras e auditáveis.
          </p>
        </div>
      </SigCard>
    </div>
  );
}