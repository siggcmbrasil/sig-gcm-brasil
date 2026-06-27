"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function FrotaDashboardPage() {
  const [dados, setDados] = useState({
    viaturas: 0,
    abastecimentos: 0,
    manutencoes: 0,
    checklists: 0,
    danos: 0,
    pneus: 0,
  });

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    if (usuario?.municipio_id) carregar();
  }, []);

  async function contar(tabela: string) {
    const { count } = await supabase
      .from(tabela)
      .select("*", { count: "exact", head: true })
      .eq("municipio_id", usuario.municipio_id);

    return count || 0;
  }

  async function carregar() {
    const [viaturas, abastecimentos, manutencoes, checklists, danos, pneus] =
      await Promise.all([
        contar("viaturas"),
        contar("abastecimentos"),
        contar("manutencoes_viaturas"),
        contar("checklists_viaturas"),
        contar("danos_viaturas"),
        contar("pneus"),
      ]);

    setDados({ viaturas, abastecimentos, manutencoes, checklists, danos, pneus });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-3xl font-black">Dashboard da Frota</h1>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card titulo="Viaturas" valor={dados.viaturas} icone="🚓" />
        <Card titulo="Abastecimentos" valor={dados.abastecimentos} icone="⛽" />
        <Card titulo="Manutenções" valor={dados.manutencoes} icone="🔧" />
        <Card titulo="Checklists" valor={dados.checklists} icone="✅" />
        <Card titulo="Danos" valor={dados.danos} icone="⚠️" />
        <Card titulo="Pneus" valor={dados.pneus} icone="🛞" />
      </div>
    </div>
  );
}

function Card({ titulo, valor, icone }: { titulo: string; valor: number; icone: string }) {
  return (
    <div className="painel-premium p-5">
      <p className="text-4xl">{icone}</p>
      <p className="text-slate-400 mt-4">{titulo}</p>
      <h2 className="text-4xl font-black mt-1">{valor}</h2>
    </div>
  );
}