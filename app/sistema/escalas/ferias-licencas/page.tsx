"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
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
};

type Registro = {
  id: number;
  guarda_id: number;
  guarda_nome: string;
  matricula: string | null;
  tipo: string;
  data_inicio: string;
  data_fim: string;
  quantidade_dias: number | null;
  status: string;
  motivo: string | null;
  observacao: string | null;
  bloqueia_escala: boolean;
  aprovado_por_nome: string | null;
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

export default function FeriasLicencasPage() {
  const [usuario] = useState(() => lerUsuarioFeriasLicencas());
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("TODOS");
  const [form, setForm] = useState({
    guarda_id: "",
    tipo: "FERIAS",
    data_inicio: hoje(),
    data_fim: hoje(),
    ano_referencia: String(new Date().getFullYear()),
    periodo_numero: "1",
    motivo: "",
    observacao: "",
    bloqueia_escala: true,
  });

  const gerencia = usuario ? podeGerenciarFeriasLicencas(usuario.perfil) : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) {
      setErro("Sessão ou município não identificado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const [guardasResposta, registrosResposta] = await Promise.all([
        supabase
          .from("guardas")
          .select("id,nome,matricula")
          .eq("municipio_id", usuario.municipio_id)
          .order("nome"),
        supabase
          .from("ferias_licencas")
          .select("*")
          .eq("municipio_id", usuario.municipio_id)
          .order("data_inicio", { ascending: false })
          .order("id", { ascending: false }),
      ]);

      const primeiroErro = guardasResposta.error || registrosResposta.error;
      if (primeiroErro) {
        if (primeiroErro.code === "42P01" || primeiroErro.code === "42703") {
          throw new Error("Execute primeiro supabase/FERIAS_LICENCAS.sql.");
        }
        throw primeiroErro;
      }

      setGuardas((guardasResposta.data as Guarda[] | null) || []);
      setRegistros((registrosResposta.data as Registro[] | null) || []);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar férias e licenças."
      );
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const metricas = useMemo(() => {
    const hojeData = hoje();
    return {
      pendentes: registros.filter(
        (item) => normalizarFeriasLicencas(item.status) === "PENDENTE"
      ).length,
      ativos: registros.filter(
        (item) =>
          normalizarFeriasLicencas(item.status) === "APROVADO" &&
          item.data_inicio <= hojeData &&
          item.data_fim >= hojeData
      ).length,
      proximos: registros.filter(
        (item) =>
          normalizarFeriasLicencas(item.status) === "APROVADO" &&
          item.data_inicio > hojeData
      ).length,
      guardas: new Set(registros.map((item) => item.guarda_id)).size,
    };
  }, [registros]);

  const filtrados = useMemo(() => {
    const termo = normalizarFeriasLicencas(busca);
    return registros.filter((item) => {
      const correspondeBusca =
        !termo ||
        normalizarFeriasLicencas(
          `${item.guarda_nome} ${item.matricula || ""} ${item.tipo}`
        ).includes(termo);
      const correspondeStatus =
        statusFiltro === "TODOS" ||
        normalizarFeriasLicencas(item.status) === statusFiltro;
      return correspondeBusca && correspondeStatus;
    });
  }, [busca, registros, statusFiltro]);

  async function salvar() {
    if (!usuario?.municipio_id || !gerencia) return;

    const guarda = guardas.find(
      (item) => String(item.id) === form.guarda_id
    );

    if (!guarda || !form.data_inicio || !form.data_fim) {
      setErro("Preencha servidor, início e fim.");
      return;
    }

    if (form.data_fim < form.data_inicio) {
      setErro("A data final não pode ser anterior à data inicial.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
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
          ano_referencia: Number(form.ano_referencia) || null,
          periodo_numero: Number(form.periodo_numero) || 1,
          motivo: form.motivo.trim() || null,
          observacao: form.observacao.trim() || null,
          status: "APROVADO",
          origem: "CADASTRO_ADMINISTRATIVO",
          bloqueia_escala: form.bloqueia_escala,
          solicitado_por: Number(usuario.id),
          solicitado_por_nome: usuario.nome,
          aprovado_por: Number(usuario.id),
          aprovado_por_nome: usuario.nome,
          aprovado_em: new Date().toISOString(),
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
        acao: "REGISTRO_CRIADO",
        descricao: `${nomeTipoFeriasLicencas(form.tipo)} registrado para ${guarda.nome}.`,
      });

      await registrarAuditoria({
        modulo: "Férias e Licenças",
        acao: "CRIAR",
        tabela: "ferias_licencas",
        registro_id: data.id,
        descricao: `Registrou ${nomeTipoFeriasLicencas(form.tipo)} para ${guarda.nome}.`,
        detalhes: {
          guarda_id: guarda.id,
          data_inicio: form.data_inicio,
          data_fim: form.data_fim,
        },
      });

      setForm({
        guarda_id: "",
        tipo: "FERIAS",
        data_inicio: hoje(),
        data_fim: hoje(),
        ano_referencia: String(new Date().getFullYear()),
        periodo_numero: "1",
        motivo: "",
        observacao: "",
        bloqueia_escala: true,
      });

      await carregar();
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Não foi possível salvar."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function decidir(registro: Registro, novoStatus: "APROVADO" | "NEGADO") {
    if (!usuario?.municipio_id || !gerencia) return;

    const observacao =
      window.prompt(
        novoStatus === "APROVADO"
          ? "Observação da aprovação:"
          : "Motivo da negativa:"
      ) || "";

    setSalvando(true);
    setErro("");

    try {
      const { error } = await supabase
        .from("ferias_licencas")
        .update({
          status: novoStatus,
          aprovado_por: Number(usuario.id),
          aprovado_por_nome: usuario.nome,
          aprovado_em: new Date().toISOString(),
          decisao_observacao: observacao || null,
        })
        .eq("id", registro.id)
        .eq("municipio_id", usuario.municipio_id);

      if (error) throw error;

      await supabase.from("ferias_licencas_historico").insert({
        municipio_id: usuario.municipio_id,
        registro_id: registro.id,
        guarda_id: registro.guarda_id,
        usuario_id: Number(usuario.id),
        usuario_nome: usuario.nome,
        acao: novoStatus,
        descricao: `${novoStatus}: ${observacao || "Sem observação."}`,
      });

      await registrarAuditoria({
        modulo: "Férias e Licenças",
        acao: novoStatus,
        tabela: "ferias_licencas",
        registro_id: registro.id,
        descricao: `${novoStatus} para ${registro.guarda_nome}.`,
      });

      await carregar();
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Não foi possível decidir."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ProtecaoModulo modulo="escalas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-[1700px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 lg:p-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                  Recursos Humanos
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  Férias, Licenças e Afastamentos
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  Programação, solicitações, aprovações e bloqueio de escalas.
                </p>
              </div>

              <button
                onClick={() => void carregar()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm font-black"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </button>
            </div>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metrica titulo="Pendentes" valor={metricas.pendentes} icone={Clock3} />
            <Metrica titulo="Em andamento" valor={metricas.ativos} icone={ShieldAlert} />
            <Metrica titulo="Programados" valor={metricas.proximos} icone={CalendarDays} />
            <Metrica titulo="Servidores" valor={metricas.guardas} icone={Users} />
          </section>

          {gerencia ? (
            <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
              <h2 className="font-black">Novo registro administrativo</h2>

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
                    className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 outline-none"
                  >
                    <option value="">Selecione</option>
                    {guardas.map((guarda) => (
                      <option key={guarda.id} value={guarda.id}>
                        {guarda.nome} • {guarda.matricula || "Sem matrícula"}
                      </option>
                    ))}
                  </select>
                </label>

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
                  label="Ano de referência"
                  type="number"
                  value={form.ano_referencia}
                  onChange={(valor) =>
                    setForm((atual) => ({ ...atual, ano_referencia: valor }))
                  }
                />

                <Select
                  label="Período"
                  value={form.periodo_numero}
                  onChange={(valor) =>
                    setForm((atual) => ({ ...atual, periodo_numero: valor }))
                  }
                  options={["1", "2", "3"]}
                />

                <Campo
                  label="Motivo"
                  value={form.motivo}
                  onChange={(valor) =>
                    setForm((atual) => ({ ...atual, motivo: valor }))
                  }
                />

                <Campo
                  label="Observação"
                  value={form.observacao}
                  onChange={(valor) =>
                    setForm((atual) => ({ ...atual, observacao: valor }))
                  }
                />
              </div>

              <label className="mt-4 flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.bloqueia_escala}
                  onChange={(event) =>
                    setForm((atual) => ({
                      ...atual,
                      bloqueia_escala: event.target.checked,
                    }))
                  }
                />
                Bloquear o servidor nas escalas durante o período
              </label>

              <button
                onClick={() => void salvar()}
                disabled={salvando}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
              >
                {salvando ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <PlusCircle className="h-5 w-5" />
                )}
                Salvar registro
              </button>
            </section>
          ) : null}

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/50 px-4">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Buscar por nome, matrícula ou tipo..."
                  className="h-12 w-full bg-transparent text-sm outline-none"
                />
              </label>

              <div className="flex gap-2 overflow-x-auto">
                {["TODOS", "PENDENTE", "APROVADO", "NEGADO", "CANCELADO"].map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => setStatusFiltro(item)}
                      className={`whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-black ${
                        statusFiltro === item
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
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
            </div>
          ) : filtrados.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-700 p-12 text-center text-slate-500">
              Nenhum registro encontrado.
            </div>
          ) : (
            <section className="grid gap-4 xl:grid-cols-2">
              {filtrados.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-[#061326] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/sistema/guardas/${item.guarda_id}/ferias-licencas`}
                        className="font-black hover:text-cyan-300"
                      >
                        {item.guarda_nome}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.matricula || "Sem matrícula"} •{" "}
                        {nomeTipoFeriasLicencas(item.tipo)}
                      </p>
                    </div>
                    <Status status={item.status} />
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Info
                      titulo="Início"
                      valor={formatarDataFeriasLicencas(item.data_inicio)}
                    />
                    <Info
                      titulo="Término"
                      valor={formatarDataFeriasLicencas(item.data_fim)}
                    />
                    <Info
                      titulo="Quantidade"
                      valor={`${item.quantidade_dias || "--"} dia(s)`}
                    />
                    <Info
                      titulo="Escala"
                      valor={item.bloqueia_escala ? "Bloqueada" : "Permitida"}
                    />
                  </div>

                  {item.motivo ? (
                    <p className="mt-4 text-sm text-slate-300">{item.motivo}</p>
                  ) : null}

                  {gerencia &&
                  normalizarFeriasLicencas(item.status) === "PENDENTE" ? (
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() => void decidir(item, "APROVADO")}
                        disabled={salvando}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Aprovar
                      </button>

                      <button
                        onClick={() => void decidir(item, "NEGADO")}
                        disabled={salvando}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm font-black text-rose-300"
                      >
                        <XCircle className="h-4 w-4" />
                        Negar
                      </button>
                    </div>
                  ) : null}
                </article>
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
  icone: typeof CalendarDays;
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
