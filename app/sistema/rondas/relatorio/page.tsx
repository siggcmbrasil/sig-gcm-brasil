"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RelatorioRondasPage() {
  const [checkins, setCheckins] = useState<any[]>([]);
  const [pontos, setPontos] = useState<any[]>([]);
  const [planos, setPlanos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarRelatorio();
  }, []);

  async function carregarRelatorio() {
    setCarregando(true);

    const { data: checkinsData } = await supabase
      .from("checkins_ronda")
      .select("*")
      .order("id", { ascending: false });

    const { data: pontosData } = await supabase
      .from("pontos_ronda")
      .select("*");

    const { data: planosData } = await supabase
      .from("planos_ronda")
      .select("*");

    setCheckins(checkinsData || []);
    setPontos(pontosData || []);
    setPlanos(planosData || []);
    setCarregando(false);
  }

  function nomePonto(pontoId: number) {
    return pontos.find((p) => Number(p.id) === Number(pontoId))?.nome_local || `Ponto ${pontoId}`;
  }

  function nomePlano(planoId: number) {
    return planos.find((p) => Number(p.id) === Number(planoId))?.nome || `Plano ${planoId}`;
  }

  return (
    <div className="p-6 text-white space-y-6">
      <header>
        <h1 className="text-3xl font-black">
          📋 Relatório de Rondas
        </h1>

        <p className="text-slate-400">
          Check-ins realizados por QR Code nos pontos de ronda.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card titulo="Total de Check-ins" valor={checkins.length} />
        <Card titulo="Planos de Ronda" valor={planos.length} />
        <Card titulo="Pontos Cadastrados" valor={pontos.length} />
      </div>

      {carregando ? (
        <div className="painel-premium p-6">
          Carregando relatório...
        </div>
      ) : checkins.length === 0 ? (
        <div className="painel-premium p-6 text-slate-400">
          Nenhum check-in registrado ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {checkins.map((item) => (
            <div
              key={item.id}
              className="painel-premium p-4"
            >
              <h2 className="font-black text-lg">
                ✅ {nomePonto(item.ponto_id)}
              </h2>

              <p className="text-blue-400 text-sm">
                🚔 {nomePlano(item.plano_id)}
              </p>

              <p className="text-slate-300">
                👮 {item.nome || "Usuário não identificado"}
              </p>

              <p className="text-slate-400 text-sm">
                📍 {item.latitude || "-"}, {item.longitude || "-"}
              </p>

              {item.observacao && (
                <p className="text-slate-300 text-sm">
                  📝 {item.observacao}
                </p>
              )}

              <p className="text-yellow-400 text-sm mt-2">
                🕒 {new Date(item.criado_em).toLocaleString("pt-BR")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="painel-premium p-5">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h2 className="text-4xl font-black mt-1">{valor}</h2>
    </div>
  );
}