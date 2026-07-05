"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import { supabase } from "@/lib/supabase";

export default function EstatisticasGuardaPage() {
  const { id } = useParams();

  const [stats, setStats] = useState({
    documentos: 0,
    cursos: 0,
    patrulhamentos: 0,
    ocorrencias: 0,
    elogios: 0,
    advertencias: 0,
  });

  const usuarioLogado =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  async function carregarEstatisticas() {
    if (!id || !usuarioLogado?.municipio_id) return;

    const [
      documentosRes,
      cursosRes,
      elogiosRes,
      advertenciasRes,
      guardaRes,
    ] = await Promise.all([
      supabase
        .from("documentos_guardas")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("guarda_id", Number(id)),

      supabase
        .from("cursos_guardas")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("guarda_id", Number(id)),

      supabase
        .from("elogios_guardas")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("guarda_id", Number(id)),

      supabase
        .from("advertencias_guardas")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("guarda_id", Number(id)),

      supabase
        .from("guardas")
        .select("nome")
        .eq("id", Number(id))
        .eq(
          "municipio_id",
          usuarioLogado.municipio_id
        )
        .single(),
    ]);

    let patrulhamentos = 0;
    let ocorrencias = 0;

    if (guardaRes.data?.nome) {
      const nome = guardaRes.data.nome;

      const { count: patrulhamentoCount } =
        await supabase
          .from("localizacoes_tempo_real")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("nome", nome);

      patrulhamentos =
        patrulhamentoCount || 0;

      const { count: ocorrenciaCount } =
        await supabase
          .from("ocorrencias")
          .select("*", {
            count: "exact",
            head: true,
          })
          .ilike(
            "guardas_envolvidos",
            `%${nome}%`
          );

      ocorrencias =
        ocorrenciaCount || 0;
    }

    setStats({
      documentos:
        documentosRes.count || 0,
      cursos:
        cursosRes.count || 0,
      patrulhamentos,
      ocorrencias,
      elogios:
        elogiosRes.count || 0,
      advertencias:
        advertenciasRes.count || 0,
    });
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <div className="p-6 text-white">
        <h1 className="text-3xl font-black mb-6">
          📊 Estatísticas do Guarda
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <Card
            titulo="📄 Documentos"
            valor={stats.documentos}
          />

          <Card
            titulo="🎓 Cursos"
            valor={stats.cursos}
          />

          <Card
            titulo="📍 Patrulhamentos"
            valor={stats.patrulhamentos}
          />

          <Card
            titulo="🚨 Ocorrências"
            valor={stats.ocorrencias}
          />

          <Card
            titulo="🏆 Elogios"
            valor={stats.elogios}
          />

          <Card
            titulo="⚠️ Advertências"
            valor={stats.advertencias}
          />
        </div>
      </div>
    </ProtecaoModulo>
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
      <p className="text-slate-400">
        {titulo}
      </p>

      <h2 className="text-5xl font-black mt-2">
        {valor}
      </h2>
    </div>
  );
}