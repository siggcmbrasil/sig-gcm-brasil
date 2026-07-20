"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  lerUsuarioCapacitacao,
  podeGerenciarCapacitacoes,
} from "@/lib/capacitacoes";
import { supabase } from "@/lib/supabase";

export default function NovoCursoPage() {
  const router = useRouter();
  const [usuario] = useState(() => lerUsuarioCapacitacao());
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("OPERACIONAL");
  const [modalidade, setModalidade] = useState("PRESENCIAL");
  const [cargaHoraria, setCargaHoraria] = useState("20");
  const [ementa, setEmenta] = useState("");
  const [objetivos, setObjetivos] = useState("");
  const [publicoAlvo, setPublicoAlvo] = useState("");
  const [obrigatorio, setObrigatorio] = useState(false);
  const [validadeMeses, setValidadeMeses] = useState("");
  const [notaMinima, setNotaMinima] = useState("7");
  const [frequenciaMinima, setFrequenciaMinima] = useState("75");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarCapacitacoes(usuario.perfil)
    : false;

  async function salvar() {
    if (!usuario?.municipio_id || !usuario.id) {
      setErro("Sessão inválida.");
      return;
    }

    if (!podeGerenciar) {
      setErro("Seu perfil não pode cadastrar cursos.");
      return;
    }

    if (!nome.trim() || Number(cargaHoraria) <= 0) {
      setErro("Informe o nome e uma carga horária válida.");
      return;
    }

    setSalvando(true);
    setErro("");

    const { data, error } = await supabase
      .from("capacitacoes_cursos")
      .insert({
        municipio_id: usuario.municipio_id,
        nome: nome.trim(),
        categoria,
        modalidade,
        carga_horaria: Number(cargaHoraria),
        ementa: ementa.trim() || null,
        objetivos: objetivos.trim() || null,
        publico_alvo: publicoAlvo.trim() || null,
        obrigatorio,
        validade_meses: validadeMeses ? Number(validadeMeses) : null,
        nota_minima: Number(notaMinima || 0),
        frequencia_minima: Number(frequenciaMinima || 0),
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
      tabela: "capacitacoes_cursos",
      registro_id: data.id,
      descricao: `Curso ${nome.trim()} cadastrado.`,
    });

    router.push(`/sistema/capacitacoes/${data.id}`);
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-5xl space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link
              href="/sistema/capacitacoes"
              className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="mt-4 text-2xl font-black">Cadastrar curso</h1>
            <p className="mt-2 text-sm text-slate-400">
              Defina regras, carga horária, validade e critérios de aprovação.
            </p>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-4 rounded-2xl border border-slate-800 bg-[#061326] p-5 md:grid-cols-2">
            <Campo titulo="Nome do curso">
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
                <option value="OPERACIONAL">Operacional</option>
                <option value="ARMAMENTO">Armamento</option>
                <option value="TRANSITO">Trânsito</option>
                <option value="DIREITOS_HUMANOS">Direitos Humanos</option>
                <option value="GESTAO">Gestão</option>
                <option value="TECNOLOGIA">Tecnologia</option>
                <option value="PRIMEIROS_SOCORROS">Primeiros Socorros</option>
                <option value="OUTRO">Outro</option>
              </select>
            </Campo>

            <Campo titulo="Modalidade">
              <select
                value={modalidade}
                onChange={(event) => setModalidade(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                <option value="PRESENCIAL">Presencial</option>
                <option value="EAD">EAD</option>
                <option value="HIBRIDA">Híbrida</option>
              </select>
            </Campo>

            <Campo titulo="Carga horária">
              <input
                type="number"
                min="1"
                value={cargaHoraria}
                onChange={(event) => setCargaHoraria(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Nota mínima">
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={notaMinima}
                onChange={(event) => setNotaMinima(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Frequência mínima (%)">
              <input
                type="number"
                min="0"
                max="100"
                value={frequenciaMinima}
                onChange={(event) => setFrequenciaMinima(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Validade da certificação (meses)">
              <input
                type="number"
                min="1"
                value={validadeMeses}
                onChange={(event) => setValidadeMeses(event.target.value)}
                placeholder="Vazio para validade indeterminada"
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/30 px-4">
              <input
                type="checkbox"
                checked={obrigatorio}
                onChange={(event) => setObrigatorio(event.target.checked)}
                className="h-5 w-5"
              />
              <span className="font-black">Curso obrigatório</span>
            </label>

            <div className="md:col-span-2">
              <Campo titulo="Público-alvo">
                <input
                  value={publicoAlvo}
                  onChange={(event) => setPublicoAlvo(event.target.value)}
                  placeholder="Ex.: Todo efetivo, motoristas, comandantes..."
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
                />
              </Campo>
            </div>

            <Campo titulo="Objetivos">
              <textarea
                value={objetivos}
                onChange={(event) => setObjetivos(event.target.value)}
                rows={6}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4"
              />
            </Campo>

            <Campo titulo="Ementa">
              <textarea
                value={ementa}
                onChange={(event) => setEmenta(event.target.value)}
                rows={6}
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
              Salvar curso
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
