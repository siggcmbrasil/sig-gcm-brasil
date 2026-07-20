"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  LockKeyhole,
  PenLine,
  Printer,
  RefreshCw,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import { supabase } from "@/lib/supabase";
import {
  baixarCsvFolhaPonto,
  formatarDataFolhaPonto,
  formatarMinutosFolhaPonto,
  intervaloCompetencia,
  lerUsuarioFolhaPonto,
  LinhaFolhaPonto,
  nomeMesFolhaPonto,
  normalizarFolhaPonto,
  podeGerenciarFolhaPonto,
} from "@/lib/folhaPonto";

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
  cargo: string | null;
};

type Folha = {
  id: number;
  status: string;
  dias_trabalhados: number;
  faltas: number;
  atrasos: number;
  minutos_trabalhados: number;
  minutos_extras: number;
  minutos_debito: number;
  afastamentos: number;
  observacao: string | null;
  assinatura_guarda_nome: string | null;
  assinatura_guarda_em: string | null;
  assinatura_responsavel_nome: string | null;
  assinatura_responsavel_em: string | null;
};

type Ponto = {
  data: string;
  entrada_em: string | null;
  saida_em: string | null;
  minutos_trabalhados: number | null;
  minutos_atraso: number | null;
  minutos_extras: number | null;
  minutos_debito: number | null;
  situacao: string;
  observacao: string | null;
  justificativa_status: string | null;
};

export default function FolhaPontoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const query = useSearchParams();
  const guardaId = Number(params.id);
  const agora = new Date();
  const mes = Number(query.get("mes") || agora.getMonth() + 1);
  const ano = Number(query.get("ano") || agora.getFullYear());

  const [usuario] = useState(() => lerUsuarioFolhaPonto());
  const [guarda, setGuarda] = useState<Guarda | null>(null);
  const [folha, setFolha] = useState<Folha | null>(null);
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [afastamentos, setAfastamentos] = useState(0);
  const [observacao, setObservacao] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const gerencia = usuario ? podeGerenciarFolhaPonto(usuario.perfil) : false;
  const { inicio, fim } = intervaloCompetencia(mes, ano);

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id || !guardaId) return;

    setCarregando(true);
    setErro("");

    try {
      const [guardaResposta, folhaResposta, pontosResposta, afastamentosResposta] =
        await Promise.all([
          supabase
            .from("guardas")
            .select("id,nome,matricula,cargo")
            .eq("municipio_id", usuario.municipio_id)
            .eq("id", guardaId)
            .single(),
          supabase
            .from("folhas_ponto")
            .select("*")
            .eq("municipio_id", usuario.municipio_id)
            .eq("guarda_id", guardaId)
            .eq("mes", mes)
            .eq("ano", ano)
            .maybeSingle(),
          supabase
            .from("ponto_eletronico")
            .select("*")
            .eq("municipio_id", usuario.municipio_id)
            .eq("guarda_id", guardaId)
            .gte("data", inicio)
            .lte("data", fim)
            .order("data"),
          supabase
            .from("ferias_licencas")
            .select("id")
            .eq("municipio_id", usuario.municipio_id)
            .eq("guarda_id", guardaId)
            .lte("data_inicio", fim)
            .gte("data_fim", inicio)
            .in("status", ["APROVADO", "ATIVO"]),
        ]);

      const erroConsulta =
        guardaResposta.error ||
        folhaResposta.error ||
        pontosResposta.error;

      if (erroConsulta) throw erroConsulta;

      const guardaDados = guardaResposta.data as Guarda;
      if (
        !gerencia &&
        usuario.matricula &&
        guardaDados.matricula !== usuario.matricula
      ) {
        throw new Error("Acesso negado à folha de outro servidor.");
      }

      setGuarda(guardaDados);
      setFolha((folhaResposta.data as Folha | null) || null);
      setObservacao((folhaResposta.data as Folha | null)?.observacao || "");
      setPontos((pontosResposta.data as Ponto[] | null) || []);
      setAfastamentos(afastamentosResposta.data?.length || 0);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a folha."
      );
    } finally {
      setCarregando(false);
    }
  }, [ano, fim, gerencia, guardaId, inicio, mes, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const linhas = useMemo<LinhaFolhaPonto[]>(
    () =>
      pontos.map((item) => ({
        data: item.data,
        entrada: item.entrada_em
          ? new Date(item.entrada_em).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : null,
        saida: item.saida_em
          ? new Date(item.saida_em).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : null,
        trabalhado: Number(item.minutos_trabalhados || 0),
        atraso:
          normalizarFolhaPonto(item.justificativa_status) === "APROVADO"
            ? 0
            : Number(item.minutos_atraso || 0),
        extra: Number(item.minutos_extras || 0),
        debito:
          normalizarFolhaPonto(item.justificativa_status) === "APROVADO"
            ? 0
            : Number(item.minutos_debito || 0),
        situacao: item.situacao,
        observacao: item.observacao || "",
      })),
    [pontos]
  );

  const totais = useMemo(
    () => ({
      dias: linhas.filter((item) => item.trabalhado > 0).length,
      atrasos: linhas.filter((item) => item.atraso > 0).length,
      trabalhado: linhas.reduce((soma, item) => soma + item.trabalhado, 0),
      extras: linhas.reduce((soma, item) => soma + item.extra, 0),
      debito: linhas.reduce((soma, item) => soma + item.debito, 0),
      faltas: linhas.filter((item) => item.situacao === "FALTA").length,
    }),
    [linhas]
  );

  async function gerarOuAtualizar(status = folha?.status || "ABERTA") {
    if (!usuario?.municipio_id || !guarda) return;

    setSalvando(true);
    setErro("");

    try {
      const payload = {
        municipio_id: usuario.municipio_id,
        guarda_id: guarda.id,
        guarda_nome: guarda.nome,
        matricula: guarda.matricula,
        mes,
        ano,
        status,
        dias_trabalhados: totais.dias,
        faltas: totais.faltas,
        atrasos: totais.atrasos,
        minutos_trabalhados: totais.trabalhado,
        minutos_extras: totais.extras,
        minutos_debito: totais.debito,
        afastamentos,
        observacao: observacao.trim() || null,
        dados_snapshot: linhas,
        ...(status === "FECHADA"
          ? {
              fechado_por: Number(usuario.id),
              fechado_por_nome: usuario.nome,
              fechado_em: new Date().toISOString(),
              assinatura_responsavel_nome: usuario.nome,
              assinatura_responsavel_em: new Date().toISOString(),
            }
          : {}),
      };

      const { data, error } = await supabase
        .from("folhas_ponto")
        .upsert(payload, {
          onConflict: "municipio_id,guarda_id,ano,mes",
        })
        .select("id")
        .single();

      if (error) throw error;

      await supabase.from("folhas_ponto_historico").insert({
        municipio_id: usuario.municipio_id,
        folha_ponto_id: data.id,
        guarda_id: guarda.id,
        usuario_id: Number(usuario.id),
        usuario_nome: usuario.nome,
        acao: status === "FECHADA" ? "FECHAMENTO" : "GERACAO_ATUALIZACAO",
        descricao: `${nomeMesFolhaPonto(mes)}/${ano} — ${guarda.nome}.`,
      });

      await registrarAuditoria({
        modulo: "Folha de Ponto",
        acao: status === "FECHADA" ? "FECHAR" : "GERAR_ATUALIZAR",
        tabela: "folhas_ponto",
        registro_id: data.id,
        descricao: `Folha ${mes}/${ano} de ${guarda.nome}.`,
      });

      await carregar();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a folha."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function assinarComoGuarda() {
    if (!usuario?.municipio_id || !folha || !guarda) return;

    const { error } = await supabase
      .from("folhas_ponto")
      .update({
        assinatura_guarda_nome: usuario.nome,
        assinatura_guarda_em: new Date().toISOString(),
      })
      .eq("id", folha.id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      setErro(error.message);
      return;
    }

    await carregar();
  }

  if (carregando) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
      </main>
    );
  }

  if (!guarda) return null;

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 print:border-black print:bg-white lg:p-7">
            <button
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center gap-2 text-sm font-black text-slate-400 print:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300 print:text-black">
              Espelho de frequência
            </p>
            <h1 className="mt-1 text-2xl font-black">
              Folha de Ponto — {nomeMesFolhaPonto(mes)} de {ano}
            </h1>
            <p className="mt-2 text-sm text-slate-400 print:text-black">
              {guarda.nome} • {guarda.matricula || "Sem matrícula"} •{" "}
              {guarda.cargo || "Guarda Civil Municipal"}
            </p>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200 print:hidden">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <Resumo titulo="Dias" valor={String(totais.dias)} />
            <Resumo titulo="Atrasos" valor={String(totais.atrasos)} />
            <Resumo titulo="Faltas" valor={String(totais.faltas)} />
            <Resumo titulo="Trabalhado" valor={formatarMinutosFolhaPonto(totais.trabalhado)} />
            <Resumo titulo="Extras" valor={formatarMinutosFolhaPonto(totais.extras)} />
            <Resumo titulo="Débito" valor={formatarMinutosFolhaPonto(totais.debito)} />
          </section>

          <section className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#061326] print:border-black print:bg-white">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-700 text-xs uppercase text-slate-400 print:text-black">
                <tr>
                  {["Data", "Entrada", "Saída", "Trabalhado", "Atraso", "Extra", "Débito", "Situação"].map(
                    (item) => (
                      <th key={item} className="px-4 py-3">{item}</th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {linhas.map((item) => (
                  <tr key={item.data} className="border-b border-slate-800/80">
                    <td className="px-4 py-3 font-black">{formatarDataFolhaPonto(item.data)}</td>
                    <td className="px-4 py-3">{item.entrada || "--"}</td>
                    <td className="px-4 py-3">{item.saida || "--"}</td>
                    <td className="px-4 py-3">{formatarMinutosFolhaPonto(item.trabalhado)}</td>
                    <td className="px-4 py-3">{formatarMinutosFolhaPonto(item.atraso)}</td>
                    <td className="px-4 py-3">{formatarMinutosFolhaPonto(item.extra)}</td>
                    <td className="px-4 py-3">{formatarMinutosFolhaPonto(item.debito)}</td>
                    <td className="px-4 py-3">{item.situacao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
            <p className="text-sm font-black">
              Afastamentos no período: {afastamentos}
            </p>
            <textarea
              rows={4}
              value={observacao}
              disabled={!gerencia || folha?.status === "FECHADA"}
              onChange={(event) => setObservacao(event.target.value)}
              placeholder="Observações do fechamento mensal..."
              className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4 outline-none disabled:opacity-70 print:bg-white"
            />
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Assinatura
              titulo="Servidor"
              nome={folha?.assinatura_guarda_nome}
              data={folha?.assinatura_guarda_em}
            />
            <Assinatura
              titulo="Responsável pelo fechamento"
              nome={folha?.assinatura_responsavel_nome}
              data={folha?.assinatura_responsavel_em}
            />
          </section>

          <div className="flex flex-wrap justify-end gap-3 print:hidden">
            <button
              onClick={() => void carregar()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 font-black"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>

            <button
              onClick={() =>
                baixarCsvFolhaPonto(
                  `folha-ponto-${guarda.matricula || guarda.id}-${ano}-${mes}.csv`,
                  linhas
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 font-black"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 font-black"
            >
              <Printer className="h-4 w-4" />
              Imprimir/PDF
            </button>

            {!folha?.assinatura_guarda_em && folha ? (
              <button
                onClick={() => void assinarComoGuarda()}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 font-black text-cyan-300"
              >
                <PenLine className="h-4 w-4" />
                Assinar como servidor
              </button>
            ) : null}

            {gerencia && folha?.status !== "FECHADA" ? (
              <>
                <button
                  onClick={() => void gerarOuAtualizar("ABERTA")}
                  disabled={salvando}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 font-black text-cyan-300"
                >
                  <FileText className="h-4 w-4" />
                  Gerar/Atualizar
                </button>
                <button
                  onClick={() => void gerarOuAtualizar("FECHADA")}
                  disabled={salvando}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 font-black text-slate-950"
                >
                  {salvando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LockKeyhole className="h-4 w-4" />
                  )}
                  Fechar competência
                </button>
              </>
            ) : null}
          </div>
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Resumo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#061326] p-4 print:border-black print:bg-white">
      <p className="text-[10px] font-black uppercase text-slate-500 print:text-black">{titulo}</p>
      <p className="mt-1 font-black">{valor}</p>
    </div>
  );
}

function Assinatura({
  titulo,
  nome,
  data,
}: {
  titulo: string;
  nome?: string | null;
  data?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 text-center print:border-black print:bg-white">
      <div className="mx-auto mt-10 w-4/5 border-t border-slate-500" />
      <p className="mt-2 font-black">{nome || titulo}</p>
      <p className="text-xs text-slate-500">
        {data ? new Date(data).toLocaleString("pt-BR") : "Assinatura pendente"}
      </p>
    </div>
  );
}
