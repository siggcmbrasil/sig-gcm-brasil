"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CarFront,
  Map,
  PhoneCall,
  Shield,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function IndicadoresPage() {
  const [carregando, setCarregando] = useState(true);
  const [dados, setDados] = useState({
    ocorrencias: 0,
    patrulhamentos: 0,
    chamados: 0,
    apoios: 0,
    escoltas: 0,
    blitzes: 0,
    pessoas: 0,
    veiculos: 0,
  });

  useEffect(() => {
    carregar();
  }, []);

  async function contar(tabela: string, municipioId: number) {
    const { count, error } = await supabase
      .from(tabela)
      .select("*", { count: "exact", head: true })
      .eq("municipio_id", municipioId);

    if (error) {
      console.error(`Erro ao contar ${tabela}:`, error);
      return 0;
    }

    return count || 0;
  }

  async function carregar() {
    setCarregando(true);

    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      setCarregando(false);
      return;
    }

    const municipioId = usuario.municipio_id;

    const [
      ocorrencias,
      patrulhamentos,
      chamados,
      apoios,
      escoltas,
      blitzes,
      pessoas,
      veiculos,
    ] = await Promise.all([
      contar("ocorrencias", municipioId),
      contar("patrulhamentos", municipioId),
      contar("chamados", municipioId),
      contar("apoios", municipioId),
      contar("escoltas", municipioId),
      contar("blitzes_barreiras", municipioId),
      contar("pessoas_abordadas", municipioId),
      contar("veiculos_abordados", municipioId),
    ]);

    setDados({
      ocorrencias,
      patrulhamentos,
      chamados,
      apoios,
      escoltas,
      blitzes,
      pessoas,
      veiculos,
    });

    setCarregando(false);
  }

  const cards = [
    {
      titulo: "Ocorrências",
      valor: dados.ocorrencias,
      icone: AlertTriangle,
    },
    {
      titulo: "Patrulhamentos",
      valor: dados.patrulhamentos,
      icone: Map,
    },
    {
      titulo: "Chamados",
      valor: dados.chamados,
      icone: PhoneCall,
    },
    {
      titulo: "Apoios",
      valor: dados.apoios,
      icone: Shield,
    },
    {
      titulo: "Escoltas",
      valor: dados.escoltas,
      icone: CarFront,
    },
    {
      titulo: "Blitze/Barreiras",
      valor: dados.blitzes,
      icone: Activity,
    },
    {
      titulo: "Pessoas Abordadas",
      valor: dados.pessoas,
      icone: Users,
    },
    {
      titulo: "Veículos Abordados",
      valor: dados.veiculos,
      icone: CarFront,
    },
  ];

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Indicadores Operacionais"
        subtitulo="Resumo geral das atividades registradas no município."
        icone={Activity}
      />

      {carregando ? (
        <SigCard>
          <p className="text-slate-400">Carregando indicadores...</p>
        </SigCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((card) => {
            const Icone = card.icone;

            return (
              <SigCard key={card.titulo}>
                <Icone className="w-8 h-8 text-cyan-400 mb-3" />

                <p className="text-slate-400 text-sm">{card.titulo}</p>

                <h2 className="text-4xl font-black text-white mt-2">
                  {card.valor}
                </h2>
              </SigCard>
            );
          })}
        </div>
      )}
    </div>
  );
}