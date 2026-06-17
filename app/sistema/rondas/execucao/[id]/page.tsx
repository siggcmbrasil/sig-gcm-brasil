"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ExecucaoRondaPage() {
  const { id } = useParams();

  const [plano, setPlano] = useState<any>(null);
  const [pontos, setPontos] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const { data: planoData } = await supabase
      .from("planos_ronda")
      .select("*")
      .eq("id", Number(id))
      .single();

    const { data: pontosData } = await supabase
      .from("pontos_ronda")
      .select("*")
      .eq("plano_id", Number(id))
      .order("ordem", { ascending: true });

    const { data: checkinsData } = await supabase
      .from("checkins_ronda")
      .select("*")
      .eq("plano_id", Number(id))
      .order("id", { ascending: false });

    setPlano(planoData);
    setPontos(pontosData || []);
    setCheckins(checkinsData || []);
    setCarregando(false);
  }

  const pontosVisitados = pontos.filter((ponto) =>
    checkins.some((checkin) => Number(checkin.ponto_id) === Number(ponto.id))
  );

  const total = pontos.length;
  const concluidos = pontosVisitados.length;
  const percentual = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  if (carregando) {
    return <div className="p-6 text-white">Carregando execução...</div>;
  }

  return (
    <div className="p-6 text-white space-y-6">
      <Link href="/sistema/rondas" className="text-blue-400 font-bold">
        ← Voltar às Rondas
      </Link>

      <div className="painel-premium p-6">
        <h1 className="text-3xl font-black">
          🚔 {plano?.nome || "Execução da Ronda"}
        </h1>

        <Link
  href="/sistema/rondas/ler-qrcode"
  className="mt-5 block bg-green-700 hover:bg-green-800 text-center px-5 py-4 rounded-2xl font-black"
>
  🔳 Ler QR Code da Ronda
</Link>

        <p className="text-slate-400 mt-2">
          {plano?.descricao || "Acompanhamento dos pontos visitados"}
        </p>

        <div className="mt-5">
          <div className="flex justify-between mb-2">
            <span className="font-bold">Progresso</span>
            <span className="text-blue-400 font-black">
              {concluidos}/{total} • {percentual}%
            </span>
          </div>

          <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-green-600"
              style={{ width: `${percentual}%` }}
            />
          </div>
        </div>
      </div>

      <div className="painel-premium p-6">
        <h2 className="text-xl font-black mb-4">
          📍 Pontos da Ronda
        </h2>

        {pontos.length === 0 ? (
          <p className="text-slate-400">Nenhum ponto cadastrado.</p>
        ) : (
          <div className="space-y-3">
            {pontos.map((ponto) => {
              const checkin = checkins.find(
                (item) => Number(item.ponto_id) === Number(ponto.id)
              );

              const visitado = !!checkin;

              return (
                <div
                  key={ponto.id}
                  className={`rounded-xl border p-4 ${
                    visitado
                      ? "border-green-600 bg-green-950/20"
                      : "border-slate-700 bg-slate-950/60"
                  }`}
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <h3 className="font-black text-lg">
                        {visitado ? "☑️" : "☐"} {ponto.ordem}.{" "}
                        {ponto.nome_local}
                      </h3>

                      {checkin && (
                        <>
                          <p className="text-green-400 text-sm mt-1">
                            👮 {checkin.nome || "Usuário não identificado"}
                          </p>

                          <p className="text-yellow-400 text-sm">
                            🕒{" "}
                            {new Date(checkin.criado_em).toLocaleString(
                              "pt-BR"
                            )}
                          </p>

                          <p className="text-slate-400 text-sm">
                            📍 {checkin.latitude}, {checkin.longitude}
                          </p>
                        </>
                      )}
                    </div>

                    <span
                      className={`text-xs font-bold h-fit px-3 py-1 rounded-full ${
                        visitado
                          ? "bg-green-700 text-white"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {visitado ? "VISITADO" : "PENDENTE"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}