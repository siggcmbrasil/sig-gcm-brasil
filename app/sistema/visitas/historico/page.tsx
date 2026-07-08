"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function HistoricoVisitasPage() {
  const [checkins, setCheckins] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("visita_checkins")
      .select(`
        *,
        pontos_visita (
          nome,
          tipo,
          endereco
        )
      `)
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false })
      .limit(300);

    setCarregando(false);

    if (error) {
      alert(error.message);
      return;
    }

    setCheckins(data || []);
  }

  useEffect(() => {
    if (usuario?.municipio_id) {
      carregar();
    }
  }, []);

  const filtrados = checkins.filter((item) => {
    const texto = `
      ${item.nome_usuario || ""}
      ${item.observacao || ""}
      ${item.pontos_visita?.nome || ""}
      ${item.pontos_visita?.tipo || ""}
      ${item.pontos_visita?.endereco || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  return (
    <div className="p-6 pb-24">
      <Link href="/sistema/visitas" className="text-blue-400 font-bold">
        ← Voltar para Visitas
      </Link>

      <div className="painel-premium p-6 mt-6">
        <h1 className="text-3xl font-black">
          Histórico de Visitas
        </h1>

        <p className="text-slate-400 mt-2">
          Comprovações realizadas por QR Code e GPS.
        </p>
      </div>

      <div className="painel-premium p-6 mt-6">
        <input
          className="input"
          placeholder="Buscar por guarda, ponto, tipo, endereço ou observação..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="space-y-4 mt-6">
        {carregando ? (
          <div className="painel-premium p-6 text-slate-400">
            Carregando histórico...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="painel-premium p-6 text-slate-400">
            Nenhuma visita comprovada encontrada.
          </div>
        ) : (
          filtrados.map((item) => (
            <div key={item.id} className="painel-premium p-5">
              <h2 className="text-xl font-black">
                {item.pontos_visita?.nome || "Ponto não informado"}
              </h2>

              <p className="text-yellow-400">
                {item.pontos_visita?.tipo || "Tipo não informado"}
              </p>

              {item.pontos_visita?.endereco && (
                <p className="text-slate-400 mt-1">
                  📍 {item.pontos_visita.endereco}
                </p>
              )}

              <p className="text-blue-400 mt-3">
                👮 {item.nome_usuario || "Usuário não identificado"}
              </p>

              <p className="text-slate-500 text-sm mt-1">
                🕒{" "}
                {item.criado_em
                  ? new Date(item.criado_em).toLocaleString("pt-BR")
                  : "Data não informada"}
              </p>

              {item.observacao && (
                <p className="text-slate-300 mt-3">
                  {item.observacao}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                {item.latitude && item.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-xl font-bold text-sm"
                  >
                    🗺️ Abrir no mapa
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}