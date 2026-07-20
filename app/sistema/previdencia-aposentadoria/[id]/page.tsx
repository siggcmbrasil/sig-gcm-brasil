"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Landmark,
  Loader2,
  Printer,
  TimerReset,
  UserRound,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  formatarData,
  formatarTempo,
  formatarTexto,
  lerUsuarioPrevidencia,
} from "@/lib/previdenciaAposentadoria";
import { supabase } from "@/lib/supabase";

type Processo = {
  id: number;
  guarda_nome: string;
  matricula: string | null;
  tipo_processo: string;
  regime_previdenciario: string;
  status: string;
  data_abertura: string;
  data_prevista_aposentadoria: string | null;
  tempo_total_meses: number | null;
  tempo_servico_publico_meses: number | null;
  tempo_especial_meses: number | null;
  protocolo: string | null;
  responsavel_nome: string | null;
  observacoes: string | null;
};

type Vinculo = {
  id: number;
  empregador: string;
  regime: string | null;
  data_inicio: string;
  data_fim: string | null;
  tempo_reconhecido_meses: number | null;
};

type Requisito = {
  id: number;
  descricao: string;
  exigido: string | null;
  apurado: string | null;
  cumprido: boolean;
};

type Documento = {
  id: number;
  nome_arquivo: string;
  tipo_documento: string | null;
  arquivo_url: string;
};

export default function ProcessoPrevidenciarioDetalhePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [usuario] = useState(() => lerUsuarioPrevidencia());
  const [processo, setProcesso] = useState<Processo | null>(null);
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [requisitos, setRequisitos] = useState<Requisito[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id || !id) return;

    const [processoResp, vinculosResp, requisitosResp, documentosResp] =
      await Promise.all([
        supabase.from("previdencia_processos").select("*").eq("id", id).eq("municipio_id", usuario.municipio_id).single(),
        supabase.from("previdencia_vinculos").select("id,empregador,regime,data_inicio,data_fim,tempo_reconhecido_meses").eq("processo_id", id).eq("municipio_id", usuario.municipio_id).order("data_inicio"),
        supabase.from("previdencia_requisitos").select("id,descricao,exigido,apurado,cumprido").eq("processo_id", id).eq("municipio_id", usuario.municipio_id).order("id"),
        supabase.from("previdencia_documentos").select("id,nome_arquivo,tipo_documento,arquivo_url").eq("processo_id", id).eq("municipio_id", usuario.municipio_id).order("criado_em", { ascending: false }),
      ]);

    if (processoResp.error) setErro(processoResp.error.message);
    setProcesso((processoResp.data as Processo | null) || null);
    setVinculos((vinculosResp.data as Vinculo[] | null) || []);
    setRequisitos((requisitosResp.data as Requisito[] | null) || []);
    setDocumentos((documentosResp.data as Documento[] | null) || []);
    setCarregando(false);
  }, [id, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "previdencia_processos",
      registro_id: id,
      descricao: "Impressão de processo previdenciário.",
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
              <Link href="/sistema/previdencia-aposentadoria" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300 print:hidden">
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
                <p className="text-xs font-black uppercase text-cyan-300 print:text-black">{formatarTexto(processo.tipo_processo)}</p>
                <h1 className="mt-1 text-2xl font-black">{processo.guarda_nome}</h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Matrícula: {processo.matricula || "não informada"} • {formatarTexto(processo.status)} • {formatarTexto(processo.regime_previdenciario)}
                </p>
              </div>
            ) : null}
          </header>

          {erro ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">{erro}</div> : null}

          {processo ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card titulo="Abertura" valor={formatarData(processo.data_abertura)} icone={CalendarDays} />
                <Card titulo="Previsão" valor={formatarData(processo.data_prevista_aposentadoria)} icone={TimerReset} />
                <Card titulo="Tempo total" valor={formatarTempo(processo.tempo_total_meses)} icone={Landmark} />
                <Card titulo="Responsável" valor={processo.responsavel_nome || "—"} icone={UserRound} />
              </section>

              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card titulo="Serviço público" valor={formatarTempo(processo.tempo_servico_publico_meses)} icone={Landmark} />
                <Card titulo="Tempo especial" valor={formatarTempo(processo.tempo_especial_meses)} icone={Landmark} />
                <Card titulo="Protocolo" valor={processo.protocolo || "—"} icone={FileText} />
                <Card titulo="Regime" valor={formatarTexto(processo.regime_previdenciario)} icone={Landmark} />
              </section>

              <Bloco titulo="Observações" texto={processo.observacoes} />

              <section className="grid gap-5 xl:grid-cols-3">
                <Lista titulo="Vínculos e averbações">
                  {vinculos.map((item) => (
                    <article key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white">
                      <p className="font-black">{item.empregador}</p>
                      <p className="mt-1 text-xs text-slate-500 print:text-black">{formatarTexto(item.regime)} • {formatarData(item.data_inicio)} a {formatarData(item.data_fim)}</p>
                      <p className="mt-3 text-sm text-slate-400 print:text-black">{formatarTempo(item.tempo_reconhecido_meses)}</p>
                    </article>
                  ))}
                  {!vinculos.length ? <Vazio texto="Nenhum vínculo registrado." /> : null}
                </Lista>

                <Lista titulo="Requisitos">
                  {requisitos.map((item) => (
                    <article key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white">
                      <p className="font-black">{item.descricao}</p>
                      <p className="mt-2 text-sm text-slate-400 print:text-black">Exigido: {item.exigido || "—"}</p>
                      <p className="text-sm text-slate-400 print:text-black">Apurado: {item.apurado || "—"}</p>
                      <p className={`mt-2 text-xs font-black uppercase ${item.cumprido ? "text-emerald-300" : "text-amber-300"} print:text-black`}>
                        {item.cumprido ? "Cumprido" : "Pendente"}
                      </p>
                    </article>
                  ))}
                  {!requisitos.length ? <Vazio texto="Nenhum requisito registrado." /> : null}
                </Lista>

                <Lista titulo="Documentos">
                  {documentos.map((item) => (
                    <a key={item.id} href={item.arquivo_url} target="_blank" rel="noreferrer" className="block rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white">
                      <FileText className="h-5 w-5 text-cyan-300 print:text-black" />
                      <p className="mt-2 font-black">{item.nome_arquivo}</p>
                      <p className="mt-1 text-xs text-slate-500 print:text-black">{formatarTexto(item.tipo_documento)}</p>
                    </a>
                  ))}
                  {!documentos.length ? <Vazio texto="Nenhum documento anexado." /> : null}
                </Lista>
              </section>
            </>
          ) : null}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Card({ titulo, valor, icone: Icone }: { titulo: string; valor: string; icone: typeof CalendarDays }) {
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

function Lista({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <h2 className="font-black">{titulo}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Vazio({ texto }: { texto: string }) {
  return <p className="py-8 text-center text-slate-500">{texto}</p>;
}
