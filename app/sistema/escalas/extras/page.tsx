"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  MapPin,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { supabase } from "@/lib/supabase";
import {
  formatarDataEscalaExtra,
  lerUsuarioEscalaExtra,
  normalizarEscalaExtra,
  podeGerenciarEscalaExtra,
} from "@/lib/escalaExtraordinaria";

type Evento = {
  id: number;
  titulo: string;
  tipo: string;
  local: string | null;
  data: string;
  hora_inicio: string | null;
  hora_fim: string | null;
  efetivo_necessario: number | null;
  comandante_nome: string | null;
  viatura_prefixo: string | null;
  status: string;
  total_presentes: number | null;
  total_ausentes: number | null;
};

export default function EscalasExtrasPage() {
  const [usuario] = useState(() => lerUsuarioEscalaExtra());
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("TODOS");

  const gerencia = usuario ? podeGerenciarEscalaExtra(usuario.perfil) : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) {
      setErro("Sessão ou município não identificado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      let consulta = supabase
        .from("escalas_extras")
        .select("*")
        .eq("municipio_id", usuario.municipio_id)
        .order("data", { ascending: false })
        .order("hora_inicio", { ascending: false });

      if (!gerencia) {
        const { data: guarda } = await supabase
          .from("guardas")
          .select("id")
          .eq("municipio_id", usuario.municipio_id)
          .or(
            `usuario_id.eq.${Number(usuario.id)},matricula.eq.${usuario.matricula || "__SEM__"}`
          )
          .maybeSingle();

        if (!guarda?.id) {
          setEventos([]);
          setCarregando(false);
          return;
        }

        const { data: convocacoes, error: erroConvocacoes } = await supabase
          .from("escalas_extras_convocados")
          .select("escala_extra_id")
          .eq("municipio_id", usuario.municipio_id)
          .eq("guarda_id", guarda.id);

        if (erroConvocacoes) throw erroConvocacoes;

        const ids = (convocacoes || []).map((item) => item.escala_extra_id);
        if (ids.length === 0) {
          setEventos([]);
          setCarregando(false);
          return;
        }

        consulta = consulta.in("id", ids);
      }

      const { data, error } = await consulta;
      if (error) {
        if (error.code === "42P01" || error.code === "42703") {
          throw new Error(
            "Execute primeiro supabase/ESCALA_EXTRAORDINARIA.sql."
          );
        }
        throw error;
      }

      setEventos((data as Evento[] | null) || []);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as escalas extraordinárias."
      );
    } finally {
      setCarregando(false);
    }
  }, [gerencia, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const metricas = useMemo(
    () => ({
      total: eventos.length,
      planejados: eventos.filter((item) =>
        ["RASCUNHO", "PUBLICADO"].includes(normalizarEscalaExtra(item.status))
      ).length,
      andamento: eventos.filter(
        (item) => normalizarEscalaExtra(item.status) === "EM_ANDAMENTO"
      ).length,
      finalizados: eventos.filter(
        (item) => normalizarEscalaExtra(item.status) === "FINALIZADO"
      ).length,
    }),
    [eventos]
  );

  const filtrados = useMemo(() => {
    const termo = normalizarEscalaExtra(busca);
    return eventos.filter((item) => {
      const correspondeBusca =
        !termo ||
        normalizarEscalaExtra(
          `${item.titulo} ${item.tipo} ${item.local || ""} ${
            item.comandante_nome || ""
          }`
        ).includes(termo);
      const correspondeStatus =
        status === "TODOS" ||
        normalizarEscalaExtra(item.status) === status;
      return correspondeBusca && correspondeStatus;
    });
  }, [busca, eventos, status]);

  return (
    <ProtecaoModulo modulo="escalas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-[1700px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 lg:p-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                  Escalas
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  Escala Extraordinária e Eventos
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  Operações especiais, eventos, reforços e convocações.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => void carregar()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm font-black"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar
                </button>

                {gerencia ? (
                  <Link
                    href="/sistema/escalas/extras/nova"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Novo evento
                  </Link>
                ) : null}
              </div>
            </div>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metrica titulo="Eventos" valor={metricas.total} icone={CalendarClock} />
            <Metrica titulo="Planejados" valor={metricas.planejados} icone={ClipboardList} />
            <Metrica titulo="Em andamento" valor={metricas.andamento} icone={ShieldCheck} />
            <Metrica titulo="Finalizados" valor={metricas.finalizados} icone={CheckCircle2} />
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/50 px-4">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Buscar por título, tipo, local ou comandante..."
                  className="h-12 w-full bg-transparent text-sm outline-none"
                />
              </label>

              <div className="flex gap-2 overflow-x-auto">
                {["TODOS", "RASCUNHO", "PUBLICADO", "EM_ANDAMENTO", "FINALIZADO"].map(
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
                      {item.replaceAll("_", " ")}
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
          ) : filtrados.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-700 p-12 text-center text-slate-500">
              Nenhuma escala extraordinária encontrada.
            </div>
          ) : (
            <section className="grid gap-4 xl:grid-cols-2">
              {filtrados.map((item) => (
                <Link
                  key={item.id}
                  href={`/sistema/escalas/extras/${item.id}`}
                  className="rounded-2xl border border-slate-800 bg-[#061326] p-5 transition hover:border-cyan-400/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-black">{item.titulo}</h2>
                      <p className="mt-1 text-xs text-cyan-300">
                        {item.tipo.replaceAll("_", " ")}
                      </p>
                    </div>
                    <Status status={item.status} />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Info
                      icone={CalendarClock}
                      texto={`${formatarDataEscalaExtra(item.data)} • ${
                        item.hora_inicio?.slice(0, 5) || "--"
                      } às ${item.hora_fim?.slice(0, 5) || "--"}`}
                    />
                    <Info
                      icone={MapPin}
                      texto={item.local || "Local não informado"}
                    />
                    <Info
                      icone={Users}
                      texto={`Efetivo necessário: ${
                        item.efetivo_necessario || 0
                      }`}
                    />
                    <Info
                      icone={ShieldCheck}
                      texto={item.comandante_nome || "Sem comandante"}
                    />
                  </div>
                </Link>
              ))}
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
  icone: typeof CalendarClock;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
      <Icone className="h-6 w-6 text-cyan-300" />
      <p className="mt-4 text-xs font-black uppercase tracking-wider text-slate-500">
        {titulo}
      </p>
      <p className="mt-1 text-2xl font-black">{valor}</p>
    </div>
  );
}

function Info({
  icone: Icone,
  texto,
}: {
  icone: typeof CalendarClock;
  texto: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-300">
      <Icone className="h-4 w-4 text-cyan-300" />
      {texto}
    </div>
  );
}

function Status({ status }: { status: string }) {
  const normalizado = normalizarEscalaExtra(status);
  const classe =
    normalizado === "FINALIZADO"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
      : normalizado === "EM_ANDAMENTO"
        ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-300"
        : normalizado === "CANCELADO"
          ? "border-rose-400/25 bg-rose-400/10 text-rose-300"
          : "border-amber-400/25 bg-amber-400/10 text-amber-300";

  return (
    <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${classe}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
