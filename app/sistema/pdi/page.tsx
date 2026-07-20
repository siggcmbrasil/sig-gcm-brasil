"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpenCheck,
  CheckCircle2,
  Eye,
  FilePlus2,
  Filter,
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
  formatarStatusPdi,
  lerUsuarioPdi,
  podeGerenciarPdi,
} from "@/lib/pdi";
import { supabase } from "@/lib/supabase";

type Pdi = {
  id: number;
  guarda_id: number;
  guarda_nome: string;
  matricula: string | null;
  titulo: string;
  data_inicio: string;
  data_fim: string | null;
  progresso: number;
  status: string;
  avaliacao_id: number | null;
  responsavel_nome: string | null;
  criado_em: string;
};

export default function PdiPage() {
  const [usuario] = useState(() => lerUsuarioPdi());
  const [registros, setRegistros] = useState<Pdi[]>([]);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("TODOS");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario ? podeGerenciarPdi(usuario.perfil) : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) {
      setErro("Sessão ou município não identificado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    const { data, error } = await supabase
      .from("planos_desenvolvimento_individual")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    if (error) {
      setErro(error.message);
      setRegistros([]);
    } else {
      setRegistros((data as Pdi[] | null) || []);
    }

    setCarregando(false);
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return registros.filter((item) => {
      const correspondeBusca =
        !termo ||
        `${item.guarda_nome} ${item.matricula || ""} ${item.titulo}`
          .toLowerCase()
          .includes(termo);

      return correspondeBusca && (status === "TODOS" || item.status === status);
    });
  }, [busca, registros, status]);

  const ativos = registros.filter((item) => item.status === "ATIVO").length;
  const concluidos = registros.filter((item) => item.status === "CONCLUIDO").length;
  const progressoMedio = registros.length
    ? Math.round(
        registros.reduce((soma, item) => soma + Number(item.progresso || 0), 0) /
          registros.length
      )
    : 0;

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "planos_desenvolvimento_individual",
      descricao: "Impressão do painel de planos de desenvolvimento individual.",
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
                  Recursos Humanos
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  Plano de Desenvolvimento Individual
                </h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Metas, competências, cursos, prazos, evidências e acompanhamento funcional.
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
                  href="/sistema/estagio-probatorio"
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-3 text-sm font-black text-violet-300"
                >
                  Estágio probatório
                </Link>
\n                {podeGerenciar ? (
                  <Link
                    href="/sistema/pdi/novo"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"
                  >
                    <FilePlus2 className="h-4 w-4" />
                    Novo PDI
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
            <Metrica titulo="Planos cadastrados" valor={registros.length} icone={Users} />
            <Metrica titulo="Planos ativos" valor={ativos} icone={Target} />
            <Metrica titulo="Concluídos" valor={concluidos} icone={CheckCircle2} />
            <Metrica titulo="Progresso médio" valor={`${progressoMedio}%`} icone={TrendingUp} />
          </section>

          <section className="grid gap-3 rounded-2xl border border-slate-800 bg-[#061326] p-4 print:hidden md:grid-cols-[1fr_240px]">
            <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/60 px-4">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar guarda, matrícula ou título..."
                className="h-12 w-full bg-transparent outline-none"
              />
            </label>

            <label className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-slate-500" />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                <option value="TODOS">Todos os status</option>
                <option value="RASCUNHO">Rascunho</option>
                <option value="ATIVO">Ativo</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </label>
          </section>

          <section className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#061326] print:border-black print:bg-white">
            {carregando ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
              </div>
            ) : (
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="border-b border-slate-700 text-[10px] uppercase text-slate-400 print:text-black">
                  <tr>
                    <th className="px-4 py-3">Guarda</th>
                    <th className="px-4 py-3">Plano</th>
                    <th className="px-4 py-3">Período</th>
                    <th className="px-4 py-3">Progresso</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Responsável</th>
                    <th className="px-4 py-3 print:hidden">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((item) => (
                    <tr key={item.id} className="border-b border-slate-800/70">
                      <td className="px-4 py-4">
                        <p className="font-black">{item.guarda_nome}</p>
                        <p className="text-xs text-slate-500">
                          {item.matricula || "Sem matrícula"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold">{item.titulo}</p>
                        {item.avaliacao_id ? (
                          <p className="text-xs text-cyan-300">Vinculado à avaliação #{item.avaliacao_id}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        {new Date(`${item.data_inicio}T00:00:00`).toLocaleDateString("pt-BR")}
                        {" — "}
                        {item.data_fim
                          ? new Date(`${item.data_fim}T00:00:00`).toLocaleDateString("pt-BR")
                          : "sem prazo final"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-40">
                          <div className="mb-1 flex justify-between text-xs">
                            <span>{Number(item.progresso || 0)}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-cyan-300"
                              style={{ width: `${Math.min(100, Number(item.progresso || 0))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">{formatarStatusPdi(item.status)}</td>
                      <td className="px-4 py-4">{item.responsavel_nome || "Não informado"}</td>
                      <td className="px-4 py-4 print:hidden">
                        <Link
                          href={`/sistema/pdi/${item.id}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/25 px-3 py-2 font-black text-cyan-300"
                        >
                          <Eye className="h-4 w-4" />
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {!filtrados.length ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                        Nenhum PDI encontrado.
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
  icone: typeof BookOpenCheck;
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
