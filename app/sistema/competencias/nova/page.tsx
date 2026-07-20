"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  lerUsuarioCompetencia,
  podeGerenciarCompetencias,
} from "@/lib/competencias";
import { supabase } from "@/lib/supabase";

type Curso = {
  id: number;
  nome: string;
};

export default function NovaCompetenciaPage() {
  const router = useRouter();
  const [usuario] = useState(() => lerUsuarioCompetencia());
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("TECNICA");
  const [descricao, setDescricao] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [evidenciasEsperadas, setEvidenciasEsperadas] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarCompetencias(usuario.perfil)
    : false;

  useEffect(() => {
    async function carregarCursos() {
      if (!usuario?.municipio_id) return;
      const { data } = await supabase
        .from("capacitacoes_cursos")
        .select("id,nome")
        .eq("municipio_id", usuario.municipio_id)
        .eq("status", "ATIVO")
        .order("nome");

      setCursos((data as Curso[] | null) || []);
    }

    void carregarCursos();
  }, [usuario]);

  async function salvar() {
    if (!usuario?.municipio_id || !usuario.id) {
      setErro("Sessão inválida.");
      return;
    }

    if (!podeGerenciar) {
      setErro("Seu perfil não pode cadastrar competências.");
      return;
    }

    if (!nome.trim()) {
      setErro("Informe o nome da competência.");
      return;
    }

    const curso = cursos.find((item) => String(item.id) === cursoId);

    setSalvando(true);
    setErro("");

    const { data, error } = await supabase
      .from("competencias_catalogo")
      .insert({
        municipio_id: usuario.municipio_id,
        nome: nome.trim(),
        categoria,
        descricao: descricao.trim() || null,
        evidencias_esperadas: evidenciasEsperadas.trim() || null,
        curso_recomendado_id: curso?.id || null,
        curso_recomendado_nome: curso?.nome || null,
        ativo: true,
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
      tabela: "competencias_catalogo",
      registro_id: data.id,
      descricao: `Competência ${nome.trim()} cadastrada.`,
    });

    router.push(`/sistema/competencias/${data.id}`);
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-4xl space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link
              href="/sistema/competencias"
              className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="mt-4 text-2xl font-black">Nova competência</h1>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-4 rounded-2xl border border-slate-800 bg-[#061326] p-5 md:grid-cols-2">
            <Campo titulo="Nome">
              <input
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Categoria">
              <select
                value={categoria}
                onChange={(event) => setCategoria(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                <option value="TECNICA">Técnica</option>
                <option value="OPERACIONAL">Operacional</option>
                <option value="COMPORTAMENTAL">Comportamental</option>
                <option value="LIDERANCA">Liderança</option>
                <option value="GESTAO">Gestão</option>
                <option value="TECNOLOGIA">Tecnologia</option>
              </select>
            </Campo>

            <div className="md:col-span-2">
              <Campo titulo="Descrição">
                <textarea
                  value={descricao}
                  onChange={(event) => setDescricao(event.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4"
                />
              </Campo>
            </div>

            <Campo titulo="Curso recomendado">
              <select
                value={cursoId}
                onChange={(event) => setCursoId(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                <option value="">Sem vínculo</option>
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.nome}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo titulo="Evidências esperadas">
              <textarea
                value={evidenciasEsperadas}
                onChange={(event) => setEvidenciasEsperadas(event.target.value)}
                rows={4}
                placeholder="Certificados, resultados, relatórios, observações..."
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
              Salvar competência
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
