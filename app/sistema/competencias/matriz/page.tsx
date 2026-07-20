"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, Loader2, Search, Target } from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import {
  calcularLacuna,
  lerUsuarioCompetencia,
  nomeNivelCompetencia,
} from "@/lib/competencias";
import { supabase } from "@/lib/supabase";

type Matriz = {
  id: number;
  guarda_id: number;
  guarda_nome: string;
  matricula: string | null;
  competencia_id: number;
  competencia_nome: string;
  nivel_atual: number;
  nivel_exigido: number;
  status_validacao: string;
};

export default function MatrizCompetenciasPage() {
  const [usuario] = useState(() => lerUsuarioCompetencia());
  const [registros, setRegistros] = useState<Matriz[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      if (!usuario?.municipio_id) return;

      const { data, error } = await supabase
        .from("competencias_matriz_guardas")
        .select("*")
        .eq("municipio_id", usuario.municipio_id)
        .order("guarda_nome");

      if (error) setErro(error.message);
      else setRegistros((data as Matriz[] | null) || []);

      setCarregando(false);
    }

    void carregar();
  }, [usuario]);

  const grupos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtrados = registros.filter((item) =>
      `${item.guarda_nome} ${item.matricula || ""} ${item.competencia_nome}`
        .toLowerCase()
        .includes(termo)
    );

    return Array.from(
      filtrados.reduce((mapa, item) => {
        const atual = mapa.get(item.guarda_id) || {
          guarda_id: item.guarda_id,
          guarda_nome: item.guarda_nome,
          matricula: item.matricula,
          itens: [] as Matriz[],
        };
        atual.itens.push(item);
        mapa.set(item.guarda_id, atual);
        return mapa;
      }, new Map<number, { guarda_id: number; guarda_nome: string; matricula: string | null; itens: Matriz[] }>())
    ).map(([, valor]) => valor);
  }, [busca, registros]);

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link
              href="/sistema/competencias"
              className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="mt-4 text-2xl font-black">Matriz de Competências do Efetivo</h1>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#061326] px-4">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar guarda ou competência..."
              className="h-12 w-full bg-transparent outline-none"
            />
          </label>

          {carregando ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
            </div>
          ) : (
            <section className="grid gap-4 lg:grid-cols-2">
              {grupos.map((grupo) => {
                const lacunas = grupo.itens.filter(
                  (item) =>
                    calcularLacuna(item.nivel_atual, item.nivel_exigido) > 0
                ).length;

                return (
                  <div
                    key={grupo.guarda_id}
                    className="rounded-2xl border border-slate-800 bg-[#061326] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-black">{grupo.guarda_nome}</h2>
                        <p className="text-xs text-slate-500">
                          {grupo.matricula || "Sem matrícula"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-cyan-400/20 px-3 py-2 text-xs font-black text-cyan-300">
                        {lacunas} lacuna(s)
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {grupo.itens.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl border border-slate-800 bg-slate-950/30 p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-black">{item.competencia_nome}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                Atual: {nomeNivelCompetencia(item.nivel_atual)} • Exigido:{" "}
                                {nomeNivelCompetencia(item.nivel_exigido)}
                              </p>
                            </div>
                            <Link
                              href={`/sistema/competencias/${item.competencia_id}`}
                              className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
                            >
                              <Eye className="h-4 w-4" />
                              Abrir
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {!grupos.length ? (
                <div className="rounded-2xl border border-slate-800 bg-[#061326] p-16 text-center text-slate-500 lg:col-span-2">
                  Nenhuma competência vinculada ao efetivo.
                </div>
              ) : null}
            </section>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}
