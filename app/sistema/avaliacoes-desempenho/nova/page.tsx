"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Save, Star } from "lucide-react";
import { useRouter } from "next/navigation";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  calcularMedia,
  conceitoDaMedia,
  CRITERIOS_PADRAO,
  CriterioAvaliacao,
  formatarConceito,
  lerUsuarioAvaliacao,
  podeGerenciarAvaliacoes,
} from "@/lib/avaliacaoDesempenho";
import { supabase } from "@/lib/supabase";

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
};

export default function NovaAvaliacaoPage() {
  const router = useRouter();
  const [usuario] = useState(() => lerUsuarioAvaliacao());
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [guardaId, setGuardaId] = useState("");
  const [periodoTipo, setPeriodoTipo] = useState("MENSAL");
  const [periodoReferencia, setPeriodoReferencia] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [tipoAvaliacao, setTipoAvaliacao] = useState("AVALIACAO_COMANDO");
  const [observacoes, setObservacoes] = useState("");
  const [planoMelhoria, setPlanoMelhoria] = useState("");
  const [criterios, setCriterios] = useState<CriterioAvaliacao[]>(
    CRITERIOS_PADRAO.map((item) => ({ ...item, nota: 7, observacao: "" }))
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarAvaliacoes(usuario.perfil)
    : false;
  const media = useMemo(() => calcularMedia(criterios), [criterios]);
  const conceito = conceitoDaMedia(media);

  useEffect(() => {
    async function carregarGuardas() {
      if (!usuario?.municipio_id) return;
      const { data, error } = await supabase
        .from("guardas")
        .select("id,nome,matricula")
        .eq("municipio_id", usuario.municipio_id)
        .order("nome");

      if (!error) setGuardas((data as Guarda[] | null) || []);
    }

    void carregarGuardas();
  }, [usuario]);

  function alterarCriterio(
    indice: number,
    campo: "nota" | "peso" | "observacao",
    valor: string
  ) {
    setCriterios((atual) =>
      atual.map((item, itemIndice) =>
        itemIndice === indice
          ? {
              ...item,
              [campo]:
                campo === "observacao"
                  ? valor
                  : Math.max(0, Number(valor || 0)),
            }
          : item
      )
    );
  }

  async function salvar(status: "RASCUNHO" | "AGUARDANDO_CIENCIA") {
    if (!usuario?.municipio_id || !usuario.id) {
      setErro("Sessão inválida.");
      return;
    }

    if (!podeGerenciar) {
      setErro("Seu perfil não pode criar avaliações.");
      return;
    }

    const guarda = guardas.find((item) => String(item.id) === guardaId);
    if (!guarda) {
      setErro("Selecione o guarda avaliado.");
      return;
    }

    if (!periodoReferencia) {
      setErro("Informe o período de referência.");
      return;
    }

    setSalvando(true);
    setErro("");

    const { data, error } = await supabase
      .from("avaliacoes_desempenho")
      .insert({
        municipio_id: usuario.municipio_id,
        guarda_id: guarda.id,
        guarda_nome: guarda.nome,
        matricula: guarda.matricula,
        periodo_tipo: periodoTipo,
        periodo_referencia: periodoReferencia,
        tipo_avaliacao: tipoAvaliacao,
        criterios,
        media_final: media,
        conceito,
        observacoes_gerais: observacoes || null,
        plano_melhoria: planoMelhoria || null,
        status,
        avaliador_id: String(usuario.id),
        avaliador_nome: usuario.nome,
      })
      .select("id")
      .single();

    if (error) {
      setErro(error.message);
      setSalvando(false);
      return;
    }

    await registrarAuditoria({
      modulo: "RH",
      acao: "CRIAR",
      tabela: "avaliacoes_desempenho",
      registro_id: data.id,
      descricao: `Avaliação funcional criada para ${guarda.nome}.`,
      detalhes: { status, media, conceito, periodoReferencia },
    });

    router.push(`/sistema/avaliacoes-desempenho/${data.id}`);
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-5xl space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link
              href="/sistema/avaliacoes-desempenho"
              className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="mt-4 text-2xl font-black">Nova avaliação funcional</h1>
            <p className="mt-2 text-sm text-slate-400">
              Atribua notas de 0 a 10 e ajuste os pesos quando necessário.
            </p>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-4 rounded-2xl border border-slate-800 bg-[#061326] p-5 md:grid-cols-2">
            <Campo titulo="Guarda avaliado">
              <select
                value={guardaId}
                onChange={(event) => setGuardaId(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                <option value="">Selecione...</option>
                {guardas.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome} — {item.matricula || "sem matrícula"}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo titulo="Tipo de avaliação">
              <select
                value={tipoAvaliacao}
                onChange={(event) => setTipoAvaliacao(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                <option value="AVALIACAO_COMANDO">Avaliação do comando</option>
                <option value="AUTOAVALIACAO">Autoavaliação</option>
                <option value="AVALIACAO_SUPERVISOR">Avaliação do supervisor</option>
              </select>
            </Campo>

            <Campo titulo="Periodicidade">
              <select
                value={periodoTipo}
                onChange={(event) => setPeriodoTipo(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                <option value="MENSAL">Mensal</option>
                <option value="TRIMESTRAL">Trimestral</option>
                <option value="SEMESTRAL">Semestral</option>
                <option value="ANUAL">Anual</option>
              </select>
            </Campo>

            <Campo titulo="Período de referência">
              <input
                value={periodoReferencia}
                onChange={(event) => setPeriodoReferencia(event.target.value)}
                placeholder="Ex.: 2026-07 ou 2026/2"
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black">Critérios de avaliação</h2>
                <p className="text-sm text-slate-400">
                  A média final é calculada automaticamente conforme os pesos.
                </p>
              </div>
              <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-center">
                <p className="text-xs font-black uppercase text-cyan-300">Resultado</p>
                <p className="text-2xl font-black">{media.toFixed(2)}</p>
                <p className="text-xs text-slate-400">{formatarConceito(conceito)}</p>
              </div>
            </div>

            <div className="space-y-3">
              {criterios.map((item, indice) => (
                <div
                  key={item.chave}
                  className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/30 p-4 md:grid-cols-[1fr_110px_110px] lg:grid-cols-[220px_1fr_110px_110px]"
                >
                  <div>
                    <p className="font-black">{item.nome}</p>
                    <p className="text-xs text-slate-500">Nota de 0 a 10</p>
                  </div>
                  <input
                    value={item.observacao || ""}
                    onChange={(event) =>
                      alterarCriterio(indice, "observacao", event.target.value)
                    }
                    placeholder="Observação do critério..."
                    className="h-11 rounded-lg border border-slate-700 bg-slate-950/60 px-3"
                  />
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={item.nota}
                    onChange={(event) =>
                      alterarCriterio(indice, "nota", event.target.value)
                    }
                    className="h-11 rounded-lg border border-slate-700 bg-slate-950/60 px-3"
                  />
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={item.peso}
                    onChange={(event) =>
                      alterarCriterio(indice, "peso", event.target.value)
                    }
                    className="h-11 rounded-lg border border-slate-700 bg-slate-950/60 px-3"
                    title="Peso"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 rounded-2xl border border-slate-800 bg-[#061326] p-5 md:grid-cols-2">
            <Campo titulo="Observações gerais">
              <textarea
                value={observacoes}
                onChange={(event) => setObservacoes(event.target.value)}
                rows={6}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4"
              />
            </Campo>
            <Campo titulo="Plano de melhoria">
              <textarea
                value={planoMelhoria}
                onChange={(event) => setPlanoMelhoria(event.target.value)}
                rows={6}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4"
              />
            </Campo>
          </section>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              disabled={salvando}
              onClick={() => void salvar("RASCUNHO")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 font-black disabled:opacity-50"
            >
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar rascunho
            </button>
            <button
              disabled={salvando}
              onClick={() => void salvar("AGUARDANDO_CIENCIA")}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
            >
              <Star className="h-4 w-4" />
              Finalizar e enviar para ciência
            </button>
          </div>
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Campo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-wider text-slate-400">
        {titulo}
      </span>
      {children}
    </label>
  );
}
