"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  Construction,
  FilePlus2,
  HardHat,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  TriangleAlert,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  diasAteSeguranca,
  formatarDataSeguranca,
  formatarSeguranca,
  lerUsuarioSeguranca,
  podeGerenciarSeguranca,
} from "@/lib/segurancaTrabalho";
import { supabase } from "@/lib/supabase";

type Risco = {
  id: number;
  titulo: string;
  categoria: string;
  local_setor: string | null;
  fonte_risco: string | null;
  nivel_risco: string;
  probabilidade: number;
  severidade: number;
  responsavel_nome: string | null;
  prazo_adequacao: string | null;
  status: string;
};

export default function SegurancaTrabalhoPage() {
  const [usuario] = useState(() => lerUsuarioSeguranca());
  const [riscos, setRiscos] = useState<Risco[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarSeguranca(usuario.perfil)
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
      .from("seguranca_trabalho_riscos")
      .select(
        "id,titulo,categoria,local_setor,fonte_risco,nivel_risco,probabilidade,severidade,responsavel_nome,prazo_adequacao,status"
      )
      .eq("municipio_id", usuario.municipio_id)
      .order("nivel_risco", { ascending: false })
      .order("prazo_adequacao", { ascending: true, nullsFirst: false });

    if (error) setErro(error.message);
    setRiscos((data as Risco[] | null) || []);
    setCarregando(false);
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return riscos.filter((item) =>
      `${item.titulo} ${item.categoria} ${item.local_setor || ""} ${item.fonte_risco || ""} ${item.nivel_risco} ${item.status}`
        .toLowerCase()
        .includes(termo)
    );
  }, [busca, riscos]);

  const criticos = riscos.filter((item) => item.nivel_risco === "CRITICO").length;
  const altos = riscos.filter((item) => item.nivel_risco === "ALTO").length;
  const vencidos = riscos.filter((item) => {
    const dias = diasAteSeguranca(item.prazo_adequacao);
    return dias !== null && dias < 0 && item.status !== "CONCLUIDO";
  }).length;

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "seguranca_trabalho_riscos",
      descricao:
        "Impressão do painel de segurança do trabalho e riscos ocupacionais.",
    });
    window.print();
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-[1700px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 print:border-black print:bg-white lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300 print:text-black">
                  Prevenção e conformidade
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  Segurança do Trabalho e Riscos Ocupacionais
                </h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Inventário de riscos, inspeções, acidentes, EPI, CAT e planos de prevenção.
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
                  href="/sistema/seguranca-trabalho/inspecoes"
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-4 py-3 text-sm font-black text-cyan-300"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Inspeções
                </Link>

                <Link
                  href="/sistema/acidentes-cat"
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-400/25 px-4 py-3 text-sm font-black text-rose-300"
                >
                  <TriangleAlert className="h-4 w-4" />
                  Acidentes e CAT
                </Link>


                <Link href="/sistema/epi-epc" className="inline-flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm font-black text-amber-300">Controle de EPI e EPC</Link>

                {podeGerenciar ? (
                  <Link
                    href="/sistema/seguranca-trabalho/novo"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"
                  >
                    <FilePlus2 className="h-4 w-4" />
                    Novo risco
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
            <Metrica titulo="Riscos cadastrados" valor={riscos.length} icone={HardHat} />
            <Metrica titulo="Críticos" valor={criticos} icone={ShieldAlert} />
            <Metrica titulo="Altos" valor={altos} icone={AlertTriangle} />
            <Metrica titulo="Prazos vencidos" valor={vencidos} icone={Construction} />
            <Metrica
              titulo="Em tratamento"
              valor={riscos.filter((item) => item.status === "EM_TRATAMENTO").length}
              icone={ShieldCheck}
            />
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {["FISICO", "QUIMICO", "BIOLOGICO", "ERGONOMICO", "ACIDENTE", "PSICOSSOCIAL"].map(
              (categoria) => (
                <div
                  key={categoria}
                  className="rounded-2xl border border-slate-800 bg-[#061326] p-4 print:border-black print:bg-white"
                >
                  <p className="text-[10px] font-black uppercase text-slate-500 print:text-black">
                    {formatarSeguranca(categoria)}
                  </p>
                  <p className="mt-2 text-xl font-black">
                    {riscos.filter((item) => item.categoria === categoria).length}
                  </p>
                </div>
              )
            )}
          </section>

          <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#061326] px-4 print:hidden">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar risco, categoria, local, fonte ou status..."
              className="h-12 w-full bg-transparent outline-none"
            />
          </label>

          {carregando ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
            </div>
          ) : (
            <section className="grid gap-4 xl:grid-cols-2">
              {filtrados.map((item) => {
                const dias = diasAteSeguranca(item.prazo_adequacao);
                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-cyan-300 print:text-black">
                          {formatarSeguranca(item.categoria)}
                        </p>
                        <h2 className="mt-1 text-lg font-black">{item.titulo}</h2>
                        <p className="mt-1 text-sm text-slate-500 print:text-black">
                          {item.local_setor || "Local não informado"}
                        </p>
                      </div>

                      <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-black uppercase text-cyan-300 print:text-black">
                        {formatarSeguranca(item.nivel_risco)}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                      <Indicador titulo="Probabilidade" valor={String(item.probabilidade)} />
                      <Indicador titulo="Severidade" valor={String(item.severidade)} />
                      <Indicador titulo="Pontuação" valor={String(item.probabilidade * item.severidade)} />
                      <Indicador titulo="Status" valor={formatarSeguranca(item.status)} />
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white">
                      <p className="text-[10px] font-black uppercase text-slate-500 print:text-black">
                        Fonte do risco
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {item.fonte_risco || "Não informada"}
                      </p>
                      <p className="mt-3 text-xs text-slate-500 print:text-black">
                        Responsável: {item.responsavel_nome || "não definido"} • Prazo:{" "}
                        {formatarDataSeguranca(item.prazo_adequacao)}
                        {dias !== null ? ` • ${dias} dia(s)` : ""}
                      </p>
                    </div>

                    <Link
                      href={`/sistema/seguranca-trabalho/${item.id}`}
                      className="mt-4 inline-flex rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 print:hidden"
                    >
                      Abrir risco e plano de ação
                    </Link>
                  </article>
                );
              })}

              {!filtrados.length ? (
                <div className="rounded-2xl border border-slate-800 bg-[#061326] p-14 text-center text-slate-500 xl:col-span-2">
                  Nenhum risco ocupacional cadastrado.
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
  icone: typeof HardHat;
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
