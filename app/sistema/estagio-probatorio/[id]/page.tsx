"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck, CalendarDays, Loader2, Printer } from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import { formatarDataEstagio, formatarEstagio, lerUsuarioEstagio } from "@/lib/estagioProbatorio";
import { supabase } from "@/lib/supabase";

type Estagio = {
  id: number;
  guarda_nome: string;
  matricula: string | null;
  data_exercicio: string;
  data_prevista_termino: string;
  status: string;
  etapa_atual: number;
  total_etapas: number;
  media_atual: number | null;
  resultado_final: string | null;
  parecer_final: string | null;
};

type Avaliacao = {
  id: number;
  etapa: number;
  data_avaliacao: string;
  assiduidade: number;
  disciplina: number;
  produtividade: number;
  responsabilidade: number;
  iniciativa: number;
  relacionamento: number;
  capacidade_tecnica: number;
  nota_final: number;
  status: string;
  parecer_chefia: string | null;
};

export default function EstagioDetalhePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [usuario] = useState(() => lerUsuarioEstagio());
  const [estagio, setEstagio] = useState<Estagio | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id || !id) return;
    const [estagioResp, avaliacoesResp] = await Promise.all([
      supabase.from("estagios_probatorios").select("*").eq("id", id).eq("municipio_id", usuario.municipio_id).single(),
      supabase.from("estagio_probatorio_avaliacoes").select("*").eq("estagio_id", id).eq("municipio_id", usuario.municipio_id).order("etapa"),
    ]);
    if (estagioResp.error) setErro(estagioResp.error.message);
    setEstagio((estagioResp.data as Estagio | null) || null);
    setAvaliacoes((avaliacoesResp.data as Avaliacao[] | null) || []);
    setCarregando(false);
  }, [id, usuario]);

  useEffect(() => { void carregar(); }, [carregar]);

  const media = useMemo(() => {
    if (!avaliacoes.length) return null;
    return avaliacoes.reduce((soma, item) => soma + Number(item.nota_final || 0), 0) / avaliacoes.length;
  }, [avaliacoes]);

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "estagios_probatorios",
      registro_id: id,
      descricao: "Impressão do acompanhamento de estágio probatório.",
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
              <Link href="/sistema/estagio-probatorio" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300 print:hidden">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Link>
              <button onClick={() => void imprimir()} className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-4 py-3 text-sm font-black text-cyan-300 print:hidden">
                <Printer className="h-4 w-4" /> Imprimir/PDF
              </button>
            </div>

            {estagio ? (
              <div className="mt-5">
                <p className="text-xs font-black uppercase text-cyan-300 print:text-black">{estagio.matricula || "Sem matrícula"}</p>
                <h1 className="mt-1 text-2xl font-black">{estagio.guarda_nome}</h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  {formatarDataEstagio(estagio.data_exercicio)} até {formatarDataEstagio(estagio.data_prevista_termino)}
                </p>
              </div>
            ) : null}
          </header>

          {erro ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">{erro}</div> : null}

          {estagio ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card titulo="Status" valor={formatarEstagio(estagio.status)} />
                <Card titulo="Etapa" valor={`${estagio.etapa_atual}/${estagio.total_etapas}`} />
                <Card titulo="Média" valor={media == null ? "—" : media.toFixed(1)} />
                <Card titulo="Resultado" valor={estagio.resultado_final ? formatarEstagio(estagio.resultado_final) : "Pendente"} />
              </section>

              <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
                <h2 className="font-black">Avaliações periódicas</h2>
                <div className="mt-4 space-y-3">
                  {avaliacoes.map((item) => (
                    <article key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black">Etapa {item.etapa}</p>
                          <p className="mt-1 text-xs text-slate-500 print:text-black">{formatarDataEstagio(item.data_avaliacao)}</p>
                        </div>
                        <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-black uppercase text-cyan-300 print:text-black">
                          Nota {Number(item.nota_final).toFixed(1)}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                        <Nota titulo="Assiduidade" valor={item.assiduidade} />
                        <Nota titulo="Disciplina" valor={item.disciplina} />
                        <Nota titulo="Produtividade" valor={item.produtividade} />
                        <Nota titulo="Responsabilidade" valor={item.responsabilidade} />
                        <Nota titulo="Iniciativa" valor={item.iniciativa} />
                        <Nota titulo="Relacionamento" valor={item.relacionamento} />
                        <Nota titulo="Capacidade técnica" valor={item.capacidade_tecnica} />
                        <Nota titulo="Resultado" valor={item.nota_final} />
                      </div>
                      {item.parecer_chefia ? <p className="mt-4 text-sm text-slate-400 print:text-black"><strong>Parecer:</strong> {item.parecer_chefia}</p> : null}
                    </article>
                  ))}
                  {!avaliacoes.length ? <p className="py-10 text-center text-slate-500">Nenhuma avaliação registrada.</p> : null}
                </div>
              </section>

              {estagio.parecer_final ? (
                <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.05] p-5 print:border-black print:bg-white">
                  <div className="flex gap-3">
                    <BadgeCheck className="h-5 w-5 text-cyan-300 print:text-black" />
                    <div>
                      <h2 className="font-black">Parecer final</h2>
                      <p className="mt-2 text-sm text-slate-400 print:text-black">{estagio.parecer_final}</p>
                    </div>
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <CalendarDays className="h-5 w-5 text-cyan-300 print:text-black" />
      <p className="mt-3 text-[10px] font-black uppercase text-slate-500 print:text-black">{titulo}</p>
      <p className="mt-1 font-black">{valor}</p>
    </div>
  );
}

function Nota({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-lg border border-slate-800 p-3 text-center print:border-black">
      <p className="text-[10px] font-black uppercase text-slate-500 print:text-black">{titulo}</p>
      <p className="mt-1 font-black">{Number(valor || 0).toFixed(1)}</p>
    </div>
  );
}
