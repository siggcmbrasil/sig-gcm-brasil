"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  lerUsuarioAssistenciaSocial,
  podeGerenciarAssistenciaSocial,
} from "@/lib/assistenciaSocial";
import { supabase } from "@/lib/supabase";

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
};

export default function NovoAtendimentoSocialPage() {
  const router = useRouter();
  const [usuario] = useState(() => lerUsuarioAssistenciaSocial());
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [guardaId, setGuardaId] = useState("");
  const [tipo, setTipo] = useState("ATENDIMENTO_SOCIAL");
  const [prioridade, setPrioridade] = useState("NORMAL");
  const [dataAtendimento, setDataAtendimento] = useState("");
  const [proximoRetorno, setProximoRetorno] = useState("");
  const [resumo, setResumo] = useState("");
  const [encaminhamento, setEncaminhamento] = useState("");
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
    if (!usuario?.municipio_id || !podeGerenciarAssistenciaSocial(usuario.perfil)) {
      setErro("Seu perfil não pode abrir atendimentos sociais.");
      return;
    }

    const guarda = guardas.find((item) => String(item.id) === guardaId);

    if (!guarda || !dataAtendimento || !resumo.trim()) {
      setErro("Selecione o servidor, informe a data e descreva a demanda.");
      return;
    }

    setSalvando(true);
    setErro("");

    const { data, error } = await supabase
      .from("assistencia_social_atendimentos")
      .insert({
        municipio_id: usuario.municipio_id,
        guarda_id: guarda.id,
        guarda_nome: guarda.nome,
        matricula: guarda.matricula,
        tipo_atendimento: tipo,
        prioridade,
        data_atendimento: dataAtendimento,
        proximo_retorno: proximoRetorno || null,
        resumo_demanda: resumo.trim(),
        encaminhamento_inicial: encaminhamento.trim() || null,
        responsavel_nome: responsavel.trim() || usuario.nome,
        observacoes: observacoes.trim() || null,
        status: "EM_ACOMPANHAMENTO",
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
      tabela: "assistencia_social_atendimentos",
      registro_id: data.id,
      descricao: `Atendimento social aberto para ${guarda.nome}.`,
    });

    router.push(`/sistema/assistencia-social/${data.id}`);
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-5xl space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link
              href="/sistema/assistencia-social"
              className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="mt-4 text-2xl font-black">Novo atendimento social</h1>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-4 rounded-2xl border border-slate-800 bg-[#061326] p-5 md:grid-cols-2">
            <Campo titulo="Servidor">
              <select
                value={guardaId}
                onChange={(event) => setGuardaId(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                <option value="">Selecione</option>
                {guardas.map((guarda) => (
                  <option key={guarda.id} value={guarda.id}>
                    {guarda.nome} {guarda.matricula ? `— ${guarda.matricula}` : ""}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo titulo="Tipo de atendimento">
              <select
                value={tipo}
                onChange={(event) => setTipo(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                <option value="ATENDIMENTO_SOCIAL">Atendimento social</option>
                <option value="ENTREVISTA_SOCIAL">Entrevista social</option>
                <option value="VISITA_DOMICILIAR">Visita domiciliar</option>
                <option value="ACOMPANHAMENTO_FAMILIAR">Acompanhamento familiar</option>
                <option value="ENCAMINHAMENTO">Encaminhamento</option>
                <option value="BENEFICIO">Benefício</option>
              </select>
            </Campo>

            <Campo titulo="Prioridade">
              <select
                value={prioridade}
                onChange={(event) => setPrioridade(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </Campo>

            <Campo titulo="Data do atendimento">
              <input
                type="date"
                value={dataAtendimento}
                onChange={(event) => setDataAtendimento(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Próximo retorno">
              <input
                type="date"
                value={proximoRetorno}
                onChange={(event) => setProximoRetorno(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Responsável">
              <input
                value={responsavel}
                onChange={(event) => setResponsavel(event.target.value)}
                placeholder={usuario?.nome || "Nome do responsável"}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Resumo da demanda">
              <textarea
                value={resumo}
                onChange={(event) => setResumo(event.target.value)}
                rows={5}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4"
              />
            </Campo>

            <Campo titulo="Encaminhamento inicial">
              <textarea
                value={encaminhamento}
                onChange={(event) => setEncaminhamento(event.target.value)}
                rows={5}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4"
              />
            </Campo>

            <div className="md:col-span-2">
              <Campo titulo="Observações">
                <textarea
                  value={observacoes}
                  onChange={(event) => setObservacoes(event.target.value)}
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
              Salvar atendimento
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
