"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  FilePlus2,
  HeartPulse,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Users,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  calcularDiasAte,
  formatarDataSaude,
  formatarSaude,
  lerUsuarioSaude,
  podeGerenciarSaude,
} from "@/lib/saudeOcupacional";
import { supabase } from "@/lib/supabase";

type Registro = {
  id: number;
  guarda_id: number;
  guarda_nome: string;
  matricula: string | null;
  situacao_aptidao: string;
  data_ultima_avaliacao: string | null;
  data_proxima_avaliacao: string | null;
  possui_restricao: boolean;
  readaptado: boolean;
  afastado: boolean;
  status: string;
};

export default function SaudeOcupacionalPage() {
  const [usuario] = useState(() => lerUsuarioSaude());
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario ? podeGerenciarSaude(usuario.perfil) : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) {
      setErro("Sessão ou município não identificado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    const { data, error } = await supabase
      .from("saude_ocupacional_prontuarios")
      .select(
        "id,guarda_id,guarda_nome,matricula,situacao_aptidao,data_ultima_avaliacao,data_proxima_avaliacao,possui_restricao,readaptado,afastado,status"
      )
      .eq("municipio_id", usuario.municipio_id)
      .order("data_proxima_avaliacao", { ascending: true, nullsFirst: false });

    if (error) setErro(error.message);
    setRegistros((data as Registro[] | null) || []);
    setCarregando(false);
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return registros.filter((item) =>
      `${item.guarda_nome} ${item.matricula || ""} ${item.situacao_aptidao} ${item.status}`
        .toLowerCase()
        .includes(termo)
    );
  }, [busca, registros]);

  const aptos = registros.filter((item) => item.situacao_aptidao === "APTO").length;
  const restricoes = registros.filter((item) => item.possui_restricao).length;
  const inaptos = registros.filter((item) =>
    ["INAPTO_TEMPORARIO", "INAPTO_DEFINITIVO"].includes(item.situacao_aptidao)
  ).length;
  const afastados = registros.filter((item) => item.afastado).length;
  const vencendo = registros.filter((item) => {
    const dias = calcularDiasAte(item.data_proxima_avaliacao);
    return dias !== null && dias >= 0 && dias <= 30;
  }).length;

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "saude_ocupacional_prontuarios",
      descricao: "Impressão do painel administrativo de saúde ocupacional.",
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

      <div className="fixed bottom-5 right-5 z-40 print:hidden">
        <Link
          href="/sistema/beneficios-servidor"
          className="rounded-xl border border-cyan-400/25 bg-[#061326] px-4 py-3 text-sm font-black text-cyan-300 shadow-xl"
        >
          Benefícios do Servidor
        </Link>
      </div>

      <div className="fixed bottom-5 left-5 z-40 print:hidden">
        <Link
          href="/sistema/previdencia-aposentadoria"
          className="rounded-xl border border-cyan-400/25 bg-[#061326] px-4 py-3 text-sm font-black text-cyan-300 shadow-xl"
        >
          Previdência e Aposentadoria
        </Link>
      </div>

      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-[1700px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 print:border-black print:bg-white lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300 print:text-black">
                  Saúde e segurança do servidor
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  Saúde Ocupacional e Aptidão Funcional
                </h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Controle administrativo de exames, aptidão, restrições, afastamentos e readaptações.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 print:hidden">
                <button onClick={() => void carregar()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-black">
                  <RefreshCw className="h-4 w-4" /> Atualizar
                </button>
                <button onClick={() => void imprimir()} className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-300">
                  <Printer className="h-4 w-4" /> Imprimir/PDF
                </button>
                <Link href="/sistema/ferias-licencas" className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-4 py-3 text-sm font-black text-cyan-300">
                  <CalendarClock className="h-4 w-4" /> Afastamentos
                </Link>

                <Link
                  href="/sistema/saude-mental"
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-3 text-sm font-black text-violet-300"
                >
                  Saúde mental
                </Link>


                <Link
                  href="/sistema/seguranca-trabalho"
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm font-black text-amber-300"
                >
                  Segurança do trabalho
                </Link>

                {podeGerenciar ? (
                  <Link href="/sistema/saude-ocupacional/novo" className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950">
                    <FilePlus2 className="h-4 w-4" /> Novo prontuário
                  </Link>
                ) : null}
              </div>
            </div>
          </header>

          <section className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-sm text-amber-100 print:border-black print:bg-white print:text-black">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                Dados médicos são sigilosos. Esta central exibe apenas informações funcionais necessárias à gestão. Diagnósticos e CID permanecem em área restrita.
              </p>
            </div>
          </section>

          {erro ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">{erro}</div> : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <Metrica titulo="Prontuários" valor={registros.length} icone={Users} />
            <Metrica titulo="Aptos" valor={aptos} icone={ShieldCheck} />
            <Metrica titulo="Com restrição" valor={restricoes} icone={AlertTriangle} />
            <Metrica titulo="Inaptos" valor={inaptos} icone={Stethoscope} />
            <Metrica titulo="Afastados" valor={afastados} icone={UserCheck} />
            <Metrica titulo="Vencem em 30 dias" valor={vencendo} icone={CalendarClock} />
          </section>

          <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#061326] px-4 print:hidden">
            <Search className="h-4 w-4 text-slate-500" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar servidor, matrícula, aptidão ou status..." className="h-12 w-full bg-transparent outline-none" />
          </label>

          {carregando ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
            </div>
          ) : (
            <section className="grid gap-4 xl:grid-cols-2">
              {filtrados.map((item) => {
                const dias = calcularDiasAte(item.data_proxima_avaliacao);
                const vencido = dias !== null && dias < 0;

                return (
                  <article key={item.id} className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                          <HeartPulse className="h-5 w-5 text-cyan-300 print:text-black" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-cyan-300 print:text-black">
                            {item.matricula || "Sem matrícula"}
                          </p>
                          <h2 className="mt-1 text-lg font-black">{item.guarda_nome}</h2>
                        </div>
                      </div>

                      <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-black uppercase text-cyan-300 print:text-black">
                        {formatarSaude(item.situacao_aptidao)}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                      <Indicador titulo="Restrição" valor={item.possui_restricao ? "Sim" : "Não"} />
                      <Indicador titulo="Readaptado" valor={item.readaptado ? "Sim" : "Não"} />
                      <Indicador titulo="Afastado" valor={item.afastado ? "Sim" : "Não"} />
                      <Indicador titulo="Status" valor={formatarSaude(item.status)} />
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <Info titulo="Última avaliação" valor={formatarDataSaude(item.data_ultima_avaliacao)} />
                      <Info
                        titulo="Próxima avaliação"
                        valor={`${formatarDataSaude(item.data_proxima_avaliacao)}${vencido ? " — Vencida" : dias !== null ? ` — ${dias} dia(s)` : ""}`}
                      />
                    </div>

                    <Link href={`/sistema/saude-ocupacional/${item.id}`} className="mt-4 inline-flex rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 print:hidden">
                      Abrir prontuário funcional
                    </Link>
                  </article>
                );
              })}

              {!filtrados.length ? (
                <div className="rounded-2xl border border-slate-800 bg-[#061326] p-14 text-center text-slate-500 xl:col-span-2">
                  Nenhum prontuário ocupacional cadastrado.
                </div>
              ) : null}
            </section>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Metrica({ titulo, valor, icone: Icone }: { titulo: string; valor: number; icone: typeof Users }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <Icone className="h-6 w-6 text-cyan-300 print:text-black" />
      <p className="mt-4 text-[10px] font-black uppercase text-slate-500 print:text-black">{titulo}</p>
      <p className="mt-1 text-xl font-black">{valor}</p>
    </div>
  );
}

function Indicador({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-center print:border-black print:bg-white">
      <p className="text-[10px] font-black uppercase text-slate-500 print:text-black">{titulo}</p>
      <p className="mt-1 font-black">{valor}</p>
    </div>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white">
      <p className="text-[10px] font-black uppercase text-slate-500 print:text-black">{titulo}</p>
      <p className="mt-1 font-black">{valor}</p>
    </div>
  );
}
