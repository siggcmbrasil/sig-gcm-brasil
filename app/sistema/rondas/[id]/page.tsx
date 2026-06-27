"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  MapPinned,
  QrCode,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";

export default function DetalheRondaPage() {
  const { id } = useParams();

  const [plano, setPlano] = useState<any>(null);
  const [pontos, setPontos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [nomeLocal, setNomeLocal] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [ordem, setOrdem] = useState("");

  function pegarUsuario() {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  }

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);

    const usuario = pegarUsuario();
    const municipioId = usuario?.municipio_id;

    if (!municipioId) {
      alert("Município do usuário não identificado.");
      setCarregando(false);
      return;
    }

    const { data: planoData, error: planoError } = await supabase
      .from("planos_ronda")
      .select("*")
      .eq("id", Number(id))
      .eq("municipio_id", municipioId)
      .single();

    if (planoError) {
      console.error(planoError);
      alert("Erro ao carregar plano de ronda.");
      setCarregando(false);
      return;
    }

    setPlano(planoData);

    const { data: pontosData, error: pontosError } = await supabase
      .from("pontos_ronda")
      .select("*")
      .eq("plano_id", Number(id))
      .eq("municipio_id", municipioId)
      .order("ordem", { ascending: true });

    if (pontosError) {
      console.error(pontosError);
      alert("Erro ao carregar pontos da ronda.");
      setCarregando(false);
      return;
    }

    setPontos(pontosData || []);
    setCarregando(false);
  }

  async function salvarPonto() {
    if (!nomeLocal.trim()) {
      alert("Informe o nome do local.");
      return;
    }

    const usuario = pegarUsuario();
    const municipioId = usuario?.municipio_id;

    if (!municipioId) {
      alert("Município do usuário não identificado.");
      return;
    }

    const { error } = await supabase.from("pontos_ronda").insert({
      municipio_id: municipioId,
      plano_id: Number(id),
      nome_local: nomeLocal.trim(),
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      ordem: ordem ? Number(ordem) : pontos.length + 1,
      obrigatorio: true,
    });

    if (error) {
      console.error(error);
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

    const usuario = pegarUsuario();
    const municipioId = usuario?.municipio_id;

    if (!municipioId) {
      alert("Município do usuário não identificado.");
      return;
    }

    const { error } = await supabase
      .from("pontos_ronda")
      .delete()
      .eq("id", pontoId)
      .eq("municipio_id", municipioId);

    if (error) {
      console.error(error);
      alert("Erro ao excluir ponto.");
      return;
    }

    carregar();
  }

  return (
    <div className="p-6 text-white space-y-6">
      <Link
        href="/sistema/rondas"
        className="text-blue-400 font-bold flex items-center gap-2"
      >
        <ArrowLeft size={18} />
        Voltar aos Planos
      </Link>

      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <ShieldCheck className="text-blue-400" size={34} />
          {plano?.nome || "Plano de Ronda"}
        </h1>

        <p className="text-slate-400">
          {plano?.descricao || "Cadastro de pontos da ronda"}
        </p>
      </div>

      <div className="painel-premium p-6 space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MapPinned className="text-blue-400" size={22} />
          Novo Ponto da Ronda
        </h2>

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

        <button
          onClick={salvarPonto}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Save size={18} />
          Salvar Ponto
        </button>
      </div>

      <div className="painel-premium p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <MapPinned className="text-blue-400" size={22} />
          Pontos Cadastrados
        </h2>

        {carregando ? (
          <p className="text-slate-400">Carregando pontos...</p>
        ) : pontos.length === 0 ? (
          <p className="text-slate-400">Nenhum ponto cadastrado.</p>
        ) : (
          <div className="space-y-3">
            {pontos.map((ponto) => (
              <div
                key={ponto.id}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <h3 className="font-black flex items-center gap-2">
                    <MapPinned size={18} className="text-blue-400" />
                    {ponto.ordem}. {ponto.nome_local}
                  </h3>

                  <p className="text-slate-400 text-sm">
                    {ponto.latitude || "Sem latitude"},{" "}
                    {ponto.longitude || "Sem longitude"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/sistema/rondas/qrcode?ponto=${ponto.id}`}
                    className="bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-lg font-bold flex items-center gap-2"
                  >
                    <QrCode size={16} />
                    QR Code
                  </Link>

                  <button
                    onClick={() => excluirPonto(ponto.id)}
                    className="bg-red-700 hover:bg-red-800 px-3 py-2 rounded-lg font-bold flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}