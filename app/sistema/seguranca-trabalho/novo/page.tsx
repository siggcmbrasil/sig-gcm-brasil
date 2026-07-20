"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  CATEGORIAS_RISCO,
  NIVEIS_RISCO,
  formatarSeguranca,
  lerUsuarioSeguranca,
  podeGerenciarSeguranca,
} from "@/lib/segurancaTrabalho";
import { supabase } from "@/lib/supabase";

export default function NovoRiscoOcupacionalPage() {
  const router = useRouter();
  const [usuario] = useState(() => lerUsuarioSeguranca());
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("ACIDENTE");
  const [localSetor, setLocalSetor] = useState("");
  const [fonteRisco, setFonteRisco] = useState("");
  const [descricao, setDescricao] = useState("");
  const [probabilidade, setProbabilidade] = useState(1);
  const [severidade, setSeveridade] = useState(1);
  const [nivelRisco, setNivelRisco] = useState("BAIXO");
  const [medidasExistentes, setMedidasExistentes] = useState("");
  const [medidasNecessarias, setMedidasNecessarias] = useState("");
  const [responsavelNome, setResponsavelNome] = useState("");
  const [prazoAdequacao, setPrazoAdequacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    if (!usuario?.municipio_id || !podeGerenciarSeguranca(usuario.perfil)) {
      setErro("Seu perfil não pode cadastrar riscos.");
      return;
    }

    if (!titulo.trim()) {
      setErro("Informe o título do risco.");
      return;
    }

    setSalvando(true);
    setErro("");

    const { data, error } = await supabase
      .from("seguranca_trabalho_riscos")
      .insert({
        municipio_id: usuario.municipio_id,
        titulo: titulo.trim(),
        categoria,
        local_setor: localSetor.trim() || null,
        fonte_risco: fonteRisco.trim() || null,
        descricao: descricao.trim() || null,
        probabilidade,
        severidade,
        nivel_risco: nivelRisco,
        medidas_existentes: medidasExistentes.trim() || null,
        medidas_necessarias: medidasNecessarias.trim() || null,
        responsavel_nome: responsavelNome.trim() || null,
        prazo_adequacao: prazoAdequacao || null,
        status: "IDENTIFICADO",
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
      tabela: "seguranca_trabalho_riscos",
      registro_id: data.id,
      descricao: `Risco ocupacional cadastrado: ${titulo.trim()}.`,
    });

    router.push(`/sistema/seguranca-trabalho/${data.id}`);
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-5xl space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link
              href="/sistema/seguranca-trabalho"
              className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="mt-4 text-2xl font-black">Novo risco ocupacional</h1>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-4 rounded-2xl border border-slate-800 bg-[#061326] p-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Campo titulo="Título do risco">
                <input
                  value={titulo}
                  onChange={(event) => setTitulo(event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
                />
              </Campo>
            </div>

            <Campo titulo="Categoria">
              <select
                value={categoria}
                onChange={(event) => setCategoria(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                {CATEGORIAS_RISCO.map((item) => (
                  <option key={item} value={item}>
                    {formatarSeguranca(item)}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo titulo="Nível do risco">
              <select
                value={nivelRisco}
                onChange={(event) => setNivelRisco(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                {NIVEIS_RISCO.map((item) => (
                  <option key={item} value={item}>
                    {formatarSeguranca(item)}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo titulo="Local ou setor">
              <input
                value={localSetor}
                onChange={(event) => setLocalSetor(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Fonte do risco">
              <input
                value={fonteRisco}
                onChange={(event) => setFonteRisco(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Probabilidade (1 a 5)">
              <input
                type="number"
                min={1}
                max={5}
                value={probabilidade}
                onChange={(event) =>
                  setProbabilidade(Number(event.target.value))
                }
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Severidade (1 a 5)">
              <input
                type="number"
                min={1}
                max={5}
                value={severidade}
                onChange={(event) => setSeveridade(Number(event.target.value))}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Responsável pela adequação">
              <input
                value={responsavelNome}
                onChange={(event) => setResponsavelNome(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Prazo de adequação">
              <input
                type="date"
                value={prazoAdequacao}
                onChange={(event) => setPrazoAdequacao(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <div className="md:col-span-2">
              <Campo titulo="Descrição">
                <textarea
                  value={descricao}
                  onChange={(event) => setDescricao(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4"
                />
              </Campo>
            </div>

            <Campo titulo="Medidas existentes">
              <textarea
                value={medidasExistentes}
                onChange={(event) => setMedidasExistentes(event.target.value)}
                rows={5}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4"
              />
            </Campo>

            <Campo titulo="Medidas necessárias">
              <textarea
                value={medidasNecessarias}
                onChange={(event) => setMedidasNecessarias(event.target.value)}
                rows={5}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4"
              />
            </Campo>
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
              Salvar risco
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
