"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  FileText,
  MapPin,
  PlusCircle,
  RefreshCw,
  Search,
  WifiOff,
  Zap,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function OcorrenciasMobilePage() {
  const [usuario, setUsuario] = useState<any>(null);
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
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
    carregarOcorrencias(dados.municipio_id);
  }, []);

  async function carregarOcorrencias(municipioId?: number) {
    if (!municipioId && !usuario?.municipio_id) return;

    setCarregando(true);

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("id, protocolo, tipo, local, bairro, data, hora, status, municipio_id")
      .eq("municipio_id", municipioId || usuario.municipio_id)
      .order("data", { ascending: false })
      .order("hora", { ascending: false })
      .limit(20);

    if (error) {
      console.error(error);
      alert("Erro ao carregar ocorrências.");
      setCarregando(false);
      return;
    }

    setOcorrencias(data || []);
    setCarregando(false);
  }

  const filtradas = ocorrencias.filter((o) => {
    const texto = `
      ${o.protocolo || ""}
      ${o.tipo || ""}
      ${o.local || ""}
      ${o.bairro || ""}
      ${o.status || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  return (
    <main className="min-h-screen bg-[#02060f] text-white p-4 pb-28">
      <header className="mb-5">
        <Link
          href="/sistema/mobile"
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-2 text-sm mb-5 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <section className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
          <p className="text-blue-400 text-sm font-bold">
            {usuario?.municipio_nome || "Central Mobile"}
          </p>

          <h1 className="text-3xl font-black mt-1">Ocorrências</h1>

          <p className="text-slate-400 text-sm mt-2">
            Registro rápido e consulta das últimas ocorrências do município.
          </p>
        </section>
      </header>

      <section className="grid grid-cols-3 gap-3 mb-5">
        <Link
          href="/sistema/mobile/ocorrencias/nova"
          className="rounded-3xl bg-blue-600 border border-blue-500 p-4 active:scale-95 transition text-center"
        >
          <PlusCircle className="w-8 h-8 mx-auto mb-2" />
          <h2 className="font-black">Nova</h2>
        </Link>

        <Link
          href="/sistema/ocorrencias/expressa"
          className="rounded-3xl bg-red-600 border border-red-500 p-4 active:scale-95 transition text-center"
        >
          <Zap className="w-8 h-8 mx-auto mb-2" />
          <h2 className="font-black">Expressa</h2>
        </Link>

        <Link
          href="/sistema/ocorrencias/offline"
          className="rounded-3xl bg-emerald-700 border border-emerald-500 p-4 active:scale-95 transition text-center"
        >
          <WifiOff className="w-8 h-8 mx-auto mb-2" />
          <h2 className="font-black">Offline</h2>
        </Link>
      </section>

      <section className="mb-5 space-y-3">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />

          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar protocolo, tipo ou local..."
            className="bg-transparent outline-none text-sm flex-1"
          />
        </div>

        <button
          type="button"
          onClick={() => carregarOcorrencias()}
          className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 font-bold flex items-center justify-center gap-2 active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">Últimas Ocorrências</h2>

          <Link href="/sistema/ocorrencias" className="text-blue-400 text-xs">
            Ver todas
          </Link>
        </div>

        {carregando ? (
          <p className="text-slate-400 text-sm">Carregando ocorrências...</p>
        ) : filtradas.length === 0 ? (
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-center">
            <FileText className="w-14 h-14 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">Nenhuma ocorrência encontrada.</p>
          </div>
        ) : (
          filtradas.map((ocorrencia) => (
            <Link
              key={ocorrencia.id}
              href={`/sistema/mobile/ocorrencias/${ocorrencia.id}`}
              className="rounded-3xl bg-slate-900 border border-slate-800 p-4 flex items-center gap-4 active:scale-95 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-black line-clamp-1">
                    {ocorrencia.tipo || "Ocorrência"}
                  </h3>

                  <Status status={ocorrencia.status} />
                </div>

                <p className="text-blue-400 text-xs font-bold mt-1">
                  {ocorrencia.protocolo || `#${ocorrencia.id}`}
                </p>

                <p className="text-slate-400 text-sm mt-1 flex items-center gap-1 line-clamp-1">
                  <MapPin className="w-3 h-3" />
                  {ocorrencia.local || "Local não informado"}
                </p>

                <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {ocorrencia.data || "-"} {ocorrencia.hora || ""}
                </p>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-500" />
            </Link>
          ))
        )}
      </section>

      <MobileBottomNav />
    </main>
  );
}

function Status({ status }: { status: string }) {
  let cor = "bg-blue-500/20 text-blue-300 border-blue-500/40";
  let texto = status || "ABERTA";

  if (status === "Aberta" || status === "ABERTA") {
    cor = "bg-red-500/20 text-red-300 border-red-500/40";
    texto = "ABERTA";
  }

  if (status === "Em andamento" || status === "EM_ANDAMENTO") {
    cor = "bg-purple-500/20 text-purple-300 border-purple-500/40";
    texto = "EM ANDAMENTO";
  }

  if (status === "Finalizada" || status === "FINALIZADA") {
    cor = "bg-green-500/20 text-green-300 border-green-500/40";
    texto = "FINALIZADA";
  }

  return (
    <span
      className={`${cor} border px-2 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap`}
    >
      {texto}
    </span>
  );
}