"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  STATUS_ACOMPANHAMENTO,
  TIPOS_ATENDIMENTO_PSICOSSOCIAL,
  formatarSaudeMental,
  lerUsuarioSaudeMental,
  podeGerenciarSaudeMental,
} from "@/lib/saudeMental";
import { supabase } from "@/lib/supabase";

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
};

export default function NovoAcompanhamentoPsicossocialPage() {
  const router = useRouter();
  const [usuario] = useState(() => lerUsuarioSaudeMental());
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [guardaId, setGuardaId] = useState("");
  const [tipo, setTipo] = useState("ACOLHIMENTO");
  const [dataInicio, setDataInicio] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [proximoAtendimento, setProximoAtendimento] = useState("");
  const [prioridade, setPrioridade] = useState("NORMAL");
  const [status, setStatus] = useState("AGENDADO");
  const [motivoAdministrativo, setMotivoAdministrativo] = useState("");
  const [restricao, setRestricao] = useState(false);
  const [afastamento, setAfastamento] = useState(false);
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
    if (!usuario?.municipio_id || !podeGerenciarSaudeMental(usuario.perfil)) {
      setErro("Seu perfil não pode cadastrar acompanhamentos.");
      return;
    }

    const guarda = guardas.find((item) => item.id === Number(guardaId));
    if (!guarda || !dataInicio) {
      setErro("Selecione o servidor e informe a data de início.");
      return;
    }

    setSalvando(true);
    setErro("");

    const { data, error } = await supabase
      .from("saude_mental_acompanhamentos")
      .insert({
        municipio_id: usuario.municipio_id,
        guarda_id: guarda.id,
        guarda_nome: guarda.nome,
        matricula: guarda.matricula,
        tipo_atendimento: tipo,
        data_inicio: dataInicio,
        proximo_atendimento: proximoAtendimento || null,
        prioridade,
        status,
        motivo_administrativo: motivoAdministrativo.trim() || null,
        possui_restricao_funcional: restricao,
        afastamento_recomendado: afastamento,
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
      tabela: "saude_mental_acompanhamentos",
      registro_id: data.id,
      descricao: `Acompanhamento psicossocial iniciado para ${guarda.nome}.`,
    });

    router.push(`/sistema/saude-mental/${data.id}`);
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-4xl space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link
              href="/sistema/saude-mental"
              className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="mt-4 text-2xl font-black">
              Novo acompanhamento psicossocial
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Registre somente informações administrativas. O conteúdo clínico deve permanecer na área sigilosa.
            </p>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-4 rounded-2xl border border-slate-800 bg-[#061326] p-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Campo titulo="Servidor">
                <select
                  value={guardaId}
                  onChange={(event) => setGuardaId(event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
                >
                  <option value="">Selecione</option>
                  {guardas.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome} {item.matricula ? `— ${item.matricula}` : ""}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>

            <Campo titulo="Tipo de atendimento">
              <select
                value={tipo}
                onChange={(event) => setTipo(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                {TIPOS_ATENDIMENTO_PSICOSSOCIAL.map((item) => (
                  <option key={item} value={item}>
                    {formatarSaudeMental(item)}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo titulo="Status">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                {STATUS_ACOMPANHAMENTO.map((item) => (
                  <option key={item} value={item}>
                    {formatarSaudeMental(item)}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo titulo="Data de início">
              <input
                type="date"
                value={dataInicio}
                onChange={(event) => setDataInicio(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Próximo atendimento">
              <input
                type="date"
                value={proximoAtendimento}
                onChange={(event) => setProximoAtendimento(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Prioridade">
              <select
                value={prioridade}
                onChange={(event) => setPrioridade(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                <option value="BAIXA">Baixa</option>
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </Campo>

            <div className="space-y-3">
              <Check titulo="Possui restrição funcional" valor={restricao} alterar={setRestricao} />
              <Check titulo="Afastamento recomendado" valor={afastamento} alterar={setAfastamento} />
            </div>

            <div className="md:col-span-2">
              <Campo titulo="Motivo administrativo">
                <textarea
                  value={motivoAdministrativo}
                  onChange={(event) =>
                    setMotivoAdministrativo(event.target.value)
                  }
                  rows={5}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4"
                  placeholder="Ex.: acompanhamento após ocorrência crítica. Não inserir relato clínico."
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
              Salvar acompanhamento
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

function Check({
  titulo,
  valor,
  alterar,
}: {
  titulo: string;
  valor: boolean;
  alterar: (valor: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/40 p-4">
      <input
        type="checkbox"
        checked={valor}
        onChange={(event) => alterar(event.target.checked)}
        className="h-4 w-4"
      />
      <span className="text-sm font-black">{titulo}</span>
    </label>
  );
}
