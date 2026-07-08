"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, QrCode, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type PontoVisita = {
  id: number;
  nome_local: string;
  latitude: number | null;
  longitude: number | null;
  ordem: number | null;
  obrigatorio: boolean | null;
};

export default function PontosVisitaPage() {
  const [pontos, setPontos] = useState<PontoVisita[]>([]);
  const [carregando, setCarregando] = useState(true);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "null")
      : null;

  async function carregarPontos() {
    if (!usuario?.municipio_id) {
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("pontos_ronda")
      .select("id, nome_local, latitude, longitude, ordem, obrigatorio")
      .eq("municipio_id", Number(usuario.municipio_id))
      .order("id", { ascending: false });

    setCarregando(false);

    if (error) {
      console.error("Erro ao carregar pontos de visita:", error);
      alert("Erro ao carregar pontos de visita.");
      return;
    }

    setPontos(data || []);
  }

  async function excluirPonto(id: number, nome: string) {
  if (!usuario?.municipio_id) {
    alert("Município não identificado.");
    return;
  }

  const confirmar = confirm(
    `Deseja realmente excluir o ponto de visita?\n\n${nome}`
  );

  if (!confirmar) return;

  const { error } = await supabase
    .from("pontos_ronda")
    .delete()
    .eq("id", id)
    .eq("municipio_id", Number(usuario.municipio_id));

  if (error) {
    console.error("Erro ao excluir ponto de visita:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    alert(error.message);
    return;
  }

  setPontos((lista) => lista.filter((ponto) => ponto.id !== id));
  alert("Ponto de visita excluído com sucesso.");
}

  useEffect(() => {
    void carregarPontos();
  }, []);

  return (
    <main className="min-h-screen bg-[#07152E] p-4 md:p-8 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          href="/sistema/patrulhamento/visitas"
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft size={18} />
          Voltar para Visitas
        </Link>

        <section className="rounded-2xl border border-[#C9A227]/40 bg-[#0D1B34] p-6">
          <h1 className="flex items-center gap-4 text-3xl font-black">
            <MapPin className="text-[#C9A227]" />
            Pontos de Visita
          </h1>

          <p className="mt-2 text-slate-300">
            Locais que já possuem QR Code gerado para check-in de visita.
          </p>
        </section>

        {carregando ? (
          <p className="text-slate-300">Carregando pontos...</p>
        ) : pontos.length === 0 ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">
            Nenhum ponto de visita com QR Code gerado.
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pontos.map((ponto) => (
              <div
                key={ponto.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <h2 className="text-lg font-black">
                  {ponto.nome_local || `Ponto ${ponto.id}`}
                </h2>

                <p className="mt-2 text-xs text-slate-400">
                  ID: {ponto.id}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Lat: {ponto.latitude || "-"} • Long: {ponto.longitude || "-"}
                </p>

<div className="mt-4 grid gap-2">
  <div className="flex gap-2">
    <Link
      href={`/sistema/patrulhamento/visitas/qrcode?ponto=${ponto.id}`}
      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#C9A227] px-3 py-2 text-sm font-black text-black hover:bg-yellow-400"
    >
      <QrCode size={16} />
      Ver QR Code
    </Link>

    <Link
      href={`/sistema/patrulhamento/visitas/checkin?ponto=${ponto.id}`}
      className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/20 px-3 py-2 text-sm font-bold text-white hover:bg-white/10"
    >
      Check-in
    </Link>
  </div>

  <button
    type="button"
    onClick={() =>
      excluirPonto(
        ponto.id,
        ponto.nome_local || `Ponto ${ponto.id}`
      )
    }
    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/50 px-3 py-2 text-sm font-bold text-red-300 hover:bg-red-500/10"
  >
    <Trash2 size={16} />
    Excluir ponto
  </button>
</div>


              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}