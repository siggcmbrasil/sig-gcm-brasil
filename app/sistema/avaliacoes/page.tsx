"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Lock,
  Star,
  TrendingUp,
  UserCheck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

type UsuarioLogado = {
  id: number;
  perfil?: string;
  municipio_id: number;
};

type Avaliacao = {
  id: number;
  guarda_id: number | null;
  nota_final: number | null;
  status: string | null;
};

export default function AvaliacoesPage() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [bloqueado, setBloqueado] = useState(false);

  useEffect(() => {
    async function iniciar() {
      const usuario = JSON.parse(
        localStorage.getItem("usuarioLogado") || "{}"
      ) as UsuarioLogado;

      if (!usuario?.id || !usuario?.municipio_id) {
        setBloqueado(true);
        setCarregando(false);
        return;
      }

      if (
        ![
          "ADMIN",
          "COMANDANTE",
          "DIRETOR",
          "DESENVOLVEDOR",
        ].includes(usuario.perfil || "")
      ) {
        await registrarAuditoria({
          modulo: "Avaliações",
          acao: "ACESSO_NEGADO",
          descricao: "Tentativa de acesso ao módulo de avaliações sem permissão.",
          tabela: "avaliacoes",
          detalhes: {
            usuario_id: usuario.id,
            perfil: usuario.perfil,
            municipio_id: usuario.municipio_id,
          },
        });

        setBloqueado(true);
        setCarregando(false);
        return;
      }

      await registrarAuditoria({
        modulo: "Avaliações",
        acao: "ACESSO",
        descricao: "Acessou o módulo de avaliações.",
        tabela: "avaliacoes",
        detalhes: {
          usuario_id: usuario.id,
          municipio_id: usuario.municipio_id,
        },
      });

      await carregar(usuario);
    }

    iniciar();
  }, []);

  async function carregar(usuario: UsuarioLogado) {
    setCarregando(true);

    const { data, error } = await supabase
      .from("avaliacoes")
      .select("id, guarda_id, nota_final, status")
      .eq("municipio_id", usuario.municipio_id)
      .order("id", { ascending: false })
      .range(0, 499);

    setCarregando(false);

    if (error) {
      await registrarAuditoria({
        modulo: "Avaliações",
        acao: "ERRO",
        descricao: "Erro ao carregar avaliações.",
        tabela: "avaliacoes",
        detalhes: {
          erro: error.message,
          municipio_id: usuario.municipio_id,
        },
      });

      alert("Erro ao carregar avaliações.");
      return;
    }

    setAvaliacoes(data || []);
  }

  const resumo = useMemo(() => {
    const guardasAvaliados = new Set(
      avaliacoes.map((item) => item.guarda_id).filter(Boolean)
    ).size;

    const notas = avaliacoes
      .map((item) => Number(item.nota_final || 0))
      .filter((nota) => nota > 0);

    const media =
      notas.length > 0
        ? Math.round(notas.reduce((acc, nota) => acc + nota, 0) / notas.length)
        : 0;

    return {
      total: avaliacoes.length,
      guardasAvaliados,
      media,
      pendentes: avaliacoes.filter((item) => item.status === "PENDENTE").length,
    };
  }, [avaliacoes]);

  if (carregando) {
    return (
      <div className="p-4 md:p-6">
        <SigCard>
          <p className="text-slate-400">Carregando avaliações...</p>
        </SigCard>
      </div>
    );
  }

  if (bloqueado) {
    return (
      <div className="p-4 md:p-6 pb-24 space-y-6">
        <div className="mb-4 flex justify-end">
        <Link
          href="/sistema/saude-mental"
          className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-300"
        >
          Saúde mental e apoio psicossocial
        </Link>
      </div>

      <SigPageHeader
          titulo="Acesso Restrito"
          subtitulo="Você não possui permissão para acessar Avaliações."
          icone={Lock}
        />

        <SigCard>
          <div className="text-center py-12">
            <Lock className="w-16 h-16 mx-auto text-red-400 mb-4" />

            <h2 className="text-2xl font-black text-white">
              Acesso negado
            </h2>

            <p className="text-slate-400 mt-2">
              Apenas perfis autorizados podem visualizar avaliações.
            </p>
          </div>
        </SigCard>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="flex justify-end">
        <Link href="/sistema/estagio-probatorio" className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-300">
          Estágio probatório
        </Link>
      </div>

      <SigPageHeader
        titulo="Avaliações"
        subtitulo="Gestão de avaliações de desempenho e acompanhamento profissional."
        icone={ClipboardCheck}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <Star className="w-8 h-8 text-yellow-400 mb-3" />
          <h2 className="text-3xl font-black text-white">{resumo.total}</h2>
          <p className="text-slate-400 mt-2">Avaliações realizadas</p>
        </SigCard>

        <SigCard>
          <UserCheck className="w-8 h-8 text-cyan-400 mb-3" />
          <h2 className="text-3xl font-black text-white">
            {resumo.guardasAvaliados}
          </h2>
          <p className="text-slate-400 mt-2">Guardas avaliados</p>
        </SigCard>

        <SigCard>
          <TrendingUp className="w-8 h-8 text-green-400 mb-3" />
          <h2 className="text-3xl font-black text-white">
            {resumo.media}%
          </h2>
          <p className="text-slate-400 mt-2">Média de desempenho</p>
        </SigCard>

        <SigCard>
          <ClipboardCheck className="w-8 h-8 text-orange-400 mb-3" />
          <h2 className="text-3xl font-black text-white">
            {resumo.pendentes}
          </h2>
          <p className="text-slate-400 mt-2">Pendentes</p>
        </SigCard>
      </div>

      <SigCard>
        <h2 className="text-2xl font-black text-white">
          Avaliações registradas
        </h2>

        {avaliacoes.length === 0 ? (
          <p className="text-slate-400 mt-3">
            Nenhuma avaliação registrada neste município.
          </p>
        ) : (
          <div className="space-y-3 mt-5">
            {avaliacoes.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <p className="text-white font-bold">
                  Avaliação #{item.id}
                </p>

                <p className="text-slate-400 text-sm mt-1">
                  Guarda ID: {item.guarda_id || "N/I"} • Nota:{" "}
                  {item.nota_final || 0}% • Status: {item.status || "N/I"}
                </p>
              </div>
            ))}
          </div>
        )}
      </SigCard>
    </div>
  );
}