"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Save, Shield } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function NovaBlitzPage() {
  const router = useRouter();

  const [tipo, setTipo] = useState("BLITZ");
  const [local, setLocal] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [capturandoGps, setCapturandoGps] = useState(false);
  const [salvando, setSalvando] = useState(false);

  function usuarioLogado() {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  }

  function capturarGps() {
    if (!navigator.geolocation) {
      alert("GPS não suportado neste dispositivo.");
      return;
    }

    setCapturandoGps(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const precisao = Math.round(position.coords.accuracy);

        if (precisao > 100) {
          setCapturandoGps(false);
          alert(`Localização imprecisa: ${precisao} metros.`);
          return;
        }

        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setCapturandoGps(false);

        alert(`GPS capturado com precisão de ${precisao} metros.`);
      },
      () => {
        setCapturandoGps(false);
        alert("Não foi possível obter a localização.");
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  }

  async function salvar() {
    const usuario = usuarioLogado();

    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    if (!local.trim()) {
      alert("Informe o local da operação.");
      return;
    }

    if (local.length > 200) {
      alert("Local muito grande.");
      return;
    }

    if (responsavel.length > 150) {
      alert("Responsável muito grande.");
      return;
    }

    if (observacoes.length > 3000) {
      alert("Observações muito grandes.");
      return;
    }

    if (
      latitude &&
      (Number(latitude) < -90 || Number(latitude) > 90)
    ) {
      alert("Latitude inválida.");
      return;
    }

    if (
      longitude &&
      (Number(longitude) < -180 || Number(longitude) > 180)
    ) {
      alert("Longitude inválida.");
      return;
    }

    setSalvando(true);

    const dadosOperacao = {
      municipio_id: usuario.municipio_id,
      tipo,
      local: local.trim(),
      responsavel: responsavel.trim() || null,
      observacoes: observacoes.trim() || null,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      data: new Date().toISOString().split("T")[0],
      status: "PLANEJADA",
      criado_por: usuario.id,
    };

    const { data, error } = await supabase
      .from("blitzes_barreiras")
      .insert([dadosOperacao])
      .select("id")
      .single();

    setSalvando(false);

    if (error) {
      await registrarAuditoria({
        modulo: "Blitzes e Barreiras",
        acao: "ERRO",
        descricao: "Erro ao criar operação.",
        tabela: "blitzes_barreiras",
        detalhes: {
          erro: error.message,
          dados: dadosOperacao,
        },
      });

      alert(error.message);
      return;
    }

    await registrarAuditoria({
      modulo: "Blitzes e Barreiras",
      acao: "CRIAR",
      descricao: `Criou ${tipo} no local ${local.trim()}.`,
      tabela: "blitzes_barreiras",
      registro_id: data?.id,
      detalhes: dadosOperacao,
    });

    alert("Operação cadastrada.");
    router.push("/sistema/blitzes-barreiras");
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <SigPageHeader
        titulo="Nova Operação"
        subtitulo="Cadastro de blitz ou barreira operacional."
        icone={Shield}
      />

      <SigCard>
        <div className="space-y-4">
          <div>
            <label className="label">Tipo da operação</label>

            <select
              className="input"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="BLITZ">Blitz</option>
              <option value="BARREIRA">Barreira</option>
            </select>
          </div>

          <div>
            <label className="label">Local</label>

            <input
              className="input"
              placeholder="Ex: Entrada da cidade, praça, bairro..."
              value={local}
              onChange={(e) => setLocal(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={capturarGps}
            disabled={capturandoGps}
            className="btn-secondary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <MapPin className="w-5 h-5" />
            {capturandoGps ? "Capturando GPS..." : "Capturar GPS da Operação"}
          </button>

          {latitude && longitude && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
              <p>Latitude: {latitude}</p>
              <p>Longitude: {longitude}</p>

              <a
                href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-cyan-400 font-bold hover:underline"
              >
                Abrir no mapa
              </a>
            </div>
          )}

          <div>
            <label className="label">Responsável</label>

            <input
              className="input"
              placeholder="Nome do responsável pela operação"
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Observações</label>

            <textarea
              className="input min-h-32 resize-none"
              placeholder="Observações da operação"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {salvando ? "Salvando..." : "Salvar Operação"}
          </button>
        </div>
      </SigCard>
    </div>
  );
}