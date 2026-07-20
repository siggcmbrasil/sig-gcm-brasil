"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  Save,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
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

type Solicitacao = {
  id: number;
  guarda_id: number;
  guarda_nome: string;
  matricula: string | null;
  data_solicitacao: string;
  data_compensacao: string;
  horas: number;
  motivo: string;
  observacoes: string | null;
  status: string;
  decidido_por_nome: string | null;
  decisao_observacao: string | null;
  decidido_em: string | null;
  criado_em: string;
};

function hoje() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bahia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function BancoHorasSolicitacoesPage() {
  const router = useRouter();
  const [usuario] = useState(() => lerUsuarioBancoHoras());
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState({
    guarda_id: "",
    data_compensacao: hoje(),
    horas: "",
    motivo: "",
    observacoes: "",
  });

  const gerencia = usuario ? podeGerenciarBancoHoras(usuario.perfil) : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) return;

    setCarregando(true);
    setErro("");

    try {
      const [guardasResposta, solicitacoesResposta] = await Promise.all([
        supabase
          .from("guardas")
          .select("id,nome,matricula")
          .eq("municipio_id", usuario.municipio_id)
          .order("nome"),
        supabase
          .from("banco_horas_solicitacoes")
          .select("*")
          .eq("municipio_id", usuario.municipio_id)
          .order("criado_em", { ascending: false }),
      ]);

      const primeiroErro =
        guardasResposta.error || solicitacoesResposta.error;

      if (primeiroErro) {
        if (primeiroErro.code === "42P01" || primeiroErro.code === "42703") {
          throw new Error(
            "Execute primeiro o arquivo supabase/BANCO_HORAS.sql."
          );
        }
        throw primeiroErro;
      }

      let listaGuardas = (guardasResposta.data as Guarda[] | null) || [];
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
          listaSolicitacoes = [];
        } else {
          listaGuardas = [meuGuarda];
          listaSolicitacoes = listaSolicitacoes.filter(
            (item) => item.guarda_id === meuGuarda.id
          );
          setForm((atual) => ({
            ...atual,
            guarda_id: String(meuGuarda.id),
          }));
        }
      }

      setGuardas(listaGuardas);
      setSolicitacoes(listaSolicitacoes);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as solicitações."
      );
    } finally {
      setCarregando(false);
    }
  }, [gerencia, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const pendentes = useMemo(
    () =>
      solicitacoes.filter(
        (item) => normalizarBancoHoras(item.status) === "PENDENTE"
      ),
    [solicitacoes]
  );

  async function solicitar() {
    if (!usuario?.municipio_id) return;

    const guarda = guardas.find(
      (item) => String(item.id) === form.guarda_id
    );

    if (
      !guarda ||
      !form.data_compensacao ||
      Number(form.horas) <= 0 ||
      !form.motivo.trim()
    ) {
      setErro(
        "Preencha servidor, data da compensação, quantidade de horas e motivo."
      );
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const { data, error } = await supabase
        .from("banco_horas_solicitacoes")
        .insert({
          municipio_id: usuario.municipio_id,
          guarda_id: guarda.id,
          guarda_nome: guarda.nome,
          matricula: guarda.matricula,
          data_solicitacao: hoje(),
          data_compensacao: form.data_compensacao,
          horas: Number(form.horas),
          motivo: form.motivo.trim(),
          observacoes: form.observacoes.trim() || null,
          status: "PENDENTE",
          solicitado_por: Number(usuario.id),
          solicitado_por_nome: usuario.nome,
        })
        .select("id")
        .single();

      if (error) throw error;

      await supabase.from("banco_horas_historico").insert({
        municipio_id: usuario.municipio_id,
        guarda_id: guarda.id,
        solicitacao_id: data.id,
        usuario_id: Number(usuario.id),
        usuario_nome: usuario.nome,
        acao: "SOLICITACAO_CRIADA",
        descricao: `Solicitação de compensação de ${form.horas}h para ${form.data_compensacao}.`,
      });

      await registrarAuditoria({
        modulo: "Banco de Horas",
        acao: "SOLICITAR_COMPENSACAO",
        tabela: "banco_horas_solicitacoes",
        registro_id: data.id,
        descricao: `Solicitou compensação de ${form.horas}h para ${guarda.nome}.`,
        detalhes: {
          guarda_id: guarda.id,
          data_compensacao: form.data_compensacao,
          horas: Number(form.horas),
        },
      });

      setForm((atual) => ({
        guarda_id: gerencia ? "" : atual.guarda_id,
        data_compensacao: hoje(),
        horas: "",
        motivo: "",
        observacoes: "",
      }));

      await carregar();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a solicitação."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function decidir(
    solicitacao: Solicitacao,
    statusNovo: "APROVADA" | "RECUSADA"
  ) {
    if (!usuario?.municipio_id || !gerencia) return;

    const observacao =
      window.prompt(
        statusNovo === "APROVADA"
          ? "Observação da aprovação:"
          : "Informe o motivo da recusa:"
      ) || "";

    setSalvando(true);

    try {
      let lancamentoId: number | null = null;

      if (statusNovo === "APROVADA") {
        const { data: lancamento, error: erroLancamento } = await supabase
          .from("banco_horas_guardas")
          .insert({
            municipio_id: usuario.municipio_id,
            guarda_id: solicitacao.guarda_id,
            tipo: "DEBITO",
            categoria: "COMPENSACAO",
            data: solicitacao.data_compensacao,
            horas: Number(solicitacao.horas),
            motivo: `Compensação aprovada: ${solicitacao.motivo}`,
            observacoes: observacao || null,
            origem: "SOLICITACAO",
            criado_por: Number(usuario.id),
            criado_por_nome: usuario.nome,
          })
          .select("id")
          .single();

        if (erroLancamento) throw erroLancamento;
        lancamentoId = lancamento.id;
      }

      const { error } = await supabase
        .from("banco_horas_solicitacoes")
        .update({
          status: statusNovo,
          decidido_por: Number(usuario.id),
          decidido_por_nome: usuario.nome,
          decisao_observacao: observacao || null,
          decidido_em: new Date().toISOString(),
          lancamento_id: lancamentoId,
        })
        .eq("id", solicitacao.id)
        .eq("municipio_id", usuario.municipio_id);

      if (error) throw error;

      await supabase.from("banco_horas_historico").insert({
        municipio_id: usuario.municipio_id,
        guarda_id: solicitacao.guarda_id,
        solicitacao_id: solicitacao.id,
        usuario_id: Number(usuario.id),
        usuario_nome: usuario.nome,
        acao:
          statusNovo === "APROVADA"
            ? "SOLICITACAO_APROVADA"
            : "SOLICITACAO_RECUSADA",
        descricao: `${statusNovo}: ${observacao || "Sem observação."}`,
      });

      await registrarAuditoria({
        modulo: "Banco de Horas",
        acao:
          statusNovo === "APROVADA"
            ? "APROVAR_COMPENSACAO"
            : "RECUSAR_COMPENSACAO",
        tabela: "banco_horas_solicitacoes",
        registro_id: solicitacao.id,
        descricao: `${statusNovo} solicitação de ${solicitacao.guarda_nome}.`,
        detalhes: {
          guarda_id: solicitacao.guarda_id,
          horas: solicitacao.horas,
          lancamento_id: lancamentoId,
        },
      });

      await carregar();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível processar a solicitação."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-[1600px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 lg:p-7">
            <button
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center gap-2 text-sm font-black text-slate-400 hover:text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
                <CalendarClock className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                  Banco de horas
                </p>
                <h1 className="mt-1 text-2xl font-black">
                  Solicitações de Compensação
                </h1>
              </div>
            </div>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
            <h2 className="font-black">Nova solicitação</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Servidor
                </span>
                <select
                  value={form.guarda_id}
                  onChange={(event) =>
                    setForm((atual) => ({
                      ...atual,
                      guarda_id: event.target.value,
                    }))
                  }
                  disabled={!gerencia}
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 outline-none disabled:opacity-70"
                >
                  <option value="">Selecione</option>
                  {guardas.map((guarda) => (
                    <option key={guarda.id} value={guarda.id}>
                      {guarda.nome} • {guarda.matricula || "Sem matrícula"}
                    </option>
                  ))}
                </select>
              </label>

              <Campo
                label="Data da compensação"
                type="date"
                value={form.data_compensacao}
                onChange={(valor) =>
                  setForm((atual) => ({
                    ...atual,
                    data_compensacao: valor,
                  }))
                }
              />

              <Campo
                label="Horas"
                type="number"
                value={form.horas}
                onChange={(valor) =>
                  setForm((atual) => ({ ...atual, horas: valor }))
                }
              />

              <Campo
                label="Motivo"
                value={form.motivo}
                onChange={(valor) =>
                  setForm((atual) => ({ ...atual, motivo: valor }))
                }
              />
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Observações
              </span>
              <textarea
                rows={4}
                value={form.observacoes}
                onChange={(event) =>
                  setForm((atual) => ({
                    ...atual,
                    observacoes: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4 outline-none"
              />
            </label>

            <button
              onClick={() => void solicitar()}
              disabled={salvando}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
            >
              {salvando ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              Enviar solicitação
            </button>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            {carregando ? (
              <div className="col-span-full flex min-h-[260px] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
              </div>
            ) : solicitacoes.length === 0 ? (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-700 p-12 text-center text-slate-500">
                Nenhuma solicitação registrada.
              </div>
            ) : (
              solicitacoes.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-[#061326] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-black">{item.guarda_nome}</h2>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.matricula || "Sem matrícula"}
                      </p>
                    </div>
                    <Status status={item.status} />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Info
                      titulo="Compensação"
                      valor={formatarDataBancoHoras(
                        item.data_compensacao
                      )}
                    />
                    <Info
                      titulo="Quantidade"
                      valor={formatarHoras(Number(item.horas))}
                    />
                  </div>

                  <p className="mt-4 text-sm text-slate-300">
                    {item.motivo}
                  </p>

                  {item.observacoes ? (
                    <p className="mt-2 text-xs text-slate-500">
                      {item.observacoes}
                    </p>
                  ) : null}

                  {gerencia &&
                  normalizarBancoHoras(item.status) === "PENDENTE" ? (
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() => void decidir(item, "APROVADA")}
                        disabled={salvando}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Aprovar
                      </button>

                      <button
                        onClick={() => void decidir(item, "RECUSADA")}
                        disabled={salvando}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm font-black text-rose-300"
                      >
                        <XCircle className="h-4 w-4" />
                        Recusar
                      </button>
                    </div>
                  ) : null}

                  {item.decidido_por_nome ? (
                    <div className="mt-5 border-t border-slate-800 pt-4 text-xs text-slate-500">
                      Decisão por {item.decidido_por_nome}
                      {item.decisao_observacao
                        ? ` • ${item.decisao_observacao}`
                        : ""}
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </section>
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <input
        type={type}
        step={type === "number" ? "0.25" : undefined}
        min={type === "number" ? "0.25" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 outline-none"
      />
    </label>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
        {titulo}
      </p>
      <p className="mt-2 font-black">{valor}</p>
    </div>
  );
}

function Status({ status }: { status: string }) {
  const normalizado = normalizarBancoHoras(status);
  const classe =
    normalizado === "APROVADA"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
      : normalizado === "RECUSADA"
        ? "border-rose-400/25 bg-rose-400/10 text-rose-300"
        : "border-amber-400/25 bg-amber-400/10 text-amber-300";

  return (
    <span
      className={`rounded-full border px-3 py-1 text-[10px] font-black ${classe}`}
    >
      {status}
    </span>
  );
}
