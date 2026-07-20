"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FilePlus2,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import {
  estiloPrioridadeOS,
  estiloStatusOS,
  formatarDataOS,
  lerUsuarioOS,
  normalizarOS,
  podeGerenciarOS,
} from "@/lib/ordemServico";

type Ordem = {
  id: number;
  numero: string;
  titulo: string;
  missao: string;
  prioridade: string;
  status: string;
  data_inicio: string;
  hora_inicio: string | null;
  local: string | null;
  equipe: string | null;
  comandante_nome: string | null;
  criado_em: string;
};

const STATUS = ["TODOS", "RASCUNHO", "PUBLICADA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"];

export default function OrdensServicoPage() {
  const [usuario] = useState(() => lerUsuarioOS());
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("TODOS");

  const carregar = useCallback(async (silencioso = false) => {
    if (!usuario?.municipio_id) {
      setErro("Sessão ou município não identificado.");
      setCarregando(false);
      return;
    }

    silencioso ? setAtualizando(true) : setCarregando(true);
    setErro("");

    try {
      let consulta = supabase
        .from("ordens_servico")
        .select("id,numero,titulo,missao,prioridade,status,data_inicio,hora_inicio,local,equipe,comandante_nome,criado_em")
        .eq("municipio_id", usuario.municipio_id)
        .order("data_inicio", { ascending: false })
        .order("id", { ascending: false });

      if (!podeGerenciarOS(usuario.perfil)) {
        const guardaResposta = await supabase
          .from("guardas")
          .select("id")
          .eq("municipio_id", usuario.municipio_id)
          .or(
            usuario.matricula
              ? `matricula.eq.${usuario.matricula},nome.ilike.${usuario.nome}`
              : `nome.ilike.${usuario.nome}`
          )
          .limit(1)
          .maybeSingle();

        const guardaId = guardaResposta.data?.id;
        if (guardaId) {
          const designados = await supabase
            .from("ordens_servico_designados")
            .select("ordem_servico_id")
            .eq("municipio_id", usuario.municipio_id)
            .eq("guarda_id", guardaId);

          const ids = (designados.data || []).map((item) => item.ordem_servico_id);
          if (ids.length === 0) {
            setOrdens([]);
            return;
          }
          consulta = consulta.in("id", ids).neq("status", "RASCUNHO");
        } else {
          setOrdens([]);
          return;
        }
      }

      const resposta = await consulta;
      if (resposta.error) {
        if (resposta.error.code === "42P01") {
          throw new Error("Execute primeiro o arquivo supabase/ORDEM_SERVICO.sql.");
        }
        throw resposta.error;
      }

      setOrdens((resposta.data as Ordem[] | null) || []);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível carregar as ordens.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtradas = useMemo(() => {
    const termo = normalizarOS(busca);
    return ordens.filter((ordem) => {
      const atendeStatus = status === "TODOS" || normalizarOS(ordem.status) === status;
      const atendeBusca =
        !termo ||
        normalizarOS(`${ordem.numero} ${ordem.titulo} ${ordem.missao} ${ordem.local || ""} ${ordem.equipe || ""}`).includes(termo);
      return atendeStatus && atendeBusca;
    });
  }, [busca, ordens, status]);

  const metricas = useMemo(() => ({
    total: ordens.length,
    publicadas: ordens.filter((item) => normalizarOS(item.status) === "PUBLICADA").length,
    andamento: ordens.filter((item) => normalizarOS(item.status) === "EM_ANDAMENTO").length,
    concluidas: ordens.filter((item) => normalizarOS(item.status) === "CONCLUIDA").length,
  }), [ordens]);

  return (
    <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
      <div className="mx-auto w-full max-w-[1700px] space-y-5">
        <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 lg:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
                <ClipboardList className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">Comando operacional</p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">Ordens de Serviço</h1>
                <p className="mt-2 text-sm text-slate-400">
                  Planejamento, ciência, execução e relatório das missões institucionais.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => void carregar(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm font-black"
              >
                <RefreshCw className={`h-4 w-4 ${atualizando ? "animate-spin" : ""}`} />
                Atualizar
              </button>

              {usuario && podeGerenciarOS(usuario.perfil) ? (
                <Link
                  href="/sistema/ordens-servico/nova"
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950"
                >
                  <FilePlus2 className="h-4 w-4" />
                  Nova ordem
                </Link>
              ) : null}
            </div>
          </div>
        </header>

        {erro ? (
          <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">{erro}</div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metrica titulo="Total" valor={metricas.total} icone={ClipboardList} />
          <Metrica titulo="Publicadas" valor={metricas.publicadas} icone={CalendarDays} />
          <Metrica titulo="Em andamento" valor={metricas.andamento} icone={Clock3} />
          <Metrica titulo="Concluídas" valor={metricas.concluidas} icone={CheckCircle2} />
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#061326] p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/50 px-4">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por número, missão, local ou equipe..."
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-600"
              />
            </label>

            <div className="flex gap-2 overflow-x-auto">
              {STATUS.map((item) => (
                <button
                  key={item}
                  onClick={() => setStatus(item)}
                  className={`whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-black ${
                    status === item
                      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                      : "border-slate-700 text-slate-400"
                  }`}
                >
                  {item.replaceAll("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </section>

        {carregando ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
          </div>
        ) : filtradas.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-700 p-12 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-slate-600" />
            <p className="mt-4 font-black">Nenhuma ordem encontrada</p>
            <p className="mt-2 text-sm text-slate-500">Crie uma ordem ou altere os filtros.</p>
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {filtradas.map((ordem) => (
              <Link
                key={ordem.id}
                href={`/sistema/ordens-servico/${ordem.id}`}
                className="group rounded-2xl border border-slate-800 bg-[#061326] p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-cyan-300">{ordem.numero}</p>
                    <h2 className="mt-2 text-lg font-black">{ordem.titulo}</h2>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${estiloStatusOS(ordem.status)}`}>
                    {ordem.status.replaceAll("_", " ")}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-400">{ordem.missao}</p>

                <div className="mt-5 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                  <span><CalendarDays className="mr-1 inline h-3.5 w-3.5" />{formatarDataOS(ordem.data_inicio)} {ordem.hora_inicio?.slice(0, 5) || ""}</span>
                  <span className={estiloPrioridadeOS(ordem.prioridade)}>Prioridade: {ordem.prioridade}</span>
                  <span><MapPin className="mr-1 inline h-3.5 w-3.5" />{ordem.local || "Local não informado"}</span>
                  <span><Users className="mr-1 inline h-3.5 w-3.5" />{ordem.equipe || "Equipe não informada"}</span>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function Metrica({ titulo, valor, icone: Icone }: { titulo: string; valor: number; icone: typeof Shield }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300">
        <Icone className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-wider text-slate-500">{titulo}</p>
      <p className="mt-1 text-2xl font-black">{valor}</p>
    </div>
  );
}
