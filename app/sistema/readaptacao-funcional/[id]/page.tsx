"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, ClipboardCheck, Loader2, Printer, UserRoundCheck } from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import { formatarData, formatarTexto, lerUsuarioReadaptacao } from "@/lib/readaptacaoFuncional";
import { supabase } from "@/lib/supabase";

type Processo = {
  id: number;
  guarda_nome: string;
  matricula: string | null;
  origem: string;
  tipo_readaptacao: string;
  prioridade: string;
  data_inicio: string;
  data_fim_prevista: string | null;
  limitacoes_funcionais: string | null;
  atividades_permitidas: string | null;
  atividades_proibidas: string | null;
  setor_destino: string | null;
  funcao_destino: string | null;
  observacoes: string | null;
  status: string;
};

type Reavaliacao = {
  id: number;
  data_reavaliacao: string;
  resultado: string;
  profissional_nome: string | null;
  observacoes: string | null;
};

export default function ReadaptacaoDetalhePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [usuario] = useState(() => lerUsuarioReadaptacao());
  const [processo, setProcesso] = useState<Processo | null>(null);
  const [reavaliacoes, setReavaliacoes] = useState<Reavaliacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id || !id) return;

    const [processoResp, reavaliacoesResp] = await Promise.all([
      supabase.from("readaptacoes_funcionais").select("*").eq("id", id).eq("municipio_id", usuario.municipio_id).single(),
      supabase.from("readaptacoes_reavaliacoes").select("id,data_reavaliacao,resultado,profissional_nome,observacoes").eq("readaptacao_id", id).eq("municipio_id", usuario.municipio_id).order("data_reavaliacao", { ascending: false }),
    ]);

    if (processoResp.error) setErro(processoResp.error.message);
    setProcesso((processoResp.data as Processo | null) || null);
    setReavaliacoes((reavaliacoesResp.data as Reavaliacao[] | null) || []);
    setCarregando(false);
  }, [id, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "readaptacoes_funcionais",
      registro_id: id,
      descricao: "Impressão do processo de readaptação funcional.",
    });
    window.print();
  }

  if (carregando) {
    return <div className="flex min-h-screen items-center justify-center bg-[#020b1c]"><Loader2 className="h-9 w-9 animate-spin text-cyan-300" /></div>;
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 print:border-black print:bg-white lg:p-7">
            <div className="flex items-center justify-between gap-4">
              <Link href="/sistema/readaptacao-funcional" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300 print:hidden">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
              <button onClick={() => void imprimir()} className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-4 py-3 text-sm font-black text-cyan-300 print:hidden">
                <Printer className="h-4 w-4" />
                Imprimir/PDF
              </button>
            </div>

            {processo ? (
              <div className="mt-5">
                <p className="text-xs font-black uppercase text-cyan-300 print:text-black">{formatarTexto(processo.tipo_readaptacao)}</p>
                <h1 className="mt-1 text-2xl font-black">{processo.guarda_nome}</h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Matrícula: {processo.matricula || "não informada"} • {formatarTexto(processo.status)}
                </p>
              </div>
            ) : null}
          </header>

          {erro ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">{erro}</div> : null}

          {processo ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card titulo="Origem" valor={formatarTexto(processo.origem)} icone={UserRoundCheck} />
                <Card titulo="Início" valor={formatarData(processo.data_inicio)} icone={CalendarDays} />
                <Card titulo="Fim previsto" valor={formatarData(processo.data_fim_prevista)} icone={CalendarDays} />
                <Card titulo="Prioridade" valor={formatarTexto(processo.prioridade)} icone={ClipboardCheck} />
              </section>

              <section className="grid gap-5 xl:grid-cols-2">
                <Bloco titulo="Limitações funcionais" texto={processo.limitacoes_funcionais} />
                <Bloco titulo="Atividades permitidas" texto={processo.atividades_permitidas} />
                <Bloco titulo="Atividades proibidas" texto={processo.atividades_proibidas} />
                <Bloco titulo="Destino funcional" texto={[processo.setor_destino, processo.funcao_destino].filter(Boolean).join(" • ")} />
                <div className="xl:col-span-2"><Bloco titulo="Observações" texto={processo.observacoes} /></div>
              </section>

              <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
                <h2 className="font-black">Histórico de reavaliações</h2>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {reavaliacoes.map((item) => (
                    <article key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white">
                      <p className="font-black">{formatarTexto(item.resultado)}</p>
                      <p className="mt-1 text-xs text-slate-500 print:text-black">
                        {formatarData(item.data_reavaliacao)} • {item.profissional_nome || "profissional não informado"}
                      </p>
                      <p className="mt-3 text-sm text-slate-400 print:text-black">{item.observacoes || "Sem observações."}</p>
                    </article>
                  ))}
                  {!reavaliacoes.length ? <p className="py-10 text-center text-slate-500 lg:col-span-2">Nenhuma reavaliação registrada.</p> : null}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Card({ titulo, valor, icone: Icone }: { titulo: string; valor: string; icone: typeof UserRoundCheck }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <Icone className="h-5 w-5 text-cyan-300 print:text-black" />
      <p className="mt-3 text-[10px] font-black uppercase text-slate-500 print:text-black">{titulo}</p>
      <p className="mt-1 font-black">{valor}</p>
    </div>
  );
}

function Bloco({ titulo, texto }: { titulo: string; texto?: string | null }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <h2 className="font-black">{titulo}</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-400 print:text-black">{texto || "Não informado."}</p>
    </div>
  );
}
