"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  FilePlus2,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  formatarDataEstagio,
  formatarEstagio,
  lerUsuarioEstagio,
  podeGerenciarEstagio,
} from "@/lib/estagioProbatorio";
import { supabase } from "@/lib/supabase";

type Estagio = {
  id: number;
  guarda_id: number;
  guarda_nome: string;
  matricula: string | null;
  data_exercicio: string;
  data_prevista_termino: string;
  meses_probatorio: number;
  status: string;
  etapa_atual: number;
  total_etapas: number;
  media_atual: number | null;
  resultado_final: string | null;
};

export default function EstagioProbatorioPage() {
  const [usuario] = useState(() => lerUsuarioEstagio());
  const [registros, setRegistros] = useState<Estagio[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario ? podeGerenciarEstagio(usuario.perfil) : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) {
      setErro("Sessão ou município não identificado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    const { data, error } = await supabase
      .from("estagios_probatorios")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("data_prevista_termino");

    if (error) setErro(error.message);
    setRegistros((data as Estagio[] | null) || []);
    setCarregando(false);
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return registros.filter((item) =>
      `${item.guarda_nome} ${item.matricula || ""} ${item.status} ${item.resultado_final || ""}`
        .toLowerCase()
        .includes(termo)
    );
  }, [busca, registros]);

  const ativos = registros.filter((item) => item.status === "EM_ANDAMENTO").length;
  const aprovados = registros.filter((item) => item.resultado_final === "APROVADO").length;
  const reprovados = registros.filter((item) => item.resultado_final === "REPROVADO").length;
  const hoje = new Date().toISOString().slice(0, 10);
  const limite = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
  const proximos = registros.filter(
    (item) =>
      item.status === "EM_ANDAMENTO" &&
      item.data_prevista_termino >= hoje &&
      item.data_prevista_termino <= limite
  ).length;

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "estagios_probatorios",
      descricao: "Impressão do painel de estágio probatório.",
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
                  Estágio Probatório e Efetivação
                </h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Avaliações periódicas, prazos, recursos, resultado final e efetivação.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 print:hidden">
                <button onClick={() => void carregar()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-black">
                  <RefreshCw className="h-4 w-4" /> Atualizar
                </button>
                <button onClick={() => void imprimir()} className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-300">
                  <Printer className="h-4 w-4" /> Imprimir/PDF
                </button>
                <Link href="/sistema/avaliacoes" className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-4 py-3 text-sm font-black text-cyan-300">
                  <UserCheck className="h-4 w-4" /> Avaliações
                </Link>

                <Link href="/sistema/saude-ocupacional" className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-300">
                  Saúde ocupacional
                </Link>

                {podeGerenciar ? (
                  <Link href="/sistema/estagio-probatorio/novo" className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950">
                    <FilePlus2 className="h-4 w-4" /> Novo estágio
                  </Link>
                ) : null}
              </div>
            </div>
          </header>

          {erro ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">{erro}</div> : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Metrica titulo="Total" valor={registros.length} icone={Users} />
            <Metrica titulo="Em andamento" valor={ativos} icone={CalendarClock} />
            <Metrica titulo="Aprovados" valor={aprovados} icone={BadgeCheck} />
            <Metrica titulo="Reprovados" valor={reprovados} icone={AlertTriangle} />
            <Metrica titulo="Vencem em 60 dias" valor={proximos} icone={ShieldCheck} />
          </section>

          <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#061326] px-4 print:hidden">
            <Search className="h-4 w-4 text-slate-500" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar servidor, matrícula, status ou resultado..." className="h-12 w-full bg-transparent outline-none" />
          </label>

          {carregando ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
            </div>
          ) : (
            <section className="grid gap-4 xl:grid-cols-2">
              {filtrados.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-cyan-300 print:text-black">
                        {item.matricula || "Sem matrícula"}
                      </p>
                      <h2 className="mt-1 text-lg font-black">{item.guarda_nome}</h2>
                      <p className="mt-1 text-sm text-slate-500 print:text-black">
                        Exercício: {formatarDataEstagio(item.data_exercicio)}
                      </p>
                    </div>
                    <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-black uppercase text-cyan-300 print:text-black">
                      {formatarEstagio(item.status)}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Numero titulo="Etapa" valor={`${item.etapa_atual}/${item.total_etapas}`} />
                    <Numero titulo="Média" valor={item.media_atual == null ? "—" : Number(item.media_atual).toFixed(1)} />
                    <Numero titulo="Meses" valor={String(item.meses_probatorio)} />
                    <Numero titulo="Resultado" valor={item.resultado_final ? formatarEstagio(item.resultado_final) : "Pendente"} />
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white">
                    <p className="text-xs font-black uppercase text-slate-500 print:text-black">Término previsto</p>
                    <p className="mt-1 font-black">{formatarDataEstagio(item.data_prevista_termino)}</p>
                  </div>

                  <Link href={`/sistema/estagio-probatorio/${item.id}`} className="mt-4 inline-flex rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 print:hidden">
                    Abrir acompanhamento
                  </Link>
                </article>
              ))}

              {!filtrados.length ? (
                <div className="rounded-2xl border border-slate-800 bg-[#061326] p-14 text-center text-slate-500 xl:col-span-2">
                  Nenhum estágio probatório cadastrado.
                </div>
              ) : null}
            </section>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Metrica({ titulo, valor, icone: Icone }: { titulo: string; valor: number; icone: typeof Users }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <Icone className="h-6 w-6 text-cyan-300 print:text-black" />
      <p className="mt-4 text-[10px] font-black uppercase text-slate-500 print:text-black">{titulo}</p>
      <p className="mt-1 text-xl font-black">{valor}</p>
    </div>
  );
}

function Numero({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-center print:border-black print:bg-white">
      <p className="text-[10px] font-black uppercase text-slate-500 print:text-black">{titulo}</p>
      <p className="mt-1 font-black">{valor}</p>
    </div>
  );
}
