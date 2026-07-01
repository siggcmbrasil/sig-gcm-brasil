"use client";

import {
  Globe,
  Key,
  Link2,
  ShieldCheck,
  Database,
  Code2,
  BookOpen,
  Server,
} from "lucide-react";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function ApiPublicaPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="API Pública"
        subtitulo="Integrações e serviços do SIG-GCM Brasil."
        icone={Globe}
      />

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4">
            <Server className="w-10 h-10 text-yellow-400" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-bold">
              Área do Desenvolvedor
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Central de APIs
            </h2>

            <p className="text-slate-400 mt-2 max-w-3xl leading-relaxed">
              Área destinada à documentação, geração de chaves de acesso e
              integração do SIG-GCM Brasil com sistemas externos, aplicativos
              móveis e serviços parceiros.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <Key className="w-8 h-8 text-yellow-400 mb-3" />

          <h3 className="text-lg font-black text-white">
            Tokens
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Geração de chaves de acesso.
          </p>
        </SigCard>

        <SigCard>
          <Code2 className="w-8 h-8 text-emerald-400 mb-3" />

          <h3 className="text-lg font-black text-white">
            Endpoints
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Consulta aos serviços disponíveis.
          </p>
        </SigCard>

        <SigCard>
          <ShieldCheck className="w-8 h-8 text-blue-400 mb-3" />

          <h3 className="text-lg font-black text-white">
            Segurança
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Controle e auditoria de acesso.
          </p>
        </SigCard>

        <SigCard>
          <BookOpen className="w-8 h-8 text-orange-400 mb-3" />

          <h3 className="text-lg font-black text-white">
            Documentação
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Guias de integração e exemplos.
          </p>
        </SigCard>
      </div>

      <SigCard>
        <h3 className="text-xl font-black text-white mb-5">
          Funcionalidades Futuras
        </h3>

        <div className="grid md:grid-cols-2 gap-3 text-sm text-slate-400">
          <p>• Geração de API Key</p>
          <p>• Tokens por município</p>
          <p>• Consulta de dados autorizados</p>
          <p>• Integração com aplicativo móvel</p>
          <p>• Webhooks</p>
          <p>• Logs de requisições</p>
          <p>• Controle de permissões</p>
          <p>• Integrações com sistemas parceiros</p>
          <p>• Documentação Swagger/OpenAPI</p>
          <p>• Limite de requisições (Rate Limit)</p>
          <p>• Auditoria completa</p>
          <p>• Ambiente Sandbox para testes</p>
        </div>
      </SigCard>

      <SigCard>
        <div className="flex items-start gap-4">
          <Database className="w-10 h-10 text-slate-500" />

          <div>
            <h3 className="text-lg font-black text-white">
              API em Desenvolvimento
            </h3>

            <p className="text-slate-400 mt-2">
              A API Pública do SIG-GCM Brasil será disponibilizada futuramente
              para integrações autorizadas, respeitando permissões,
              multi-município, LGPD e auditoria de acesso.
            </p>
          </div>
        </div>
      </SigCard>

      <SigCard>
        <div className="flex items-center gap-3">
          <Link2 className="w-5 h-5 text-yellow-400" />

          <span className="text-slate-300">
            Endpoint base planejado:
          </span>

          <code className="rounded-lg bg-slate-900 px-3 py-1 text-yellow-400">
            https://api.siggcmbrasil.com/v1
          </code>
        </div>
      </SigCard>
    </div>
  );
}