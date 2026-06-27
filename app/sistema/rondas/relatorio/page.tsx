"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle,
  Clock,
  FileText,
  ImageIcon,
  Map,
  MapPin,
  Route,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";

export default function RelatorioRondasPage() {
  const [checkins, setCheckins] = useState<any[]>([]);
  const [pontos, setPontos] = useState<any[]>([]);
  const [planos, setPlanos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  function pegarUsuario() {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  }

  useEffect(() => {
    carregarRelatorio();
  }, []);

  async function carregarRelatorio() {
    setCarregando(true);

    const usuario = pegarUsuario();
    const municipioId = usuario?.municipio_id;

    if (!municipioId) {
      alert("Município do usuário não identificado.");
      setCarregando(false);
      return;
    }

    const { data: checkinsData, error: checkinsError } = await supabase
      .from("checkins_ronda")
      .select("*")
      .eq("municipio_id", municipioId)
      .order("id", { ascending: false });

    if (checkinsError) {
      console.error(checkinsError);
      alert("Erro ao carregar check-ins.");
      setCarregando(false);
      return;
    }

    const { data: pontosData, error: pontosError } = await supabase
      .from("pontos_ronda")
      .select("*")
      .eq("municipio_id", municipioId);

    if (pontosError) {
      console.error(pontosError);
      alert("Erro ao carregar pontos.");
      setCarregando(false);
      return;
    }

    const { data: planosData, error: planosError } = await supabase
      .from("planos_ronda")
      .select("*")
      .eq("municipio_id", municipioId);

    if (planosError) {
      console.error(planosError);
      alert("Erro ao carregar planos.");
      setCarregando(false);
      return;
    }

    setCheckins(checkinsData || []);
    setPontos(pontosData || []);
    setPlanos(planosData || []);
    setCarregando(false);
  }

  async function excluirCheckin(id: number) {
    const confirmar = confirm("Deseja excluir este check-in?");
    if (!confirmar) return;

    const usuario = pegarUsuario();
    const municipioId = usuario?.municipio_id;

    if (!municipioId) {
      alert("Município do usuário não identificado.");
      return;
    }

    const { error } = await supabase
      .from("checkins_ronda")
      .delete()
      .eq("id", id)
      .eq("municipio_id", municipioId);

    if (error) {
      console.error(error);
      alert("Erro ao excluir check-in.");
      return;
    }

    carregarRelatorio();
  }

  function abrirMapa(latitude: any, longitude: any) {
    if (!latitude || !longitude) {
      alert("Este check-in não possui coordenadas.");
      return;
    }

    window.open(
      `https://www.google.com/maps?q=${latitude},${longitude}`,
      "_blank"
    );
  }

  function nomePonto(pontoId: number) {
    return (
      pontos.find((p) => Number(p.id) === Number(pontoId))?.nome_local ||
      `Ponto ${pontoId}`
    );
  }

  function nomePlano(planoId: number) {
    return (
      planos.find((p) => Number(p.id) === Number(planoId))?.nome ||
      `Plano ${planoId}`
    );
  }

  function classeDistancia(distancia: any) {
    const metros = Number(distancia);

    if (!Number.isFinite(metros)) {
      return "bg-slate-800 text-slate-300 border-slate-700";
    }

    if (metros <= 200) {
      return "bg-green-900/60 text-green-300 border-green-700";
    }

    if (metros <= 300) {
      return "bg-yellow-900/60 text-yellow-300 border-yellow-700";
    }

    return "bg-red-900/60 text-red-300 border-red-700";
  }

  function textoSituacao(distancia: any) {
    const metros = Number(distancia);

    if (!Number.isFinite(metros)) return "Distância não informada";
    if (metros <= 200) return "Dentro do raio permitido";
    if (metros <= 300) return "Próximo do limite";
    return "Fora do raio permitido";
  }

  return (
    <div className="p-6 text-white space-y-6">
      <header>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <FileText className="text-blue-400" size={34} />
          Relatório de Rondas
        </h1>

        <p className="text-slate-400">
          Check-ins realizados por QR Code nos pontos de ronda.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card titulo="Total de Check-ins" valor={checkins.length} icone="check" />
        <Card titulo="Planos de Ronda" valor={planos.length} icone="shield" />
        <Card titulo="Pontos Cadastrados" valor={pontos.length} icone="map" />
      </div>

      {carregando ? (
        <div className="painel-premium p-6">Carregando relatório...</div>
      ) : checkins.length === 0 ? (
        <div className="painel-premium p-6 text-slate-400">
          Nenhum check-in registrado ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {checkins.map((item) => (
            <div key={item.id} className="painel-premium p-4">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <h2 className="font-black text-lg flex items-center gap-2">
                    <CheckCircle className="text-green-400" size={20} />
                    {nomePonto(item.ponto_id)}
                  </h2>

                  <p className="text-blue-400 text-sm flex items-center gap-2 mt-1">
                    <ShieldCheck size={15} />
                    {nomePlano(item.plano_id)}
                  </p>

                  <p className="text-slate-300 flex items-center gap-2 mt-1">
                    <User size={15} />
                    {item.nome || "Usuário não identificado"}
                  </p>

                  <p className="text-slate-400 text-sm flex items-center gap-2">
                    <MapPin size={15} />
                    {item.latitude || "-"}, {item.longitude || "-"}
                  </p>

                  <div
                    className={`mt-2 inline-flex items-center gap-2 border px-3 py-1 rounded-full text-xs font-bold ${classeDistancia(
                      item.distancia_metros
                    )}`}
                  >
                    <Route size={14} />
                    {item.distancia_metros !== null &&
                    item.distancia_metros !== undefined
                      ? `${item.distancia_metros} m`
                      : "Sem distância"}{" "}
                    • {textoSituacao(item.distancia_metros)}
                  </div>

                  {item.observacao && (
                    <p className="text-slate-300 text-sm mt-3">
                      {item.observacao}
                    </p>
                  )}

                  <p className="text-yellow-400 text-sm mt-2 flex items-center gap-2">
                    <Clock size={15} />
                    {item.criado_em
                      ? new Date(item.criado_em).toLocaleString("pt-BR")
                      : "Data não informada"}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => abrirMapa(item.latitude, item.longitude)}
                      className="bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
                    >
                      <Map size={16} />
                      Ver no mapa
                    </button>

                    <button
                      type="button"
                      onClick={() => excluirCheckin(item.id)}
                      className="bg-red-700 hover:bg-red-800 px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  </div>
                </div>

                {item.foto_url ? (
                  <a
                    href={item.foto_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={item.foto_url}
                      alt="Foto do check-in"
                      className="w-full lg:w-44 h-32 object-cover rounded-xl border border-slate-700 hover:opacity-80 transition"
                    />
                  </a>
                ) : (
                  <div className="w-full lg:w-44 h-32 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col items-center justify-center text-slate-500 text-sm">
                    <ImageIcon size={24} />
                    Sem foto
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Card({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: number;
  icone: "check" | "shield" | "map";
}) {
  const Icone =
    icone === "check" ? CheckCircle : icone === "shield" ? ShieldCheck : MapPin;

  return (
    <div className="painel-premium p-5">
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <Icone size={18} />
        <p>{titulo}</p>
      </div>

      <h2 className="text-4xl font-black mt-1">{valor}</h2>
    </div>
  );
}