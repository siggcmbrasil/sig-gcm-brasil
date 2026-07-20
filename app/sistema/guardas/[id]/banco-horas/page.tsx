"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarClock,
  Clock3,
  Loader2,
  PlusCircle,
  Save,
  Trash2,
} from "lucide-react";

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

type Registro = {
  id: number;
  tipo: string;
  categoria: string | null;
  data: string | null;
  horas: number;
  motivo: string | null;
  observacoes: string | null;
  origem: string | null;
  criado_por_nome: string | null;
  criado_em: string | null;
};

function hoje() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bahia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function BancoHorasGuardaPage() {
  const params = useParams();
  const router = useRouter();
  const guardaId = Number(params.id);
  const [usuario] = useState(() => lerUsuarioBancoHoras());
  const [guarda, setGuarda] = useState<Guarda | null>(null);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState({
    tipo: "CREDITO",
    categoria: "HORA_EXTRA",
    data: hoje(),
    horas: "",
    motivo: "",
    observacoes: "",
  });

  const gerencia = usuario ? podeGerenciarBancoHoras(usuario.perfil) : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id || !guardaId) return;

    setCarregando(true);
    setErro("");

    try {
      const [guardaResposta, registrosResposta] = await Promise.all([
        supabase
          .from("guardas")
          .select("id,nome,matricula")
          .eq("municipio_id", usuario.municipio_id)
          .eq("id", guardaId)
          .single(),
        supabase
          .from("banco_horas_guardas")
          .select("id,tipo,categoria,data,horas,motivo,observacoes,origem,criado_por_nome,criado_em")
          .eq("municipio_id", usuario.municipio_id)
          .eq("guarda_id", guardaId)
          .order("data", { ascending: false })
          .order("id", { ascending: false }),
      ]);

      const primeiroErro =
        guardaResposta.error || registrosResposta.error;

      if (primeiroErro) {
        if (primeiroErro.code === "42P01" || primeiroErro.code === "42703") {
          throw new Error(
            "Execute primeiro o arquivo supabase/BANCO_HORAS.sql."
          );
        }
        throw primeiroErro;
      }

      const guardaAtual = guardaResposta.data as Guarda;

      if (!gerencia) {
        const corresponde =
          (usuario.matricula &&
            guardaAtual.matricula === usuario.matricula) ||
          normalizarBancoHoras(guardaAtual.nome) ===
            normalizarBancoHoras(usuario.nome);

        if (!corresponde) {
          router.replace("/sistema/banco-horas");
          return;
        }
      }

      setGuarda(guardaAtual);
      setRegistros((registrosResposta.data as Registro[] | null) || []);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o banco de horas."
      );
    } finally {
      setCarregando(false);
    }
  }, [gerencia, guardaId, router, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const saldo = useMemo(
    () =>
      registros.reduce((total, item) => {
        const valor = Number(item.horas || 0);
        return normalizarBancoHoras(item.tipo) === "DEBITO"
          ? total - valor
          : total + valor;
      }, 0),
    [registros]
  );

  async function salvar() {
    if (!usuario?.municipio_id || !gerencia || !guarda) return;

    if (
      !form.data ||
      Number(form.horas) <= 0 ||
      !form.motivo.trim()
    ) {
      setErro("Preencha data, quantidade de horas e motivo.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const { data, error } = await supabase
        .from("banco_horas_guardas")
        .insert({
          municipio_id: usuario.municipio_id,
          guarda_id: guarda.id,
          tipo: form.tipo,
          categoria: form.categoria,
          data: form.data,
          horas: Number(form.horas),
          motivo: form.motivo.trim(),
          observacoes: form.observacoes.trim() || null,
          origem: "MANUAL",
          criado_por: Number(usuario.id),
          criado_por_nome: usuario.nome,
        })
        .select("id")
        .single();

      if (error) throw error;

      await supabase.from("banco_horas_historico").insert({
        municipio_id: usuario.municipio_id,
        guarda_id: guarda.id,
        usuario_id: Number(usuario.id),
        usuario_nome: usuario.nome,
        acao: "LANCAMENTO_CRIADO",
        descricao: `${form.tipo} de ${form.horas}h: ${form.motivo.trim()}`,
      });

      await registrarAuditoria({
        modulo: "Banco de Horas",
        acao: "CRIAR_LANCAMENTO",
        tabela: "banco_horas_guardas",
        registro_id: data.id,
        descricao: `Registrou ${form.horas}h para ${guarda.nome}.`,
        detalhes: {
          guarda_id: guarda.id,
          tipo: form.tipo,
          categoria: form.categoria,
          horas: Number(form.horas),
        },
      });

      setForm({
        tipo: "CREDITO",
        categoria: "HORA_EXTRA",
        data: hoje(),
        horas: "",
        motivo: "",
        observacoes: "",
      });

      await carregar();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o lançamento."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(registro: Registro) {
    if (!usuario?.municipio_id || !gerencia || !guarda) return;
    if (!window.confirm("Excluir este lançamento do banco de horas?")) {
      return;
    }

    const { error } = await supabase
      .from("banco_horas_guardas")
      .delete()
      .eq("id", registro.id)
      .eq("municipio_id", usuario.municipio_id)
      .eq("guarda_id", guarda.id);

    if (error) {
      setErro(error.message);
      return;
    }

    await registrarAuditoria({
      modulo: "Banco de Horas",
      acao: "EXCLUIR_LANCAMENTO",
      tabela: "banco_horas_guardas",
      registro_id: registro.id,
      descricao: `Excluiu lançamento do banco de horas de ${guarda.nome}.`,
      detalhes: {
        guarda_id: guarda.id,
        tipo: registro.tipo,
        horas: Number(registro.horas),
      },
    });

    await carregar();
  }

  if (carregando) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
      </main>
    );
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 lg:p-7">
            <button
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center gap-2 text-sm font-black text-slate-400 hover:text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                  Banco de horas individual
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  {guarda?.nome || "Servidor"}
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  Matrícula: {guarda?.matricula || "Não informada"}
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Saldo atual
                </p>
                <p
                  className={`mt-1 text-4xl font-black ${
                    saldo > 0
                      ? "text-emerald-300"
                      : saldo < 0
                        ? "text-rose-300"
                        : "text-slate-300"
                  }`}
                >
                  {formatarHoras(saldo)}
                </p>
              </div>
            </div>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          {gerencia ? (
            <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
              <h2 className="font-black">Novo lançamento</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Select
                  label="Tipo"
                  value={form.tipo}
                  onChange={(valor) =>
                    setForm((atual) => ({ ...atual, tipo: valor }))
                  }
                  options={["CREDITO", "DEBITO"]}
                />

                <Select
                  label="Categoria"
                  value={form.categoria}
                  onChange={(valor) =>
                    setForm((atual) => ({
                      ...atual,
                      categoria: valor,
                    }))
                  }
                  options={[
                    "HORA_EXTRA",
                    "CONVOCACAO",
                    "EVENTO",
                    "CURSO",
                    "COMPENSACAO",
                    "FOLGA",
                    "AJUSTE",
                  ]}
                />

                <Campo
                  label="Data"
                  type="date"
                  value={form.data}
                  onChange={(valor) =>
                    setForm((atual) => ({ ...atual, data: valor }))
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
                  className="md:col-span-2"
                />

                <Campo
                  label="Observações"
                  value={form.observacoes}
                  onChange={(valor) =>
                    setForm((atual) => ({
                      ...atual,
                      observacoes: valor,
                    }))
                  }
                  className="md:col-span-2"
                />
              </div>

              <button
                onClick={() => void salvar()}
                disabled={salvando}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
              >
                {salvando ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                Salvar lançamento
              </button>
            </section>
          ) : null}

          <section className="space-y-4">
            {registros.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-700 p-12 text-center text-slate-500">
                Nenhum lançamento registrado.
              </div>
            ) : (
              registros.map((item) => {
                const debito =
                  normalizarBancoHoras(item.tipo) === "DEBITO";

                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-800 bg-[#061326] p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-4">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
                            debito
                              ? "border-rose-400/20 bg-rose-400/10 text-rose-300"
                              : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                          }`}
                        >
                          {debito ? (
                            <ArrowDownCircle className="h-6 w-6" />
                          ) : (
                            <ArrowUpCircle className="h-6 w-6" />
                          )}
                        </div>

                        <div>
                          <p
                            className={`text-xl font-black ${
                              debito
                                ? "text-rose-300"
                                : "text-emerald-300"
                            }`}
                          >
                            {debito ? "-" : "+"}
                            {formatarHoras(Number(item.horas))}
                          </p>
                          <p className="mt-1 text-sm font-black text-white">
                            {item.motivo || "Sem motivo informado"}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            {formatarDataBancoHoras(item.data)} •{" "}
                            {(item.categoria || "AJUSTE").replaceAll(
                              "_",
                              " "
                            )}{" "}
                            • {item.origem || "MANUAL"}
                          </p>
                          {item.observacoes ? (
                            <p className="mt-3 text-sm text-slate-400">
                              {item.observacoes}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {gerencia ? (
                        <button
                          onClick={() => void excluir(item)}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-black text-rose-300"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })
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
  className = "",
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <label className={className}>
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

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  options: string[];
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 outline-none"
      >
        {options.map((item) => (
          <option key={item} value={item}>
            {item.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
