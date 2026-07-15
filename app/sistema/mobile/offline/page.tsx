"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  Database,
  RefreshCw,
  Smartphone,
  Wifi,
  WifiOff,
} from "lucide-react";

import MobileBottomNav from "@/components/MobileBottomNav";

type FilaOffline = {
  chave: string;
  quantidade: number;
};

const CHAVES = [
  "ocorrenciasOffline",
  "ocorrencias_offline",
  "filaOffline",
  "fila_offline",
  "pendenciasOffline",
];

export default function MobileOfflinePage() {
  const [online, setOnline] = useState(true);
  const [fila, setFila] = useState<FilaOffline[]>([]);

  function carregarFila() {
    const resultado: FilaOffline[] = [];

    for (const chave of CHAVES) {
      try {
        const salvo = localStorage.getItem(chave);
        if (!salvo) continue;

        const conteudo = JSON.parse(salvo);

        if (Array.isArray(conteudo) && conteudo.length > 0) {
          resultado.push({
            chave,
            quantidade: conteudo.length,
          });
        }
      } catch {
        // Ignora registros antigos inválidos.
      }
    }

    setFila(resultado);
  }

  useEffect(() => {
    setOnline(navigator.onLine);
    carregarFila();

    const atualizar = () => {
      setOnline(navigator.onLine);
      carregarFila();
    };

    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);

    return () => {
      window.removeEventListener("online", atualizar);
      window.removeEventListener("offline", atualizar);
    };
  }, []);

  const total = useMemo(
    () =>
      fila.reduce(
        (soma, item) => soma + item.quantidade,
        0
      ),
    [fila]
  );

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#02060f] pb-28 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,#0d3b66_0%,transparent_36%),linear-gradient(180deg,#06111f_0%,#02060f_55%)] opacity-90" />

      <div className="relative z-10 mx-auto max-w-md px-3 pb-4 pt-3">
        <Link
          href="/sistema/mobile"
          className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 text-sm font-black text-slate-200"
        >
          <ChevronLeft className="h-5 w-5" />
          Voltar
        </Link>

        <header className="rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/80 p-5 shadow-2xl">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-3xl ${
                online
                  ? "bg-emerald-400/15"
                  : "bg-amber-400/15"
              }`}
            >
              {online ? (
                <Wifi className="h-9 w-9 text-emerald-300" />
              ) : (
                <WifiOff className="h-9 w-9 text-amber-300" />
              )}
            </div>

            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">
                Central offline
              </p>
              <h1 className="mt-1 text-2xl font-black">
                {online ? "Conectado" : "Sem conexão"}
              </h1>
            </div>
          </div>
        </header>

        <section className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/85 p-4">
            <Database className="h-6 w-6 text-cyan-300" />
            <p className="mt-3 text-3xl font-black">{total}</p>
            <p className="mt-1 text-xs font-black uppercase text-slate-500">
              Pendências
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/85 p-4">
            <Smartphone className="h-6 w-6 text-cyan-300" />
            <p className="mt-3 text-3xl font-black">
              {fila.length}
            </p>
            <p className="mt-1 text-xs font-black uppercase text-slate-500">
              Filas locais
            </p>
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-slate-800 bg-slate-900/85 p-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <Database className="h-6 w-6 text-cyan-300" />
            <div>
              <h2 className="font-black">Registros pendentes</h2>
              <p className="text-xs text-slate-500">
                Dados armazenados neste dispositivo
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {fila.length === 0 ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-300" />
                <p className="mt-3 font-black">
                  Tudo sincronizado
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Nenhuma pendência encontrada.
                </p>
              </div>
            ) : (
              fila.map((item) => (
                <div
                  key={item.chave}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div>
                    <p className="font-black text-white">
                      {item.chave}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Fila local
                    </p>
                  </div>

                  <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-black text-amber-300">
                    {item.quantidade}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <button
          type="button"
          onClick={carregarFila}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 font-black text-white"
        >
          <RefreshCw className="h-5 w-5" />
          Verificar novamente
        </button>

        <MobileBottomNav />
      </div>
    </main>
  );
}
