"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import MobileBottomNav from "@/components/MobileBottomNav";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  FileText,
  MapPin,
  Navigation,
  Shield,
} from "lucide-react";

export default function DetalheOcorrenciaMobilePage() {
  const params = useParams();
  const router = useRouter();

  const id = typeof params.id === "string" ? params.id : params.id?.[0];

  const [ocorrencia, setOcorrencia] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const salvo = localStorage.getItem("usuarioLogado");

    if (!salvo) {
      window.location.href = "/login";
      return;
    }

    const dados = JSON.parse(salvo);

    if (!dados?.id || !dados?.municipio_id) {
      window.location.href = "/login";
      return;
    }

    setUsuario(dados);
    carregarOcorrencia(dados);
  }, []);

  async function carregarOcorrencia(usuarioAtual: any) {
    if (!id) {
      alert("ID da ocorrência não informado.");
      router.push("/sistema/mobile/ocorrencias");
      return;
    }

    setCarregando(true);

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("*")
      .eq("id", id)
      .eq("municipio_id", usuarioAtual.municipio_id)
      .maybeSingle();

    if (error) {
      console.error(error);
      alert("Erro ao carregar ocorrência.");
      setCarregando(false);
      return;
    }

    if (!data) {
      alert("Ocorrência não encontrada ou sem permissão.");
      setCarregando(false);
      router.push("/sistema/mobile/ocorrencias");
      return;
    }

    setOcorrencia(data);

    await registrarAuditoria({
      modulo: "OCORRENCIAS",
      acao: "VISUALIZAR_MOBILE",
      descricao: `Visualizou ocorrência mobile ${data.protocolo || data.id}.`,
      registro_id: String(data.id),
    });

    setCarregando(false);
  }

  function abrirMapa() {
    if (!ocorrencia?.latitude || !ocorrencia?.longitude) {
      alert("Esta ocorrência não possui GPS.");
      return;
    }

    window.open(
      `https://www.google.com/maps?q=${ocorrencia.latitude},${ocorrencia.longitude}`,
      "_blank"
    );
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-[#02060f] text-white p-4 pb-28">
        <p className="text-slate-400">Carregando ocorrência...</p>
        <MobileBottomNav />
      </main>
    );
  }

  if (!ocorrencia) {
    return (
      <main className="min-h-screen bg-[#02060f] text-white p-4 pb-28">
        <p className="text-slate-400">Ocorrência não encontrada.</p>
        <MobileBottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#02060f] text-white p-4 pb-28">
      <header className="mb-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-2 text-sm mb-5 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <section className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
          <p className="text-blue-400 text-sm font-bold">
            {ocorrencia.protocolo || `#${ocorrencia.id}`}
          </p>

          <h1 className="text-3xl font-black mt-1">
            {ocorrencia.tipo || "Ocorrência"}
          </h1>

          <p className="text-slate-400 text-sm mt-2">
            Consulta rápida da ocorrência em campo.
          </p>

          {usuario?.nome && (
            <p className="text-slate-500 text-xs mt-3">
              Acessado por: {usuario.nome}
            </p>
          )}
        </section>
      </header>

      <section className="grid grid-cols-2 gap-3 mb-5">
        <Card
          icone={AlertTriangle}
          titulo="Status"
          valor={ocorrencia.status || "Aberta"}
        />

        <Card
          icone={Shield}
          titulo="Prioridade"
          valor={ocorrencia.prioridade || "MÉDIA"}
        />
      </section>

      {ocorrencia.latitude && ocorrencia.longitude && (
        <button
          type="button"
          onClick={abrirMapa}
          className="mb-5 w-full rounded-3xl bg-emerald-700 border border-emerald-500 p-4 font-black flex items-center justify-center gap-2 active:scale-95"
        >
          <Navigation className="w-5 h-5" />
          Abrir localização no mapa
        </button>
      )}

      <section className="space-y-3">
        <Bloco titulo="Local" icone={MapPin} cor="text-green-400">
          <p className="text-slate-300">
            {ocorrencia.local || "Não informado"}
          </p>

          {ocorrencia.bairro && (
            <p className="text-slate-500 text-sm mt-1">
              Bairro: {ocorrencia.bairro}
            </p>
          )}

          {ocorrencia.latitude && ocorrencia.longitude && (
            <p className="text-emerald-400 text-xs mt-2">
              GPS: {ocorrencia.latitude}, {ocorrencia.longitude}
            </p>
          )}
        </Bloco>

        <Bloco titulo="Data e Hora" icone={Clock} cor="text-blue-400">
          <p className="text-slate-300">
            {ocorrencia.data || "-"} {ocorrencia.hora || ""}
          </p>
        </Bloco>

        <Bloco titulo="Descrição" icone={FileText} cor="text-yellow-400">
          <p className="text-slate-300 whitespace-pre-wrap">
            {ocorrencia.descricao || "Nenhuma descrição informada."}
          </p>
        </Bloco>
      </section>

      <MobileBottomNav />
    </main>
  );
}

function Card({
  icone: Icone,
  titulo,
  valor,
}: {
  icone: any;
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4">
      <Icone className="w-6 h-6 text-blue-400 mb-2" />
      <p className="text-slate-400 text-xs">{titulo}</p>
      <h2 className="font-black">{valor}</h2>
    </div>
  );
}

function Bloco({
  titulo,
  icone: Icone,
  cor,
  children,
}: {
  titulo: string;
  icone: any;
  cor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icone className={`w-5 h-5 ${cor}`} />
        <h2 className="font-black">{titulo}</h2>
      </div>

      {children}
    </div>
  );
}