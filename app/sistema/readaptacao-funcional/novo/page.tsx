"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  lerUsuarioReadaptacao,
  podeGerenciarReadaptacao,
} from "@/lib/readaptacaoFuncional";
import { supabase } from "@/lib/supabase";

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
};

export default function NovaReadaptacaoPage() {
  const router = useRouter();
  const [usuario] = useState(() => lerUsuarioReadaptacao());
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [guardaId, setGuardaId] = useState("");
  const [origem, setOrigem] = useState("MEDICA");
  const [tipo, setTipo] = useState("TEMPORARIA");
  const [prioridade, setPrioridade] = useState("NORMAL");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [limitacoes, setLimitacoes] = useState("");
  const [permitidas, setPermitidas] = useState("");
  const [proibidas, setProibidas] = useState("");
  const [setorDestino, setSetorDestino] = useState("");
  const [funcaoDestino, setFuncaoDestino] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarGuardas() {
      if (!usuario?.municipio_id) return;
      const { data } = await supabase
        .from("guardas")
        .select("id,nome,matricula")
        .eq("municipio_id", usuario.municipio_id)
        .order("nome");
      setGuardas((data as Guarda[] | null) || []);
    }
    void carregarGuardas();
  }, [usuario]);

  async function salvar() {
    if (!usuario?.municipio_id || !podeGerenciarReadaptacao(usuario.perfil)) {
      setErro("Seu perfil não pode abrir processos de readaptação.");
      return;
    }

    const guarda = guardas.find((item) => String(item.id) === guardaId);
    if (!guarda || !dataInicio) {
      setErro("Selecione o servidor e informe a data de início.");
      return;
    }

    setSalvando(true);
    setErro("");

    const { data, error } = await supabase
      .from("readaptacoes_funcionais")
      .insert({
        municipio_id: usuario.municipio_id,
        guarda_id: guarda.id,
        guarda_nome: guarda.nome,
        matricula: guarda.matricula,
        origem,
        tipo_readaptacao: tipo,
        prioridade,
        data_inicio: dataInicio,
        data_fim_prevista: dataFim || null,
        limitacoes_funcionais: limitacoes.trim() || null,
        atividades_permitidas: permitidas.trim() || null,
        atividades_proibidas: proibidas.trim() || null,
        setor_destino: setorDestino.trim() || null,
        funcao_destino: funcaoDestino.trim() || null,
        observacoes: observacoes.trim() || null,
        status: "ATIVO",
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
      tabela: "readaptacoes_funcionais",
      registro_id: data.id,
      descricao: `Processo de readaptação aberto para ${guarda.nome}.`,
    });

    router.push(`/sistema/readaptacao-funcional/${data.id}`);
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-5xl space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link href="/sistema/readaptacao-funcional" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="mt-4 text-2xl font-black">Novo processo de readaptação</h1>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">{erro}</div>
          ) : null}

          <section className="grid gap-4 rounded-2xl border border-slate-800 bg-[#061326] p-5 md:grid-cols-2">
            <Campo titulo="Servidor">
              <select value={guardaId} onChange={(e) => setGuardaId(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4">
                <option value="">Selecione</option>
                {guardas.map((guarda) => (
                  <option key={guarda.id} value={guarda.id}>
                    {guarda.nome} {guarda.matricula ? `— ${guarda.matricula}` : ""}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo titulo="Origem">
              <select value={origem} onChange={(e) => setOrigem(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4">
                <option value="MEDICA">Médica</option>
                <option value="ADMINISTRATIVA">Administrativa</option>
                <option value="ACIDENTE_TRABALHO">Acidente de trabalho</option>
                <option value="JUDICIAL">Judicial</option>
              </select>
            </Campo>

            <Campo titulo="Tipo">
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4">
                <option value="TEMPORARIA">Temporária</option>
                <option value="DEFINITIVA">Definitiva</option>
                <option value="REABILITACAO">Reabilitação</option>
                <option value="RETORNO_GRADUAL">Retorno gradual</option>
              </select>
            </Campo>

            <Campo titulo="Prioridade">
              <select value={prioridade} onChange={(e) => setPrioridade(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4">
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </Campo>

            <Campo titulo="Data de início">
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Fim previsto">
              <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Setor de destino">
              <input value={setorDestino} onChange={(e) => setSetorDestino(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Função de destino">
              <input value={funcaoDestino} onChange={(e) => setFuncaoDestino(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Limitações funcionais">
              <textarea value={limitacoes} onChange={(e) => setLimitacoes(e.target.value)} rows={5} className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4" />
            </Campo>

            <Campo titulo="Atividades permitidas">
              <textarea value={permitidas} onChange={(e) => setPermitidas(e.target.value)} rows={5} className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4" />
            </Campo>

            <Campo titulo="Atividades proibidas">
              <textarea value={proibidas} onChange={(e) => setProibidas(e.target.value)} rows={5} className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4" />
            </Campo>

            <Campo titulo="Observações">
              <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={5} className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4" />
            </Campo>
          </section>

          <div className="flex justify-end">
            <button disabled={salvando} onClick={() => void salvar()} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50">
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar processo
            </button>
          </div>
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Campo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-wider text-slate-400">{titulo}</span>
      {children}
    </label>
  );
}
