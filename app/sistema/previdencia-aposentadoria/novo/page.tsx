"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  lerUsuarioPrevidencia,
  podeGerenciarPrevidencia,
} from "@/lib/previdenciaAposentadoria";
import { supabase } from "@/lib/supabase";

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
};

export default function NovoProcessoPrevidenciarioPage() {
  const router = useRouter();
  const [usuario] = useState(() => lerUsuarioPrevidencia());
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [guardaId, setGuardaId] = useState("");
  const [tipo, setTipo] = useState("SIMULACAO_APOSENTADORIA");
  const [regime, setRegime] = useState("RPPS");
  const [dataAbertura, setDataAbertura] = useState("");
  const [dataPrevisao, setDataPrevisao] = useState("");
  const [tempoTotalMeses, setTempoTotalMeses] = useState("");
  const [tempoPublicoMeses, setTempoPublicoMeses] = useState("");
  const [tempoEspecialMeses, setTempoEspecialMeses] = useState("");
  const [protocolo, setProtocolo] = useState("");
  const [responsavel, setResponsavel] = useState("");
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
    if (!usuario?.municipio_id || !podeGerenciarPrevidencia(usuario.perfil)) {
      setErro("Seu perfil não pode abrir processos previdenciários.");
      return;
    }

    const guarda = guardas.find((item) => String(item.id) === guardaId);
    if (!guarda || !dataAbertura) {
      setErro("Selecione o servidor e informe a data de abertura.");
      return;
    }

    setSalvando(true);
    setErro("");

    const { data, error } = await supabase
      .from("previdencia_processos")
      .insert({
        municipio_id: usuario.municipio_id,
        guarda_id: guarda.id,
        guarda_nome: guarda.nome,
        matricula: guarda.matricula,
        tipo_processo: tipo,
        regime_previdenciario: regime,
        status: "ABERTO",
        data_abertura: dataAbertura,
        data_prevista_aposentadoria: dataPrevisao || null,
        tempo_total_meses: tempoTotalMeses ? Number(tempoTotalMeses) : 0,
        tempo_servico_publico_meses: tempoPublicoMeses ? Number(tempoPublicoMeses) : 0,
        tempo_especial_meses: tempoEspecialMeses ? Number(tempoEspecialMeses) : 0,
        protocolo: protocolo.trim() || null,
        responsavel_nome: responsavel.trim() || usuario.nome,
        observacoes: observacoes.trim() || null,
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
      tabela: "previdencia_processos",
      registro_id: data.id,
      descricao: `Processo previdenciário aberto para ${guarda.nome}.`,
    });

    router.push(`/sistema/previdencia-aposentadoria/${data.id}`);
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-5xl space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link href="/sistema/previdencia-aposentadoria" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="mt-4 text-2xl font-black">Novo processo previdenciário</h1>
          </header>

          {erro ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">{erro}</div> : null}

          <section className="grid gap-4 rounded-2xl border border-slate-800 bg-[#061326] p-5 md:grid-cols-2">
            <Campo titulo="Servidor">
              <select value={guardaId} onChange={(event) => setGuardaId(event.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4">
                <option value="">Selecione</option>
                {guardas.map((guarda) => (
                  <option key={guarda.id} value={guarda.id}>
                    {guarda.nome} {guarda.matricula ? `— ${guarda.matricula}` : ""}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo titulo="Tipo de processo">
              <select value={tipo} onChange={(event) => setTipo(event.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4">
                <option value="SIMULACAO_APOSENTADORIA">Simulação de aposentadoria</option>
                <option value="AVERBACAO">Averbação</option>
                <option value="CERTIDAO_TEMPO_CONTRIBUICAO">Certidão de tempo de contribuição</option>
                <option value="ABONO_PERMANENCIA">Abono de permanência</option>
                <option value="APOSENTADORIA">Aposentadoria</option>
                <option value="REVISAO">Revisão</option>
              </select>
            </Campo>

            <Campo titulo="Regime previdenciário">
              <select value={regime} onChange={(event) => setRegime(event.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4">
                <option value="RPPS">RPPS</option>
                <option value="RGPS">RGPS</option>
                <option value="MISTO">Misto</option>
              </select>
            </Campo>

            <Campo titulo="Data de abertura">
              <input type="date" value={dataAbertura} onChange={(event) => setDataAbertura(event.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Previsão de aposentadoria">
              <input type="date" value={dataPrevisao} onChange={(event) => setDataPrevisao(event.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Protocolo">
              <input value={protocolo} onChange={(event) => setProtocolo(event.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Tempo total em meses">
              <input type="number" min="0" value={tempoTotalMeses} onChange={(event) => setTempoTotalMeses(event.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Serviço público em meses">
              <input type="number" min="0" value={tempoPublicoMeses} onChange={(event) => setTempoPublicoMeses(event.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Tempo especial em meses">
              <input type="number" min="0" value={tempoEspecialMeses} onChange={(event) => setTempoEspecialMeses(event.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Responsável">
              <input value={responsavel} onChange={(event) => setResponsavel(event.target.value)} placeholder={usuario?.nome || "Nome do responsável"} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <div className="md:col-span-2">
              <Campo titulo="Observações">
                <textarea value={observacoes} onChange={(event) => setObservacoes(event.target.value)} rows={6} className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4" />
              </Campo>
            </div>
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
