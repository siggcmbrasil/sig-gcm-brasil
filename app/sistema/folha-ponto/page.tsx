"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { supabase } from "@/lib/supabase";
import {
  lerUsuarioFolhaPonto,
  nomeMesFolhaPonto,
  normalizarFolhaPonto,
  podeGerenciarFolhaPonto,
} from "@/lib/folhaPonto";

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
};

type Folha = {
  id: number;
  guarda_id: number;
  guarda_nome: string;
  matricula: string | null;
  mes: number;
  ano: number;
  status: string;
  dias_trabalhados: number;
  faltas: number;
  atrasos: number;
  minutos_extras: number;
  minutos_debito: number;
};

export default function FolhaPontoPage() {
  const agora = new Date();
  const [usuario] = useState(() => lerUsuarioFolhaPonto());
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [ano, setAno] = useState(agora.getFullYear());
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [folhas, setFolhas] = useState<Folha[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const gerencia = usuario ? podeGerenciarFolhaPonto(usuario.perfil) : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) return;

    setCarregando(true);
    setErro("");

    try {
      let consultaGuardas = supabase
        .from("guardas")
        .select("id,nome,matricula")
        .eq("municipio_id", usuario.municipio_id)
        .order("nome");

      if (!gerencia) {
        consultaGuardas = consultaGuardas.or(
          `usuario_id.eq.${Number(usuario.id)},matricula.eq.${usuario.matricula || "__SEM__"}`
        );
      }

      const [guardasResposta, folhasResposta] = await Promise.all([
        consultaGuardas,
        supabase
          .from("folhas_ponto")
          .select("*")
          .eq("municipio_id", usuario.municipio_id)
          .eq("mes", mes)
          .eq("ano", ano),
      ]);

      if (guardasResposta.error) throw guardasResposta.error;
      if (folhasResposta.error) {
        if (
          folhasResposta.error.code === "42P01" ||
          folhasResposta.error.code === "42703"
        ) {
          throw new Error("Execute primeiro supabase/FOLHA_PONTO.sql.");
        }
        throw folhasResposta.error;
      }

      setGuardas((guardasResposta.data as Guarda[] | null) || []);
      setFolhas((folhasResposta.data as Folha[] | null) || []);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as folhas de ponto."
      );
    } finally {
      setCarregando(false);
    }
  }, [ano, gerencia, mes, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const linhas = useMemo(() => {
    const termo = normalizarFolhaPonto(busca);

    return guardas
      .filter((guarda) =>
        !termo ||
        normalizarFolhaPonto(
          `${guarda.nome} ${guarda.matricula || ""}`
        ).includes(termo)
      )
      .map((guarda) => ({
        guarda,
        folha: folhas.find((item) => item.guarda_id === guarda.id) || null,
      }));
  }, [busca, folhas, guardas]);

  const fechadas = folhas.filter(
    (item) => normalizarFolhaPonto(item.status) === "FECHADA"
  ).length;

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-[1700px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 lg:p-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                  Controle mensal
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  Folha de Ponto e Frequência
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  Espelho mensal, fechamento, assinatura e exportação.
                </p>
              </div>

              <button
                onClick={() => void carregar()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-black"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </button>
            </div>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-3">
            <Metrica titulo="Servidores" valor={guardas.length} icone={Users} />
            <Metrica titulo="Folhas geradas" valor={folhas.length} icone={FileSpreadsheet} />
            <Metrica titulo="Folhas fechadas" valor={fechadas} icone={CheckCircle2} />
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-4">
            <div className="grid gap-3 md:grid-cols-[180px_150px_1fr]">
              <select
                value={mes}
                onChange={(event) => setMes(Number(event.target.value))}
                className="h-12 rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                {Array.from({ length: 12 }, (_, indice) => indice + 1).map(
                  (item) => (
                    <option key={item} value={item}>
                      {nomeMesFolhaPonto(item)}
                    </option>
                  )
                )}
              </select>

              <input
                type="number"
                value={ano}
                onChange={(event) => setAno(Number(event.target.value))}
                className="h-12 rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />

              <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/50 px-4">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Buscar servidor ou matrícula..."
                  className="h-12 w-full bg-transparent outline-none"
                />
              </label>
            </div>
          </section>

          {carregando ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
            </div>
          ) : (
            <section className="grid gap-4 xl:grid-cols-2">
              {linhas.map(({ guarda, folha }) => (
                <Link
                  key={guarda.id}
                  href={`/sistema/folha-ponto/${guarda.id}?mes=${mes}&ano=${ano}`}
                  className="rounded-2xl border border-slate-800 bg-[#061326] p-5 transition hover:border-cyan-400/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-black">{guarda.nome}</h2>
                      <p className="mt-1 text-xs text-slate-500">
                        {guarda.matricula || "Sem matrícula"} •{" "}
                        {nomeMesFolhaPonto(mes)} de {ano}
                      </p>
                    </div>
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black text-cyan-300">
                      {folha?.status || "NÃO GERADA"}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                    <Resumo titulo="Trabalhados" valor={folha?.dias_trabalhados || 0} />
                    <Resumo titulo="Atrasos" valor={folha?.atrasos || 0} />
                    <Resumo titulo="Faltas" valor={folha?.faltas || 0} />
                  </div>
                </Link>
              ))}
            </section>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Metrica({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: number;
  icone: typeof CalendarRange;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
      <Icone className="h-6 w-6 text-cyan-300" />
      <p className="mt-4 text-xs font-black uppercase tracking-wider text-slate-500">
        {titulo}
      </p>
      <p className="mt-1 text-2xl font-black">{valor}</p>
    </div>
  );
}

function Resumo({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
      <p className="text-[10px] font-black uppercase text-slate-500">{titulo}</p>
      <p className="mt-1 font-black">{valor}</p>
    </div>
  );
}
