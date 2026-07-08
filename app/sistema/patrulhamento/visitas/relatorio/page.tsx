"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  FileText,
  ImageIcon,
  Map,
  MapPin,
  RefreshCw,
  Route,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

type UsuarioLogado = {
  id: string;
  perfil: string;
  municipio_id: number;
};

type CheckinRonda = {
  id: number;
  plano_id: number | null;
  ponto_id: number | null;
  nome: string | null;
  latitude: number | null;
  longitude: number | null;
  distancia_metros: number | null;
  observacao: string | null;
  foto_url: string | null;
  criado_em: string | null;
};

type PontoRonda = {
  id: number;
  nome_local: string | null;
};

type PlanoRonda = {
  id: number;
  nome: string | null;
};

function obterUsuarioLogado(): UsuarioLogado | null {
  try {
    const salvo = localStorage.getItem("usuarioLogado");
    if (!salvo) return null;

    const usuario = JSON.parse(salvo);

    if (!usuario?.id || !usuario?.perfil || !usuario?.municipio_id) {
      return null;
    }

    return {
      id: String(usuario.id),
      perfil: usuario.perfil,
      municipio_id: Number(usuario.municipio_id),
    };
  } catch {
    return null;
  }
}

export default function RelatorioRondasPage() {
  const [checkins, setCheckins] = useState<CheckinRonda[]>([]);
  const [pontos, setPontos] = useState<PontoRonda[]>([]);
  const [planos, setPlanos] = useState<PlanoRonda[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    void carregarRelatorio();
  }, []);

  async function carregarRelatorio() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      alert("Sessão inválida.");
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const [checkinsResp, pontosResp, planosResp] = await Promise.all([
      supabase
        .from("checkins_ronda")
        .select(
          "id, plano_id, ponto_id, nome, latitude, longitude, distancia_metros, observacao, foto_url, criado_em"
        )
        .eq("municipio_id", usuario.municipio_id)
        .order("id", { ascending: false })
        .limit(200),

      supabase
        .from("pontos_ronda")
        .select("id, nome_local")
        .eq("municipio_id", usuario.municipio_id),

      supabase
        .from("planos_ronda")
        .select("id, nome")
        .eq("municipio_id", usuario.municipio_id),
    ]);

    setCarregando(false);

    if (checkinsResp.error || pontosResp.error || planosResp.error) {
      const erro =
        checkinsResp.error || pontosResp.error || planosResp.error;

        console.error("ERRO AO CARREGAR RELATÓRIO DE VISITAS:", {
  code: erro?.code,
  message: erro?.message,
  details: erro?.details,
  hint: erro?.hint,
  erro,
});

alert(
  `Erro ao carregar relatório de visitas.\n\nCódigo: ${erro?.code || "sem código"}\nMensagem: ${erro?.message || "sem mensagem"}\nDetalhes: ${erro?.details || "sem detalhes"}`
);

      await registrarAuditoria({
        modulo: "Visitas",
        acao: "ERRO",
        descricao: "Erro ao carregar relatório de rondas.",
        tabela: "checkins_ronda",
        detalhes: {
          erro: erro?.message,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao carregar relatório de rondas.");
      return;
    }

    setCheckins((checkinsResp.data || []) as CheckinRonda[]);
    setPontos((pontosResp.data || []) as PontoRonda[]);
    setPlanos((planosResp.data || []) as PlanoRonda[]);
  }

  async function excluirCheckin(id: number) {
    const confirmar = confirm("Deseja excluir este check-in?");
    if (!confirmar) return;

    const usuario = obterUsuarioLogado();

    if (!usuario) {
      alert("Sessão inválida.");
      return;
    }

    const { error } = await supabase
      .from("checkins_ronda")
      .delete()
      .eq("id", id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Rondas",
        acao: "ERRO",
        descricao: "Erro ao excluir check-in de ronda.",
        tabela: "checkins_ronda",
        registro_id: id,
        detalhes: {
          erro: error.message,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao excluir check-in.");
      return;
    }

    await registrarAuditoria({
      modulo: "Rondas",
      acao: "EXCLUIR",
      descricao: "Excluiu check-in de ronda.",
      tabela: "checkins_ronda",
      registro_id: id,
      detalhes: {
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
      },
    });

    await carregarRelatorio();
  }

  function abrirMapa(latitude: number | null, longitude: number | null) {
    if (!latitude || !longitude) {
      alert("Este check-in não possui coordenadas.");
      return;
    }

    window.open(
      `https://www.google.com/maps?q=${latitude},${longitude}`,
      "_blank"
    );
  }

  function nomePonto(pontoId: number | null) {
    if (!pontoId) return "Ponto não informado";

    return (
      pontos.find((p) => Number(p.id) === Number(pontoId))?.nome_local ||
      `Ponto ${pontoId}`
    );
  }

  function nomePlano(planoId: number | null) {
    if (!planoId) return "Plano não informado";

    return (
      planos.find((p) => Number(p.id) === Number(planoId))?.nome ||
      `Plano ${planoId}`
    );
  }

  function classeDistancia(distancia: number | null) {
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

  function textoSituacao(distancia: number | null) {
    const metros = Number(distancia);

    if (!Number.isFinite(metros)) return "Distância não informada";
    if (metros <= 200) return "Dentro do raio permitido";
    if (metros <= 300) return "Próximo do limite";
    return "Fora do raio permitido";
  }

  const dentroRaio = checkins.filter(
    (c) =>
      Number.isFinite(Number(c.distancia_metros)) &&
      Number(c.distancia_metros) <= 200
  ).length;

  const foraRaio = checkins.filter(
    (c) =>
      Number.isFinite(Number(c.distancia_metros)) &&
      Number(c.distancia_metros) > 300
  ).length;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Relatório de Rondas"
        subtitulo="Check-ins realizados por QR Code nos pontos de ronda."
        icone={FileText}
      />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <ResumoCard
          titulo="Check-ins"
          valor={checkins.length}
          icone={<CheckCircle className="w-8 h-8 text-green-400" />}
        />

        <ResumoCard
          titulo="Planos"
          valor={planos.length}
          icone={<ShieldCheck className="w-8 h-8 text-blue-400" />}
        />

        <ResumoCard
          titulo="Pontos"
          valor={pontos.length}
          icone={<MapPin className="w-8 h-8 text-cyan-400" />}
        />

        <ResumoCard
          titulo="Dentro do raio"
          valor={dentroRaio}
          icone={<Route className="w-8 h-8 text-emerald-400" />}
        />

        <ResumoCard
          titulo="Fora do raio"
          valor={foraRaio}
          icone={<Route className="w-8 h-8 text-red-400" />}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={carregarRelatorio}
          disabled={carregando}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-4 py-3 font-bold text-white hover:bg-blue-600 disabled:opacity-50"
        >
          <RefreshCw size={18} />
          {carregando ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {carregando ? (
        <SigCard>
          <p className="text-slate-400">Carregando relatório...</p>
        </SigCard>
      ) : checkins.length === 0 ? (
        <SigCard>
          <div className="py-16 text-center">
            <FileText className="w-16 h-16 mx-auto text-slate-600 mb-4" />

            <h2 className="text-xl font-black text-white">
              Nenhum check-in registrado
            </h2>

            <p className="text-slate-400 mt-2">
              Os check-ins por QR Code aparecerão aqui.
            </p>
          </div>
        </SigCard>
      ) : (
        <div className="space-y-3">
          {checkins.map((item) => (
            <SigCard key={item.id}>
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <h2 className="font-black text-lg text-white flex items-center gap-2">
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
                    className={`mt-3 inline-flex items-center gap-2 border px-3 py-1 rounded-full text-xs font-bold ${classeDistancia(
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

                  <p className="text-yellow-400 text-sm mt-3 flex items-center gap-2">
                    <Clock size={15} />
                    {item.criado_em
                      ? new Date(item.criado_em).toLocaleString("pt-BR")
                      : "Data não informada"}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() =>
                        abrirMapa(item.latitude, item.longitude)
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-3 py-2 text-sm font-bold text-white hover:bg-blue-600"
                    >
                      <Map size={16} />
                      Ver no mapa
                    </button>

                    <button
                      type="button"
                      onClick={() => excluirCheckin(item.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-3 py-2 text-sm font-bold text-white hover:bg-red-600"
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
            </SigCard>
          ))}
        </div>
      )}
    </div>
  );
}

function ResumoCard({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: number;
  icone: React.ReactNode;
}) {
  return (
    <SigCard>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">{titulo}</p>
          <h2 className="text-4xl font-black text-white mt-2">{valor}</h2>
        </div>

        {icone}
      </div>
    </SigCard>
  );
}