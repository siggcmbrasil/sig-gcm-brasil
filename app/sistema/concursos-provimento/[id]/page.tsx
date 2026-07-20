"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  ShieldCheck,
  CalendarDays,
  FileText,
  Loader2,
  Plus,
  UserCheck,
  Users,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import {
  formatarConcursos,
  formatarDataConcurso,
  lerUsuarioConcursos,
  podeGerenciarConcursos,
} from "@/lib/concursosProvimento";
import { supabase } from "@/lib/supabase";

type Concurso = {
  id: number;
  numero_edital: string;
  titulo: string;
  cargo: string;
  vagas_imediatas: number;
  vagas_cadastro_reserva: number;
  vagas_cotas: number;
  data_publicacao: string | null;
  validade_ate: string | null;
  status: string;
  organizadora: string | null;
  descricao: string | null;
};

type Fase = {
  id: number;
  nome: string;
  ordem: number;
  data_inicio: string | null;
  data_fim: string | null;
  status: string;
};

export default function ConcursoDetalhePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [usuario] = useState(() => lerUsuarioConcursos());
  const [concurso, setConcurso] = useState<Concurso | null>(null);
  const [fases, setFases] = useState<Fase[]>([]);
  const [totalCandidatos, setTotalCandidatos] = useState(0);
  const [totalConvocados, setTotalConvocados] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarConcursos(usuario.perfil)
    : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id || !id) return;

    const [concursoResp, fasesResp, candidatosResp, convocadosResp] =
      await Promise.all([
        supabase
          .from("concursos_publicos")
          .select("*")
          .eq("id", id)
          .eq("municipio_id", usuario.municipio_id)
          .single(),
        supabase
          .from("concursos_fases")
          .select("id,nome,ordem,data_inicio,data_fim,status")
          .eq("concurso_id", id)
          .eq("municipio_id", usuario.municipio_id)
          .order("ordem"),
        supabase
          .from("concursos_candidatos")
          .select("id", { count: "exact", head: true })
          .eq("concurso_id", id)
          .eq("municipio_id", usuario.municipio_id),
        supabase
          .from("concursos_convocacoes")
          .select("id", { count: "exact", head: true })
          .eq("concurso_id", id)
          .eq("municipio_id", usuario.municipio_id),
      ]);

    if (concursoResp.error) setErro(concursoResp.error.message);
    setConcurso((concursoResp.data as Concurso | null) || null);
    setFases((fasesResp.data as Fase[] | null) || []);
    setTotalCandidatos(candidatosResp.count || 0);
    setTotalConvocados(convocadosResp.count || 0);
    setCarregando(false);
  }, [id, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020b1c]">
        <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
      </div>
    );
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link href="/sistema/concursos-provimento" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>

            {concurso ? (
              <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-cyan-300">
                    Edital {concurso.numero_edital}
                  </p>
                  <h1 className="mt-1 text-2xl font-black">{concurso.titulo}</h1>
                  <p className="mt-2 text-sm text-slate-400">
                    {concurso.cargo} • {concurso.organizadora || "Organizadora não informada"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link href={`/sistema/concursos-provimento/${id}/candidatos`} className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-black">
                    Candidatos
                  </Link>
                  {podeGerenciar ? (
                    <Link href={`/sistema/concursos-provimento/${id}/candidatos/novo`} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950">
                      <Plus className="h-4 w-4" />
                      Adicionar candidato
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
          </header>

          {erro ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">{erro}</div> : null}

          {concurso ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <Card titulo="Status" valor={formatarConcursos(concurso.status)} icone={BadgeCheck} />
                <Card titulo="Vagas" valor={String(concurso.vagas_imediatas)} icone={Users} />
                <Card titulo="Reserva" valor={String(concurso.vagas_cadastro_reserva)} icone={Users} />
                <Card titulo="Cotas" valor={String(concurso.vagas_cotas)} icone={ShieldCheck} />
                <Card titulo="Candidatos" valor={String(totalCandidatos)} icone={UserCheck} />
                <Card titulo="Convocações" valor={String(totalConvocados)} icone={FileText} />
              </section>

              <section className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 lg:col-span-2">
                  <h2 className="font-black">Fases do concurso</h2>
                  <div className="mt-4 space-y-3">
                    {fases.map((fase) => (
                      <div key={fase.id} className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-black">{fase.ordem}. {fase.nome}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatarDataConcurso(fase.data_inicio)} até {formatarDataConcurso(fase.data_fim)}
                            </p>
                          </div>
                          <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-black uppercase text-cyan-300">
                            {formatarConcursos(fase.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {!fases.length ? <p className="py-10 text-center text-slate-500">Nenhuma fase cadastrada.</p> : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
                  <h2 className="font-black">Informações</h2>
                  <div className="mt-4 space-y-3 text-sm">
                    <Info titulo="Publicação" valor={formatarDataConcurso(concurso.data_publicacao)} />
                    <Info titulo="Validade" valor={formatarDataConcurso(concurso.validade_ate)} />
                    <Info titulo="Organizadora" valor={concurso.organizadora || "—"} />
                  </div>
                  {concurso.descricao ? <p className="mt-5 text-sm text-slate-400">{concurso.descricao}</p> : null}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Card({ titulo, valor, icone: Icone }: { titulo: string; valor: string; icone: typeof Users }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
      <Icone className="h-6 w-6 text-cyan-300" />
      <p className="mt-4 text-[10px] font-black uppercase tracking-wider text-slate-500">{titulo}</p>
      <p className="mt-1 text-lg font-black">{valor}</p>
    </div>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
      <CalendarDays className="mt-0.5 h-4 w-4 text-cyan-300" />
      <div>
        <p className="text-[10px] font-black uppercase text-slate-500">{titulo}</p>
        <p className="mt-1 font-bold">{valor}</p>
      </div>
    </div>
  );
}
