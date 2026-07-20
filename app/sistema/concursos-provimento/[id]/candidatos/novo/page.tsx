"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  STATUS_CANDIDATO,
  formatarConcursos,
  lerUsuarioConcursos,
  podeGerenciarConcursos,
} from "@/lib/concursosProvimento";
import { supabase } from "@/lib/supabase";

export default function NovoCandidatoPage() {
  const params = useParams<{ id: string }>();
  const concursoId = Number(params.id);
  const router = useRouter();
  const [usuario] = useState(() => lerUsuarioConcursos());
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [inscricao, setInscricao] = useState("");
  const [classificacao, setClassificacao] = useState("");
  const [notaFinal, setNotaFinal] = useState("");
  const [modalidade, setModalidade] = useState("AMPLA_CONCORRENCIA");
  const [status, setStatus] = useState("INSCRITO");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    if (!usuario?.municipio_id || !podeGerenciarConcursos(usuario.perfil)) {
      setErro("Seu perfil não pode cadastrar candidatos.");
      return;
    }

    if (!nome.trim()) {
      setErro("Informe o nome do candidato.");
      return;
    }

    setSalvando(true);
    setErro("");

    const { data, error } = await supabase
      .from("concursos_candidatos")
      .insert({
        municipio_id: usuario.municipio_id,
        concurso_id: concursoId,
        nome: nome.trim(),
        cpf: cpf.trim() || null,
        inscricao: inscricao.trim() || null,
        classificacao: classificacao ? Number(classificacao) : null,
        nota_final: notaFinal ? Number(notaFinal) : null,
        modalidade_vaga: modalidade,
        status,
        email: email.trim() || null,
        telefone: telefone.trim() || null,
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
      tabela: "concursos_candidatos",
      registro_id: data.id,
      descricao: `Candidato ${nome.trim()} incluído no concurso ${concursoId}.`,
    });

    router.push(`/sistema/concursos-provimento/${concursoId}/candidatos`);
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-4xl space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link href={`/sistema/concursos-provimento/${concursoId}/candidatos`} className="inline-flex items-center gap-2 text-sm font-black text-cyan-300">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="mt-4 text-2xl font-black">Novo candidato</h1>
          </header>

          {erro ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">{erro}</div> : null}

          <section className="grid gap-4 rounded-2xl border border-slate-800 bg-[#061326] p-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Campo titulo="Nome completo">
                <input value={nome} onChange={(e) => setNome(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
              </Campo>
            </div>

            <Campo titulo="CPF">
              <input value={cpf} onChange={(e) => setCpf(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Inscrição">
              <input value={inscricao} onChange={(e) => setInscricao(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Classificação">
              <input type="number" min="1" value={classificacao} onChange={(e) => setClassificacao(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Nota final">
              <input type="number" step="0.01" value={notaFinal} onChange={(e) => setNotaFinal(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Modalidade">
              <select value={modalidade} onChange={(e) => setModalidade(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4">
                <option value="AMPLA_CONCORRENCIA">Ampla concorrência</option>
                <option value="COTA_RACIAL">Cota racial</option>
                <option value="PCD">Pessoa com deficiência</option>
                <option value="OUTRA_COTA">Outra cota</option>
              </select>
            </Campo>

            <Campo titulo="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4">
                {STATUS_CANDIDATO.map((item) => (
                  <option key={item} value={item}>{formatarConcursos(item)}</option>
                ))}
              </select>
            </Campo>

            <Campo titulo="E-mail">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Telefone">
              <input value={telefone} onChange={(e) => setTelefone(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>
          </section>

          <div className="flex justify-end">
            <button disabled={salvando} onClick={() => void salvar()} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50">
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar candidato
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
