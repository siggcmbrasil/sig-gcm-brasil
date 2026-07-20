"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  lerUsuarioBeneficios,
  podeGerenciarBeneficios,
} from "@/lib/beneficiosServidor";
import { supabase } from "@/lib/supabase";

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
};

export default function NovoBeneficioServidorPage() {
  const router = useRouter();
  const [usuario] = useState(() => lerUsuarioBeneficios());
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [guardaId, setGuardaId] = useState("");
  const [tipo, setTipo] = useState("AUXILIO_ALIMENTACAO");
  const [dataSolicitacao, setDataSolicitacao] = useState("");
  const [inicioVigencia, setInicioVigencia] = useState("");
  const [fimVigencia, setFimVigencia] = useState("");
  const [valorMensal, setValorMensal] = useState("");
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
    if (!usuario?.municipio_id || !podeGerenciarBeneficios(usuario.perfil)) {
      setErro("Seu perfil não pode cadastrar benefícios.");
      return;
    }

    const guarda = guardas.find((item) => String(item.id) === guardaId);

    if (!guarda || !dataSolicitacao) {
      setErro("Selecione o servidor e informe a data da solicitação.");
      return;
    }

    setSalvando(true);
    setErro("");

    const { data, error } = await supabase
      .from("beneficios_servidor")
      .insert({
        municipio_id: usuario.municipio_id,
        guarda_id: guarda.id,
        guarda_nome: guarda.nome,
        matricula: guarda.matricula,
        tipo_beneficio: tipo,
        status: "SOLICITADO",
        data_solicitacao: dataSolicitacao,
        inicio_vigencia: inicioVigencia || null,
        fim_vigencia: fimVigencia || null,
        valor_mensal: valorMensal ? Number(valorMensal.replace(",", ".")) : null,
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
      tabela: "beneficios_servidor",
      registro_id: data.id,
      descricao: `Benefício solicitado para ${guarda.nome}.`,
    });

    router.push(`/sistema/beneficios-servidor/${data.id}`);
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-5xl space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link
              href="/sistema/beneficios-servidor"
              className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="mt-4 text-2xl font-black">Novo benefício</h1>
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

            <Campo titulo="Tipo de benefício">
              <select
                value={tipo}
                onChange={(event) => setTipo(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                <option value="AUXILIO_ALIMENTACAO">Auxílio alimentação</option>
                <option value="AUXILIO_TRANSPORTE">Auxílio transporte</option>
                <option value="AUXILIO_FUNERAL">Auxílio funeral</option>
                <option value="AUXILIO_EMERGENCIAL">Auxílio emergencial</option>
                <option value="AUXILIO_SAUDE">Auxílio saúde</option>
                <option value="AUXILIO_EDUCACAO">Auxílio educação</option>
                <option value="SALARIO_FAMILIA">Salário-família</option>
                <option value="OUTRO">Outro</option>
              </select>
            </Campo>

            <Campo titulo="Data da solicitação">
              <input
                type="date"
                value={dataSolicitacao}
                onChange={(event) => setDataSolicitacao(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Valor mensal">
              <input
                inputMode="decimal"
                value={valorMensal}
                onChange={(event) => setValorMensal(event.target.value)}
                placeholder="0,00"
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Início da vigência">
              <input
                type="date"
                value={inicioVigencia}
                onChange={(event) => setInicioVigencia(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Fim da vigência">
              <input
                type="date"
                value={fimVigencia}
                onChange={(event) => setFimVigencia(event.target.value)}
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

            <div className="md:col-span-2">
              <Campo titulo="Observações">
                <textarea
                  value={observacoes}
                  onChange={(event) => setObservacoes(event.target.value)}
                  rows={6}
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
              Salvar benefício
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
