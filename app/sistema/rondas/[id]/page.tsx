"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function DetalheRondaPage() {
  const { id } = useParams();

  const [plano, setPlano] = useState<any>(null);
  const [pontos, setPontos] = useState<any[]>([]);

  const [nomeLocal, setNomeLocal] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [ordem, setOrdem] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const { data: planoData } = await supabase
      .from("planos_ronda")
      .select("*")
      .eq("id", Number(id))
      .single();

    setPlano(planoData);

    const { data: pontosData } = await supabase
      .from("pontos_ronda")
      .select("*")
      .eq("plano_id", Number(id))
      .order("ordem", { ascending: true });

    setPontos(pontosData || []);
  }

  async function salvarPonto() {
    if (!nomeLocal.trim()) {
      alert("Informe o nome do local.");
      return;
    }

    const { error } = await supabase.from("pontos_ronda").insert({
      plano_id: Number(id),
      nome_local: nomeLocal,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      ordem: ordem ? Number(ordem) : pontos.length + 1,
      obrigatorio: true,
    });

    if (error) {
      alert("Erro ao salvar ponto.");
      return;
    }

    setNomeLocal("");
    setLatitude("");
    setLongitude("");
    setOrdem("");
    carregar();
  }

  async function excluirPonto(pontoId: number) {
    if (!confirm("Excluir este ponto da ronda?")) return;

    await supabase.from("pontos_ronda").delete().eq("id", pontoId);

    carregar();
  }

  return (
    <div className="p-6 text-white space-y-6">
      <Link href="/sistema/rondas" className="text-blue-400 font-bold">
        ← Voltar aos Planos
      </Link>

      <div>
        <h1 className="text-3xl font-black">
          🚔 {plano?.nome || "Plano de Ronda"}
        </h1>

        <p className="text-slate-400">
          {plano?.descricao || "Cadastro de pontos da ronda"}
        </p>
      </div>

      <div className="painel-premium p-6 space-y-4">
        <h2 className="text-xl font-bold">📍 Novo Ponto da Ronda</h2>

        <input
          className="input"
          placeholder="Nome do local. Ex: Praça da Matriz"
          value={nomeLocal}
          onChange={(e) => setNomeLocal(e.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            className="input"
            placeholder="Latitude"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
          />

          <input
            className="input"
            placeholder="Longitude"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
          />

          <input
            className="input"
            placeholder="Ordem"
            value={ordem}
            onChange={(e) => setOrdem(e.target.value)}
          />
        </div>

        <button onClick={salvarPonto} className="btn-primary">
          Salvar Ponto
        </button>
      </div>

      <div className="painel-premium p-6">
        <h2 className="text-xl font-bold mb-4">
          Pontos Cadastrados
        </h2>

        {pontos.length === 0 ? (
          <p className="text-slate-400">
            Nenhum ponto cadastrado.
          </p>
        ) : (
          <div className="space-y-3">
            {pontos.map((ponto) => (
              <div
                key={ponto.id}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex justify-between gap-3"
              >
                <div>
                  <h3 className="font-black">
                    {ponto.ordem}. 📍 {ponto.nome_local}
                  </h3>

                  <p className="text-slate-400 text-sm">
                    {ponto.latitude}, {ponto.longitude}
                  </p>
                </div>

                <Link
  href={`/sistema/rondas/qrcode?ponto=${ponto.id}`}
  className="bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-lg font-bold"
>
  🔳 QR Code
</Link>

                <button
                  onClick={() => excluirPonto(ponto.id)}
                  className="bg-red-700 hover:bg-red-800 px-3 py-2 rounded-lg"
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}