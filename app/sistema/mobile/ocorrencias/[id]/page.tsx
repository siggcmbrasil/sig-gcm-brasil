"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import MobileBottomNav from "@/components/MobileBottomNav";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  FileText,
  MapPin,
  Clock,
  Shield,
  AlertTriangle,
} from "lucide-react";

export default function DetalheOcorrenciaMobilePage() {
  const params = useParams();
  const router = useRouter();

  const [ocorrencia, setOcorrencia] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  function pegarUsuario() {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  }

  useEffect(() => {
    carregarOcorrencia();
  }, []);

  async function carregarOcorrencia() {
    setCarregando(true);

    const usuario = pegarUsuario();

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("*")
      .eq("id", params.id)
      .eq("municipio_id", usuario.municipio_id)
      .single();

    if (error) {
      console.error(error);
      alert("Erro ao carregar ocorrência.");
      setCarregando(false);
      return;
    }

    setOcorrencia(data);
    setCarregando(false);
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
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-2 text-sm mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
          <p className="text-blue-400 text-sm font-bold">
            {ocorrencia.protocolo || `#${ocorrencia.id}`}
          </p>

          <h1 className="text-3xl font-black mt-1">
            {ocorrencia.tipo || "Ocorrência"}
          </h1>

          <p className="text-slate-400 text-sm mt-2">
            Consulta rápida da ocorrência em campo.
          </p>
        </div>
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

      <section className="space-y-3">
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-green-400" />
            <h2 className="font-black">Local</h2>
          </div>

          <p className="text-slate-300">
            {ocorrencia.local || "Não informado"}
          </p>

          {ocorrencia.bairro && (
            <p className="text-slate-500 text-sm mt-1">
              Bairro: {ocorrencia.bairro}
            </p>
          )}
        </div>

        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <h2 className="font-black">Data e Hora</h2>
          </div>

          <p className="text-slate-300">
            {ocorrencia.data || "-"} {ocorrencia.hora || ""}
          </p>
        </div>

        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-yellow-400" />
            <h2 className="font-black">Descrição</h2>
          </div>

          <p className="text-slate-300 whitespace-pre-wrap">
            {ocorrencia.descricao || "Nenhuma descrição informada."}
          </p>
        </div>
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