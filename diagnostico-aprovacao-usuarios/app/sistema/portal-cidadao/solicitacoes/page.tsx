"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  ClipboardList,
  Clock,
  Plus,
  Search,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigButton from "@/components/sig/SigButton";

type UsuarioLogado = {
  id: string;
  perfil: string;
  municipio_id: number;
};

type Solicitacao = {
  id: number;
  protocolo: string | null;
  tipo: string | null;
  local: string | null;
  descricao: string | null;
  status: string | null;
  criado_em: string | null;
};

function obterUsuarioLogado(): UsuarioLogado | null {
  try {
    const salvo = localStorage.getItem("usuarioLogado");

    if (!salvo) return null;

    const usuario = JSON.parse(salvo);

    if (!usuario?.id || !usuario?.perfil || !usuario?.municipio_id) {
      return null;
    }

    return {
      id: String(usuario.id),
      perfil: usuario.perfil,
      municipio_id: Number(usuario.municipio_id),
    };
  } catch {
    return null;
  }
}

export default function SolicitacoesPage() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("TODOS");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    void carregar();
  }, []);

  async function carregar() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      setSolicitacoes([]);
      setCarregando(false);
      return;
    }

    setCarregando(true);

    let query = supabase
      .from("solicitacoes_cidadao")
      .select("id, protocolo, tipo, local, descricao, status, criado_em")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false })
      .limit(100);

    if (status !== "TODOS") {
      query = query.eq("status", status);
    }

    if (busca.trim()) {
      const termo = busca.trim();

      query = query.or(
        `protocolo.ilike.%${termo}%,tipo.ilike.%${termo}%,local.ilike.%${termo}%,descricao.ilike.%${termo}%`
      );
    }

    const { data, error } = await query;

    setCarregando(false);

    if (error) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Solicitações do Cidadão",
        acao: "ERRO",
        descricao: "Erro ao carregar solicitações do cidadão.",
        tabela: "solicitacoes_cidadao",
        detalhes: {
          erro: error.message,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao carregar solicitações.");
      return;
    }

    setSolicitacoes((data || []) as Solicitacao[]);
  }

  const pendentes = solicitacoes.filter((s) => s.status === "PENDENTE").length;
  const analise = solicitacoes.filter((s) => s.status === "EM_ANALISE").length;
  const concluidas = solicitacoes.filter((s) =>
    ["ATENDIDA", "CONCLUIDA"].includes(s.status || "")
  ).length;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Solicitações"
        subtitulo="Pedidos de apoio, serviços e demandas enviados pelo cidadão."
        icone={ClipboardList}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          titulo="Solicitações"
          valor={solicitacoes.length}
          icone={<ClipboardList className="w-7 h-7 text-blue-400" />}
        />

        <Card
          titulo="Pendentes"
          valor={pendentes}
          icone={<Clock className="w-7 h-7 text-yellow-400" />}
        />

        <Card
          titulo="Em Análise"
          valor={analise}
          icone={<AlertCircle className="w-7 h-7 text-red-400" />}
        />

        <Card
          titulo="Concluídas"
          valor={concluidas}
          icone={<CheckCircle className="w-7 h-7 text-green-400" />}
        />
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            className="input flex-1"
            placeholder="Pesquisar por protocolo, tipo, local ou descrição..."
            value={busca}
            maxLength={80}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="input md:w-60"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="TODOS">Todos</option>
            <option value="PENDENTE">Pendente</option>
            <option value="EM_ANALISE">Em análise</option>
            <option value="ATENDIDA">Atendida</option>
            <option value="INDEFERIDA">Indeferida</option>
            <option value="ARQUIVADA">Arquivada</option>
          </select>

          <SigButton type="gold" onClick={carregar}>
            <Search className="w-4 h-4" />
            Consultar
          </SigButton>

          <Link href="/sistema/portal-cidadao/solicitacoes/nova">
            <SigButton type="blue">
              <Plus className="w-4 h-4" />
              Nova Solicitação
            </SigButton>
          </Link>
        </div>
      </SigCard>

      <SigCard>
        {carregando ? (
          <p className="text-slate-400">Carregando solicitações...</p>
        ) : solicitacoes.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-16 h-16 mx-auto text-slate-600 mb-4" />

            <h2 className="text-xl font-black text-white">
              Nenhuma solicitação encontrada
            </h2>

            <p className="text-slate-400 mt-2">
              As solicitações feitas pelo cidadão aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {solicitacoes.map((solicitacao) => (
              <div
                key={solicitacao.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="text-white font-black">
                      {solicitacao.protocolo || "Sem protocolo"}
                    </p>

                    <p className="text-slate-400 text-sm">
                      {solicitacao.tipo || "Sem tipo"} •{" "}
                      {solicitacao.local || "Local não informado"}
                    </p>
                  </div>

                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold text-slate-300">
                    {solicitacao.status || "PENDENTE"}
                  </span>
                </div>

                <p className="text-slate-300 mt-3 line-clamp-2">
                  {solicitacao.descricao || "Descrição não informada."}
                </p>

                <p className="text-xs text-slate-500 mt-4">
                  Criada em:{" "}
                  {solicitacao.criado_em
                    ? new Date(solicitacao.criado_em).toLocaleString("pt-BR")
                    : "N/I"}
                </p>
              </div>
            ))}
          </div>
        )}
      </SigCard>
    </div>
  );
}

function Card({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: number;
  icone: React.ReactNode;
}) {
  return (
    <div className="painel-premium p-5">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-slate-400 text-sm">{titulo}</p>
          <h2 className="text-3xl font-black text-white">{valor}</h2>
        </div>

        {icone}
      </div>
    </div>
  );
}