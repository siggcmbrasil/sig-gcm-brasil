"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { obterLocalizacao } from "@/lib/gps";

export default function CheckinVisitaPage() {
  const searchParams = useSearchParams();
  const pontoId = Number(searchParams.get("ponto"));

  const [ponto, setPonto] = useState<any>(null);
  const [observacao, setObservacao] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [salvando, setSalvando] = useState(false);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    const { data, error } = await supabase
      .from("pontos_visita")
      .select("*")
      .eq("id", pontoId)
      .eq("municipio_id", usuario.municipio_id)
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setPonto(data);
  }

  async function capturarGps() {
    try {
      const localizacao = await obterLocalizacao();

      setLatitude(String(localizacao.latitude));
      setLongitude(String(localizacao.longitude));
    } catch {
      alert("Não foi possível capturar o GPS.");
    }
  }

  async function registrarCheckin() {
    if (!ponto) return;

    setSalvando(true);

    let lat = latitude;
    let lng = longitude;

    if (!lat || !lng) {
      try {
        const localizacao = await obterLocalizacao();

        lat = String(localizacao.latitude);
        lng = String(localizacao.longitude);
      } catch {
        setSalvando(false);
        alert("Permita o GPS.");
        return;
      }
    }

    const { error } = await supabase
      .from("visita_checkins")
      .insert({
        municipio_id: usuario.municipio_id,
        ponto_id: ponto.id,
        usuario_id: usuario.id,
        nome_usuario:
          usuario.nome ||
          usuario.email ||
          "Usuário",

        latitude: Number(lat),
        longitude: Number(lng),
        observacao:
          observacao.trim() || null,

        criado_em:
          new Date().toISOString(),
      });

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      "Visita comprovada com sucesso!"
    );

    window.location.href =
      "/sistema/visitas";
  }

  useEffect(() => {
    if (
      pontoId &&
      usuario?.municipio_id
    ) {
      carregar();
    }
  }, [pontoId]);

  useEffect(() => {
    if (ponto) {
      capturarGps();
    }
  }, [ponto]);

  return (
    <div className="p-6 pb-24">
      <Link
        href="/sistema/visitas"
        className="text-blue-400 font-bold"
      >
        ← Voltar
      </Link>

      <div className="painel-premium p-6 mt-6">
        <h1 className="text-3xl font-black">
          Comprovar Visita
        </h1>

        <p className="text-slate-400 mt-2">
          Leia o QR Code e confirme
          sua presença no local.
        </p>
      </div>

      {ponto && (
        <div className="painel-premium p-6 mt-6 space-y-4">
          <h2 className="text-2xl font-black">
            {ponto.nome}
          </h2>

          <p className="text-yellow-400">
            {ponto.tipo}
          </p>

          {ponto.endereco && (
            <p className="text-slate-400">
              {ponto.endereco}
            </p>
          )}

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="font-bold mb-2">
              GPS Atual
            </p>

            <p>
              Latitude:
              {" "}
              {latitude || "-"}
            </p>

            <p>
              Longitude:
              {" "}
              {longitude || "-"}
            </p>

            <button
              onClick={capturarGps}
              className="btn-secondary mt-4"
            >
              Atualizar GPS
            </button>
          </div>

          <textarea
            className="input min-h-32"
            placeholder="Observação"
            value={observacao}
            onChange={(e) =>
              setObservacao(
                e.target.value
              )
            }
          />

          <button
            onClick={registrarCheckin}
            disabled={salvando}
            className="sig-btn-gold disabled:opacity-50"
          >
            {salvando
              ? "Registrando..."
              : "Comprovar Visita"}
          </button>
        </div>
      )}
    </div>
  );
}