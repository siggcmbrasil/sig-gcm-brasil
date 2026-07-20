"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Droplets,
  ExternalLink,
  Newspaper,
  RefreshCw,
  Wind,
} from "lucide-react";

type Noticia = {
  titulo: string;
  link: string;
  fonte: string;
  data_publicacao: string | null;
};

type Clima = {
  temperature_2m?: number;
  relative_humidity_2m?: number;
  precipitation?: number;
  wind_speed_10m?: number;
  weather_code?: number;
};

export default function CardNoticiasClima() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [indice, setIndice] = useState(0);
  const [clima, setClima] = useState<Clima | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);

    try {
      const [noticiasResp, climaResp] = await Promise.all([
        fetch("/api/noticias-seguranca"),
        fetch("/api/clima"),
      ]);

      const noticiasJson = await noticiasResp.json();
      const climaJson = await climaResp.json();

      setNoticias((noticiasJson.noticias || []).slice(0, 8));
      setClima(climaJson.clima || null);
      setIndice(0);
    } catch (error) {
      console.error("Erro ao carregar notícias/clima:", error);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  useEffect(() => {
    if (noticias.length <= 1) return;

    const timer = setInterval(() => {
      setIndice((atual) => (atual + 1) % noticias.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [noticias]);

  const noticiaAtual = noticias[indice];

  function anterior() {
    if (noticias.length === 0) return;
    setIndice((atual) => (atual === 0 ? noticias.length - 1 : atual - 1));
  }

  function proxima() {
    if (noticias.length === 0) return;
    setIndice((atual) => (atual + 1) % noticias.length);
  }

  return (
    <section className="bg-[linear-gradient(145deg,rgba(8,24,46,.98),rgba(3,12,27,.98))] p-3 text-white">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
            <Newspaper className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-300">
              Tempo real
            </p>
            <h2 className="text-sm font-black">Clima e notícias</h2>
          </div>
        </div>

        <button
          type="button"
          onClick={carregar}
          className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:border-cyan-400/30 hover:text-cyan-300"
          title="Atualizar"
        >
          <RefreshCw className={`h-4 w-4 ${carregando ? "animate-spin" : ""}`} />
        </button>
      </div>

      {carregando ? (
        <div className="flex h-[112px] items-center justify-center text-xs text-slate-500">
          Carregando informações...
        </div>
      ) : (
        <div className="grid min-h-[112px] grid-cols-1 gap-2 xl:grid-cols-[220px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.05] p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Clima local
                </p>
                <p className="mt-1 text-2xl font-black text-white">
                  {clima?.temperature_2m ?? "-"}°C
                </p>
              </div>
              <CloudSun className="h-7 w-7 text-cyan-300" />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><Droplets className="h-3 w-3" />{clima?.relative_humidity_2m ?? "-"}%</span>
              <span className="flex items-center gap-1"><Wind className="h-3 w-3" />{clima?.wind_speed_10m ?? "-"}</span>
              <span>{clima?.precipitation ?? "0"} mm</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#020817]/75 p-3">
            {!noticiaAtual ? (
              <p className="text-xs text-slate-500">Nenhuma notícia encontrada agora.</p>
            ) : (
              <>
                <div className="pr-20">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-300">
                    Segurança Pública
                  </p>
                  <h3 className="mt-1 line-clamp-2 text-sm font-black leading-5 text-white">
                    {noticiaAtual.titulo}
                  </h3>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {noticiaAtual.fonte || "Notícias"}
                    {noticiaAtual.data_publicacao
                      ? ` • ${new Date(noticiaAtual.data_publicacao).toLocaleDateString("pt-BR")}`
                      : ""}
                  </p>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                  <div className="flex gap-1">
                    <button type="button" onClick={anterior} className="rounded-lg border border-white/10 p-1.5 hover:border-cyan-400/30">
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={proxima} className="rounded-lg border border-white/10 p-1.5 hover:border-cyan-400/30">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <a
                    href={noticiaAtual.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 px-3 py-1.5 text-[10px] font-black text-cyan-300 hover:bg-cyan-400/10"
                  >
                    Ler
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
