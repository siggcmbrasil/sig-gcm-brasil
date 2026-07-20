"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Calculator, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  formatarMoeda,
  lerUsuarioDimensionamento,
  podeGerenciarDimensionamento,
} from "@/lib/dimensionamentoEfetivo";
import { supabase } from "@/lib/supabase";

export default function NovoDimensionamentoPage() {
  const router = useRouter();
  const [usuario] = useState(() => lerUsuarioDimensionamento());
  const [titulo, setTitulo] = useState("");
  const [anoReferencia, setAnoReferencia] = useState(
    String(new Date().getFullYear())
  );
  const [cargo, setCargo] = useState("");
  const [setor, setSetor] = useState("");
  const [regiao, setRegiao] = useState("");
  const [turno, setTurno] = useState("");
  const [efetivoAtual, setEfetivoAtual] = useState("0");
  const [efetivoIdeal, setEfetivoIdeal] = useState("0");
  const [aposentadorias, setAposentadorias] = useState("0");
  const [afastamentos, setAfastamentos] = useState("0");
  const [crescimento, setCrescimento] = useState("0");
  const [contratacoes, setContratacoes] = useState("0");
  const [custoUnitario, setCustoUnitario] = useState("0");
  const [prioridade, setPrioridade] = useState("MODERADA");
  const [justificativa, setJustificativa] = useState("");
  const [cronograma, setCronograma] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const custoMensal =
    Math.max(0, Number(contratacoes || 0)) *
    Math.max(0, Number(custoUnitario || 0));
  const custoAnual = custoMensal * 12;

  async function salvar() {
    if (
      !usuario?.municipio_id ||
      !podeGerenciarDimensionamento(usuario.perfil)
    ) {
      setErro("Seu perfil não pode criar cenários de dimensionamento.");
      return;
    }

    if (!titulo.trim() || !cargo.trim()) {
      setErro("Informe o título e o cargo.");
      return;
    }

    setSalvando(true);
    setErro("");

    const { data, error } = await supabase
      .from("planejamento_dimensionamento_efetivo")
      .insert({
        municipio_id: usuario.municipio_id,
        titulo: titulo.trim(),
        ano_referencia: Number(anoReferencia),
        setor: setor.trim() || null,
        regiao: regiao.trim() || null,
        turno: turno.trim() || null,
        cargo: cargo.trim(),
        efetivo_atual: Math.max(0, Number(efetivoAtual || 0)),
        efetivo_ideal: Math.max(0, Number(efetivoIdeal || 0)),
        aposentadorias_previstas: Math.max(0, Number(aposentadorias || 0)),
        afastamentos_estimados: Math.max(0, Number(afastamentos || 0)),
        crescimento_demanda_percentual: Math.max(0, Number(crescimento || 0)),
        contratacoes_previstas: Math.max(0, Number(contratacoes || 0)),
        custo_unitario_mensal: Math.max(0, Number(custoUnitario || 0)),
        custo_total_mensal: custoMensal,
        custo_total_anual: custoAnual,
        prioridade,
        status: "EM_ANALISE",
        justificativa: justificativa.trim() || null,
        cronograma: cronograma.trim() || null,
        criado_por_id: String(usuario.id),
        criado_por_nome: usuario.nome,
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
      tabela: "planejamento_dimensionamento_efetivo",
      registro_id: data.id,
      descricao: `Cenário de dimensionamento criado: ${titulo.trim()}.`,
    });

    router.push("/sistema/dimensionamento-efetivo");
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-5xl space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link
              href="/sistema/dimensionamento-efetivo"
              className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="mt-4 text-2xl font-black">
              Novo cenário de dimensionamento
            </h1>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-4 rounded-2xl border border-slate-800 bg-[#061326] p-5 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Campo titulo="Título do cenário">
                <input
                  value={titulo}
                  onChange={(event) => setTitulo(event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
                />
              </Campo>
            </div>

            <Campo titulo="Ano de referência">
              <input
                type="number"
                value={anoReferencia}
                onChange={(event) => setAnoReferencia(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Cargo prioritário">
              <input
                value={cargo}
                onChange={(event) => setCargo(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Região">
              <input
                value={regiao}
                onChange={(event) => setRegiao(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Setor">
              <input
                value={setor}
                onChange={(event) => setSetor(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Turno">
              <select
                value={turno}
                onChange={(event) => setTurno(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                <option value="">Todos</option>
                <option value="DIURNO">Diurno</option>
                <option value="NOTURNO">Noturno</option>
                <option value="INTEGRAL">Integral</option>
              </select>
            </Campo>

            <Campo titulo="Efetivo atual">
              <input
                type="number"
                min="0"
                value={efetivoAtual}
                onChange={(event) => setEfetivoAtual(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Efetivo ideal">
              <input
                type="number"
                min="0"
                value={efetivoIdeal}
                onChange={(event) => setEfetivoIdeal(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Aposentadorias previstas">
              <input
                type="number"
                min="0"
                value={aposentadorias}
                onChange={(event) => setAposentadorias(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Afastamentos estimados">
              <input
                type="number"
                min="0"
                value={afastamentos}
                onChange={(event) => setAfastamentos(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Crescimento da demanda (%)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={crescimento}
                onChange={(event) => setCrescimento(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Contratações previstas">
              <input
                type="number"
                min="0"
                value={contratacoes}
                onChange={(event) => setContratacoes(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Custo mensal por servidor">
              <input
                type="number"
                min="0"
                step="0.01"
                value={custoUnitario}
                onChange={(event) => setCustoUnitario(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Prioridade">
              <select
                value={prioridade}
                onChange={(event) => setPrioridade(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                <option value="BAIXA">Baixa</option>
                <option value="MODERADA">Moderada</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </Campo>

            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4 lg:col-span-2">
              <div className="flex items-center gap-2 text-cyan-300">
                <Calculator className="h-5 w-5" />
                <p className="font-black">Impacto financeiro calculado</p>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Mensal: <strong className="text-white">{formatarMoeda(custoMensal)}</strong>
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Anual: <strong className="text-white">{formatarMoeda(custoAnual)}</strong>
              </p>
            </div>

            <div className="lg:col-span-3">
              <Campo titulo="Justificativa técnica">
                <textarea
                  value={justificativa}
                  onChange={(event) => setJustificativa(event.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4"
                />
              </Campo>
            </div>

            <div className="lg:col-span-3">
              <Campo titulo="Cronograma de concurso/convocação">
                <textarea
                  value={cronograma}
                  onChange={(event) => setCronograma(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4"
                />
              </Campo>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              disabled={salvando}
              onClick={() => void salvar()}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
            >
              {salvando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar cenário
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
