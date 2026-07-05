"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
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

type RegistroOuvidoria = {
  id: number;
  protocolo: string | null;
  tipo: string | null;
  assunto: string | null;
  mensagem: string | null;
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

export default function OuvidoriaPage() {
  const [registros, setRegistros] = useState<RegistroOuvidoria[]>([]);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("TODOS");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    void carregar();
  }, []);

  async function carregar() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      setCarregando(false);
      return;
    }

    setCarregando(true);

    let query = supabase
      .from("ouvidoria_cidadao")
      .select("id, protocolo, tipo, assunto, mensagem, status, criado_em")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false })
      .limit(100);

    if (status !== "TODOS") {
      query = query.eq("status", status);
    }

    if (busca.trim()) {
      const termo = busca.trim();

      query = query.or(
        `protocolo.ilike.%${termo}%,tipo.ilike.%${termo}%,assunto.ilike.%${termo}%`
      );
    }

    const { data, error } = await query;

    setCarregando(false);

    if (error) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Ouvidoria",
        acao: "ERRO",
        descricao: "Erro ao carregar registros da ouvidoria.",
        tabela: "ouvidoria_cidadao",
        detalhes: {
          erro: error.message,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao carregar registros da ouvidoria.");
      return;
    }

    setRegistros((data || []) as RegistroOuvidoria[]);
  }

  const pendentes = registros.filter((r) => r.status === "PENDENTE").length;
  const analise = registros.filter((r) => r.status === "EM_ANALISE").length;
  const respondidos = registros.filter((r) => r.status === "RESPONDIDO").length;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Ouvidoria"
        subtitulo="Canal de comunicação entre o cidadão e a Guarda Municipal."
        icone={MessageSquare}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          titulo="Registros"
          valor={registros.length}
          icone={<MessageSquare className="w-7 h-7 text-blue-400" />}
        />

        <Card
          titulo="Pendentes"
          valor={pendentes}
          icone={<Clock className="w-7 h-7 text-yellow-400" />}
        />

        <Card
          titulo="Respondidos"
          valor={respondidos}
          icone={<CheckCircle className="w-7 h-7 text-green-400" />}
        />

        <Card
          titulo="Em Análise"
          valor={analise}
          icone={<AlertCircle className="w-7 h-7 text-red-400" />}
        />
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            className="input flex-1"
            placeholder="Pesquisar protocolo, tipo ou assunto..."
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
            <option value="RESPONDIDO">Respondido</option>
            <option value="ARQUIVADO">Arquivado</option>
          </select>

          <SigButton type="gold" onClick={carregar}>
            <Search className="w-4 h-4" />
            Consultar
          </SigButton>

          <Link href="/sistema/portal-cidadao/ouvidoria/nova">
            <SigButton type="blue">
              <Plus className="w-4 h-4" />
              Novo Registro
            </SigButton>
          </Link>
        </div>
      </SigCard>

      <SigCard>
        {carregando ? (
          <p className="text-slate-400">Carregando registros...</p>
        ) : registros.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-16 h-16 mx-auto text-slate-600 mb-4" />

            <h2 className="text-xl font-black text-white">
              Nenhum registro encontrado
            </h2>

            <p className="text-slate-400 mt-2">
              As manifestações da ouvidoria aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {registros.map((registro) => (
              <div
                key={registro.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="text-white font-black">
                      {registro.protocolo || "Sem protocolo"}
                    </p>

                    <p className="text-slate-400 text-sm">
                      {registro.tipo || "Tipo não informado"} •{" "}
                      {registro.assunto || "Sem assunto"}
                    </p>
                  </div>

                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold text-slate-300">
                    {registro.status || "PENDENTE"}
                  </span>
                </div>

                <p className="text-slate-300 mt-3 line-clamp-2">
                  {registro.mensagem || "Mensagem não informada."}
                </p>

                <p className="text-xs text-slate-500 mt-4">
                  Criado em:{" "}
                  {registro.criado_em
                    ? new Date(registro.criado_em).toLocaleString("pt-BR")
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