"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function QRCodePontoVisitaPage() {
  const searchParams = useSearchParams();
  const pontoId = Number(searchParams.get("ponto"));

  const [ponto, setPonto] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  const urlCheckin =
    typeof window !== "undefined" && ponto
      ? `${window.location.origin}/sistema/visitas/checkin?ponto=${ponto.id}`
      : "";

  const qrUrl = urlCheckin
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
        urlCheckin
      )}`
    : "";

  async function carregar() {
    if (!pontoId || !usuario?.municipio_id) {
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("pontos_visita")
      .select("*")
      .eq("id", pontoId)
      .eq("municipio_id", usuario.municipio_id)
      .single();

    setCarregando(false);

    if (error) {
      alert(error.message);
      return;
    }

    setPonto(data);
  }

  useEffect(() => {
    carregar();
  }, [pontoId]);

  return (
    <div className="p-6 pb-24">
      <Link href="/sistema/visitas/pontos" className="text-blue-400 font-bold">
        ← Voltar para Pontos
      </Link>

      <div className="painel-premium p-6 mt-6 text-center">
        <h1 className="text-3xl font-black">QR Code do Ponto</h1>

        <p className="text-slate-400 mt-2">
          Imprima este QR Code e fixe no local de visita.
        </p>
      </div>

      {carregando ? (
        <div className="painel-premium p-6 mt-6">Carregando...</div>
      ) : !ponto ? (
        <div className="painel-premium p-6 mt-6">Ponto não encontrado.</div>
      ) : (
        <div className="painel-premium p-6 mt-6 flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-black">{ponto.nome}</h2>

          <p className="text-yellow-400">{ponto.tipo}</p>

          {ponto.endereco && (
            <p className="text-slate-400">{ponto.endereco}</p>
          )}

          {qrUrl && (
            <img
              src={qrUrl}
              alt="QR Code do ponto"
              className="bg-white rounded-2xl p-4 w-80 h-80 object-contain"
            />
          )}

          <p className="text-xs text-slate-500 break-all max-w-xl">
            {urlCheckin}
          </p>

          <button
            type="button"
            onClick={() => window.print()}
            className="sig-btn-gold"
          >
            Imprimir QR Code
          </button>
        </div>
      )}
    </div>
  );
}