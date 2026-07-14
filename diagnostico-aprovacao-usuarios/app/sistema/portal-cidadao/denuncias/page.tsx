"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MessageSquareWarning,
  PlusCircle,
  RefreshCw,
  Search,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigStatusBadge from "@/components/sig/SigStatusBadge";

type UsuarioLogado = {
  id: string;
  perfil: string;
  municipio_id: number;
};

type Denuncia = {
  id: number;
  protocolo: string | null;
  tipo: string | null;
  local: string | null;
  relato: string | null;
  status: string | null;
  anonima: boolean | null;
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

export default function DenunciasCidadaoPage() {
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    void carregarDenuncias();
  }, []);

  async function carregarDenuncias() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      setDenuncias([]);
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const { data, error } = await supabase
      .from("denuncias_cidadao")
      .select("id, protocolo, tipo, local, relato, status, anonima, criado_em")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false })
      .limit(100);

    if (error) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Denúncias do Cidadão",
        acao: "ERRO",
        descricao: "Erro ao carregar denúncias do cidadão.",
        tabela: "denuncias_cidadao",
        detalhes: {
          erro: error.message,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao carregar denúncias.");
      setCarregando(false);
      return;
    }

    await registrarAuditoria({
      modulo: "Denúncias do Cidadão",
      acao: "ACESSO",
      descricao: "Acessou a central de denúncias do cidadão.",
      tabela: "denuncias_cidadao",
      detalhes: {
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
        total_registros: data?.length || 0,
      },
    });

    setDenuncias((data || []) as Denuncia[]);
    setCarregando(false);
  }

  const denunciasFiltradas = denuncias.filter((d) => {
    const texto = `
      ${d.protocolo || ""}
      ${d.tipo || ""}
      ${d.local || ""}
      ${d.relato || ""}
      ${d.status || ""}
    `.toLowerCase();

    return texto.includes(busca.trim().toLowerCase());
  });

  const abertas = denuncias.filter((d) => d.status !== "CONCLUIDA").length;
  const concluidas = denuncias.filter((d) => d.status === "CONCLUIDA").length;
  const anonimas = denuncias.filter((d) => d.anonima).length;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Denúncias do Cidadão"
        subtitulo="Registro, triagem e acompanhamento das denúncias enviadas pela população."
        icone={MessageSquareWarning}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ResumoCard titulo="Total" valor={denuncias.length} cor="text-cyan-400" />
        <ResumoCard titulo="Abertas" valor={abertas} cor="text-yellow-400" />
        <ResumoCard titulo="Concluídas" valor={concluidas} cor="text-emerald-400" />
        <ResumoCard titulo="Anônimas" valor={anonimas} cor="text-red-400" />
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />

            <input
              className="input pl-12"
              placeholder="Buscar por protocolo, tipo, local, relato ou status..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <Link
            href="/sistema/portal-cidadao/denuncias/nova"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 font-bold text-white hover:bg-emerald-500"
          >
            <PlusCircle size={18} />
            Nova Denúncia
          </Link>

          <button
            type="button"
            onClick={carregarDenuncias}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-slate-800"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-1">
          Denúncias registradas
        </h2>

        <p className="text-slate-400 text-sm mb-5">
          Exibindo {denunciasFiltradas.length} registro(s).
        </p>

        {carregando ? (
          <p className="text-slate-400">Carregando denúncias...</p>
        ) : denunciasFiltradas.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquareWarning className="w-16 h-16 mx-auto text-cyan-400 mb-4" />

            <h3 className="text-2xl font-black text-white">
              Nenhuma denúncia encontrada
            </h3>

            <p className="text-slate-400 mt-2">
              As denúncias enviadas pela população aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {denunciasFiltradas.map((d) => (
              <div
                key={d.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 hover:border-cyan-500/30 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="text-white font-black">
                      {d.protocolo || "Sem protocolo"}
                    </p>

                    <p className="text-slate-400 text-sm">
                      {d.tipo || "Tipo não informado"} •{" "}
                      {d.local || "Local não informado"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {d.anonima && (
                      <span className="rounded-full bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1 text-xs font-black">
                        ANÔNIMA
                      </span>
                    )}

                    <SigStatusBadge status={d.status || "PENDENTE"} />
                  </div>
                </div>

                <p className="text-slate-300 mt-3 line-clamp-2">
                  {d.relato || "Relato não informado."}
                </p>

                <p className="text-xs text-slate-500 mt-4">
                  Registrada em:{" "}
                  {d.criado_em
                    ? new Date(d.criado_em).toLocaleString("pt-BR")
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

function ResumoCard({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: number;
  cor: string;
}) {
  return (
    <SigCard>
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h2 className={`text-4xl font-black mt-2 ${cor}`}>{valor}</h2>
      <p className="text-slate-500 text-xs mt-1">Denúncias</p>
    </SigCard>
  );
}