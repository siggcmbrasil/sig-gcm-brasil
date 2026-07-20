"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Download,
  FileText,
  Filter,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export type CampoTransito = {
  nome: string;
  rotulo: string;
  tipo?: "text" | "textarea" | "number" | "date" | "datetime-local" | "select";
  obrigatorio?: boolean;
  opcoes?: string[];
  placeholder?: string;
  colunaLista?: boolean;
};

export type ConfigModuloTransito = {
  titulo: string;
  descricao: string;
  tabela: string;
  campos: CampoTransito[];
  campoTitulo: string;
  campoStatus?: string;
  statusOpcoes?: string[];
};

type Registro = Record<string, unknown>;

const valorInicial = (campos: CampoTransito[]): Record<string, string> =>
  Object.fromEntries(campos.map((campo) => [campo.nome, ""]));

const formatarValor = (valor: unknown): string => {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  const texto = String(valor);
  const data = new Date(texto);
  if (
    texto.includes("-") &&
    !Number.isNaN(data.getTime()) &&
    (texto.includes("T") || /^\d{4}-\d{2}-\d{2}$/.test(texto))
  ) {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      ...(texto.includes("T") ? { timeStyle: "short" as const } : {}),
    }).format(data);
  }
  return texto;
};

const statusClasse = (status: unknown): string => {
  const valor = String(status ?? "").toUpperCase();
  if (["ATIVO", "CONCLUIDA", "CONCLUIDO", "APROVADO", "LIBERADO", "JULGADO"].includes(valor)) {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
  }
  if (["CANCELADO", "REPROVADO", "INDEFERIDO", "REMOVIDO"].includes(valor)) {
    return "border-rose-400/25 bg-rose-400/10 text-rose-300";
  }
  return "border-amber-400/25 bg-amber-400/10 text-amber-300";
};

export default function TransitoCrud({ config }: { config: ConfigModuloTransito }) {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [formulario, setFormulario] = useState<Record<string, string>>(
    valorInicial(config.campos),
  );
  const [editandoId, setEditandoId] = useState<string | number | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    const { data, error } = await supabase
      .from(config.tabela)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) setErro(error.message);
    setRegistros((data ?? []) as Registro[]);
    setCarregando(false);
  }, [config.tabela]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return registros.filter((registro) => {
      const bateBusca =
        !termo ||
        Object.values(registro).some((valor) =>
          String(valor ?? "").toLowerCase().includes(termo),
        );
      const bateStatus =
        !filtroStatus ||
        String(registro[config.campoStatus ?? "status"] ?? "") === filtroStatus;
      return bateBusca && bateStatus;
    });
  }, [busca, config.campoStatus, filtroStatus, registros]);

  const abrirNovo = () => {
    setFormulario(valorInicial(config.campos));
    setEditandoId(null);
    setModalAberto(true);
    setErro("");
  };

  const abrirEdicao = (registro: Registro) => {
    const valores: Record<string, string> = {};
    for (const campo of config.campos) {
      const valor = registro[campo.nome];
      if (campo.tipo === "datetime-local" && typeof valor === "string") {
        valores[campo.nome] = valor.slice(0, 16);
      } else {
        valores[campo.nome] = valor === null || valor === undefined ? "" : String(valor);
      }
    }
    setFormulario(valores);
    setEditandoId(registro.id as string | number);
    setModalAberto(true);
    setErro("");
  };

  const salvar = async () => {
    setErro("");
    setSucesso("");
    for (const campo of config.campos) {
      if (campo.obrigatorio && !formulario[campo.nome]?.trim()) {
        setErro(`Preencha o campo obrigatório: ${campo.rotulo}.`);
        return;
      }
    }

    setSalvando(true);
    const payload: Record<string, unknown> = {};
    for (const campo of config.campos) {
      const valor = formulario[campo.nome];
      if (valor === "") {
        payload[campo.nome] = null;
      } else if (campo.tipo === "number") {
        payload[campo.nome] = Number(valor);
      } else {
        payload[campo.nome] = valor;
      }
    }

    const resposta = editandoId
      ? await supabase.from(config.tabela).update(payload).eq("id", editandoId)
      : await supabase.from(config.tabela).insert(payload);

    setSalvando(false);
    if (resposta.error) {
      setErro(resposta.error.message);
      return;
    }

    setModalAberto(false);
    setSucesso(editandoId ? "Registro atualizado com sucesso." : "Registro criado com sucesso.");
    await carregar();
  };

  const excluir = async (registro: Registro) => {
    const titulo = String(registro[config.campoTitulo] ?? registro.id ?? "registro");
    if (!window.confirm(`Excluir "${titulo}"? Esta ação ficará registrada na auditoria.`)) return;
    const { error } = await supabase.from(config.tabela).delete().eq("id", registro.id);
    if (error) {
      setErro(error.message);
      return;
    }
    setSucesso("Registro excluído.");
    await carregar();
  };

  const exportarCsv = () => {
    if (!filtrados.length) return;
    const colunas = Array.from(
      new Set(filtrados.flatMap((registro) => Object.keys(registro))),
    );
    const escapar = (valor: unknown) =>
      `"${String(valor ?? "").replaceAll('"', '""')}"`;
    const csv = [
      colunas.map(escapar).join(";"),
      ...filtrados.map((registro) =>
        colunas.map((coluna) => escapar(registro[coluna])).join(";"),
      ),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${config.tabela}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const colunasLista = config.campos.filter((campo) => campo.colunaLista).slice(0, 5);
  const statuses = config.statusOpcoes ?? [];

  return (
    <main className="min-h-screen bg-[#020817] px-4 py-5 text-white lg:px-8">
      <div className="mx-auto max-w-[1750px] space-y-5">
        <header className="rounded-[30px] border border-cyan-400/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_32%),linear-gradient(135deg,#07152e,#020817)] p-6 shadow-2xl shadow-cyan-950/25">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <Link
                href="/sistema/transito"
                className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-cyan-300 hover:text-cyan-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao SIG Trânsito
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                    SIG TRÂNSITO
                  </p>
                  <h1 className="text-3xl font-black tracking-tight">{config.titulo}</h1>
                </div>
              </div>
              <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-300">
                {config.descricao}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={exportarCsv}
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 font-black text-slate-200 hover:bg-white/[0.08]"
              >
                <Download className="h-5 w-5" />
                Exportar
              </button>
              <button
                type="button"
                onClick={() => void carregar()}
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 font-black text-cyan-200"
              >
                <RefreshCw className="h-5 w-5" />
                Atualizar
              </button>
              <button
                type="button"
                onClick={abrirNovo}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-cyan-400 px-5 font-black text-[#03111f] hover:bg-cyan-300"
              >
                <Plus className="h-5 w-5" />
                Novo registro
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { rotulo: "Total", valor: registros.length, icone: FileText },
            { rotulo: "Exibidos", valor: filtrados.length, icone: Filter },
            { rotulo: "Hoje", valor: registros.filter((r) => String(r.created_at ?? "").startsWith(new Date().toISOString().slice(0,10))).length, icone: CheckCircle2 },
            { rotulo: "Segurança", valor: "RLS", icone: ShieldCheck },
          ].map((item) => {
            const Icone = item.icone;
            return (
              <div key={item.rotulo} className="rounded-3xl border border-white/10 bg-[#071225] p-5">
                <Icone className="h-5 w-5 text-cyan-300" />
                <p className="mt-4 text-3xl font-black">{item.valor}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">{item.rotulo}</p>
              </div>
            );
          })}
        </section>

        {erro ? (
          <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm font-bold text-rose-200">{erro}</div>
        ) : null}
        {sucesso ? (
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-200">{sucesso}</div>
        ) : null}

        <section className="rounded-3xl border border-white/10 bg-[#071225] p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Pesquisar em todos os campos..."
                className="h-12 w-full rounded-2xl border border-white/10 bg-[#020817] pl-12 pr-4 text-sm outline-none focus:border-cyan-400/40"
              />
            </label>
            {statuses.length ? (
              <select
                value={filtroStatus}
                onChange={(event) => setFiltroStatus(event.target.value)}
                className="h-12 rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm outline-none"
              >
                <option value="">Todos os status</option>
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            ) : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#071225]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">Identificação</th>
                  {colunasLista.map((campo) => <th key={campo.nome} className="px-5 py-4">{campo.rotulo}</th>)}
                  <th className="px-5 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.07]">
                {carregando ? (
                  <tr><td colSpan={colunasLista.length + 2} className="px-5 py-16 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-cyan-300" /></td></tr>
                ) : filtrados.length === 0 ? (
                  <tr><td colSpan={colunasLista.length + 2} className="px-5 py-16 text-center text-slate-500">Nenhum registro encontrado.</td></tr>
                ) : (
                  filtrados.map((registro) => (
                    <tr key={String(registro.id)} className="hover:bg-white/[0.025]">
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-100">{formatarValor(registro[config.campoTitulo])}</p>
                        <p className="mt-1 text-xs text-slate-600">ID {String(registro.id)}</p>
                      </td>
                      {colunasLista.map((campo) => (
                        <td key={campo.nome} className="px-5 py-4 text-slate-300">
                          {campo.nome === config.campoStatus ? (
                            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${statusClasse(registro[campo.nome])}`}>
                              {formatarValor(registro[campo.nome])}
                            </span>
                          ) : formatarValor(registro[campo.nome])}
                        </td>
                      ))}
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => abrirEdicao(registro)} className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-300"><Pencil className="h-4 w-4" /></button>
                          <button type="button" onClick={() => void excluir(registro)} className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-2 text-rose-300"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {modalAberto ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[30px] border border-cyan-400/20 bg-[#071225] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-cyan-300">SIG TRÂNSITO</p>
                <h2 className="mt-1 text-2xl font-black">{editandoId ? "Editar registro" : "Novo registro"}</h2>
              </div>
              <button type="button" onClick={() => setModalAberto(false)} className="rounded-xl border border-white/10 p-2 text-slate-400"><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {config.campos.map((campo) => (
                <label key={campo.nome} className={campo.tipo === "textarea" ? "md:col-span-2" : ""}>
                  <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                    {campo.rotulo}{campo.obrigatorio ? " *" : ""}
                  </span>
                  {campo.tipo === "textarea" ? (
                    <textarea
                      value={formulario[campo.nome] ?? ""}
                      onChange={(event) => setFormulario((atual) => ({ ...atual, [campo.nome]: event.target.value }))}
                      placeholder={campo.placeholder}
                      rows={4}
                      className="w-full rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm outline-none focus:border-cyan-400/40"
                    />
                  ) : campo.tipo === "select" ? (
                    <select
                      value={formulario[campo.nome] ?? ""}
                      onChange={(event) => setFormulario((atual) => ({ ...atual, [campo.nome]: event.target.value }))}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm outline-none focus:border-cyan-400/40"
                    >
                      <option value="">Selecione</option>
                      {(campo.opcoes ?? []).map((opcao) => <option key={opcao}>{opcao}</option>)}
                    </select>
                  ) : (
                    <input
                      type={campo.tipo ?? "text"}
                      value={formulario[campo.nome] ?? ""}
                      onChange={(event) => setFormulario((atual) => ({ ...atual, [campo.nome]: event.target.value }))}
                      placeholder={campo.placeholder}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm outline-none focus:border-cyan-400/40"
                    />
                  )}
                </label>
              ))}
            </div>

            {erro ? <div className="mt-5 rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm font-bold text-rose-200">{erro}</div> : null}

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setModalAberto(false)} className="h-12 rounded-2xl border border-white/10 px-5 font-black text-slate-300">Cancelar</button>
              <button type="button" onClick={() => void salvar()} disabled={salvando} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-cyan-400 px-6 font-black text-[#03111f] disabled:opacity-60">
                {salvando ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
