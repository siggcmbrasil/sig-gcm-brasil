"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Brain,
  CalendarClock,
  FilePlus2,
  HeartHandshake,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  diasAteSaudeMental,
  formatarDataSaudeMental,
  formatarSaudeMental,
  lerUsuarioSaudeMental,
  podeGerenciarSaudeMental,
} from "@/lib/saudeMental";
import { supabase } from "@/lib/supabase";

type Acompanhamento = {
  id: number;
  guarda_id: number;
  guarda_nome: string;
  matricula: string | null;
  tipo_atendimento: string;
  motivo_administrativo: string | null;
  data_inicio: string;
  proximo_atendimento: string | null;
  status: string;
  prioridade: string;
  possui_restricao_funcional: boolean;
  afastamento_recomendado: boolean;
};

export default function SaudeMentalPage() {
  const [usuario] = useState(() => lerUsuarioSaudeMental());
  const [registros, setRegistros] = useState<Acompanhamento[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarSaudeMental(usuario.perfil)
    : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) {
      setErro("Sessão ou município não identificado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    const { data, error } = await supabase
      .from("saude_mental_acompanhamentos")
      .select(
        "id,guarda_id,guarda_nome,matricula,tipo_atendimento,motivo_administrativo,data_inicio,proximo_atendimento,status,prioridade,possui_restricao_funcional,afastamento_recomendado"
      )
      .eq("municipio_id", usuario.municipio_id)
      .order("proximo_atendimento", { ascending: true, nullsFirst: false });

    if (error) setErro(error.message);
    setRegistros((data as Acompanhamento[] | null) || []);
    setCarregando(false);
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return registros.filter((item) =>
      `${item.guarda_nome} ${item.matricula || ""} ${item.tipo_atendimento} ${item.status} ${item.prioridade}`
        .toLowerCase()
        .includes(termo)
    );
  }, [busca, registros]);

  const ativos = registros.filter((item) =>
    ["AGENDADO", "EM_ACOMPANHAMENTO", "ENCAMINHADO"].includes(item.status)
  ).length;
  const urgentes = registros.filter((item) =>
    ["ALTA", "URGENTE"].includes(item.prioridade)
  ).length;
  const restricoes = registros.filter(
    (item) => item.possui_restricao_funcional
  ).length;
  const afastamentos = registros.filter(
    (item) => item.afastamento_recomendado
  ).length;
  const proximos = registros.filter((item) => {
    const dias = diasAteSaudeMental(item.proximo_atendimento);
    return dias !== null && dias >= 0 && dias <= 7;
  }).length;

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "saude_mental_acompanhamentos",
      descricao:
        "Impressão do painel estatístico administrativo de saúde mental.",
    });
    window.print();
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <div className="fixed bottom-5 right-5 z-40 print:hidden">
        <Link
          href="/sistema/readaptacao-funcional"
          className="rounded-xl border border-cyan-400/25 bg-[#061326] px-4 py-3 text-sm font-black text-cyan-300 shadow-xl"
        >
          Readaptação funcional
        </Link>
      </div>

      <div className="fixed bottom-5 left-5 z-40 print:hidden">
        <Link
          href="/sistema/assistencia-social"
          className="rounded-xl border border-cyan-400/25 bg-[#061326] px-4 py-3 text-sm font-black text-cyan-300 shadow-xl"
        >
          Assistência Social
        </Link>
      </div>

      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-[1700px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 print:border-black print:bg-white lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300 print:text-black">
                  Apoio ao servidor
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  Saúde Mental e Apoio Psicossocial
                </h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Acolhimentos, encaminhamentos, acompanhamento pós-ocorrência crítica e qualidade de vida.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 print:hidden">
                <button
                  onClick={() => void carregar()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-black"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar
                </button>

                <button
                  onClick={() => void imprimir()}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-300"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir/PDF
                </button>

                <Link
                  href="/sistema/saude-ocupacional"
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-4 py-3 text-sm font-black text-cyan-300"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Saúde ocupacional
                </Link>

                {podeGerenciar ? (
                  <Link
                    href="/sistema/saude-mental/novo"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"
                  >
                    <FilePlus2 className="h-4 w-4" />
                    Novo acompanhamento
                  </Link>
                ) : null}
              </div>
            </div>
          </header>

          <section className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-sm text-amber-100 print:border-black print:bg-white print:text-black">
            <div className="flex items-start gap-3">
              <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                O painel apresenta somente informações administrativas. Conteúdo clínico, relatos pessoais, hipóteses e avaliações psicológicas permanecem em área sigilosa.
              </p>
            </div>
          </section>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <Metrica titulo="Registros" valor={registros.length} icone={Users} />
            <Metrica titulo="Em acompanhamento" valor={ativos} icone={Brain} />
            <Metrica titulo="Alta prioridade" valor={urgentes} icone={AlertTriangle} />
            <Metrica titulo="Com restrição" valor={restricoes} icone={ShieldCheck} />
            <Metrica titulo="Afastamento recomendado" valor={afastamentos} icone={UserCheck} />
            <Metrica titulo="Atendimentos em 7 dias" valor={proximos} icone={CalendarClock} />
          </section>

          <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#061326] px-4 print:hidden">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar servidor, matrícula, atendimento, prioridade ou status..."
              className="h-12 w-full bg-transparent outline-none"
            />
          </label>

          {carregando ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
            </div>
          ) : (
            <section className="grid gap-4 xl:grid-cols-2">
              {filtrados.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-cyan-300 print:text-black">
                        {item.matricula || "Sem matrícula"}
                      </p>
                      <h2 className="mt-1 text-lg font-black">{item.guarda_nome}</h2>
                      <p className="mt-1 text-sm text-slate-500 print:text-black">
                        {formatarSaudeMental(item.tipo_atendimento)}
                      </p>
                    </div>

                    <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-black uppercase text-cyan-300 print:text-black">
                      {formatarSaudeMental(item.status)}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Indicador titulo="Prioridade" valor={formatarSaudeMental(item.prioridade)} />
                    <Indicador titulo="Restrição" valor={item.possui_restricao_funcional ? "Sim" : "Não"} />
                    <Indicador titulo="Afastamento" valor={item.afastamento_recomendado ? "Recomendado" : "Não"} />
                    <Indicador titulo="Início" valor={formatarDataSaudeMental(item.data_inicio)} />
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white">
                    <p className="text-[10px] font-black uppercase text-slate-500 print:text-black">
                      Próximo atendimento
                    </p>
                    <p className="mt-1 font-black">
                      {formatarDataSaudeMental(item.proximo_atendimento)}
                    </p>
                    {item.motivo_administrativo ? (
                      <p className="mt-3 text-sm text-slate-400 print:text-black">
                        {item.motivo_administrativo}
                      </p>
                    ) : null}
                  </div>

                  <Link
                    href={`/sistema/saude-mental/${item.id}`}
                    className="mt-4 inline-flex rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 print:hidden"
                  >
                    Abrir acompanhamento
                  </Link>
                </article>
              ))}

              {!filtrados.length ? (
                <div className="rounded-2xl border border-slate-800 bg-[#061326] p-14 text-center text-slate-500 xl:col-span-2">
                  Nenhum acompanhamento psicossocial cadastrado.
                </div>
              ) : null}
            </section>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Metrica({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: number;
  icone: typeof Users;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <Icone className="h-6 w-6 text-cyan-300 print:text-black" />
      <p className="mt-4 text-[10px] font-black uppercase text-slate-500 print:text-black">
        {titulo}
      </p>
      <p className="mt-1 text-xl font-black">{valor}</p>
    </div>
  );
}

function Indicador({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-center print:border-black print:bg-white">
      <p className="text-[10px] font-black uppercase text-slate-500 print:text-black">
        {titulo}
      </p>
      <p className="mt-1 font-black">{valor}</p>
    </div>
  );
}
