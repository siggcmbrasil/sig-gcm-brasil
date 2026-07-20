"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  HardHat,
  Loader2,
  Printer,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  formatarDataSeguranca,
  formatarSeguranca,
  lerUsuarioSeguranca,
} from "@/lib/segurancaTrabalho";
import { supabase } from "@/lib/supabase";

type Risco = {
  id: number;
  titulo: string;
  categoria: string;
  local_setor: string | null;
  fonte_risco: string | null;
  descricao: string | null;
  probabilidade: number;
  severidade: number;
  nivel_risco: string;
  medidas_existentes: string | null;
  medidas_necessarias: string | null;
  responsavel_nome: string | null;
  prazo_adequacao: string | null;
  status: string;
};

type Acao = {
  id: number;
  titulo: string;
  responsavel_nome: string | null;
  prazo: string | null;
  prioridade: string;
  percentual_conclusao: number;
  status: string;
};

export default function RiscoOcupacionalDetalhePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [usuario] = useState(() => lerUsuarioSeguranca());
  const [risco, setRisco] = useState<Risco | null>(null);
  const [acoes, setAcoes] = useState<Acao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id || !id) return;

    const [riscoResp, acoesResp] = await Promise.all([
      supabase
        .from("seguranca_trabalho_riscos")
        .select("*")
        .eq("id", id)
        .eq("municipio_id", usuario.municipio_id)
        .single(),
      supabase
        .from("seguranca_trabalho_planos_acao")
        .select(
          "id,titulo,responsavel_nome,prazo,prioridade,percentual_conclusao,status"
        )
        .eq("risco_id", id)
        .eq("municipio_id", usuario.municipio_id)
        .order("prazo", { ascending: true, nullsFirst: false }),
    ]);

    if (riscoResp.error) setErro(riscoResp.error.message);
    setRisco((riscoResp.data as Risco | null) || null);
    setAcoes((acoesResp.data as Acao[] | null) || []);
    setCarregando(false);
  }, [id, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "seguranca_trabalho_riscos",
      registro_id: id,
      descricao: "Impressão do risco ocupacional e plano de ação.",
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
                href="/sistema/seguranca-trabalho"
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

            {risco ? (
              <div className="mt-5">
                <p className="text-xs font-black uppercase text-cyan-300 print:text-black">
                  {formatarSeguranca(risco.categoria)}
                </p>
                <h1 className="mt-1 text-2xl font-black">{risco.titulo}</h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  {risco.local_setor || "Local não informado"} •{" "}
                  {formatarSeguranca(risco.status)}
                </p>
              </div>
            ) : null}
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">
              {erro}
            </div>
          ) : null}

          {risco ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card
                  titulo="Nível"
                  valor={formatarSeguranca(risco.nivel_risco)}
                  icone={TriangleAlert}
                />
                <Card
                  titulo="Probabilidade"
                  valor={String(risco.probabilidade)}
                  icone={HardHat}
                />
                <Card
                  titulo="Severidade"
                  valor={String(risco.severidade)}
                  icone={ShieldCheck}
                />
                <Card
                  titulo="Prazo"
                  valor={formatarDataSeguranca(risco.prazo_adequacao)}
                  icone={CalendarDays}
                />
              </section>

              <section className="grid gap-5 xl:grid-cols-2">
                <Bloco titulo="Descrição" texto={risco.descricao} />
                <Bloco titulo="Fonte do risco" texto={risco.fonte_risco} />
                <Bloco titulo="Medidas existentes" texto={risco.medidas_existentes} />
                <Bloco titulo="Medidas necessárias" texto={risco.medidas_necessarias} />
              </section>

              <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="h-5 w-5 text-cyan-300 print:text-black" />
                  <h2 className="font-black">Plano de ação</h2>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {acoes.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black">{item.titulo}</p>
                          <p className="mt-1 text-xs text-slate-500 print:text-black">
                            Responsável: {item.responsavel_nome || "não definido"} • Prazo:{" "}
                            {formatarDataSeguranca(item.prazo)}
                          </p>
                        </div>
                        <span className="text-sm font-black text-cyan-300 print:text-black">
                          {item.percentual_conclusao}%
                        </span>
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900 print:border print:border-black">
                        <div
                          className="h-full bg-cyan-300 print:bg-black"
                          style={{ width: `${item.percentual_conclusao}%` }}
                        />
                      </div>
                    </article>
                  ))}

                  {!acoes.length ? (
                    <p className="py-10 text-center text-slate-500 lg:col-span-2">
                      Nenhuma ação cadastrada.
                    </p>
                  ) : null}
                </div>
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
  icone: typeof HardHat;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <Icone className="h-5 w-5 text-cyan-300 print:text-black" />
      <p className="mt-3 text-[10px] font-black uppercase text-slate-500 print:text-black">
        {titulo}
      </p>
      <p className="mt-1 font-black">{valor}</p>
    </div>
  );
}

function Bloco({
  titulo,
  texto,
}: {
  titulo: string;
  texto?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <h2 className="font-black">{titulo}</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-400 print:text-black">
        {texto || "Não informado."}
      </p>
    </div>
  );
}
