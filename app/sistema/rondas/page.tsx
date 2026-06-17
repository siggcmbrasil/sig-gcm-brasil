"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function RondasPage() {
  const [planos, setPlanos] = useState<any[]>([]);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    carregarPlanos();
  }, []);

  async function carregarPlanos() {
    const { data } = await supabase
      .from("planos_ronda")
      .select("*")
      .order("id", { ascending: false });

    setPlanos(data || []);
  }

  async function salvarPlano() {
    if (!nome.trim()) {
      alert("Informe o nome do plano.");
      return;
    }

    const { error } = await supabase.from("planos_ronda").insert({
      nome,
      descricao,
      ativo: true,
    });

    if (error) {
      alert("Erro ao salvar plano.");
      return;
    }

    setNome("");
    setDescricao("");
    carregarPlanos();
  }

  return (
    <div className="p-6 text-white space-y-6">
      <h1 className="text-3xl font-black">🚔 Plano de Rondas</h1>

      <div className="bg-red-600 p-3 rounded-xl font-black">
  TESTE RONDAS 123
</div>

      <div className="flex gap-3 mt-4 mb-6">
  <Link
    href="/sistema/rondas/relatorio"
    className="bg-blue-700 hover:bg-blue-800 px-4 py-3 rounded-xl font-bold"
  >
    📋 Relatório de Rondas
  </Link>

  <Link
    href="/sistema/rondas/ler-qrcode"
    className="bg-green-700 hover:bg-green-800 px-4 py-3 rounded-xl font-bold"
  >
    🔳 Ler QR Code
  </Link>
</div>

      <div className="painel-premium p-6 space-y-4">
        <input
          className="input"
          placeholder="Nome do plano. Ex: Ronda Escolar"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <textarea
          className="input h-28"
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <button onClick={salvarPlano} className="btn-primary">
          Salvar Plano
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {planos.map((plano) => (
          <Link key={plano.id} href={`/sistema/rondas/${plano.id}`} className="painel-premium p-5 block hover:scale-105 transition">
            <h2 className="text-xl font-black">🚔 {plano.nome}</h2>

<p className="text-slate-400 mt-2">
  {plano.descricao}
</p>

<div className="flex gap-2 mt-4">
  <Link
    href={`/sistema/rondas/${plano.id}`}
    className="bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-lg font-bold text-sm"
  >
    📍 Pontos
  </Link>

  <Link
    href={`/sistema/rondas/execucao/${plano.id}`}
    className="bg-green-700 hover:bg-green-800 px-3 py-2 rounded-lg font-bold text-sm"
  >
    🚔 Executar
  </Link>
</div>
          </Link>
        ))}
      </div>
    </div>
  );
}