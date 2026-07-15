"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CarFront,
  ChevronLeft,
  FileText,
  Loader2,
  MapPin,
  Search,
  UserRound,
} from "lucide-react";

import MobileBottomNav from "@/components/MobileBottomNav";
import { supabase } from "@/lib/supabase";

type UsuarioLogado = {
  municipio_id?: number;
};

type Resultado = {
  id: string;
  tipo: "PESSOA" | "VEICULO" | "OCORRENCIA" | "LOCAL";
  titulo: string;
  descricao: string;
  href: string;
};

function lerUsuario(): UsuarioLogado {
  try {
    return JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    ) as UsuarioLogado;
  } catch {
    return {};
  }
}

export default function MobileBuscaPage() {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");

  async function buscar() {
    const usuario = lerUsuario();
    const valor = termo.trim();

    if (!usuario.municipio_id) {
      setErro("Município não identificado.");
      return;
    }

    if (valor.length < 2) {
      setErro("Digite pelo menos 2 caracteres.");
      return;
    }

    setBuscando(true);
    setErro("");

    const [pessoas, veiculos, ocorrencias, locais] =
      await Promise.all([
        supabase
          .from("pessoas")
          .select("*")
          .eq("municipio_id", usuario.municipio_id)
          .ilike("nome", `%${valor}%`)
          .limit(10),

        supabase
          .from("veiculos")
          .select("*")
          .eq("municipio_id", usuario.municipio_id)
          .or(
            `placa.ilike.%${valor}%,marca.ilike.%${valor}%,modelo.ilike.%${valor}%`
          )
          .limit(10),

        supabase
          .from("ocorrencias")
          .select("*")
          .eq("municipio_id", usuario.municipio_id)
          .or(
            `numero.ilike.%${valor}%,natureza.ilike.%${valor}%,local.ilike.%${valor}%`
          )
          .limit(10),

        supabase
          .from("locais")
          .select("*")
          .eq("municipio_id", usuario.municipio_id)
          .ilike("nome", `%${valor}%`)
          .limit(10),
      ]);

    const lista: Resultado[] = [];

    for (const item of pessoas.data || []) {
      lista.push({
        id: `pessoa-${item.id}`,
        tipo: "PESSOA",
        titulo: item.nome || `Pessoa ${item.id}`,
        descricao:
          item.cpf || item.documento || "Documento não informado",
        href: "/sistema/pessoas",
      });
    }

    for (const item of veiculos.data || []) {
      lista.push({
        id: `veiculo-${item.id}`,
        tipo: "VEICULO",
        titulo: item.placa || `Veículo ${item.id}`,
        descricao:
          [item.marca, item.modelo, item.cor]
            .filter(Boolean)
            .join(" • ") || "Dados não informados",
        href: "/sistema/veiculos",
      });
    }

    for (const item of ocorrencias.data || []) {
      lista.push({
        id: `ocorrencia-${item.id}`,
        tipo: "OCORRENCIA",
        titulo:
          item.numero ||
          item.natureza ||
          `Ocorrência ${item.id}`,
        descricao:
          item.local || item.status || "Sem detalhes",
        href: "/sistema/ocorrencias",
      });
    }

    for (const item of locais.data || []) {
      lista.push({
        id: `local-${item.id}`,
        tipo: "LOCAL",
        titulo: item.nome || `Local ${item.id}`,
        descricao:
          item.endereco ||
          item.categoria ||
          "Local cadastrado",
        href: "/sistema/locais",
      });
    }

    setResultados(lista);
    setBuscando(false);
  }

  const grupos = useMemo(() => {
    return {
      PESSOA: resultados.filter((item) => item.tipo === "PESSOA"),
      VEICULO: resultados.filter(
        (item) => item.tipo === "VEICULO"
      ),
      OCORRENCIA: resultados.filter(
        (item) => item.tipo === "OCORRENCIA"
      ),
      LOCAL: resultados.filter((item) => item.tipo === "LOCAL"),
    };
  }, [resultados]);

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
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">
            Consulta rápida
          </p>
          <h1 className="mt-2 text-2xl font-black">
            Pesquisa operacional
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Pessoas, veículos, ocorrências e locais.
          </p>
        </header>

        <section className="mt-4 rounded-3xl border border-slate-800 bg-slate-900/85 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 px-4">
              <Search className="h-5 w-5 shrink-0 text-cyan-300" />

              <input
                value={termo}
                onChange={(evento) => setTermo(evento.target.value)}
                onKeyDown={(evento) => {
                  if (evento.key === "Enter") {
                    evento.preventDefault();
                    void buscar();
                  }
                }}
                placeholder="Nome, placa, ocorrência ou local..."
                className="h-12 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
              />
            </div>

            <button
              type="button"
              onClick={() => void buscar()}
              disabled={buscando}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white disabled:opacity-50"
            >
              {buscando ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </button>
          </div>

          {erro ? (
            <p className="mt-3 text-sm text-red-300">{erro}</p>
          ) : null}
        </section>

        <div className="mt-4 space-y-5">
          <Grupo
            titulo="Pessoas"
            itens={grupos.PESSOA}
            icone={UserRound}
          />
          <Grupo
            titulo="Veículos"
            itens={grupos.VEICULO}
            icone={CarFront}
          />
          <Grupo
            titulo="Ocorrências"
            itens={grupos.OCORRENCIA}
            icone={FileText}
          />
          <Grupo
            titulo="Locais"
            itens={grupos.LOCAL}
            icone={MapPin}
          />
        </div>

        <MobileBottomNav />
      </div>
    </main>
  );
}

function Grupo({
  titulo,
  itens,
  icone: Icone,
}: {
  titulo: string;
  itens: Resultado[];
  icone: typeof Search;
}) {
  if (itens.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {titulo}
      </h2>

      <div className="space-y-2">
        {itens.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex min-h-18 items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900/85 p-4 shadow-lg"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10">
              <Icone className="h-5 w-5 text-cyan-300" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-black text-white">
                {item.titulo}
              </p>
              <p className="mt-1 truncate text-sm text-slate-400">
                {item.descricao}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
