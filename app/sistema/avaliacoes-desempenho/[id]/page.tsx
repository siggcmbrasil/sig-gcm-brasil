"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Printer,
  Save,
  ShieldCheck,
  Signature,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  CriterioAvaliacao,
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
  criterios: CriterioAvaliacao[];
  media_final: number;
  conceito: string;
  observacoes_gerais: string | null;
  plano_melhoria: string | null;
  status: string;
  avaliador_nome: string | null;
  avaliador_assinatura_em: string | null;
  guarda_ciencia_em: string | null;
  guarda_ciencia_nome: string | null;
  criado_em: string;
};

export default function AvaliacaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [usuario] = useState(() => lerUsuarioAvaliacao());
  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarAvaliacoes(usuario.perfil)
    : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) return;
    setCarregando(true);
    const { data, error } = await supabase
      .from("avaliacoes_desempenho")
      .select("*")
      .eq("id", Number(id))
      .eq("municipio_id", usuario.municipio_id)
      .single();

    if (error) setErro(error.message);
    else setAvaliacao(data as Avaliacao);
    setCarregando(false);
  }, [id, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function atualizar(
    campos: Partial<Avaliacao>,
    acao: string,
    descricao: string
  ) {
    if (!avaliacao || !usuario) return;
    setProcessando(true);
    setErro("");

    const { error } = await supabase
      .from("avaliacoes_desempenho")
      .update({ ...campos, atualizado_em: new Date().toISOString() })
      .eq("id", avaliacao.id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      setErro(error.message);
      setProcessando(false);
      return;
    }

    await registrarAuditoria({
      modulo: "RH",
      acao,
      tabela: "avaliacoes_desempenho",
      registro_id: avaliacao.id,
      descricao,
    });

    await carregar();
    setProcessando(false);
  }

  async function assinarAvaliador() {
    await atualizar(
      {
        avaliador_assinatura_em: new Date().toISOString(),
        status: "AGUARDANDO_CIENCIA",
      },
      "ASSINAR_AVALIADOR",
      `Avaliação de ${avaliacao?.guarda_nome || ""} assinada pelo avaliador.`
    );
  }

  async function registrarCiencia() {
    if (!usuario) return;
    await atualizar(
      {
        guarda_ciencia_em: new Date().toISOString(),
        guarda_ciencia_nome: usuario.nome,
        status: "CIENTE",
      },
      "REGISTRAR_CIENCIA",
      `Ciência registrada na avaliação de ${avaliacao?.guarda_nome || ""}.`
    );
  }

  async function concluir() {
    await atualizar(
      { status: "CONCLUIDA" },
      "CONCLUIR",
      `Avaliação de ${avaliacao?.guarda_nome || ""} concluída.`
    );
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020b1c]">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
      </div>
    );
  }

  if (!avaliacao) {
    return (
      <div className="min-h-screen bg-[#020b1c] p-8 text-white">
        Avaliação não encontrada.
      </div>
    );
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-5xl space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 print:border-black print:bg-white lg:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Link
                  href="/sistema/avaliacoes-desempenho"
                  className="inline-flex items-center gap-2 text-sm font-black text-cyan-300 print:hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Link>
                <h1 className="mt-4 text-2xl font-black">{avaliacao.guarda_nome}</h1>
                <p className="mt-1 text-sm text-slate-400 print:text-black">
                  {avaliacao.matricula || "Sem matrícula"} •{" "}
                  {formatarConceito(avaliacao.periodo_tipo)} •{" "}
                  {avaliacao.periodo_referencia}
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
            <Resumo titulo="Média final" valor={Number(avaliacao.media_final || 0).toFixed(2)} />
            <Resumo titulo="Conceito" valor={formatarConceito(avaliacao.conceito)} />
            <Resumo titulo="Status" valor={formatarConceito(avaliacao.status)} />
            <Resumo titulo="Avaliador" valor={avaliacao.avaliador_nome || "Não informado"} />
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
            <h2 className="text-lg font-black">Critérios e notas</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-slate-700 text-xs uppercase text-slate-400 print:text-black">
                  <tr>
                    <th className="px-3 py-3">Critério</th>
                    <th className="px-3 py-3">Peso</th>
                    <th className="px-3 py-3">Nota</th>
                    <th className="px-3 py-3">Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {(avaliacao.criterios || []).map((item) => (
                    <tr key={item.chave} className="border-b border-slate-800/70">
                      <td className="px-3 py-3 font-black">{item.nome}</td>
                      <td className="px-3 py-3">{Number(item.peso || 0).toFixed(1)}</td>
                      <td className="px-3 py-3 text-lg font-black text-cyan-300 print:text-black">
                        {Number(item.nota || 0).toFixed(1)}
                      </td>
                      <td className="px-3 py-3">{item.observacao || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Texto titulo="Observações gerais" valor={avaliacao.observacoes_gerais} />
            <Texto titulo="Plano de melhoria" valor={avaliacao.plano_melhoria} />
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
            <h2 className="font-black">Assinaturas e ciência</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Assinatura
                titulo="Avaliador"
                nome={avaliacao.avaliador_nome || "Não informado"}
                data={avaliacao.avaliador_assinatura_em}
              />
              <Assinatura
                titulo="Ciência do guarda"
                nome={avaliacao.guarda_ciencia_nome || avaliacao.guarda_nome}
                data={avaliacao.guarda_ciencia_em}
              />
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-3 print:hidden">

            {podeGerenciar ? (
              <Link
                href={`/sistema/pdi/novo?avaliacao_id=${avaliacao.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-5 py-3 font-black text-cyan-300"
              >
                Criar PDI desta avaliação
              </Link>
            ) : null}
            {podeGerenciar && !avaliacao.avaliador_assinatura_em ? (
              <button
                disabled={processando}
                onClick={() => void assinarAvaliador()}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-5 py-3 font-black text-cyan-300 disabled:opacity-50"
              >
                <Signature className="h-4 w-4" />
                Assinar como avaliador
              </button>
            ) : null}
            {!avaliacao.guarda_ciencia_em &&
            avaliacao.status === "AGUARDANDO_CIENCIA" ? (
              <button
                disabled={processando}
                onClick={() => void registrarCiencia()}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Registrar ciência
              </button>
            ) : null}
            {podeGerenciar && avaliacao.status === "CIENTE" ? (
              <button
                disabled={processando}
                onClick={() => void concluir()}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                Concluir avaliação
              </button>
            ) : null}
          </div>
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

function Texto({ titulo, valor }: { titulo: string; valor: string | null }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <h2 className="font-black">{titulo}</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-400 print:text-black">
        {valor || "Nenhuma informação registrada."}
      </p>
    </div>
  );
}

function Assinatura({
  titulo,
  nome,
  data,
}: {
  titulo: string;
  nome: string;
  data: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-700 p-4 print:border-black">
      <p className="text-xs font-black uppercase text-slate-500 print:text-black">{titulo}</p>
      <p className="mt-3 font-black">{nome}</p>
      <p className="mt-1 text-xs text-slate-500 print:text-black">
        {data ? new Date(data).toLocaleString("pt-BR") : "Assinatura pendente"}
      </p>
    </div>
  );
}
