"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FileText, Plus, Search, Shield } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

type UsuarioLogado = {
  id: number;
  municipio_id: number;
  perfil?: string;
};

type Operacao = {
  id: number;
  tipo: string | null;
  local: string | null;
  responsavel: string | null;
  observacoes: string | null;
  data: string | null;
  status: string | null;
};

export default function BlitzesBarreirasPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function iniciar() {
      const dados = JSON.parse(
        localStorage.getItem("usuarioLogado") || "{}"
      );

      if (!dados?.id || !dados?.municipio_id) {
        alert("Sessão inválida.");
        setCarregando(false);
        return;
      }

      setUsuario(dados);

      await registrarAuditoria({
        modulo: "Blitzes e Barreiras",
        acao: "ACESSO",
        descricao: "Acessou a listagem de blitzes e barreiras.",
        tabela: "blitzes_barreiras",
        detalhes: {
          usuario_id: dados.id,
          municipio_id: dados.municipio_id,
        },
      });

      await carregar(dados);
    }

    iniciar();
  }, []);

  async function carregar(usuarioAtual: UsuarioLogado) {
    setCarregando(true);

    const { data, error } = await supabase
      .from("blitzes_barreiras")
      .select("id, tipo, local, responsavel, observacoes, data, status")
      .eq("municipio_id", usuarioAtual.municipio_id)
      .order("id", { ascending: false })
      .range(0, 199);

    setCarregando(false);

    if (error) {
      await registrarAuditoria({
        modulo: "Blitzes e Barreiras",
        acao: "ERRO",
        descricao: "Erro ao carregar blitzes e barreiras.",
        tabela: "blitzes_barreiras",
        detalhes: {
          erro: error.message,
          usuario_id: usuarioAtual.id,
          municipio_id: usuarioAtual.municipio_id,
        },
      });

      alert("Erro ao carregar operações.");
      return;
    }

    setOperacoes(data || []);
  }

  const lista = useMemo(() => {
    return operacoes.filter((item) => {
      const texto = `
        ${item.tipo || ""}
        ${item.local || ""}
        ${item.responsavel || ""}
        ${item.observacoes || ""}
        ${item.status || ""}
      `.toLowerCase();

      return texto.includes(busca.toLowerCase());
    });
  }, [operacoes, busca]);

  const hoje = new Date().toISOString().split("T")[0];

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Blitzes e Barreiras"
        subtitulo="Lista e gerenciamento das operações registradas."
        icone={Shield}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <p className="text-slate-400">Total</p>
          <h2 className="text-4xl font-black mt-2">
            {carregando ? "..." : operacoes.length}
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400">Blitzes</p>
          <h2 className="text-4xl font-black text-yellow-400 mt-2">
            {carregando
              ? "..."
              : operacoes.filter((item) => item.tipo === "BLITZ").length}
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400">Barreiras</p>
          <h2 className="text-4xl font-black text-cyan-400 mt-2">
            {carregando
              ? "..."
              : operacoes.filter((item) => item.tipo === "BARREIRA").length}
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400">Hoje</p>
          <h2 className="text-4xl font-black text-emerald-400 mt-2">
            {carregando
              ? "..."
              : operacoes.filter((item) => item.data === hoje).length}
          </h2>
        </SigCard>
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

            <input
              className="input pl-12"
              placeholder="Pesquisar por tipo, local, responsável ou status..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <Link
            href="/sistema/blitzes-barreiras/nova"
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Nova Operação
          </Link>

          <Link
            href="/sistema/blitzes-barreiras/relatorio"
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            <FileText size={18} />
            Relatório
          </Link>
        </div>
      </SigCard>

      <SigCard>
        {carregando ? (
          <p className="text-slate-400 text-center py-10">
            Carregando operações...
          </p>
        ) : lista.length === 0 ? (
          <p className="text-slate-400 text-center py-10">
            Nenhuma operação encontrada.
          </p>
        ) : (
          <div className="space-y-4">
            {lista.map((item) => (
              <div
                key={item.id}
                className="border border-slate-800 rounded-xl p-4 bg-slate-950/50"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h2 className="font-black text-lg text-white">
                      {item.tipo || "Operação"}
                    </h2>

                    <p className="text-slate-400">
                      {item.local || "Local não informado"}
                    </p>

                    <p className="text-sm text-slate-500">
                      {item.data || "Data não informada"}
                    </p>
                  </div>

                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold text-slate-300 w-fit">
                    {item.status || "SEM_STATUS"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SigCard>
    </div>
  );
}