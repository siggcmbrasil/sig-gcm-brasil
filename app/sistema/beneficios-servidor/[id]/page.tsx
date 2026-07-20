"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeDollarSign,
  CalendarDays,
  FileText,
  Loader2,
  Printer,
  UserRound,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  formatarData,
  formatarMoeda,
  formatarTexto,
  lerUsuarioBeneficios,
} from "@/lib/beneficiosServidor";
import { supabase } from "@/lib/supabase";

type Beneficio = {
  id: number;
  guarda_nome: string;
  matricula: string | null;
  tipo_beneficio: string;
  status: string;
  data_solicitacao: string;
  inicio_vigencia: string | null;
  fim_vigencia: string | null;
  valor_mensal: number | null;
  responsavel_nome: string | null;
  observacoes: string | null;
};

type Pagamento = {
  id: number;
  competencia: string;
  data_pagamento: string | null;
  valor: number;
  status: string;
};

type Documento = {
  id: number;
  nome_arquivo: string;
  tipo_documento: string | null;
  arquivo_url: string;
};

type Historico = {
  id: number;
  acao: string;
  descricao: string | null;
  criado_em: string;
  usuario_nome: string | null;
};

export default function BeneficioServidorDetalhePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [usuario] = useState(() => lerUsuarioBeneficios());
  const [beneficio, setBeneficio] = useState<Beneficio | null>(null);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id || !id) return;

    const [beneficioResp, pagamentosResp, documentosResp, historicoResp] =
      await Promise.all([
        supabase
          .from("beneficios_servidor")
          .select("*")
          .eq("id", id)
          .eq("municipio_id", usuario.municipio_id)
          .single(),
        supabase
          .from("beneficios_servidor_pagamentos")
          .select("id,competencia,data_pagamento,valor,status")
          .eq("beneficio_id", id)
          .eq("municipio_id", usuario.municipio_id)
          .order("competencia", { ascending: false }),
        supabase
          .from("beneficios_servidor_documentos")
          .select("id,nome_arquivo,tipo_documento,arquivo_url")
          .eq("beneficio_id", id)
          .eq("municipio_id", usuario.municipio_id)
          .order("criado_em", { ascending: false }),
        supabase
          .from("beneficios_servidor_historico")
          .select("id,acao,descricao,criado_em,usuario_nome")
          .eq("beneficio_id", id)
          .eq("municipio_id", usuario.municipio_id)
          .order("criado_em", { ascending: false }),
      ]);

    if (beneficioResp.error) setErro(beneficioResp.error.message);
    setBeneficio((beneficioResp.data as Beneficio | null) || null);
    setPagamentos((pagamentosResp.data as Pagamento[] | null) || []);
    setDocumentos((documentosResp.data as Documento[] | null) || []);
    setHistorico((historicoResp.data as Historico[] | null) || []);
    setCarregando(false);
  }, [id, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "beneficios_servidor",
      registro_id: id,
      descricao: "Impressão de benefício do servidor.",
    });
    window.print();
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020b1c]">
        <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
      </div>
    );
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 print:border-black print:bg-white lg:p-7">
            <div className="flex items-center justify-between gap-4">
              <Link
                href="/sistema/beneficios-servidor"
                className="inline-flex items-center gap-2 text-sm font-black text-cyan-300 print:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
              <button
                onClick={() => void imprimir()}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-4 py-3 text-sm font-black text-cyan-300 print:hidden"
              >
                <Printer className="h-4 w-4" />
                Imprimir/PDF
              </button>
            </div>

            {beneficio ? (
              <div className="mt-5">
                <p className="text-xs font-black uppercase text-cyan-300 print:text-black">
                  {formatarTexto(beneficio.tipo_beneficio)}
                </p>
                <h1 className="mt-1 text-2xl font-black">{beneficio.guarda_nome}</h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Matrícula: {beneficio.matricula || "não informada"} •{" "}
                  {formatarTexto(beneficio.status)}
                </p>
              </div>
            ) : null}
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">
              {erro}
            </div>
          ) : null}

          {beneficio ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card titulo="Solicitação" valor={formatarData(beneficio.data_solicitacao)} icone={CalendarDays} />
                <Card titulo="Vigência" valor={`${formatarData(beneficio.inicio_vigencia)} a ${formatarData(beneficio.fim_vigencia)}`} icone={CalendarDays} />
                <Card titulo="Valor mensal" valor={formatarMoeda(beneficio.valor_mensal)} icone={BadgeDollarSign} />
                <Card titulo="Responsável" valor={beneficio.responsavel_nome || "—"} icone={UserRound} />
              </section>

              <Bloco titulo="Observações" texto={beneficio.observacoes} />

              <section className="grid gap-5 xl:grid-cols-3">
                <Lista titulo="Pagamentos">
                  {pagamentos.map((item) => (
                    <article key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white">
                      <p className="font-black">{item.competencia}</p>
                      <p className="mt-1 text-xs text-slate-500 print:text-black">
                        {formatarTexto(item.status)} • {formatarData(item.data_pagamento)}
                      </p>
                      <p className="mt-3 text-sm font-black">{formatarMoeda(item.valor)}</p>
                    </article>
                  ))}
                  {!pagamentos.length ? <Vazio texto="Nenhum pagamento registrado." /> : null}
                </Lista>

                <Lista titulo="Documentos">
                  {documentos.map((item) => (
                    <a
                      key={item.id}
                      href={item.arquivo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white"
                    >
                      <FileText className="h-5 w-5 text-cyan-300 print:text-black" />
                      <p className="mt-2 font-black">{item.nome_arquivo}</p>
                      <p className="mt-1 text-xs text-slate-500 print:text-black">
                        {formatarTexto(item.tipo_documento)}
                      </p>
                    </a>
                  ))}
                  {!documentos.length ? <Vazio texto="Nenhum documento anexado." /> : null}
                </Lista>

                <Lista titulo="Histórico">
                  {historico.map((item) => (
                    <article key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white">
                      <p className="font-black">{formatarTexto(item.acao)}</p>
                      <p className="mt-1 text-xs text-slate-500 print:text-black">
                        {new Date(item.criado_em).toLocaleString("pt-BR")} • {item.usuario_nome || "Sistema"}
                      </p>
                      <p className="mt-3 text-sm text-slate-400 print:text-black">
                        {item.descricao || "Sem descrição."}
                      </p>
                    </article>
                  ))}
                  {!historico.length ? <Vazio texto="Nenhuma movimentação registrada." /> : null}
                </Lista>
              </section>
            </>
          ) : null}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Card({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: string;
  icone: typeof CalendarDays;
}) {
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
      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-400 print:text-black">
        {texto || "Não informado."}
      </p>
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
