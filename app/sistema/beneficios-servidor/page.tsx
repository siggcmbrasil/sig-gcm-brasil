"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarClock,
  FilePlus2,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  formatarData,
  formatarMoeda,
  formatarTexto,
  lerUsuarioBeneficios,
  podeGerenciarBeneficios,
} from "@/lib/beneficiosServidor";
import { supabase } from "@/lib/supabase";

type Beneficio = {
  id: number;
  guarda_id: number | null;
  guarda_nome: string;
  matricula: string | null;
  tipo_beneficio: string;
  status: string;
  data_solicitacao: string;
  inicio_vigencia: string | null;
  fim_vigencia: string | null;
  valor_mensal: number | null;
  responsavel_nome: string | null;
  observacoes: string | null;
};

export default function BeneficiosServidorPage() {
  const [usuario] = useState(() => lerUsuarioBeneficios());
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarBeneficios(usuario.perfil)
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
      .from("beneficios_servidor")
      .select(
        "id,guarda_id,guarda_nome,matricula,tipo_beneficio,status,data_solicitacao,inicio_vigencia,fim_vigencia,valor_mensal,responsavel_nome,observacoes"
      )
      .eq("municipio_id", usuario.municipio_id)
      .order("data_solicitacao", { ascending: false });

    if (error) setErro(error.message);
    setBeneficios((data as Beneficio[] | null) || []);
    setCarregando(false);
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return beneficios.filter((item) =>
      `${item.guarda_nome} ${item.matricula || ""} ${item.tipo_beneficio} ${item.status}`
        .toLowerCase()
        .includes(termo)
    );
  }, [beneficios, busca]);

  const ativos = beneficios.filter((item) => item.status === "ATIVO").length;
  const pendentes = beneficios.filter(
    (item) => item.status === "EM_ANALISE" || item.status === "SOLICITADO"
  ).length;
  const suspensos = beneficios.filter(
    (item) => item.status === "SUSPENSO"
  ).length;
  const valorMensal = beneficios
    .filter((item) => item.status === "ATIVO")
    .reduce((total, item) => total + Number(item.valor_mensal || 0), 0);

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "beneficios_servidor",
      descricao: "Impressão do painel de benefícios do servidor.",
    });
    window.print();
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <div className="fixed bottom-5 left-5 z-40 print:hidden">
        <Link
          href="/sistema/previdencia-aposentadoria"
          className="rounded-xl border border-cyan-400/25 bg-[#061326] px-4 py-3 text-sm font-black text-cyan-300 shadow-xl"
        >
          Previdência e Aposentadoria
        </Link>
      </div>

      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-[1650px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 print:border-black print:bg-white lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300 print:text-black">
                  Direitos, auxílios e programas internos
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  Benefícios do Servidor
                </h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Solicitações, análise, vigência, pagamentos, suspensão, renovação e histórico.
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
                    href="/sistema/beneficios-servidor/novo"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"
                  >
                    <FilePlus2 className="h-4 w-4" />
                    Novo benefício
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
            <Metrica titulo="Registros" valor={String(beneficios.length)} icone={UsersRound} />
            <Metrica titulo="Ativos" valor={String(ativos)} icone={ShieldCheck} />
            <Metrica titulo="Pendentes" valor={String(pendentes)} icone={CalendarClock} />
            <Metrica titulo="Suspensos" valor={String(suspensos)} icone={BadgeDollarSign} />
            <Metrica titulo="Valor mensal ativo" valor={formatarMoeda(valorMensal)} icone={BadgeDollarSign} />
          </section>

          <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#061326] px-4 print:hidden">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar servidor, matrícula, benefício ou status..."
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
                        {formatarTexto(item.tipo_beneficio)}
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
                    <Info titulo="Solicitação" valor={formatarData(item.data_solicitacao)} />
                    <Info titulo="Início" valor={formatarData(item.inicio_vigencia)} />
                    <Info titulo="Fim" valor={formatarData(item.fim_vigencia)} />
                    <Info titulo="Valor mensal" valor={formatarMoeda(item.valor_mensal)} />
                  </div>

                  <Link
                    href={`/sistema/beneficios-servidor/${item.id}`}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 print:hidden"
                  >
                    Abrir benefício
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}

              {!filtrados.length ? (
                <div className="rounded-2xl border border-slate-800 bg-[#061326] p-14 text-center text-slate-500 xl:col-span-2">
                  Nenhum benefício cadastrado.
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
  valor: string;
  icone: typeof BadgeDollarSign;
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
