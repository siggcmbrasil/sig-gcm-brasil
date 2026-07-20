"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  PlayCircle,
  Save,
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
  XCircle,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import { supabase } from "@/lib/supabase";
import {
  calcularHorasEscalaExtra,
  formatarDataEscalaExtra,
  lerUsuarioEscalaExtra,
  normalizarEscalaExtra,
  podeGerenciarEscalaExtra,
} from "@/lib/escalaExtraordinaria";

type Evento = {
  id: number;
  titulo: string;
  descricao: string | null;
  tipo: string;
  local: string | null;
  endereco: string | null;
  data: string;
  hora_inicio: string | null;
  hora_fim: string | null;
  comandante_nome: string | null;
  viatura_prefixo: string | null;
  status: string;
  observacao: string | null;
  relatorio_final: string | null;
  contabilizar_banco_horas: boolean;
};

type Convocado = {
  id: number;
  guarda_id: number;
  guarda_nome: string;
  matricula: string | null;
  funcao: string;
  status_convocacao: string;
  presenca: string;
  hora_entrada: string | null;
  hora_saida: string | null;
  horas_computadas: number | null;
  observacao: string | null;
  banco_horas_lancamento_id: number | null;
};

export default function EscalaExtraDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [usuario] = useState(() => lerUsuarioEscalaExtra());
  const [evento, setEvento] = useState<Evento | null>(null);
  const [convocados, setConvocados] = useState<Convocado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [relatorio, setRelatorio] = useState("");

  const gerencia = usuario ? podeGerenciarEscalaExtra(usuario.perfil) : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id || !id) return;

    setCarregando(true);
    setErro("");

    try {
      const [eventoResposta, convocadosResposta] = await Promise.all([
        supabase
          .from("escalas_extras")
          .select("*")
          .eq("municipio_id", usuario.municipio_id)
          .eq("id", id)
          .single(),
        supabase
          .from("escalas_extras_convocados")
          .select("*")
          .eq("municipio_id", usuario.municipio_id)
          .eq("escala_extra_id", id)
          .order("funcao")
          .order("guarda_nome"),
      ]);

      const primeiroErro = eventoResposta.error || convocadosResposta.error;
      if (primeiroErro) throw primeiroErro;

      setEvento(eventoResposta.data as Evento);
      setRelatorio((eventoResposta.data as Evento).relatorio_final || "");
      setConvocados((convocadosResposta.data as Convocado[] | null) || []);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o evento."
      );
    } finally {
      setCarregando(false);
    }
  }, [id, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const meuConvite = useMemo(() => {
    if (!usuario) return null;
    return convocados.find(
      (item) =>
        (!!usuario.matricula && item.matricula === usuario.matricula) ||
        normalizarEscalaExtra(item.guarda_nome) ===
          normalizarEscalaExtra(usuario.nome)
    );
  }, [convocados, usuario]);

  async function atualizarConvocado(
    convocado: Convocado,
    dados: Partial<Convocado>
  ) {
    if (!usuario?.municipio_id) return;

    const permitido =
      gerencia ||
      (meuConvite?.id === convocado.id &&
        Object.keys(dados).every((chave) =>
          ["status_convocacao"].includes(chave)
        ));

    if (!permitido) return;

    const { error } = await supabase
      .from("escalas_extras_convocados")
      .update(dados)
      .eq("id", convocado.id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      setErro(error.message);
      return;
    }

    await carregar();
  }

  async function alterarStatus(novoStatus: string) {
    if (!usuario?.municipio_id || !gerencia || !evento) return;

    setSalvando(true);
    setErro("");

    try {
      const atualizacao: Record<string, unknown> = {
        status: novoStatus,
      };

      if (novoStatus === "FINALIZADO") {
        const presentes = convocados.filter(
          (item) => normalizarEscalaExtra(item.presenca) === "PRESENTE"
        );

        if (
          evento.contabilizar_banco_horas &&
          presentes.some((item) => !item.banco_horas_lancamento_id)
        ) {
          for (const item of presentes) {
            if (item.banco_horas_lancamento_id) continue;

            const entrada = item.hora_entrada || evento.hora_inicio;
            const saida = item.hora_saida || evento.hora_fim;
            const horas =
              Number(item.horas_computadas || 0) ||
              calcularHorasEscalaExtra(entrada, saida);

            if (horas <= 0) continue;

            const { data: lancamento, error: erroLancamento } = await supabase
              .from("banco_horas_guardas")
              .insert({
                municipio_id: usuario.municipio_id,
                guarda_id: item.guarda_id,
                tipo: "CREDITO",
                categoria: "EVENTO",
                data: evento.data,
                horas,
                motivo: `Escala extraordinária: ${evento.titulo}`,
                observacoes: `${evento.local || ""} • ${
                  entrada || "--"
                } às ${saida || "--"}`,
                origem: "ESCALA_EXTRAORDINARIA",
                referencia_id: evento.id,
                criado_por: Number(usuario.id),
                criado_por_nome: usuario.nome,
              })
              .select("id")
              .single();

            if (erroLancamento) throw erroLancamento;

            await supabase
              .from("escalas_extras_convocados")
              .update({
                horas_computadas: horas,
                banco_horas_lancamento_id: lancamento.id,
              })
              .eq("id", item.id)
              .eq("municipio_id", usuario.municipio_id);
          }
        }

        atualizacao.relatorio_final = relatorio.trim() || null;
        atualizacao.total_presentes = presentes.length;
        atualizacao.total_ausentes = convocados.filter(
          (item) => normalizarEscalaExtra(item.presenca) === "AUSENTE"
        ).length;
        atualizacao.finalizado_em = new Date().toISOString();
      }

      const { error } = await supabase
        .from("escalas_extras")
        .update(atualizacao)
        .eq("id", evento.id)
        .eq("municipio_id", usuario.municipio_id);

      if (error) throw error;

      await supabase.from("escalas_extras_historico").insert({
        municipio_id: usuario.municipio_id,
        escala_extra_id: evento.id,
        usuario_id: Number(usuario.id),
        usuario_nome: usuario.nome,
        acao: novoStatus,
        descricao: `Status alterado para ${novoStatus}.`,
      });

      await registrarAuditoria({
        modulo: "Escala Extraordinária",
        acao: novoStatus,
        tabela: "escalas_extras",
        registro_id: evento.id,
        descricao: `${evento.titulo}: ${novoStatus}.`,
      });

      await carregar();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar o status."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
      </main>
    );
  }

  if (!evento) return null;

  return (
    <ProtecaoModulo modulo="escalas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 lg:p-7">
            <button
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center gap-2 text-sm font-black text-slate-400"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                  {evento.tipo.replaceAll("_", " ")}
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  {evento.titulo}
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  {formatarDataEscalaExtra(evento.data)} •{" "}
                  {evento.hora_inicio?.slice(0, 5) || "--"} às{" "}
                  {evento.hora_fim?.slice(0, 5) || "--"} •{" "}
                  {evento.local || "Local não informado"}
                </p>
              </div>
              <Status status={evento.status} />
            </div>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          {!gerencia && meuConvite ? (
            <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5">
              <h2 className="font-black">Sua convocação</h2>
              <p className="mt-2 text-sm text-slate-300">
                Função: {meuConvite.funcao.replaceAll("_", " ")}
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() =>
                    void atualizarConvocado(meuConvite, {
                      status_convocacao: "CONFIRMADO",
                    })
                  }
                  className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950"
                >
                  Confirmar presença
                </button>
                <button
                  onClick={() =>
                    void atualizarConvocado(meuConvite, {
                      status_convocacao: "RECUSADO",
                    })
                  }
                  className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm font-black text-rose-300"
                >
                  Informar indisponibilidade
                </button>
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
            <h2 className="flex items-center gap-2 font-black">
              <Users className="h-5 w-5 text-cyan-300" />
              Efetivo convocado
            </h2>

            <div className="mt-5 space-y-3">
              {convocados.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <p className="font-black">{item.guarda_nome}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.matricula || "Sem matrícula"} •{" "}
                        {item.funcao.replaceAll("_", " ")} •{" "}
                        {item.status_convocacao.replaceAll("_", " ")}
                      </p>
                    </div>

                    {gerencia ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            void atualizarConvocado(item, {
                              presenca: "PRESENTE",
                              hora_entrada:
                                item.hora_entrada || evento.hora_inicio,
                              hora_saida:
                                item.hora_saida || evento.hora_fim,
                            })
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950"
                        >
                          <UserCheck className="h-4 w-4" />
                          Presente
                        </button>
                        <button
                          onClick={() =>
                            void atualizarConvocado(item, {
                              presenca: "AUSENTE",
                            })
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-xs font-black text-rose-300"
                        >
                          <UserX className="h-4 w-4" />
                          Ausente
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {gerencia ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <input
                        type="time"
                        value={item.hora_entrada?.slice(0, 5) || ""}
                        onChange={(event) =>
                          void atualizarConvocado(item, {
                            hora_entrada: event.target.value,
                          })
                        }
                        className="h-11 rounded-xl border border-slate-700 bg-slate-950/60 px-3"
                      />
                      <input
                        type="time"
                        value={item.hora_saida?.slice(0, 5) || ""}
                        onChange={(event) =>
                          void atualizarConvocado(item, {
                            hora_saida: event.target.value,
                          })
                        }
                        className="h-11 rounded-xl border border-slate-700 bg-slate-950/60 px-3"
                      />
                      <select
                        value={item.funcao}
                        onChange={(event) =>
                          void atualizarConvocado(item, {
                            funcao: event.target.value,
                          })
                        }
                        className="h-11 rounded-xl border border-slate-700 bg-slate-950/60 px-3"
                      >
                        {[
                          "COMANDANTE",
                          "MOTORISTA",
                          "PATRULHEIRO",
                          "APOIO",
                          "OPERADOR",
                          "FISCAL",
                        ].map((funcao) => (
                          <option key={funcao} value={funcao}>
                            {funcao}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          {gerencia ? (
            <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
              <h2 className="font-black">Relatório final</h2>
              <textarea
                rows={7}
                value={relatorio}
                onChange={(event) => setRelatorio(event.target.value)}
                placeholder="Descreva o serviço executado, resultados, alterações e observações..."
                className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4 outline-none"
              />

              <div className="mt-5 flex flex-wrap gap-3">
                {normalizarEscalaExtra(evento.status) === "RASCUNHO" ? (
                  <button
                    onClick={() => void alterarStatus("PUBLICADO")}
                    disabled={salvando}
                    className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950"
                  >
                    Publicar
                  </button>
                ) : null}

                {normalizarEscalaExtra(evento.status) === "PUBLICADO" ? (
                  <button
                    onClick={() => void alterarStatus("EM_ANDAMENTO")}
                    disabled={salvando}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Iniciar serviço
                  </button>
                ) : null}

                {normalizarEscalaExtra(evento.status) === "EM_ANDAMENTO" ? (
                  <button
                    onClick={() => void alterarStatus("FINALIZADO")}
                    disabled={salvando}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950"
                  >
                    {salvando ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Finalizar e lançar horas
                  </button>
                ) : null}

                {!["FINALIZADO", "CANCELADO"].includes(
                  normalizarEscalaExtra(evento.status)
                ) ? (
                  <button
                    onClick={() => void alterarStatus("CANCELADO")}
                    disabled={salvando}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm font-black text-rose-300"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancelar evento
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </ProtecaoModulo>
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
    <span className={`rounded-full border px-3 py-1 text-xs font-black ${classe}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
