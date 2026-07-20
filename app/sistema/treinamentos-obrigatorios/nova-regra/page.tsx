"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  lerUsuarioTreinamento,
  podeGerenciarTreinamentos,
} from "@/lib/treinamentosObrigatorios";
import { supabase } from "@/lib/supabase";

type Curso = {
  id: number;
  nome: string;
  validade_meses: number | null;
};

export default function NovaRegraTreinamentoPage() {
  const router = useRouter();
  const [usuario] = useState(() => lerUsuarioTreinamento());
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoId, setCursoId] = useState("");
  const [cargo, setCargo] = useState("");
  const [funcao, setFuncao] = useState("");
  const [setor, setSetor] = useState("");
  const [periodicidade, setPeriodicidade] = useState("12");
  const [diasAlerta, setDiasAlerta] = useState("60");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarTreinamentos(usuario.perfil)
    : false;

  useEffect(() => {
    async function carregar() {
      if (!usuario?.municipio_id) return;

      const { data } = await supabase
        .from("capacitacoes_cursos")
        .select("id,nome,validade_meses")
        .eq("municipio_id", usuario.municipio_id)
        .eq("status", "ATIVO")
        .order("nome");

      setCursos((data as Curso[] | null) || []);
    }

    void carregar();
  }, [usuario]);

  function selecionarCurso(valor: string) {
    setCursoId(valor);
    const curso = cursos.find((item) => String(item.id) === valor);
    if (curso?.validade_meses) {
      setPeriodicidade(String(curso.validade_meses));
    }
  }

  async function salvar() {
    if (!usuario?.municipio_id || !usuario.id) {
      setErro("Sessão inválida.");
      return;
    }

    if (!podeGerenciar) {
      setErro("Seu perfil não pode criar exigências.");
      return;
    }

    const curso = cursos.find((item) => String(item.id) === cursoId);
    if (!curso) {
      setErro("Selecione o curso obrigatório.");
      return;
    }

    setSalvando(true);
    setErro("");

    const { data, error } = await supabase
      .from("treinamentos_obrigatorios_regras")
      .insert({
        municipio_id: usuario.municipio_id,
        curso_id: curso.id,
        curso_nome: curso.nome,
        cargo: cargo.trim() || null,
        funcao: funcao.trim() || null,
        setor: setor.trim() || null,
        periodicidade_meses: Number(periodicidade),
        dias_alerta: Number(diasAlerta),
        observacao: observacao.trim() || null,
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
      acao: "CRIAR_REGRA",
      tabela: "treinamentos_obrigatorios_regras",
      registro_id: data.id,
      descricao: `Treinamento obrigatório ${curso.nome} configurado.`,
    });

    router.push("/sistema/treinamentos-obrigatorios/matriz");
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-4xl space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link
              href="/sistema/treinamentos-obrigatorios"
              className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="mt-4 text-2xl font-black">Nova exigência obrigatória</h1>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-4 rounded-2xl border border-slate-800 bg-[#061326] p-5 md:grid-cols-2">
            <Campo titulo="Curso ou capacitação">
              <select
                value={cursoId}
                onChange={(event) => selecionarCurso(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                <option value="">Selecione...</option>
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.nome}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo titulo="Periodicidade da reciclagem (meses)">
              <input
                type="number"
                min="1"
                value={periodicidade}
                onChange={(event) => setPeriodicidade(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Cargo exigido">
              <input
                value={cargo}
                onChange={(event) => setCargo(event.target.value)}
                placeholder="Vazio para todos os cargos"
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Função exigida">
              <input
                value={funcao}
                onChange={(event) => setFuncao(event.target.value)}
                placeholder="Ex.: Motorista, Patrulheiro..."
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Setor exigido">
              <input
                value={setor}
                onChange={(event) => setSetor(event.target.value)}
                placeholder="Vazio para todos os setores"
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Alerta antes do vencimento (dias)">
              <input
                type="number"
                min="1"
                value={diasAlerta}
                onChange={(event) => setDiasAlerta(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <div className="md:col-span-2">
              <Campo titulo="Observação">
                <textarea
                  value={observacao}
                  onChange={(event) => setObservacao(event.target.value)}
                  rows={5}
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
              Salvar exigência
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
