"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Brain,
  CalendarDays,
  HeartHandshake,
  Loader2,
  LockKeyhole,
  Printer,
  ShieldAlert,
  UserCheck,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  formatarDataSaudeMental,
  formatarSaudeMental,
  lerUsuarioSaudeMental,
  podeVerClinicoSaudeMental,
} from "@/lib/saudeMental";
import { supabase } from "@/lib/supabase";

type Acompanhamento = {
  id: number;
  guarda_nome: string;
  matricula: string | null;
  tipo_atendimento: string;
  data_inicio: string;
  proximo_atendimento: string | null;
  status: string;
  prioridade: string;
  motivo_administrativo: string | null;
  possui_restricao_funcional: boolean;
  afastamento_recomendado: boolean;
  retorno_trabalho_previsto: string | null;
};

type Atendimento = {
  id: number;
  data_atendimento: string;
  tipo: string;
  profissional_nome: string | null;
  encaminhamento: string | null;
  proximo_atendimento: string | null;
  status: string;
};

type Plano = {
  id: number;
  titulo: string;
  data_inicio: string;
  data_fim: string | null;
  progresso: number;
  status: string;
};

export default function SaudeMentalDetalhePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [usuario] = useState(() => lerUsuarioSaudeMental());
  const [registro, setRegistro] = useState<Acompanhamento | null>(null);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const podeVerClinico = usuario
    ? podeVerClinicoSaudeMental(usuario.perfil)
    : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id || !id) return;

    const [registroResp, atendimentosResp, planosResp] = await Promise.all([
      supabase
        .from("saude_mental_acompanhamentos")
        .select("*")
        .eq("id", id)
        .eq("municipio_id", usuario.municipio_id)
        .single(),
      supabase
        .from("saude_mental_atendimentos")
        .select(
          "id,data_atendimento,tipo,profissional_nome,encaminhamento,proximo_atendimento,status"
        )
        .eq("acompanhamento_id", id)
        .eq("municipio_id", usuario.municipio_id)
        .order("data_atendimento", { ascending: false }),
      supabase
        .from("saude_mental_planos_acompanhamento")
        .select("id,titulo,data_inicio,data_fim,progresso,status")
        .eq("acompanhamento_id", id)
        .eq("municipio_id", usuario.municipio_id)
        .order("data_inicio", { ascending: false }),
    ]);

    if (registroResp.error) setErro(registroResp.error.message);
    setRegistro((registroResp.data as Acompanhamento | null) || null);
    setAtendimentos((atendimentosResp.data as Atendimento[] | null) || []);
    setPlanos((planosResp.data as Plano[] | null) || []);
    setCarregando(false);
  }, [id, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "saude_mental_acompanhamentos",
      registro_id: id,
      descricao:
        "Impressão do acompanhamento administrativo psicossocial.",
    });
    window.print();
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020b1c]">
        <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
      </div>
    );
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 print:border-black print:bg-white lg:p-7">
            <div className="flex items-center justify-between gap-4">
              <Link
                href="/sistema/saude-mental"
                className="inline-flex items-center gap-2 text-sm font-black text-cyan-300 print:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>

              <button
                onClick={() => void imprimir()}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-4 py-3 text-sm font-black text-cyan-300 print:hidden"
              >
                <Printer className="h-4 w-4" />
                Imprimir/PDF
              </button>
            </div>

            {registro ? (
              <div className="mt-5">
                <p className="text-xs font-black uppercase text-cyan-300 print:text-black">
                  {registro.matricula || "Sem matrícula"}
                </p>
                <h1 className="mt-1 text-2xl font-black">
                  {registro.guarda_nome}
                </h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  {formatarSaudeMental(registro.tipo_atendimento)} •{" "}
                  {formatarSaudeMental(registro.status)}
                </p>
              </div>
            ) : null}
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">
              {erro}
            </div>
          ) : null}

          {registro ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card
                  titulo="Prioridade"
                  valor={formatarSaudeMental(registro.prioridade)}
                  icone={ShieldAlert}
                />
                <Card
                  titulo="Início"
                  valor={formatarDataSaudeMental(registro.data_inicio)}
                  icone={CalendarDays}
                />
                <Card
                  titulo="Próximo atendimento"
                  valor={formatarDataSaudeMental(registro.proximo_atendimento)}
                  icone={HeartHandshake}
                />
                <Card
                  titulo="Retorno previsto"
                  valor={formatarDataSaudeMental(
                    registro.retorno_trabalho_previsto
                  )}
                  icone={UserCheck}
                />
              </section>

              {registro.motivo_administrativo ? (
                <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.05] p-5 print:border-black print:bg-white">
                  <h2 className="font-black">Motivo administrativo</h2>
                  <p className="mt-2 text-sm text-slate-400 print:text-black">
                    {registro.motivo_administrativo}
                  </p>
                </section>
              ) : null}

              <section className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
                  <h2 className="font-black">Atendimentos registrados</h2>

                  <div className="mt-4 space-y-3">
                    {atendimentos.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black">
                              {formatarSaudeMental(item.tipo)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 print:text-black">
                              {formatarDataSaudeMental(item.data_atendimento)}
                            </p>
                          </div>
                          <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-black uppercase text-cyan-300 print:text-black">
                            {formatarSaudeMental(item.status)}
                          </span>
                        </div>

                        <p className="mt-3 text-xs text-slate-500 print:text-black">
                          Profissional:{" "}
                          {item.profissional_nome || "não informado"}
                        </p>

                        {item.encaminhamento ? (
                          <p className="mt-3 text-sm text-slate-400 print:text-black">
                            Encaminhamento: {item.encaminhamento}
                          </p>
                        ) : null}
                      </article>
                    ))}

                    {!atendimentos.length ? (
                      <p className="py-10 text-center text-slate-500">
                        Nenhum atendimento administrativo registrado.
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
                  <h2 className="font-black">Planos de acompanhamento</h2>

                  <div className="mt-4 space-y-3">
                    {planos.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black">{item.titulo}</p>
                            <p className="mt-1 text-xs text-slate-500 print:text-black">
                              {formatarDataSaudeMental(item.data_inicio)} até{" "}
                              {formatarDataSaudeMental(item.data_fim)}
                            </p>
                          </div>
                          <span className="text-sm font-black text-cyan-300 print:text-black">
                            {item.progresso}%
                          </span>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900 print:border print:border-black">
                          <div
                            className="h-full bg-cyan-300 print:bg-black"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, item.progresso)
                              )}%`,
                            }}
                          />
                        </div>
                      </article>
                    ))}

                    {!planos.length ? (
                      <p className="py-10 text-center text-slate-500">
                        Nenhum plano cadastrado.
                      </p>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
                <div className="flex items-start gap-3">
                  <LockKeyhole className="mt-0.5 h-5 w-5 text-cyan-300 print:text-black" />
                  <div>
                    <h2 className="font-black">Área clínica sigilosa</h2>
                    <p className="mt-1 text-sm text-slate-400 print:text-black">
                      {podeVerClinico
                        ? "Perfil administrativo autorizado. O acesso clínico deve ocorrer somente por fluxo seguro e quando estritamente necessário."
                        : "Seu perfil não possui acesso a relatos, avaliações psicológicas, hipóteses clínicas ou documentos terapêuticos."}
                    </p>
                  </div>
                </div>
              </section>
            </>
          ) : null}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Card({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: string;
  icone: typeof Brain;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <Icone className="h-5 w-5 text-cyan-300 print:text-black" />
      <p className="mt-3 text-[10px] font-black uppercase text-slate-500 print:text-black">
        {titulo}
      </p>
      <p className="mt-1 font-black">{valor}</p>
    </div>
  );
}
