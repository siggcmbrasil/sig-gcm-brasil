"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  Save,
  XCircle,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import { supabase } from "@/lib/supabase";
import {
  formatarDataFeriasLicencas,
  lerUsuarioFeriasLicencas,
  nomeTipoFeriasLicencas,
  normalizarFeriasLicencas,
  podeGerenciarFeriasLicencas,
} from "@/lib/feriasLicencas";

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
  usuario_id: number | null;
};

type Registro = {
  id: number;
  tipo: string;
  data_inicio: string;
  data_fim: string;
  quantidade_dias: number | null;
  motivo: string | null;
  observacao: string | null;
  status: string;
  bloqueia_escala: boolean;
  decisao_observacao: string | null;
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

export default function FeriasLicencasGuardaPage() {
  const params = useParams();
  const router = useRouter();
  const guardaId = Number(params.id);
  const [usuario] = useState(() => lerUsuarioFeriasLicencas());
  const [guarda, setGuarda] = useState<Guarda | null>(null);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState({
    tipo: "FERIAS",
    data_inicio: hoje(),
    data_fim: hoje(),
    motivo: "",
    observacao: "",
  });

  const gerencia = usuario ? podeGerenciarFeriasLicencas(usuario.perfil) : false;
  const proprioGuarda =
    !!usuario &&
    !!guarda &&
    (Number(guarda.usuario_id) === Number(usuario.id) ||
      (!!usuario.matricula && guarda.matricula === usuario.matricula) ||
      normalizarFeriasLicencas(guarda.nome) ===
        normalizarFeriasLicencas(usuario.nome));

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id || !guardaId) return;

    setCarregando(true);
    setErro("");

    try {
      const [guardaResposta, registrosResposta] = await Promise.all([
        supabase
          .from("guardas")
          .select("id,nome,matricula,usuario_id")
          .eq("municipio_id", usuario.municipio_id)
          .eq("id", guardaId)
          .single(),
        supabase
          .from("ferias_licencas")
          .select("*")
          .eq("municipio_id", usuario.municipio_id)
          .eq("guarda_id", guardaId)
          .order("data_inicio", { ascending: false })
          .order("id", { ascending: false }),
      ]);

      const primeiroErro = guardaResposta.error || registrosResposta.error;
      if (primeiroErro) {
        if (primeiroErro.code === "42P01" || primeiroErro.code === "42703") {
          throw new Error("Execute primeiro supabase/FERIAS_LICENCAS.sql.");
        }
        throw primeiroErro;
      }

      setGuarda(guardaResposta.data as Guarda);
      setRegistros((registrosResposta.data as Registro[] | null) || []);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os afastamentos."
      );
    } finally {
      setCarregando(false);
    }
  }, [guardaId, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function solicitar() {
    if (!usuario?.municipio_id || !guarda) return;

    if (!gerencia && !proprioGuarda) {
      setErro("Você não pode solicitar afastamento para outro servidor.");
      return;
    }

    if (!form.data_inicio || !form.data_fim) {
      setErro("Preencha as datas.");
      return;
    }

    if (form.data_fim < form.data_inicio) {
      setErro("A data final não pode ser anterior à inicial.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const status = gerencia ? "APROVADO" : "PENDENTE";

      const { data, error } = await supabase
        .from("ferias_licencas")
        .insert({
          municipio_id: usuario.municipio_id,
          guarda_id: guarda.id,
          guarda_nome: guarda.nome,
          matricula: guarda.matricula,
          tipo: form.tipo,
          modalidade: "INTEGRAL",
          data_inicio: form.data_inicio,
          data_fim: form.data_fim,
          motivo: form.motivo.trim() || null,
          observacao: form.observacao.trim() || null,
          status,
          origem: gerencia ? "CADASTRO_ADMINISTRATIVO" : "SOLICITACAO",
          bloqueia_escala: true,
          solicitado_por: Number(usuario.id),
          solicitado_por_nome: usuario.nome,
          aprovado_por: gerencia ? Number(usuario.id) : null,
          aprovado_por_nome: gerencia ? usuario.nome : null,
          aprovado_em: gerencia ? new Date().toISOString() : null,
        })
        .select("id")
        .single();

      if (error) throw error;

      await supabase.from("ferias_licencas_historico").insert({
        municipio_id: usuario.municipio_id,
        registro_id: data.id,
        guarda_id: guarda.id,
        usuario_id: Number(usuario.id),
        usuario_nome: usuario.nome,
        acao: gerencia ? "REGISTRO_CRIADO" : "SOLICITACAO_CRIADA",
        descricao: `${nomeTipoFeriasLicencas(form.tipo)} para ${guarda.nome}.`,
      });

      await registrarAuditoria({
        modulo: "Férias e Licenças",
        acao: gerencia ? "CRIAR" : "SOLICITAR",
        tabela: "ferias_licencas",
        registro_id: data.id,
        descricao: `${gerencia ? "Registrou" : "Solicitou"} ${nomeTipoFeriasLicencas(form.tipo)} para ${guarda.nome}.`,
      });

      setForm({
        tipo: "FERIAS",
        data_inicio: hoje(),
        data_fim: hoje(),
        motivo: "",
        observacao: "",
      });

      await carregar();
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Não foi possível solicitar."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function cancelar(registro: Registro) {
    if (!usuario?.municipio_id || (!gerencia && !proprioGuarda)) return;

    const motivo = window.prompt("Informe o motivo do cancelamento:");
    if (!motivo) return;

    setSalvando(true);

    try {
      const { error } = await supabase
        .from("ferias_licencas")
        .update({
          status: "CANCELADO",
          cancelado_por: Number(usuario.id),
          cancelado_por_nome: usuario.nome,
          cancelado_em: new Date().toISOString(),
          cancelamento_motivo: motivo,
        })
        .eq("id", registro.id)
        .eq("municipio_id", usuario.municipio_id);

      if (error) throw error;

      await registrarAuditoria({
        modulo: "Férias e Licenças",
        acao: "CANCELAR",
        tabela: "ferias_licencas",
        registro_id: registro.id,
        descricao: `Cancelou ${nomeTipoFeriasLicencas(registro.tipo)} de ${guarda?.nome}.`,
      });

      await carregar();
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Não foi possível cancelar."
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

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-[1400px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 lg:p-7">
            <button
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center gap-2 text-sm font-black text-slate-400"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              Férias e licenças
            </p>
            <h1 className="mt-1 text-2xl font-black lg:text-3xl">
              {guarda?.nome || "Servidor"}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Matrícula: {guarda?.matricula || "Não informada"}
            </p>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          {(gerencia || proprioGuarda) ? (
            <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
              <h2 className="font-black">
                {gerencia ? "Novo registro" : "Nova solicitação"}
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Select
                  label="Tipo"
                  value={form.tipo}
                  onChange={(valor) =>
                    setForm((atual) => ({ ...atual, tipo: valor }))
                  }
                  options={[
                    "FERIAS",
                    "LICENCA_MEDICA",
                    "LICENCA_PREMIO",
                    "LICENCA_MATERNIDADE",
                    "LICENCA_PATERNIDADE",
                    "ATESTADO",
                    "CURSO",
                    "AFASTAMENTO",
                    "OUTROS",
                  ]}
                />

                <Campo
                  label="Data inicial"
                  type="date"
                  value={form.data_inicio}
                  onChange={(valor) =>
                    setForm((atual) => ({ ...atual, data_inicio: valor }))
                  }
                />

                <Campo
                  label="Data final"
                  type="date"
                  value={form.data_fim}
                  onChange={(valor) =>
                    setForm((atual) => ({ ...atual, data_fim: valor }))
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
                  value={form.observacao}
                  onChange={(event) =>
                    setForm((atual) => ({
                      ...atual,
                      observacao: event.target.value,
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
                {gerencia ? "Salvar registro" : "Enviar solicitação"}
              </button>
            </section>
          ) : null}

          <section className="grid gap-4 xl:grid-cols-2">
            {registros.length === 0 ? (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-700 p-12 text-center text-slate-500">
                Nenhum afastamento registrado.
              </div>
            ) : (
              registros.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-[#061326] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-black">
                        {nomeTipoFeriasLicencas(item.tipo)}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatarDataFeriasLicencas(item.data_inicio)} até{" "}
                        {formatarDataFeriasLicencas(item.data_fim)} •{" "}
                        {item.quantidade_dias || "--"} dia(s)
                      </p>
                    </div>
                    <Status status={item.status} />
                  </div>

                  {item.motivo ? (
                    <p className="mt-4 text-sm text-slate-300">{item.motivo}</p>
                  ) : null}

                  {item.decisao_observacao ? (
                    <p className="mt-3 text-xs text-slate-500">
                      Decisão: {item.decisao_observacao}
                    </p>
                  ) : null}

                  {!["CANCELADO", "NEGADO", "FINALIZADO"].includes(
                    normalizarFeriasLicencas(item.status)
                  ) &&
                  (gerencia || proprioGuarda) ? (
                    <button
                      onClick={() => void cancelar(item)}
                      disabled={salvando}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm font-black text-rose-300"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancelar
                    </button>
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

function Status({ status }: { status: string }) {
  const normalizado = normalizarFeriasLicencas(status);
  const classe =
    normalizado === "APROVADO"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
      : normalizado === "NEGADO" || normalizado === "CANCELADO"
        ? "border-rose-400/25 bg-rose-400/10 text-rose-300"
        : "border-amber-400/25 bg-amber-400/10 text-amber-300";

  return (
    <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${classe}`}>
      {status}
    </span>
  );
}
