"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EstatisticasGuardaPage() {
  const { id } = useParams();

  const [stats, setStats] = useState({
    documentos: 0,
    cursos: 0,
    patrulhamentos: 0,
    ocorrencias: 0,
  });

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : {};

  async function carregarEstatisticas() {
    const { count: documentos } = await supabase
      .from("documentos_guardas")
      .select("*", { count: "exact", head: true })
      .eq("guarda_id", Number(id));

    const { count: cursos } = await supabase
      .from("cursos_guardas")
      .select("*", { count: "exact", head: true })
      .eq("guarda_id", Number(id));

    const { data: guarda } = await supabase
      .from("guardas")
      .select("nome")
      .eq("id", Number(id))
      .eq("municipio_id", usuarioLogado.municipio_id)
      .single();

    let patrulhamentos = 0;

    if (guarda?.nome) {
      const { count } = await supabase
        .from("localizacoes_tempo_real")
        .select("*", { count: "exact", head: true })
        .eq("nome", guarda.nome);

      patrulhamentos = count || 0;
    }

    setStats({
      documentos: documentos || 0,
      cursos: cursos || 0,
      patrulhamentos,
      ocorrencias: 0,
    });
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-black mb-6">
        📊 Estatísticas do Guarda
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <Card titulo="📄 Documentos" valor={stats.documentos} />
        <Card titulo="🎓 Cursos" valor={stats.cursos} />
        <Card titulo="📍 Patrulhamentos" valor={stats.patrulhamentos} />
        <Card titulo="🚨 Ocorrências" valor={stats.ocorrencias} />
      </div>
    </div>
  );
}

function Card({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="painel-premium p-6">
      <p className="text-slate-400">{titulo}</p>

      <h2 className="text-5xl font-black mt-2">
        {valor}
      </h2>
    </div>
  );
}