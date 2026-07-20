"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  BellRing,
  CheckCircle2,
  FileCheck2,
  Loader2,
  Printer,
  Save,
  ShieldX,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  classificarSituacaoObrigacao,
  formatarTextoTreinamento,
  lerUsuarioTreinamento,
  podeGerenciarTreinamentos,
} from "@/lib/treinamentosObrigatorios";
import { supabase } from "@/lib/supabase";

type Situacao = {
  id: number;
  regra_id: number;
  guarda_id: number;
  guarda_nome: string;
  matricula: string | null;
  ultima_conclusao: string | null;
  validade: string | null;
  dispensado: boolean;
  motivo_dispensa: string | null;
  dispensa_inicio: string | null;
  dispensa_fim: string | null;
  convocado_em: string | null;
  convocacao_observacao: string | null;
};

type Regra = {
  id: number;
  curso_id: number;
  curso_nome: string;
  periodicidade_meses: number;
  dias_alerta: number;
  observacao: string | null;
};

export default function SituacaoTreinamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [usuario] = useState(() => lerUsuarioTreinamento());
  const [situacao, setSituacao] = useState<Situacao | null>(null);
  const [regra, setRegra] = useState<Regra | null>(null);
  const [motivoDispensa, setMotivoDispensa] = useState("");
  const [dispensaInicio, setDispensaInicio] = useState("");
  const [dispensaFim, setDispensaFim] = useState("");
  const [convocacao, setConvocacao] = useState("");
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarTreinamentos(usuario.perfil)
    : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) return;

    const { data, error } = await supabase
      .from("treinamentos_obrigatorios_situacoes")
      .select("*")
      .eq("id", Number(id))
      .eq("municipio_id", usuario.municipio_id)
      .single();

    if (error) {
      setErro(error.message);
      return;
    }

    const registro = data as Situacao;
    setSituacao(registro);
    setMotivoDispensa(registro.motivo_dispensa || "");
    setDispensaInicio(registro.dispensa_inicio || "");
    setDispensaFim(registro.dispensa_fim || "");
    setConvocacao(registro.convocacao_observacao || "");

    const regraResp = await supabase
      .from("treinamentos_obrigatorios_regras")
      .select("*")
      .eq("id", registro.regra_id)
      .single();

    if (!regraResp.error) setRegra(regraResp.data as Regra);
  }, [id, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function atualizar(
    campos: Record<string, unknown>,
    acao: string,
    descricao: string
  ) {
    if (!situacao || !usuario || !podeGerenciar) return;

    setProcessando(true);
    setErro("");

    const { error } = await supabase
      .from("treinamentos_obrigatorios_situacoes")
      .update({
        ...campos,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", situacao.id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      setErro(error.message);
      setProcessando(false);
      return;
    }

    await registrarAuditoria({
      modulo: "RH",
      acao,
      tabela: "treinamentos_obrigatorios_situacoes",
      registro_id: situacao.id,
      descricao,
    });

    await carregar();
    setProcessando(false);
  }

  async function dispensar() {
    if (!motivoDispensa.trim()) {
      setErro("Informe o motivo da dispensa.");
      return;
    }

    await atualizar(
      {
        dispensado: true,
        motivo_dispensa: motivoDispensa.trim(),
        dispensa_inicio: dispensaInicio || null,
        dispensa_fim: dispensaFim || null,
      },
      "DISPENSAR",
      `Dispensa registrada para ${situacao?.guarda_nome || ""}.`
    );
  }

  async function removerDispensa() {
    await atualizar(
      {
        dispensado: false,
        motivo_dispensa: null,
        dispensa_inicio: null,
        dispensa_fim: null,
      },
      "REMOVER_DISPENSA",
      `Dispensa removida de ${situacao?.guarda_nome || ""}.`
    );
  }

  async function convocar() {
    await atualizar(
      {
        convocado_em: new Date().toISOString(),
        convocacao_observacao: convocacao.trim() || null,
      },
      "CONVOCAR",
      `${situacao?.guarda_nome || ""} convocado para treinamento obrigatório.`
    );
  }

  if (!situacao || !regra) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020b1c] text-white">
        {erro ? erro : <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />}
      </div>
    );
  }

  const status = classificarSituacaoObrigacao(
    situacao.validade,
    situacao.dispensado,
    regra.dias_alerta
  );

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-5xl space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 print:border-black print:bg-white lg:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Link
                  href="/sistema/treinamentos-obrigatorios"
                  className="inline-flex items-center gap-2 text-sm font-black text-cyan-300 print:hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Link>
                <h1 className="mt-4 text-2xl font-black">{regra.curso_nome}</h1>
                <p className="mt-1 text-sm text-slate-400 print:text-black">
                  {situacao.guarda_nome} • {situacao.matricula || "Sem matrícula"}
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 self-start rounded-xl border border-cyan-400/25 px-4 py-3 font-black text-cyan-300 print:hidden"
              >
                <Printer className="h-4 w-4" />
                Imprimir/PDF
              </button>
            </div>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Resumo titulo="Situação" valor={formatarTextoTreinamento(status)} />
            <Resumo
              titulo="Periodicidade"
              valor={`${regra.periodicidade_meses} meses`}
            />
            <Resumo
              titulo="Última conclusão"
              valor={
                situacao.ultima_conclusao
                  ? new Date(`${situacao.ultima_conclusao}T00:00:00`).toLocaleDateString("pt-BR")
                  : "Nunca concluído"
              }
            />
            <Resumo
              titulo="Validade"
              valor={
                situacao.validade
                  ? new Date(`${situacao.validade}T00:00:00`).toLocaleDateString("pt-BR")
                  : "Pendente"
              }
            />
          </section>

          {regra.observacao ? (
            <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
              <h2 className="font-black">Observação da exigência</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-400 print:text-black">
                {regra.observacao}
              </p>
            </section>
          ) : null}

          {podeGerenciar ? (
            <section className="grid gap-4 lg:grid-cols-2 print:hidden">
              <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
                <h2 className="font-black">Convocação</h2>
                <textarea
                  value={convocacao}
                  onChange={(event) => setConvocacao(event.target.value)}
                  rows={4}
                  placeholder="Data, local, turma ou orientação..."
                  className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4"
                />
                <button
                  disabled={processando}
                  onClick={() => void convocar()}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
                >
                  <BellRing className="h-4 w-4" />
                  Registrar convocação
                </button>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
                <h2 className="font-black">Dispensa justificada</h2>
                <textarea
                  value={motivoDispensa}
                  onChange={(event) => setMotivoDispensa(event.target.value)}
                  rows={3}
                  placeholder="Motivo obrigatório"
                  className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4"
                />
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    type="date"
                    value={dispensaInicio}
                    onChange={(event) => setDispensaInicio(event.target.value)}
                    className="h-11 rounded-lg border border-slate-700 bg-slate-950/60 px-3"
                  />
                  <input
                    type="date"
                    value={dispensaFim}
                    onChange={(event) => setDispensaFim(event.target.value)}
                    className="h-11 rounded-lg border border-slate-700 bg-slate-950/60 px-3"
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    disabled={processando}
                    onClick={() => void dispensar()}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-400/25 px-5 py-3 font-black text-amber-300 disabled:opacity-50"
                  >
                    <FileCheck2 className="h-4 w-4" />
                    Registrar dispensa
                  </button>

                  {situacao.dispensado ? (
                    <button
                      disabled={processando}
                      onClick={() => void removerDispensa()}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-400/25 px-5 py-3 font-black text-rose-300 disabled:opacity-50"
                    >
                      <ShieldX className="h-4 w-4" />
                      Remover dispensa
                    </button>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
            <h2 className="font-black">Histórico atual</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Resumo
                titulo="Convocado em"
                valor={
                  situacao.convocado_em
                    ? new Date(situacao.convocado_em).toLocaleString("pt-BR")
                    : "Não convocado"
                }
              />
              <Resumo
                titulo="Dispensa"
                valor={
                  situacao.dispensado
                    ? situacao.motivo_dispensa || "Dispensa registrada"
                    : "Não dispensado"
                }
              />
            </div>
          </section>
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Resumo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <p className="text-xs font-black uppercase text-slate-500 print:text-black">{titulo}</p>
      <p className="mt-2 font-black">{valor}</p>
    </div>
  );
}
