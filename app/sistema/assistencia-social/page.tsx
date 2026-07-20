"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  FilePlus2,
  HandHeart,
  House,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  UsersRound,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  formatarData,
  formatarTexto,
  lerUsuarioAssistenciaSocial,
  podeGerenciarAssistenciaSocial,
} from "@/lib/assistenciaSocial";
import { supabase } from "@/lib/supabase";

type Atendimento = {
  id: number;
  guarda_id: number | null;
  guarda_nome: string;
  matricula: string | null;
  tipo_atendimento: string;
  prioridade: string;
  status: string;
  data_atendimento: string;
  proximo_retorno: string | null;
  resumo_demanda: string | null;
  responsavel_nome: string | null;
};

export default function AssistenciaSocialPage() {
  const [usuario] = useState(() => lerUsuarioAssistenciaSocial());
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarAssistenciaSocial(usuario.perfil)
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
      .from("assistencia_social_atendimentos")
      .select(
        "id,guarda_id,guarda_nome,matricula,tipo_atendimento,prioridade,status,data_atendimento,proximo_retorno,resumo_demanda,responsavel_nome"
      )
      .eq("municipio_id", usuario.municipio_id)
      .order("data_atendimento", { ascending: false });

    if (error) setErro(error.message);
    setAtendimentos((data as Atendimento[] | null) || []);
    setCarregando(false);
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return atendimentos.filter((item) =>
      `${item.guarda_nome} ${item.matricula || ""} ${item.tipo_atendimento} ${item.prioridade} ${item.status} ${item.resumo_demanda || ""}`
        .toLowerCase()
        .includes(termo)
    );
  }, [atendimentos, busca]);

  const emAcompanhamento = atendimentos.filter(
    (item) => item.status === "EM_ACOMPANHAMENTO"
  ).length;
  const urgentes = atendimentos.filter(
    (item) => item.prioridade === "URGENTE"
  ).length;
  const retornos = atendimentos.filter((item) => item.proximo_retorno).length;
  const visitas = atendimentos.filter(
    (item) => item.tipo_atendimento === "VISITA_DOMICILIAR"
  ).length;

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "assistencia_social_atendimentos",
      descricao: "Impressão do painel de assistência social ao servidor.",
    });
    window.print();
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <div className="fixed bottom-5 right-5 z-40 print:hidden">
        <Link
          href="/sistema/beneficios-servidor"
          className="rounded-xl border border-cyan-400/25 bg-[#061326] px-4 py-3 text-sm font-black text-cyan-300 shadow-xl"
        >
          Benefícios do Servidor
        </Link>
      </div>

      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-[1650px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 print:border-black print:bg-white lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300 print:text-black">
                  Proteção social e apoio ao servidor
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  Assistência Social ao Servidor
                </h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Atendimentos, encaminhamentos, visitas, benefícios e acompanhamento familiar.
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

                {podeGerenciar ? (
                  <Link
                    href="/sistema/assistencia-social/novo"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"
                  >
                    <FilePlus2 className="h-4 w-4" />
                    Novo atendimento
                  </Link>
                ) : null}
              </div>
            </div>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Metrica titulo="Atendimentos" valor={atendimentos.length} icone={HandHeart} />
            <Metrica titulo="Em acompanhamento" valor={emAcompanhamento} icone={UsersRound} />
            <Metrica titulo="Urgentes" valor={urgentes} icone={HandHeart} />
            <Metrica titulo="Retornos" valor={retornos} icone={CalendarClock} />
            <Metrica titulo="Visitas domiciliares" valor={visitas} icone={House} />
          </section>

          <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#061326] px-4 print:hidden">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar servidor, matrícula, tipo, prioridade ou status..."
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
                        {formatarTexto(item.tipo_atendimento)}
                      </p>
                      <h2 className="mt-1 text-lg font-black">{item.guarda_nome}</h2>
                      <p className="mt-1 text-sm text-slate-500 print:text-black">
                        Matrícula: {item.matricula || "não informada"}
                      </p>
                    </div>
                    <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-black uppercase text-cyan-300 print:text-black">
                      {formatarTexto(item.status)}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Info titulo="Data" valor={formatarData(item.data_atendimento)} />
                    <Info titulo="Prioridade" valor={formatarTexto(item.prioridade)} />
                    <Info titulo="Retorno" valor={formatarData(item.proximo_retorno)} />
                    <Info titulo="Responsável" valor={item.responsavel_nome || "—"} />
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white">
                    <p className="text-[10px] font-black uppercase text-slate-500 print:text-black">
                      Resumo da demanda
                    </p>
                    <p className="mt-1 text-sm text-slate-300 print:text-black">
                      {item.resumo_demanda || "Não informado."}
                    </p>
                  </div>

                  <Link
                    href={`/sistema/assistencia-social/${item.id}`}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 print:hidden"
                  >
                    Abrir atendimento
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}

              {!filtrados.length ? (
                <div className="rounded-2xl border border-slate-800 bg-[#061326] p-14 text-center text-slate-500 xl:col-span-2">
                  Nenhum atendimento social cadastrado.
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
  icone: typeof HandHeart;
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

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-center print:border-black print:bg-white">
      <p className="text-[10px] font-black uppercase text-slate-500 print:text-black">
        {titulo}
      </p>
      <p className="mt-1 text-sm font-black">{valor}</p>
    </div>
  );
}
