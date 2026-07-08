"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CloudSun,
  ExternalLink,
  Newspaper,
  RefreshCw,
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
    setIndice((atual) =>
      atual === 0 ? noticias.length - 1 : atual - 1
    );
  }

  function proxima() {
    if (noticias.length === 0) return;
    setIndice((atual) => (atual + 1) % noticias.length);
  }

  return (
    <section className="painel-premium h-full p-4 text-white">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#C9A227]">
            Tempo real
          </p>

          <h2 className="mt-1 flex items-center gap-2 text-xl font-black">
            <Newspaper className="text-[#C9A227]" size={22} />
            Notícias e Clima
          </h2>
        </div>

        <button
          type="button"
          onClick={carregar}
          className="rounded-xl border border-white/10 p-2 text-slate-300 hover:border-[#C9A227] hover:text-[#C9A227]"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando informações...</p>
      ) : (
        <div className="grid h-[170px] grid-cols-1 gap-3 xl:grid-cols-[0.35fr_0.65fr]">
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-4">
            <div className="flex items-center gap-3">
              <CloudSun className="text-cyan-300" size={28} />

              <div>
                <p className="text-xs text-slate-400">Clima local</p>

                <h3 className="text-3xl font-black text-white">
                  {clima?.temperature_2m ?? "-"}°C
                </h3>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
              <p>Umidade: {clima?.relative_humidity_2m ?? "-"}%</p>
              <p>Vento: {clima?.wind_speed_10m ?? "-"} km/h</p>
              <p>Chuva: {clima?.precipitation ?? "0"} mm</p>
              <p>Código: {clima?.weather_code ?? "-"}</p>
            </div>
          </div>

          <div className="relative rounded-2xl border border-white/10 bg-slate-950/70 p-4 overflow-hidden">
            {!noticiaAtual ? (
              <p className="text-sm text-slate-400">
                Nenhuma notícia encontrada agora.
              </p>
            ) : (
              <>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C9A227]">
                  Segurança Pública
                </p>

                <h3 className="mt-2 line-clamp-2 text-lg font-black text-white">
                  {noticiaAtual.titulo}
                </h3>

                <p className="mt-2 text-xs text-slate-400">
                  {noticiaAtual.fonte || "Notícias"}
                  {noticiaAtual.data_publicacao
                    ? ` • ${new Date(
                        noticiaAtual.data_publicacao
                      ).toLocaleDateString("pt-BR")}`
                    : ""}
                </p>

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={anterior}
                    className="rounded-lg border border-white/10 p-2 hover:border-[#C9A227]"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <a
                    href={noticiaAtual.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#C9A227]/50 px-4 py-2 text-xs font-black text-[#C9A227] hover:bg-[#C9A227]/10"
                  >
                    Ler notícia
                    <ExternalLink size={14} />
                  </a>

                  <button
                    type="button"
                    onClick={proxima}
                    className="rounded-lg border border-white/10 p-2 hover:border-[#C9A227]"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="absolute right-4 top-4 flex gap-1">
                  {noticias.slice(0, 8).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIndice(i)}
                      className={`h-2 w-2 rounded-full ${
                        i === indice ? "bg-[#C9A227]" : "bg-slate-600"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}