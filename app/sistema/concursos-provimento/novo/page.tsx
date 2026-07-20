"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  STATUS_CONCURSO,
  formatarConcursos,
  lerUsuarioConcursos,
  podeGerenciarConcursos,
} from "@/lib/concursosProvimento";
import { supabase } from "@/lib/supabase";

export default function NovoConcursoPage() {
  const router = useRouter();
  const [usuario] = useState(() => lerUsuarioConcursos());
  const [numeroEdital, setNumeroEdital] = useState("");
  const [titulo, setTitulo] = useState("");
  const [cargo, setCargo] = useState("");
  const [organizadora, setOrganizadora] = useState("");
  const [vagasImediatas, setVagasImediatas] = useState("0");
  const [vagasReserva, setVagasReserva] = useState("0");
  const [vagasCotas, setVagasCotas] = useState("0");
  const [dataPublicacao, setDataPublicacao] = useState("");
  const [validadeAte, setValidadeAte] = useState("");
  const [status, setStatus] = useState("PLANEJADO");
  const [descricao, setDescricao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    if (!usuario?.municipio_id || !podeGerenciarConcursos(usuario.perfil)) {
      setErro("Seu perfil não pode cadastrar concursos.");
      return;
    }

    if (!numeroEdital.trim() || !titulo.trim() || !cargo.trim()) {
      setErro("Informe número do edital, título e cargo.");
      return;
    }

    setSalvando(true);
    setErro("");

    const { data, error } = await supabase
      .from("concursos_publicos")
      .insert({
        municipio_id: usuario.municipio_id,
        numero_edital: numeroEdital.trim(),
        titulo: titulo.trim(),
        cargo: cargo.trim(),
        organizadora: organizadora.trim() || null,
        vagas_imediatas: Math.max(0, Number(vagasImediatas || 0)),
        vagas_cadastro_reserva: Math.max(0, Number(vagasReserva || 0)),
        vagas_cotas: Math.max(0, Number(vagasCotas || 0)),
        data_publicacao: dataPublicacao || null,
        validade_ate: validadeAte || null,
        status,
        descricao: descricao.trim() || null,
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
      tabela: "concursos_publicos",
      registro_id: data.id,
      descricao: `Concurso ${numeroEdital.trim()} cadastrado.`,
    });

    router.push(`/sistema/concursos-provimento/${data.id}`);
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-5xl space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link
              href="/sistema/concursos-provimento"
              className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="mt-4 text-2xl font-black">Novo concurso público</h1>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-4 rounded-2xl border border-slate-800 bg-[#061326] p-5 md:grid-cols-2 lg:grid-cols-3">
            <Campo titulo="Número do edital">
              <input value={numeroEdital} onChange={(e) => setNumeroEdital(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <div className="lg:col-span-2">
              <Campo titulo="Título">
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
              </Campo>
            </div>

            <Campo titulo="Cargo">
              <input value={cargo} onChange={(e) => setCargo(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Organizadora">
              <input value={organizadora} onChange={(e) => setOrganizadora(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4">
                {STATUS_CONCURSO.map((item) => (
                  <option key={item} value={item}>{formatarConcursos(item)}</option>
                ))}
              </select>
            </Campo>

            <Campo titulo="Vagas imediatas">
              <input type="number" min="0" value={vagasImediatas} onChange={(e) => setVagasImediatas(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Cadastro reserva">
              <input type="number" min="0" value={vagasReserva} onChange={(e) => setVagasReserva(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Vagas de cotas">
              <input type="number" min="0" value={vagasCotas} onChange={(e) => setVagasCotas(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Data de publicação">
              <input type="date" value={dataPublicacao} onChange={(e) => setDataPublicacao(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Validade até">
              <input type="date" value={validadeAte} onChange={(e) => setValidadeAte(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <div className="lg:col-span-3">
              <Campo titulo="Descrição e observações">
                <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={5} className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4" />
              </Campo>
            </div>
          </section>

          <div className="flex justify-end">
            <button disabled={salvando} onClick={() => void salvar()} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50">
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar concurso
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
