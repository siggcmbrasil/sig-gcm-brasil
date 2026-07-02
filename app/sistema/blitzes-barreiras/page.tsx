"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Shield,
  Search,
  Plus,
  FileText,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function BlitzesBarreirasPage() {
  const [operacoes, setOperacoes] = useState<any[]>([]);
  const [busca, setBusca] = useState("");

  async function carregar() {
    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    const { data } = await supabase
      .from("blitzes_barreiras")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("id", { ascending: false });

    setOperacoes(data || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  const lista = operacoes.filter((o) =>
    `
      ${o.tipo || ""}
      ${o.local || ""}
      ${o.responsavel || ""}
      ${o.observacoes || ""}
    `
      .toLowerCase()
      .includes(busca.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Blitze e Barreiras"
        subtitulo="Lista e gerenciamento das operações registradas."
        icone={Shield}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <p className="text-slate-400">Total</p>
          <h2 className="text-4xl font-black mt-2">
            {operacoes.length}
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400">Blitzes</p>
          <h2 className="text-4xl font-black text-yellow-400 mt-2">
            {
              operacoes.filter(
                (o) => o.tipo === "BLITZ"
              ).length
            }
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400">Barreiras</p>
          <h2 className="text-4xl font-black text-cyan-400 mt-2">
            {
              operacoes.filter(
                (o) => o.tipo === "BARREIRA"
              ).length
            }
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400">Hoje</p>
          <h2 className="text-4xl font-black text-emerald-400 mt-2">
            {
              operacoes.filter(
                (o) =>
                  o.data ===
                  new Date().toISOString().split("T")[0]
              ).length
            }
          </h2>
        </SigCard>
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

            <input
              className="input pl-12"
              placeholder="Pesquisar..."
              value={busca}
              onChange={(e) =>
                setBusca(e.target.value)
              }
            />
          </div>

          <Link
            href="/sistema/blitzes-barreiras/nova"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={18} />
            Nova Operação
          </Link>

          <Link
            href="/sistema/blitzes-barreiras/relatorio"
            className="btn-secondary inline-flex items-center gap-2"
          >
            <FileText size={18} />
            Relatório
          </Link>
        </div>
      </SigCard>

      <SigCard>
        {lista.length === 0 ? (
  <p className="text-slate-400 text-center py-10">
    Nenhuma operação encontrada.
  </p>
) : (
  <div className="space-y-4">
    {lista.map((item) => (
            <div
              key={item.id}
              className="border border-slate-800 rounded-xl p-4"
            >
              <h2 className="font-black text-lg">
                {item.tipo}
              </h2>

              <p className="text-slate-400">
                {item.local}
              </p>

              <p className="text-sm text-slate-500">
                {item.data}
              </p>
            </div>
              ))}
  </div>
)}
      </SigCard>
    </div>
  );
}