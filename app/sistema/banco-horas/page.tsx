"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Filter,
  Loader2,
  PlusCircle,
  RefreshCw,
  Search,
  Users,
  XCircle,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { supabase } from "@/lib/supabase";
import {
  formatarDataBancoHoras,
  formatarHoras,
  lerUsuarioBancoHoras,
  normalizarBancoHoras,
  podeGerenciarBancoHoras,
} from "@/lib/bancoHoras";

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
};

type Lancamento = {
  id: number;
  guarda_id: number;
  tipo: string;
  categoria: string | null;
  data: string | null;
  horas: number;
  motivo: string | null;
  criado_em: string | null;
};

type Solicitacao = {
  id: number;
  guarda_id: number;
  guarda_nome: string;
  matricula: string | null;
  data_compensacao: string;
  horas: number;
  motivo: string;
  status: string;
  criado_em: string;
};

export default function BancoHorasPage() {
  const [usuario] = useState(() => lerUsuarioBancoHoras());
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("TODOS");

  const gerencia = usuario ? podeGerenciarBancoHoras(usuario.perfil) : false;

  const carregar = useCallback(async (silencioso = false) => {
    if (!usuario?.municipio_id) {
      setErro("Sessão ou município não identificado.");
      setCarregando(false);
      return;
    }

    silencioso ? setAtualizando(true) : setCarregando(true);
    setErro("");

    try {
      const [guardasResposta, lancamentosResposta, solicitacoesResposta] =
        await Promise.all([
          supabase
            .from("guardas")
            .select("id,nome,matricula")
            .eq("municipio_id", usuario.municipio_id)
            .order("nome"),
          supabase
            .from("banco_horas_guardas")
            .select("id,guarda_id,tipo,categoria,data,horas,motivo,criado_em")
            .eq("municipio_id", usuario.municipio_id)
            .order("data", { ascending: false })
            .order("id", { ascending: false }),
          supabase
            .from("banco_horas_solicitacoes")
            .select("id,guarda_id,guarda_nome,matricula,data_compensacao,horas,motivo,status,criado_em")
            .eq("municipio_id", usuario.municipio_id)
            .order("criado_em", { ascending: false }),
        ]);

      const primeiroErro =
        guardasResposta.error ||
        lancamentosResposta.error ||
        solicitacoesResposta.error;

      if (primeiroErro) {
        if (primeiroErro.code === "42P01" || primeiroErro.code === "42703") {
          throw new Error(
            "Execute primeiro o arquivo supabase/BANCO_HORAS.sql."
          );
        }
        throw primeiroErro;
      }

      let listaGuardas = (guardasResposta.data as Guarda[] | null) || [];
      let listaLancamentos =
        (lancamentosResposta.data as Lancamento[] | null) || [];
      let listaSolicitacoes =
        (solicitacoesResposta.data as Solicitacao[] | null) || [];

      if (!gerencia) {
        const nomeUsuario = normalizarBancoHoras(usuario.nome);
        const meuGuarda = listaGuardas.find(
          (guarda) =>
            (usuario.matricula &&
              guarda.matricula === usuario.matricula) ||
            normalizarBancoHoras(guarda.nome) === nomeUsuario
        );

        if (!meuGuarda) {
          listaGuardas = [];
          listaLancamentos = [];
          listaSolicitacoes = [];
        } else {
          listaGuardas = [meuGuarda];
          listaLancamentos = listaLancamentos.filter(
            (item) => item.guarda_id === meuGuarda.id
          );
          listaSolicitacoes = listaSolicitacoes.filter(
            (item) => item.guarda_id === meuGuarda.id
          );
        }
      }

      setGuardas(listaGuardas);
      setLancamentos(listaLancamentos);
      setSolicitacoes(listaSolicitacoes);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o banco de horas."
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [gerencia, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const saldos = useMemo(() => {
    const mapa = new Map<number, number>();

    for (const item of lancamentos) {
      const valor = Number(item.horas || 0);
      const sinal =
        normalizarBancoHoras(item.tipo) === "DEBITO" ? -1 : 1;
      mapa.set(
        item.guarda_id,
        Number(mapa.get(item.guarda_id) || 0) + valor * sinal
      );
    }

    return mapa;
  }, [lancamentos]);

  const metricas = useMemo(() => {
    const saldoTotal = Array.from(saldos.values()).reduce(
      (total, valor) => total + valor,
      0
    );

    return {
      guardas: guardas.length,
      saldoTotal,
      pendentes: solicitacoes.filter(
        (item) => normalizarBancoHoras(item.status) === "PENDENTE"
      ).length,
      aprovadas: solicitacoes.filter(
        (item) => normalizarBancoHoras(item.status) === "APROVADA"
      ).length,
    };
  }, [guardas.length, saldos, solicitacoes]);

  const listaFiltrada = useMemo(() => {
    const termo = normalizarBancoHoras(busca);

    return guardas.filter((guarda) => {
      const saldo = saldos.get(guarda.id) || 0;
      const possuiStatus =
        status === "TODOS" ||
        (status === "POSITIVO" && saldo > 0) ||
        (status === "ZERADO" && saldo === 0) ||
        (status === "NEGATIVO" && saldo < 0);

      const possuiBusca =
        !termo ||
        normalizarBancoHoras(
          `${guarda.nome} ${guarda.matricula || ""}`
        ).includes(termo);

      return possuiStatus && possuiBusca;
    });
  }, [busca, guardas, saldos, status]);

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto w-full max-w-[1700px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 lg:p-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                  Gestão de pessoal
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  Banco de Horas
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  Créditos, débitos, compensações, solicitações e saldo
                  individual.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => void carregar(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm font-black"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      atualizando ? "animate-spin" : ""
                    }`}
                  />
                  Atualizar
                </button>

                <Link
                  href="/sistema/banco-horas/solicitacoes"
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-300"
                >
                  <CalendarClock className="h-4 w-4" />
                  Solicitações
                </Link>
              </div>
            </div>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metrica
              titulo="Servidores"
              valor={String(metricas.guardas)}
              icone={Users}
            />
            <Metrica
              titulo="Saldo consolidado"
              valor={formatarHoras(metricas.saldoTotal)}
              icone={Clock3}
            />
            <Metrica
              titulo="Solicitações pendentes"
              valor={String(metricas.pendentes)}
              icone={CalendarClock}
            />
            <Metrica
              titulo="Solicitações aprovadas"
              valor={String(metricas.aprovadas)}
              icone={CheckCircle2}
            />
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/50 px-4">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Buscar por nome ou matrícula..."
                  className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-600"
                />
              </label>

              <div className="flex gap-2 overflow-x-auto">
                {["TODOS", "POSITIVO", "ZERADO", "NEGATIVO"].map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => setStatus(item)}
                      className={`whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-black ${
                        status === item
                          ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                          : "border-slate-700 text-slate-400"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            </div>
          </section>

          {carregando ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
            </div>
          ) : listaFiltrada.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-700 p-12 text-center text-slate-500">
              Nenhum servidor encontrado.
            </div>
          ) : (
            <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {listaFiltrada.map((guarda) => {
                const saldo = saldos.get(guarda.id) || 0;
                const pendentes = solicitacoes.filter(
                  (item) =>
                    item.guarda_id === guarda.id &&
                    normalizarBancoHoras(item.status) === "PENDENTE"
                ).length;

                return (
                  <Link
                    key={guarda.id}
                    href={`/sistema/guardas/${guarda.id}/banco-horas`}
                    className="rounded-2xl border border-slate-800 bg-[#061326] p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-black">{guarda.nome}</h2>
                        <p className="mt-1 text-xs text-slate-500">
                          Matrícula: {guarda.matricula || "Não informada"}
                        </p>
                      </div>
                      {saldo > 0 ? (
                        <ArrowUpCircle className="h-6 w-6 text-emerald-300" />
                      ) : saldo < 0 ? (
                        <ArrowDownCircle className="h-6 w-6 text-rose-300" />
                      ) : (
                        <Clock3 className="h-6 w-6 text-slate-500" />
                      )}
                    </div>

                    <p className="mt-6 text-xs font-black uppercase tracking-wider text-slate-500">
                      Saldo atual
                    </p>
                    <p
                      className={`mt-1 text-3xl font-black ${
                        saldo > 0
                          ? "text-emerald-300"
                          : saldo < 0
                            ? "text-rose-300"
                            : "text-slate-300"
                      }`}
                    >
                      {formatarHoras(saldo)}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-500">
                      <span>{pendentes} solicitação(ões) pendente(s)</span>
                      <span>Abrir histórico</span>
                    </div>
                  </Link>
                );
              })}
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
  icone: typeof Clock3;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300">
        <Icone className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-wider text-slate-500">
        {titulo}
      </p>
      <p className="mt-1 text-2xl font-black">{valor}</p>
    </div>
  );
}
