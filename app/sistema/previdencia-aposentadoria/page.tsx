"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  FilePlus2,
  Landmark,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  TimerReset,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  formatarData,
  formatarTempo,
  formatarTexto,
  lerUsuarioPrevidencia,
  podeGerenciarPrevidencia,
} from "@/lib/previdenciaAposentadoria";
import { supabase } from "@/lib/supabase";

type Processo = {
  id: number;
  guarda_id: number | null;
  guarda_nome: string;
  matricula: string | null;
  tipo_processo: string;
  regime_previdenciario: string;
  status: string;
  data_abertura: string;
  data_prevista_aposentadoria: string | null;
  tempo_total_meses: number | null;
  tempo_servico_publico_meses: number | null;
  responsavel_nome: string | null;
};

export default function PrevidenciaAposentadoriaPage() {
  const [usuario] = useState(() => lerUsuarioPrevidencia());
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarPrevidencia(usuario.perfil)
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
      .from("previdencia_processos")
      .select("id,guarda_id,guarda_nome,matricula,tipo_processo,regime_previdenciario,status,data_abertura,data_prevista_aposentadoria,tempo_total_meses,tempo_servico_publico_meses,responsavel_nome")
      .eq("municipio_id", usuario.municipio_id)
      .order("data_abertura", { ascending: false });

    if (error) setErro(error.message);
    setProcessos((data as Processo[] | null) || []);
    setCarregando(false);
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return processos.filter((item) =>
      `${item.guarda_nome} ${item.matricula || ""} ${item.tipo_processo} ${item.regime_previdenciario} ${item.status}`
        .toLowerCase()
        .includes(termo)
    );
  }, [processos, busca]);

  const emAnalise = processos.filter((item) =>
    ["ABERTO", "EM_ANALISE", "AGUARDANDO_DOCUMENTOS"].includes(item.status)
  ).length;
  const concluidos = processos.filter((item) => item.status === "CONCLUIDO").length;
  const proximos = processos.filter((item) => {
    if (!item.data_prevista_aposentadoria) return false;
    const limite = new Date();
    limite.setFullYear(limite.getFullYear() + 2);
    return new Date(item.data_prevista_aposentadoria) <= limite;
  }).length;

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "previdencia_processos",
      descricao: "Impressão do painel previdenciário.",
    });
    window.print();
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-[1650px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 print:border-black print:bg-white lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300 print:text-black">
                  Gestão previdenciária do efetivo
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  Previdência e Aposentadoria
                </h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Tempo de serviço, averbações, certidões, simulações, processos e alertas.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 print:hidden">
                <button onClick={() => void carregar()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-black">
                  <RefreshCw className="h-4 w-4" />
                  Atualizar
                </button>
                <button onClick={() => void imprimir()} className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-300">
                  <Printer className="h-4 w-4" />
                  Imprimir/PDF
                </button>
                {podeGerenciar ? (
                  <Link href="/sistema/previdencia-aposentadoria/novo" className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950">
                    <FilePlus2 className="h-4 w-4" />
                    Novo processo
                  </Link>
                ) : null}
              </div>
            </div>
          </header>

          {erro ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">{erro}</div> : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metrica titulo="Processos" valor={String(processos.length)} icone={Landmark} />
            <Metrica titulo="Em análise" valor={String(emAnalise)} icone={CalendarClock} />
            <Metrica titulo="Concluídos" valor={String(concluidos)} icone={ShieldCheck} />
            <Metrica titulo="Próximos de aposentar" valor={String(proximos)} icone={TimerReset} />
          </section>

          <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#061326] px-4 print:hidden">
            <Search className="h-4 w-4 text-slate-500" />
            <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar servidor, matrícula, processo, regime ou status..." className="h-12 w-full bg-transparent outline-none" />
          </label>

          {carregando ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
            </div>
          ) : (
            <section className="grid gap-4 xl:grid-cols-2">
              {filtrados.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-cyan-300 print:text-black">
                        {formatarTexto(item.tipo_processo)}
                      </p>
                      <h2 className="mt-1 text-lg font-black">{item.guarda_nome}</h2>
                      <p className="mt-1 text-sm text-slate-500 print:text-black">
                        Matrícula: {item.matricula || "não informada"} • {formatarTexto(item.regime_previdenciario)}
                      </p>
                    </div>
                    <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-black uppercase text-cyan-300 print:text-black">
                      {formatarTexto(item.status)}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Info titulo="Abertura" valor={formatarData(item.data_abertura)} />
                    <Info titulo="Previsão" valor={formatarData(item.data_prevista_aposentadoria)} />
                    <Info titulo="Tempo total" valor={formatarTempo(item.tempo_total_meses)} />
                    <Info titulo="Serviço público" valor={formatarTempo(item.tempo_servico_publico_meses)} />
                  </div>

                  <Link href={`/sistema/previdencia-aposentadoria/${item.id}`} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 print:hidden">
                    Abrir processo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}

              {!filtrados.length ? (
                <div className="rounded-2xl border border-slate-800 bg-[#061326] p-14 text-center text-slate-500 xl:col-span-2">
                  Nenhum processo previdenciário cadastrado.
                </div>
              ) : null}
            </section>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Metrica({ titulo, valor, icone: Icone }: { titulo: string; valor: string; icone: typeof Landmark }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <Icone className="h-6 w-6 text-cyan-300 print:text-black" />
      <p className="mt-4 text-[10px] font-black uppercase text-slate-500 print:text-black">{titulo}</p>
      <p className="mt-1 text-xl font-black">{valor}</p>
    </div>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-center print:border-black print:bg-white">
      <p className="text-[10px] font-black uppercase text-slate-500 print:text-black">{titulo}</p>
      <p className="mt-1 text-sm font-black">{valor}</p>
    </div>
  );
}
