"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Accessibility,
  ArrowRight,
  BriefcaseMedical,
  FilePlus2,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  formatarData,
  formatarTexto,
  lerUsuarioReadaptacao,
  podeGerenciarReadaptacao,
} from "@/lib/readaptacaoFuncional";
import { supabase } from "@/lib/supabase";

type Processo = {
  id: number;
  guarda_id: number | null;
  guarda_nome: string;
  matricula: string | null;
  origem: string;
  tipo_readaptacao: string;
  setor_destino: string | null;
  funcao_destino: string | null;
  data_inicio: string;
  data_fim_prevista: string | null;
  status: string;
  prioridade: string;
};

export default function ReadaptacaoFuncionalPage() {
  const [usuario] = useState(() => lerUsuarioReadaptacao());
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario ? podeGerenciarReadaptacao(usuario.perfil) : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) {
      setErro("Sessão ou município não identificado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    const { data, error } = await supabase
      .from("readaptacoes_funcionais")
      .select("id,guarda_id,guarda_nome,matricula,origem,tipo_readaptacao,setor_destino,funcao_destino,data_inicio,data_fim_prevista,status,prioridade")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    if (error) setErro(error.message);
    setProcessos((data as Processo[] | null) || []);
    setCarregando(false);
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return processos.filter((item) =>
      `${item.guarda_nome} ${item.matricula || ""} ${item.origem} ${item.tipo_readaptacao} ${item.setor_destino || ""} ${item.funcao_destino || ""} ${item.status}`
        .toLowerCase()
        .includes(termo)
    );
  }, [busca, processos]);

  const ativos = processos.filter((item) => item.status === "ATIVO").length;
  const temporarios = processos.filter((item) => item.tipo_readaptacao === "TEMPORARIA").length;
  const definitivos = processos.filter((item) => item.tipo_readaptacao === "DEFINITIVA").length;
  const reavaliacao = processos.filter((item) => item.status === "AGUARDANDO_REAVALIACAO").length;

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "readaptacoes_funcionais",
      descricao: "Impressão do painel de reabilitação e readaptação funcional.",
    });
    window.print();
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <div className="fixed bottom-5 left-5 z-40 print:hidden">
        <Link
          href="/sistema/assistencia-social"
          className="rounded-xl border border-cyan-400/25 bg-[#061326] px-4 py-3 text-sm font-black text-cyan-300 shadow-xl"
        >
          Assistência Social
        </Link>
      </div>

      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-[1650px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 print:border-black print:bg-white lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300 print:text-black">
                  Gestão funcional e retorno ao trabalho
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  Reabilitação e Readaptação Funcional
                </h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Processos, limitações, atividades compatíveis, reavaliações e retorno seguro ao trabalho.
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
                    href="/sistema/readaptacao-funcional/novo"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"
                  >
                    <FilePlus2 className="h-4 w-4" />
                    Novo processo
                  </Link>
                ) : null}
              </div>
            </div>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Metrica titulo="Processos" valor={processos.length} icone={Accessibility} />
            <Metrica titulo="Ativos" valor={ativos} icone={ShieldCheck} />
            <Metrica titulo="Temporários" valor={temporarios} icone={BriefcaseMedical} />
            <Metrica titulo="Definitivos" valor={definitivos} icone={UserRoundCheck} />
            <Metrica titulo="Reavaliação" valor={reavaliacao} icone={RefreshCw} />
          </section>

          <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#061326] px-4 print:hidden">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar servidor, matrícula, setor, função ou status..."
              className="h-12 w-full bg-transparent outline-none"
            />
          </label>

          {carregando ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
            </div>
          ) : (
            <section className="grid gap-4 xl:grid-cols-2">
              {filtrados.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-cyan-300 print:text-black">
                        {formatarTexto(item.tipo_readaptacao)}
                      </p>
                      <h2 className="mt-1 text-lg font-black">{item.guarda_nome}</h2>
                      <p className="mt-1 text-sm text-slate-500 print:text-black">
                        Matrícula: {item.matricula || "não informada"}
                      </p>
                    </div>
                    <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-black uppercase text-cyan-300 print:text-black">
                      {formatarTexto(item.status)}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Info titulo="Origem" valor={formatarTexto(item.origem)} />
                    <Info titulo="Início" valor={formatarData(item.data_inicio)} />
                    <Info titulo="Fim previsto" valor={formatarData(item.data_fim_prevista)} />
                    <Info titulo="Prioridade" valor={formatarTexto(item.prioridade)} />
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white">
                    <p className="text-[10px] font-black uppercase text-slate-500 print:text-black">
                      Destino funcional
                    </p>
                    <p className="mt-1 font-semibold">
                      {item.setor_destino || "Setor não definido"}
                      {item.funcao_destino ? ` • ${item.funcao_destino}` : ""}
                    </p>
                  </div>

                  <Link
                    href={`/sistema/readaptacao-funcional/${item.id}`}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 print:hidden"
                  >
                    Abrir processo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}

              {!filtrados.length ? (
                <div className="rounded-2xl border border-slate-800 bg-[#061326] p-14 text-center text-slate-500 xl:col-span-2">
                  Nenhum processo de readaptação cadastrado.
                </div>
              ) : null}
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
  icone: typeof Accessibility;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <Icone className="h-6 w-6 text-cyan-300 print:text-black" />
      <p className="mt-4 text-[10px] font-black uppercase text-slate-500 print:text-black">{titulo}</p>
      <p className="mt-1 text-xl font-black">{valor}</p>
    </div>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-center print:border-black print:bg-white">
      <p className="text-[10px] font-black uppercase text-slate-500 print:text-black">{titulo}</p>
      <p className="mt-1 text-sm font-black">{valor}</p>
    </div>
  );
}
