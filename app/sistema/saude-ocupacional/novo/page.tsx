"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  RESULTADOS_APTIDAO,
  formatarSaude,
  lerUsuarioSaude,
  podeGerenciarSaude,
} from "@/lib/saudeOcupacional";
import { supabase } from "@/lib/supabase";

type Guarda = { id: number; nome: string; matricula: string | null };

export default function NovoProntuarioOcupacionalPage() {
  const router = useRouter();
  const [usuario] = useState(() => lerUsuarioSaude());
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [guardaId, setGuardaId] = useState("");
  const [situacao, setSituacao] = useState("AGUARDANDO_AVALIACAO");
  const [ultimaAvaliacao, setUltimaAvaliacao] = useState("");
  const [proximaAvaliacao, setProximaAvaliacao] = useState("");
  const [possuiRestricao, setPossuiRestricao] = useState(false);
  const [readaptado, setReadaptado] = useState(false);
  const [afastado, setAfastado] = useState(false);
  const [observacaoFuncional, setObservacaoFuncional] = useState("");
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
    if (!usuario?.municipio_id || !podeGerenciarSaude(usuario.perfil)) {
      setErro("Seu perfil não pode cadastrar prontuários ocupacionais.");
      return;
    }

    const guarda = guardas.find((item) => item.id === Number(guardaId));
    if (!guarda) {
      setErro("Selecione o servidor.");
      return;
    }

    setSalvando(true);
    setErro("");

    const { data, error } = await supabase
      .from("saude_ocupacional_prontuarios")
      .insert({
        municipio_id: usuario.municipio_id,
        guarda_id: guarda.id,
        guarda_nome: guarda.nome,
        matricula: guarda.matricula,
        situacao_aptidao: situacao,
        data_ultima_avaliacao: ultimaAvaliacao || null,
        data_proxima_avaliacao: proximaAvaliacao || null,
        possui_restricao: possuiRestricao,
        readaptado,
        afastado,
        observacao_funcional: observacaoFuncional.trim() || null,
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
      tabela: "saude_ocupacional_prontuarios",
      registro_id: data.id,
      descricao: `Prontuário ocupacional criado para ${guarda.nome}.`,
    });

    router.push(`/sistema/saude-ocupacional/${data.id}`);
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-4xl space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link href="/sistema/saude-ocupacional" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
            <h1 className="mt-4 text-2xl font-black">Novo prontuário ocupacional</h1>
            <p className="mt-2 text-sm text-slate-400">
              Cadastre somente dados funcionais. Informações clínicas e CID devem ser inseridas na área sigilosa do prontuário.
            </p>
          </header>

          {erro ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">{erro}</div> : null}

          <section className="grid gap-4 rounded-2xl border border-slate-800 bg-[#061326] p-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Campo titulo="Servidor">
                <select value={guardaId} onChange={(e) => setGuardaId(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4">
                  <option value="">Selecione</option>
                  {guardas.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome} {item.matricula ? `— ${item.matricula}` : ""}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>

            <Campo titulo="Situação de aptidão">
              <select value={situacao} onChange={(e) => setSituacao(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4">
                {RESULTADOS_APTIDAO.map((item) => (
                  <option key={item} value={item}>{formatarSaude(item)}</option>
                ))}
              </select>
            </Campo>

            <Campo titulo="Última avaliação">
              <input type="date" value={ultimaAvaliacao} onChange={(e) => setUltimaAvaliacao(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Próxima avaliação">
              <input type="date" value={proximaAvaliacao} onChange={(e) => setProximaAvaliacao(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <div className="space-y-3">
              <Check titulo="Possui restrição funcional" valor={possuiRestricao} alterar={setPossuiRestricao} />
              <Check titulo="Servidor readaptado" valor={readaptado} alterar={setReadaptado} />
              <Check titulo="Servidor afastado" valor={afastado} alterar={setAfastado} />
            </div>

            <div className="md:col-span-2">
              <Campo titulo="Observação funcional">
                <textarea value={observacaoFuncional} onChange={(e) => setObservacaoFuncional(e.target.value)} rows={5} className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4" placeholder="Ex.: evitar atividade armada até nova avaliação. Não inserir diagnóstico ou CID." />
              </Campo>
            </div>
          </section>

          <div className="flex justify-end">
            <button disabled={salvando} onClick={() => void salvar()} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50">
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar prontuário
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

function Check({ titulo, valor, alterar }: { titulo: string; valor: boolean; alterar: (valor: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/40 p-4">
      <input type="checkbox" checked={valor} onChange={(e) => alterar(e.target.checked)} className="h-4 w-4" />
      <span className="text-sm font-black">{titulo}</span>
    </label>
  );
}
