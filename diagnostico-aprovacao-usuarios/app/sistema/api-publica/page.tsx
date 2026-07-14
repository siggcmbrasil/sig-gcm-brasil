"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  Key,
  Link2,
  ShieldCheck,
  Database,
  Code2,
  BookOpen,
  Server,
  Lock,
  Activity,
} from "lucide-react";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import { registrarAuditoria } from "@/lib/auditoria";

type UsuarioLogado = {
  id: number;
  nome?: string;
  perfil?: string;
  municipio_id?: number;
};

export default function ApiPublicaPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [bloqueado, setBloqueado] = useState(false);

  useEffect(() => {
    async function iniciar() {
      const dados = JSON.parse(
        localStorage.getItem("usuarioLogado") || "{}"
      );

      if (!dados?.id) {
        alert("Sessão inválida. Faça login novamente.");
        setBloqueado(true);
        setCarregando(false);
        return;
      }

      if (dados.perfil !== "DESENVOLVEDOR") {
        await registrarAuditoria({
          modulo: "API Pública",
          acao: "ACESSO_NEGADO",
          descricao: "Tentativa de acesso à área de API Pública sem permissão.",
          tabela: "usuarios",
          registro_id: dados.id,
          detalhes: {
            usuario_id: dados.id,
            perfil: dados.perfil,
            municipio_id: dados.municipio_id || null,
          },
        });

        setBloqueado(true);
        setCarregando(false);
        return;
      }

      setUsuario(dados);

      await registrarAuditoria({
        modulo: "API Pública",
        acao: "ACESSO",
        descricao: "Acessou a Central de API Pública.",
        tabela: "usuarios",
        registro_id: dados.id,
        detalhes: {
          usuario_id: dados.id,
          perfil: dados.perfil,
          municipio_id: dados.municipio_id || null,
        },
      });

      setCarregando(false);
    }

    iniciar();
  }, []);

  if (carregando) {
    return (
      <div className="p-4 md:p-6 pb-24">
        <SigCard>
          <p className="text-slate-400">Carregando Central de APIs...</p>
        </SigCard>
      </div>
    );
  }

  if (bloqueado) {
    return (
      <div className="p-4 md:p-6 pb-24 space-y-6">
        <SigPageHeader
          titulo="Acesso Restrito"
          subtitulo="Área exclusiva do desenvolvedor do SIG-GCM Brasil."
          icone={Lock}
        />

        <SigCard>
          <div className="text-center py-12">
            <Lock className="w-16 h-16 mx-auto text-red-400 mb-4" />

            <h2 className="text-2xl font-black text-white">
              Você não possui permissão
            </h2>

            <p className="text-slate-400 mt-2">
              A Central de API Pública é restrita ao perfil DESENVOLVEDOR.
            </p>
          </div>
        </SigCard>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="API Pública"
        subtitulo="Integrações oficiais e serviços externos do SIG-GCM Brasil."
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
              Área técnica para documentação, chaves de integração, controle de
              endpoints, auditoria e preparação da API oficial do SIG-GCM Brasil.
            </p>

            <p className="text-xs text-slate-500 mt-3">
              Usuário autorizado: {usuario?.nome || "DESENVOLVEDOR"}
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SigCard>
          <Key className="w-8 h-8 text-yellow-400 mb-3" />
          <h3 className="text-lg font-black text-white">Tokens</h3>
          <p className="text-sm text-slate-400 mt-2">
            Chaves por município, serviço e escopo de permissão.
          </p>
        </SigCard>

        <SigCard>
          <Code2 className="w-8 h-8 text-emerald-400 mb-3" />
          <h3 className="text-lg font-black text-white">Endpoints</h3>
          <p className="text-sm text-slate-400 mt-2">
            Serviços oficiais com versionamento e documentação.
          </p>
        </SigCard>

        <SigCard>
          <ShieldCheck className="w-8 h-8 text-blue-400 mb-3" />
          <h3 className="text-lg font-black text-white">Segurança</h3>
          <p className="text-sm text-slate-400 mt-2">
            Rate limit, auditoria, LGPD e controle por município.
          </p>
        </SigCard>

        <SigCard>
          <Activity className="w-8 h-8 text-orange-400 mb-3" />
          <h3 className="text-lg font-black text-white">Logs</h3>
          <p className="text-sm text-slate-400 mt-2">
            Monitoramento técnico de requisições e falhas.
          </p>
        </SigCard>
      </div>

      <SigCard>
        <h3 className="text-xl font-black text-white mb-5">
          Recursos da API Oficial
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-400">
          <p>• Geração de API Key por município</p>
          <p>• Tokens com escopo limitado</p>
          <p>• Consulta de dados autorizados</p>
          <p>• Integração com aplicativo móvel</p>
          <p>• Webhooks institucionais</p>
          <p>• Logs de requisições</p>
          <p>• Controle de permissões por serviço</p>
          <p>• Integrações com sistemas parceiros</p>
          <p>• Documentação Swagger/OpenAPI</p>
          <p>• Rate limit por token</p>
          <p>• Auditoria completa</p>
          <p>• Ambiente sandbox para testes</p>
        </div>
      </SigCard>

      <SigCard>
        <div className="flex items-start gap-4">
          <Database className="w-10 h-10 text-slate-500" />

          <div>
            <h3 className="text-lg font-black text-white">
              Regras obrigatórias da API
            </h3>

            <p className="text-slate-400 mt-2 leading-relaxed">
              Toda integração deverá respeitar autenticação por token,
              multi-município, escopo de permissão, LGPD, auditoria de acesso,
              bloqueio por uso indevido e rastreamento completo das requisições.
            </p>
          </div>
        </div>
      </SigCard>

      <SigCard>
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-3">
            <Link2 className="w-5 h-5 text-yellow-400" />

            <span className="text-slate-300">
              Endpoint base planejado:
            </span>
          </div>

          <code className="rounded-lg bg-slate-900 px-3 py-2 text-yellow-400 break-all">
            https://api.siggcmbrasil.com/v1
          </code>
        </div>
      </SigCard>

      <SigCard>
        <div className="flex items-start gap-4">
          <BookOpen className="w-10 h-10 text-cyan-400" />

          <div>
            <h3 className="text-lg font-black text-white">
              Status da documentação
            </h3>

            <p className="text-slate-400 mt-2">
              A documentação técnica deverá ser publicada somente após a criação
              das rotas oficiais, tokens, permissões, rate limit e Central de Logs.
            </p>
          </div>
        </div>
      </SigCard>
    </div>
  );
}