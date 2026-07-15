"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CarFront,
  ChevronLeft,
  Clock3,
  Loader2,
  MapPin,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import MobileBottomNav from "@/components/MobileBottomNav";
import { calcularGuarnicaoDia } from "@/lib/guarnicaoDia";
import { supabase } from "@/lib/supabase";

type UsuarioLogado = {
  id?: string | number;
  nome?: string;
  municipio_id?: number;
};

type Guarda = {
  id: number;
  nome: string;
};

function lerUsuario(): UsuarioLogado {
  try {
    return JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    ) as UsuarioLogado;
  } catch {
    return {};
  }
}

export default function MobilePlantaoPage() {
  const [usuario] = useState<UsuarioLogado>(() => lerUsuario());
  const [guarnicao, setGuarnicao] = useState<any>(null);
  const [membros, setMembros] = useState<Guarda[]>([]);
  const [patrulhamento, setPatrulhamento] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const horarioAtual = useMemo(
    () =>
      new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  async function carregar() {
    if (!usuario.municipio_id) {
      setErro("Município não identificado.");
      setCarregando(false);
      return;
    }

    const [config, guarnicoes, guardas, viaturas, patrulhamentoResposta] =
      await Promise.all([
        supabase
          .from("escala_operacional_config")
          .select("*")
          .eq("municipio_id", usuario.municipio_id)
          .eq("ativo", true)
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle(),

        supabase
          .from("guarnicoes")
          .select("*")
          .eq("municipio_id", usuario.municipio_id)
          .eq("ativa", true),

        supabase
          .from("guardas")
          .select("id,nome")
          .eq("municipio_id", usuario.municipio_id),

        supabase
          .from("viaturas")
          .select("*")
          .eq("municipio_id", usuario.municipio_id),

        supabase
          .from("patrulhamentos")
          .select("id,status,iniciado_em,distancia_km")
          .eq("municipio_id", usuario.municipio_id)
          .in("status", ["EM_ANDAMENTO", "PAUSADO"])
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    if (!config.data?.ordem_guarnicoes?.length) {
      setErro("Nenhuma escala operacional ativa.");
      setCarregando(false);
      return;
    }

    const atual = calcularGuarnicaoDia(
      config.data,
      guarnicoes.data || []
    );

    if (!atual) {
      setErro("Não foi possível identificar o plantão atual.");
      setCarregando(false);
      return;
    }

    const listaGuardas = (guardas.data || []) as Guarda[];

    const comandante = listaGuardas.find(
      (item) =>
        Number(item.id) === Number(atual.comandante_id)
    );

    const viatura = (viaturas.data || []).find(
      (item: any) =>
        Number(item.id) === Number(atual.viatura_id)
    );

    const membrosResposta = await supabase
      .from("guarnicao_membros")
      .select("guarda_id")
      .eq("guarnicao_id", atual.id);

    const ids = (membrosResposta.data || []).map(
      (item: any) => Number(item.guarda_id)
    );

    setMembros(
      listaGuardas.filter((item) =>
        ids.includes(Number(item.id))
      )
    );

    setGuarnicao({
      nome: atual.nome || "Guarnição",
      comandante: comandante?.nome || "Não informado",
      viatura: viatura?.prefixo || "Sem VTR",
      inicio: config.data.hora_inicio || "07:00",
      fim: config.data.hora_fim || "07:00",
    });

    setPatrulhamento(
      patrulhamentoResposta.error
        ? null
        : patrulhamentoResposta.data
    );

    setCarregando(false);
  }

  useEffect(() => {
    void carregar();
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#02060f] pb-28 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,#0d3b66_0%,transparent_36%),linear-gradient(180deg,#06111f_0%,#02060f_55%)] opacity-90" />

      <div className="relative z-10 mx-auto max-w-md px-3 pb-4 pt-3">
        <Link
          href="/sistema/mobile"
          className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 text-sm font-black text-slate-200"
        >
          <ChevronLeft className="h-5 w-5" />
          Voltar
        </Link>

        {carregando ? (
          <div className="flex min-h-[70vh] items-center justify-center">
            <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
          </div>
        ) : erro ? (
          <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-5 text-red-100">
            {erro}
          </div>
        ) : (
          <>
            <header className="rounded-[28px] border border-cyan-300/25 bg-gradient-to-br from-cyan-500/15 via-slate-900 to-slate-950 p-5 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400/15 ring-1 ring-cyan-300/20">
                  <ShieldCheck className="h-9 w-9 text-cyan-200" />
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">
                    Meu plantão
                  </p>
                  <h1 className="mt-1 truncate text-2xl font-black">
                    {guarnicao.nome}
                  </h1>
                  <p className="mt-1 text-sm text-slate-400">
                    Agora: {horarioAtual}
                  </p>
                </div>
              </div>
            </header>

            <section className="mt-4 grid grid-cols-2 gap-3">
              <Info
                icone={Clock3}
                titulo="Início"
                valor={guarnicao.inicio}
              />
              <Info
                icone={Clock3}
                titulo="Fim"
                valor={guarnicao.fim}
              />
              <Info
                icone={UserRound}
                titulo="Comandante"
                valor={guarnicao.comandante}
              />
              <Info
                icone={CarFront}
                titulo="Viatura"
                valor={guarnicao.viatura}
              />
            </section>

            <section className="mt-4 rounded-3xl border border-slate-800 bg-slate-900/85 p-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-cyan-300" />
                  <div>
                    <h2 className="font-black">Situação operacional</h2>
                    <p className="text-xs text-slate-500">
                      Status atual do serviço
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-black ${
                    patrulhamento
                      ? "bg-emerald-400/15 text-emerald-300"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {patrulhamento
                    ? String(patrulhamento.status).replaceAll("_", " ")
                    : "AGUARDANDO"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs font-black uppercase text-slate-500">
                    Distância
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {Number(
                      patrulhamento?.distancia_km || 0
                    ).toFixed(1)}{" "}
                    km
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs font-black uppercase text-slate-500">
                    Integrantes
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {membros.length}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-4 rounded-3xl border border-slate-800 bg-slate-900/85 p-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <Users className="h-6 w-6 text-cyan-300" />
                <div>
                  <h2 className="font-black">Equipe do plantão</h2>
                  <p className="text-xs text-slate-500">
                    Integrantes vinculados
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {membros.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-700 p-5 text-center text-sm text-slate-500">
                    Nenhum integrante vinculado.
                  </p>
                ) : (
                  membros.map((membro) => (
                    <div
                      key={membro.id}
                      className="flex min-h-14 items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10">
                        <UserRound className="h-5 w-5 text-cyan-300" />
                      </div>

                      <p className="font-black text-white">
                        {membro.nome}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        <MobileBottomNav />
      </div>
    </main>
  );
}

function Info({
  icone: Icone,
  titulo,
  valor,
}: {
  icone: typeof Clock3;
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/85 p-4 shadow-lg">
      <Icone className="h-5 w-5 text-cyan-300" />
      <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
        {titulo}
      </p>
      <p className="mt-1 truncate text-base font-black text-white">
        {valor}
      </p>
    </div>
  );
}
