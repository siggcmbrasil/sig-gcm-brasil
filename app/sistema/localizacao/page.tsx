"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PatrulhamentoGpsPage() {
  const [tipo, setTipo] = useState("VIATURA");
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviarLocalizacao() {
    if (!navigator.geolocation) {
      alert("GPS não suportado neste dispositivo.");
      return;
    }

    setEnviando(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const usuario = JSON.parse(
            localStorage.getItem("usuarioLogado") || "{}"
          );

          if (!usuario?.id || !usuario?.municipio_id) {
            alert("Usuário ou município não identificado.");
            setEnviando(false);
            return;
          }

          const dados = {
            usuario_id: usuario.id,
            nome: usuario.nome || "Usuário sem nome",
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            municipio_id: usuario.municipio_id,
            status: tipo,
            observacao,
            atualizado_em: new Date().toISOString(),
          };

          const { data: existente, error: erroBusca } = await supabase
            .from("localizacoes_tempo_real")
            .select("id")
            .eq("usuario_id", usuario.id)
            .eq("municipio_id", usuario.municipio_id)
            .maybeSingle();

          if (erroBusca) throw erroBusca;

          let error;

          if (existente) {
            ({ error } = await supabase
              .from("localizacoes_tempo_real")
              .update(dados)
              .eq("id", existente.id)
              .eq("municipio_id", usuario.municipio_id));
          } else {
            ({ error } = await supabase
              .from("localizacoes_tempo_real")
              .insert(dados));
          }

          if (error) throw error;

          alert("Localização atualizada!");
          setObservacao("");
        } catch (error) {
          console.error("Erro ao enviar localização:", error);
          alert("Erro ao enviar localização.");
        } finally {
          setEnviando(false);
        }
      },
      () => {
        alert("Não foi possível obter sua localização.");
        setEnviando(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  async function limparMeusPontos() {
    const confirmar = confirm("Deseja excluir seus pontos de GPS de teste?");
    if (!confirmar) return;

    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Usuário ou município não identificado.");
      return;
    }

    const { error } = await supabase
      .from("localizacoes_tempo_real")
      .delete()
      .eq("usuario_id", usuario.id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      console.error("Erro ao excluir pontos:", error);
      alert("Erro ao excluir pontos.");
      return;
    }

    alert("Pontos excluídos.");
  }

  return (
    <div className="min-h-screen bg-[#020b1c] text-white p-6">
      <h1 className="text-3xl font-black mb-2">
  📍 Localização em Tempo Real
</h1>

      <p className="text-slate-400 mb-6">
  Compartilhe sua localização atual com o Centro Operacional.
</p>

      <div className="painel-premium p-5 space-y-5">
        <div>
          <label className="label">
  Tipo de deslocamento
</label>

          <select
            className="input"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="VIATURA">🚓 Viatura</option>
            <option value="A_PE">🚶 A pé</option>
            <option value="MOTO">🏍️ Motocicleta</option>
          </select>
        </div>

        <div>
          <label className="label">Observação</label>

          <textarea
            className="input h-28 resize-none"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex: ronda preventiva na Praça da Matriz."
          />
        </div>

        <button
          onClick={enviarLocalizacao}
          disabled={enviando}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-5 rounded-2xl font-black text-lg"
        >
          {enviando ? "Enviando localização..." : "📡 Atualizar localização"}
        </button>

        <button
          onClick={limparMeusPontos}
          className="w-full bg-red-700 hover:bg-red-800 px-6 py-4 rounded-2xl font-black text-lg"
        >
          🗑️ Remover minha localização
        </button>
      </div>
    </div>
  );
}