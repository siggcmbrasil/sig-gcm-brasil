"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  BarChart3,
  CheckCircle2,
  Clock3,
  Eye,
  FilePlus2,
  Loader2,
  Medal,
  Printer,
  RefreshCw,
  Search,
  Star,
  Users,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  formatarConceito,
  lerUsuarioAvaliacao,
  podeGerenciarAvaliacoes,
} from "@/lib/avaliacaoDesempenho";
import { supabase } from "@/lib/supabase";

type Avaliacao = {
  id: number;
  guarda_id: number;
  guarda_nome: string;
  matricula: string | null;
  periodo_tipo: string;
  periodo_referencia: string;
  tipo_avaliacao: string;
  media_final: number;
  conceito: string;
  status: string;
  avaliador_nome: string | null;
  criado_em: string;
};

export default function AvaliacoesDesempenhoPage() {
  const [usuario] = useState(() => lerUsuarioAvaliacao());
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("TODOS");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarAvaliacoes(usuario.perfil)
    : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) {
      setErro("Sessão ou município não identificado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    const { data, error } = await supabase
      .from("avaliacoes_desempenho")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    if (error) {
      setErro(error.message);
      setAvaliacoes([]);
    } else {
      setAvaliacoes((data as Avaliacao[] | null) || []);
    }

    setCarregando(false);
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return avaliacoes.filter((item) => {
      const correspondeBusca =
        !termo ||
        `${item.guarda_nome} ${item.matricula || ""} ${item.avaliador_nome || ""}`
          .toLowerCase()
          .includes(termo);
      return correspondeBusca && (status === "TODOS" || item.status === status);
    });
  }, [avaliacoes, busca, status]);

  const concluidas = avaliacoes.filter((item) =>
    ["CONCLUIDA", "CIENTE"].includes(item.status)
  );
  const mediaGeral = concluidas.length
    ? concluidas.reduce((soma, item) => soma + Number(item.media_final || 0), 0) /
      concluidas.length
    : 0;
  const pendentes = avaliacoes.filter((item) =>
    ["RASCUNHO", "AGUARDANDO_CIENCIA"].includes(item.status)
  ).length;

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "avaliacoes_desempenho",
      descricao: "Impressão do painel de avaliações de desempenho.",
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
                  Avaliação de Desempenho Funcional
                </h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Acompanhe avaliações, conceitos, ciência e planos de melhoria.
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
                {podeGerenciar ? (
                  <Link
                    href="/sistema/avaliacoes-desempenho/nova"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"
                  >
                    <FilePlus2 className="h-4 w-4" />
                    Nova avaliação
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
            <Metrica titulo="Avaliações" valor={avaliacoes.length} icone={Users} />
            <Metrica titulo="Média geral" valor={mediaGeral.toFixed(2)} icone={Star} />
            <Metrica titulo="Pendentes" valor={pendentes} icone={Clock3} />
            <Metrica titulo="Concluídas" valor={concluidas.length} icone={CheckCircle2} />
          </section>

          <section className="grid gap-3 rounded-2xl border border-slate-800 bg-[#061326] p-4 print:hidden md:grid-cols-[1fr_240px]">
            <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/60 px-4">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar guarda, matrícula ou avaliador..."
                className="h-12 w-full bg-transparent outline-none"
              />
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-12 rounded-xl border border-slate-700 bg-slate-950/60 px-4"
            >
              <option value="TODOS">Todos os status</option>
              <option value="RASCUNHO">Rascunho</option>
              <option value="AGUARDANDO_CIENCIA">Aguardando ciência</option>
              <option value="CIENTE">Ciente</option>
              <option value="CONCLUIDA">Concluída</option>
            </select>
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
                    {[
                      "Guarda",
                      "Período",
                      "Tipo",
                      "Média",
                      "Conceito",
                      "Status",
                      "Avaliador",
                      "Ações",
                    ].map((item) => (
                      <th key={item} className="px-4 py-3">{item}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((item, indice) => (
                    <tr key={item.id} className="border-b border-slate-800/70">
                      <td className="px-4 py-4">
                        <p className="font-black">{indice + 1}. {item.guarda_nome}</p>
                        <p className="text-xs text-slate-500">{item.matricula || "Sem matrícula"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p>{formatarConceito(item.periodo_tipo)}</p>
                        <p className="text-xs text-slate-500">{item.periodo_referencia}</p>
                      </td>
                      <td className="px-4 py-4">{formatarConceito(item.tipo_avaliacao)}</td>
                      <td className="px-4 py-4 text-lg font-black text-cyan-300 print:text-black">
                        {Number(item.media_final || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-4">{formatarConceito(item.conceito)}</td>
                      <td className="px-4 py-4">{formatarConceito(item.status)}</td>
                      <td className="px-4 py-4">{item.avaliador_nome || "Não informado"}</td>
                      <td className="px-4 py-4 print:hidden">
                        <Link
                          href={`/sistema/avaliacoes-desempenho/${item.id}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/25 px-3 py-2 font-black text-cyan-300"
                        >
                          <Eye className="h-4 w-4" />
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!filtradas.length ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center text-slate-500">
                        Nenhuma avaliação encontrada.
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
  icone: typeof Award;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <Icone className="h-6 w-6 text-cyan-300 print:text-black" />
      <p className="mt-4 text-[10px] font-black uppercase tracking-wider text-slate-500 print:text-black">{titulo}</p>
      <p className="mt-1 text-xl font-black">{valor}</p>
    </div>
  );
}
