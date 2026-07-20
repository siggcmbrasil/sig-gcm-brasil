"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Brain,
  Eye,
  FilePlus2,
  Gauge,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  formatarTextoCompetencia,
  lerUsuarioCompetencia,
  nomeNivelCompetencia,
  podeGerenciarCompetencias,
} from "@/lib/competencias";
import { supabase } from "@/lib/supabase";

type Competencia = {
  id: number;
  nome: string;
  categoria: string;
  descricao: string | null;
  curso_recomendado_id: number | null;
  curso_recomendado_nome: string | null;
  ativo: boolean;
};

type Matriz = {
  id: number;
  guarda_id: number;
  guarda_nome: string;
  competencia_id: number;
  competencia_nome: string;
  nivel_atual: number;
  nivel_exigido: number;
  status_validacao: string;
};

export default function CompetenciasPage() {
  const [usuario] = useState(() => lerUsuarioCompetencia());
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [matriz, setMatriz] = useState<Matriz[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarCompetencias(usuario.perfil)
    : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) {
      setErro("Sessão ou município não identificado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    const [competenciasResp, matrizResp] = await Promise.all([
      supabase
        .from("competencias_catalogo")
        .select("*")
        .eq("municipio_id", usuario.municipio_id)
        .order("nome"),
      supabase
        .from("competencias_matriz_guardas")
        .select("*")
        .eq("municipio_id", usuario.municipio_id)
        .order("guarda_nome"),
    ]);

    const primeiroErro = competenciasResp.error || matrizResp.error;
    if (primeiroErro) setErro(primeiroErro.message);

    setCompetencias((competenciasResp.data as Competencia[] | null) || []);
    setMatriz((matrizResp.data as Matriz[] | null) || []);
    setCarregando(false);
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return competencias.filter((item) =>
      `${item.nome} ${item.categoria} ${item.descricao || ""}`
        .toLowerCase()
        .includes(termo)
    );
  }, [busca, competencias]);

  const guardasAvaliados = new Set(matriz.map((item) => item.guarda_id)).size;
  const lacunas = matriz.filter(
    (item) => Number(item.nivel_atual) < Number(item.nivel_exigido)
  ).length;
  const validadas = matriz.filter(
    (item) => item.status_validacao === "VALIDADO"
  ).length;

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "competencias_catalogo",
      descricao: "Impressão do painel de competências e habilidades.",
    });
    window.print();
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-[1700px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 print:border-black print:bg-white lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300 print:text-black">
                  Desenvolvimento do efetivo
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  Competências e Habilidades
                </h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Catálogo, níveis exigidos, autoavaliação, validação e lacunas profissionais.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 print:hidden">
                <button
                  onClick={() => void carregar()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-black"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar
                </button>

                <button
                  onClick={() => void imprimir()}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-300"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir/PDF
                </button>

                <Link
                  href="/sistema/competencias/matriz"
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-4 py-3 text-sm font-black text-cyan-300"
                >
                  <Gauge className="h-4 w-4" />
                  Matriz do efetivo
                </Link>

                {podeGerenciar ? (
                  <Link
                    href="/sistema/competencias/nova"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"
                  >
                    <FilePlus2 className="h-4 w-4" />
                    Nova competência
                  </Link>
                ) : null}
              </div>
            </div>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metrica titulo="Competências" valor={competencias.length} icone={Brain} />
            <Metrica titulo="Guardas avaliados" valor={guardasAvaliados} icone={Users} />
            <Metrica titulo="Lacunas identificadas" valor={lacunas} icone={Target} />
            <Metrica titulo="Registros validados" valor={validadas} icone={TrendingUp} />
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-4 print:hidden">
            <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/60 px-4">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar competência, categoria ou descrição..."
                className="h-12 w-full bg-transparent outline-none"
              />
            </label>
          </section>

          <section className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#061326] print:border-black print:bg-white">
            {carregando ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
              </div>
            ) : (
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="border-b border-slate-700 text-[10px] uppercase text-slate-400 print:text-black">
                  <tr>
                    <th className="px-4 py-3">Competência</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3">Curso recomendado</th>
                    <th className="px-4 py-3">Registros</th>
                    <th className="px-4 py-3 print:hidden">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((item) => {
                    const registros = matriz.filter(
                      (registro) => registro.competencia_id === item.id
                    );

                    return (
                      <tr key={item.id} className="border-b border-slate-800/70">
                        <td className="px-4 py-4 font-black">{item.nome}</td>
                        <td className="px-4 py-4">
                          {formatarTextoCompetencia(item.categoria)}
                        </td>
                        <td className="max-w-md px-4 py-4 text-slate-400 print:text-black">
                          {item.descricao || "Sem descrição"}
                        </td>
                        <td className="px-4 py-4">
                          {item.curso_recomendado_nome || "Não vinculado"}
                        </td>
                        <td className="px-4 py-4">{registros.length}</td>
                        <td className="px-4 py-4 print:hidden">
                          <Link
                            href={`/sistema/competencias/${item.id}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/25 px-3 py-2 font-black text-cyan-300"
                          >
                            <Eye className="h-4 w-4" />
                            Abrir
                          </Link>
                        </td>
                      </tr>
                    );
                  })}

                  {!filtradas.length ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center text-slate-500">
                        Nenhuma competência encontrada.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            )}
          </section>
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
  valor: number | string;
  icone: typeof Brain;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <Icone className="h-6 w-6 text-cyan-300 print:text-black" />
      <p className="mt-4 text-[10px] font-black uppercase tracking-wider text-slate-500 print:text-black">
        {titulo}
      </p>
      <p className="mt-1 text-xl font-black">{valor}</p>
    </div>
  );
}
