"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  HandHeart,
  Loader2,
  Printer,
  UserRound,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  formatarData,
  formatarTexto,
  lerUsuarioAssistenciaSocial,
} from "@/lib/assistenciaSocial";
import { supabase } from "@/lib/supabase";

type Atendimento = {
  id: number;
  guarda_nome: string;
  matricula: string | null;
  tipo_atendimento: string;
  prioridade: string;
  status: string;
  data_atendimento: string;
  proximo_retorno: string | null;
  resumo_demanda: string | null;
  encaminhamento_inicial: string | null;
  responsavel_nome: string | null;
  observacoes: string | null;
};

type Encaminhamento = {
  id: number;
  data_encaminhamento: string;
  destino: string;
  motivo: string | null;
  status: string;
};

type Beneficio = {
  id: number;
  tipo_beneficio: string;
  data_solicitacao: string;
  status: string;
  valor: number | null;
};

export default function AtendimentoSocialDetalhePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [usuario] = useState(() => lerUsuarioAssistenciaSocial());
  const [atendimento, setAtendimento] = useState<Atendimento | null>(null);
  const [encaminhamentos, setEncaminhamentos] = useState<Encaminhamento[]>([]);
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id || !id) return;

    const [atendimentoResp, encaminhamentosResp, beneficiosResp] =
      await Promise.all([
        supabase
          .from("assistencia_social_atendimentos")
          .select("*")
          .eq("id", id)
          .eq("municipio_id", usuario.municipio_id)
          .single(),
        supabase
          .from("assistencia_social_encaminhamentos")
          .select("id,data_encaminhamento,destino,motivo,status")
          .eq("atendimento_id", id)
          .eq("municipio_id", usuario.municipio_id)
          .order("data_encaminhamento", { ascending: false }),
        supabase
          .from("assistencia_social_beneficios")
          .select("id,tipo_beneficio,data_solicitacao,status,valor")
          .eq("atendimento_id", id)
          .eq("municipio_id", usuario.municipio_id)
          .order("data_solicitacao", { ascending: false }),
      ]);

    if (atendimentoResp.error) setErro(atendimentoResp.error.message);
    setAtendimento((atendimentoResp.data as Atendimento | null) || null);
    setEncaminhamentos(
      (encaminhamentosResp.data as Encaminhamento[] | null) || []
    );
    setBeneficios((beneficiosResp.data as Beneficio[] | null) || []);
    setCarregando(false);
  }, [id, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "assistencia_social_atendimentos",
      registro_id: id,
      descricao: "Impressão de atendimento social.",
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
                href="/sistema/assistencia-social"
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

            {atendimento ? (
              <div className="mt-5">
                <p className="text-xs font-black uppercase text-cyan-300 print:text-black">
                  {formatarTexto(atendimento.tipo_atendimento)}
                </p>
                <h1 className="mt-1 text-2xl font-black">
                  {atendimento.guarda_nome}
                </h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Matrícula: {atendimento.matricula || "não informada"} •{" "}
                  {formatarTexto(atendimento.status)}
                </p>
              </div>
            ) : null}
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">
              {erro}
            </div>
          ) : null}

          {atendimento ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card
                  titulo="Data"
                  valor={formatarData(atendimento.data_atendimento)}
                  icone={CalendarDays}
                />
                <Card
                  titulo="Retorno"
                  valor={formatarData(atendimento.proximo_retorno)}
                  icone={CalendarDays}
                />
                <Card
                  titulo="Prioridade"
                  valor={formatarTexto(atendimento.prioridade)}
                  icone={HandHeart}
                />
                <Card
                  titulo="Responsável"
                  valor={atendimento.responsavel_nome || "—"}
                  icone={UserRound}
                />
              </section>

              <section className="grid gap-5 xl:grid-cols-2">
                <Bloco
                  titulo="Resumo da demanda"
                  texto={atendimento.resumo_demanda}
                />
                <Bloco
                  titulo="Encaminhamento inicial"
                  texto={atendimento.encaminhamento_inicial}
                />
                <div className="xl:col-span-2">
                  <Bloco titulo="Observações" texto={atendimento.observacoes} />
                </div>
              </section>

              <section className="grid gap-5 xl:grid-cols-2">
                <Lista titulo="Encaminhamentos">
                  {encaminhamentos.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white"
                    >
                      <p className="font-black">{item.destino}</p>
                      <p className="mt-1 text-xs text-slate-500 print:text-black">
                        {formatarData(item.data_encaminhamento)} •{" "}
                        {formatarTexto(item.status)}
                      </p>
                      <p className="mt-3 text-sm text-slate-400 print:text-black">
                        {item.motivo || "Sem motivo informado."}
                      </p>
                    </article>
                  ))}
                  {!encaminhamentos.length ? (
                    <p className="py-8 text-center text-slate-500">
                      Nenhum encaminhamento registrado.
                    </p>
                  ) : null}
                </Lista>

                <Lista titulo="Benefícios">
                  {beneficios.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white"
                    >
                      <p className="font-black">
                        {formatarTexto(item.tipo_beneficio)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 print:text-black">
                        {formatarData(item.data_solicitacao)} •{" "}
                        {formatarTexto(item.status)}
                      </p>
                      <p className="mt-3 text-sm text-slate-400 print:text-black">
                        {item.valor !== null
                          ? `Valor: R$ ${Number(item.valor).toFixed(2)}`
                          : "Valor não informado."}
                      </p>
                    </article>
                  ))}
                  {!beneficios.length ? (
                    <p className="py-8 text-center text-slate-500">
                      Nenhum benefício registrado.
                    </p>
                  ) : null}
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

function Lista({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <h2 className="font-black">{titulo}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}
