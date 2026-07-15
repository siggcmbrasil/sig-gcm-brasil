"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Car,
  ChevronLeft,
  FileText,
  Map,
  QrCode,
  Route,
  Search,
  Star,
  Users,
} from "lucide-react";

import MobileBottomNav from "@/components/MobileBottomNav";

type Atalho = {
  id: string;
  titulo: string;
  descricao: string;
  href: string;
  icone: typeof Star;
};

const CHAVE = "sig_mobile_favoritos";

const atalhosDisponiveis: Atalho[] = [
  {
    id: "ocorrencias",
    titulo: "Ocorrências",
    descricao: "Registro rápido em campo",
    href: "/sistema/ocorrencias/expressa",
    icone: FileText,
  },
  {
    id: "patrulhamento",
    titulo: "Patrulhamento",
    descricao: "Iniciar ou continuar rota",
    href: "/sistema/patrulhamento",
    icone: Route,
  },
  {
    id: "chamados",
    titulo: "Chamados",
    descricao: "Demandas operacionais",
    href: "/sistema/chamados",
    icone: Bell,
  },
  {
    id: "visitas",
    titulo: "Visitas",
    descricao: "QR Code e presença",
    href: "/sistema/visitas/ler-qrcode",
    icone: QrCode,
  },
  {
    id: "mapa",
    titulo: "Mapa",
    descricao: "Mapa operacional",
    href: "/sistema/mapa-operacional",
    icone: Map,
  },
  {
    id: "busca",
    titulo: "Pesquisa",
    descricao: "Pessoa, veículo e ocorrência",
    href: "/sistema/mobile/busca",
    icone: Search,
  },
  {
    id: "guarnicao",
    titulo: "Guarnição",
    descricao: "Equipe de serviço",
    href: "/sistema/mobile/guarnicao",
    icone: Users,
  },
  {
    id: "viaturas",
    titulo: "Viaturas",
    descricao: "Consultar frota",
    href: "/sistema/viaturas",
    icone: Car,
  },
];

export default function MobileFavoritosPage() {
  const [favoritos, setFavoritos] = useState<string[]>([]);

  useEffect(() => {
    try {
      const salvos = JSON.parse(
        localStorage.getItem(CHAVE) || "[]"
      ) as string[];

      setFavoritos(
        salvos.length > 0
          ? salvos
          : ["ocorrencias", "patrulhamento", "chamados", "visitas"]
      );
    } catch {
      setFavoritos([
        "ocorrencias",
        "patrulhamento",
        "chamados",
        "visitas",
      ]);
    }
  }, []);

  function alternar(id: string) {
    setFavoritos((atual) => {
      const novo = atual.includes(id)
        ? atual.filter((item) => item !== id)
        : [...atual, id];

      localStorage.setItem(CHAVE, JSON.stringify(novo));
      return novo;
    });
  }

  const selecionados = useMemo(
    () =>
      atalhosDisponiveis.filter((item) =>
        favoritos.includes(item.id)
      ),
    [favoritos]
  );

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#02060f] pb-28 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,#0d3b66_0%,transparent_36%),linear-gradient(180deg,#06111f_0%,#02060f_55%)] opacity-90" />

      <div className="relative z-10 mx-auto max-w-md px-3 pb-4 pt-3">
        <Link
          href="/sistema/mobile/mais"
          className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 text-sm font-black text-slate-200"
        >
          <ChevronLeft className="h-5 w-5" />
          Voltar
        </Link>

        <header className="rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/80 p-5 shadow-2xl">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">
            Personalização
          </p>

          <h1 className="mt-2 text-2xl font-black">
            Meus atalhos
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Escolha os módulos que deseja acessar mais rapidamente.
          </p>
        </header>

        <section className="mt-4">
          <h2 className="mb-2 px-1 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Selecionados
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {selecionados.map((item) => {
              const Icone = item.icone;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="min-h-28 rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.07] p-4 shadow-lg"
                >
                  <Icone className="h-7 w-7 text-cyan-300" />
                  <p className="mt-3 font-black text-white">
                    {item.titulo}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {item.descricao}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-5">
          <h2 className="mb-2 px-1 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Configurar atalhos
          </h2>

          <div className="space-y-2">
            {atalhosDisponiveis.map((item) => {
              const Icone = item.icone;
              const ativo = favoritos.includes(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => alternar(item.id)}
                  className="flex min-h-20 w-full items-center gap-4 rounded-3xl border border-slate-800 bg-slate-900/85 p-4 text-left shadow-lg"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10">
                    <Icone className="h-6 w-6 text-cyan-300" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-black text-white">
                      {item.titulo}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-400">
                      {item.descricao}
                    </p>
                  </div>

                  <Star
                    className={`h-6 w-6 ${
                      ativo
                        ? "fill-amber-300 text-amber-300"
                        : "text-slate-600"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </section>

        <MobileBottomNav />
      </div>
    </main>
  );
}
