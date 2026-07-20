"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export type CampoCorregedoria = {
  readonly nome: string;
  readonly rotulo: string;
  readonly tipo?: "text" | "textarea" | "date" | "datetime-local" | "select";
  readonly opcoes?: readonly string[];
  readonly obrigatorio?: boolean;
  readonly lista?: boolean;
};

export type ConfigCorregedoria = {
  readonly titulo: string;
  readonly descricao: string;
  readonly tabela: string;
  readonly campoTitulo: string;
  readonly campoStatus?: string;
  readonly campos: readonly CampoCorregedoria[];
};

type Registro = Record<string, unknown>;

export default function CorregedoriaCrud({ config }: { config: ConfigCorregedoria }) {
  const [dados, setDados] = useState<Registro[]>([]);
  const [form, setForm] = useState<Record<string,string>>({});
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro("");
    const resposta = await supabase.from(config.tabela).select("*").order("created_at", { ascending: false }).limit(500);
    if (resposta.error) setErro(resposta.error.message);
    setDados((resposta.data ?? []) as Registro[]);
    setLoading(false);
  }, [config.tabela]);

  useEffect(() => { void carregar(); }, [carregar]);

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return dados;
    return dados.filter((registro) =>
      Object.values(registro).some((valor) => String(valor ?? "").toLowerCase().includes(q))
    );
  }, [busca, dados]);

  const novo = () => {
    setEditando(null);
    setForm(Object.fromEntries(config.campos.map((campo) => [campo.nome, ""])));
    setModal(true);
    setErro("");
  };

  const editar = (registro: Registro) => {
    const valores: Record<string,string> = {};
    for (const campo of config.campos) {
      const valor = registro[campo.nome];
      valores[campo.nome] = valor == null ? "" : String(valor).slice(0, campo.tipo === "datetime-local" ? 16 : undefined);
    }
    setEditando(registro.id as string | number);
    setForm(valores);
    setModal(true);
    setErro("");
  };

  const salvar = async () => {
    for (const campo of config.campos) {
      if (campo.obrigatorio && !form[campo.nome]?.trim()) {
        setErro(`Preencha: ${campo.rotulo}.`);
        return;
      }
    }
    setSalvando(true);
    const payload = Object.fromEntries(config.campos.map((campo) => [campo.nome, form[campo.nome] || null]));
    const resposta = editando
      ? await supabase.from(config.tabela).update(payload).eq("id", editando)
      : await supabase.from(config.tabela).insert(payload);
    setSalvando(false);
    if (resposta.error) { setErro(resposta.error.message); return; }
    setModal(false);
    await carregar();
  };

  const excluir = async (id: unknown) => {
    if (!window.confirm("Excluir este registro? A ação permanecerá na auditoria.")) return;
    const resposta = await supabase.from(config.tabela).delete().eq("id", id);
    if (resposta.error) setErro(resposta.error.message);
    else await carregar();
  };

  const colunas = config.campos.filter((campo) => campo.lista).slice(0,5);

  return (
    <main className="min-h-screen bg-[#020817] px-4 py-5 text-white lg:px-8">
      <div className="mx-auto max-w-[1750px] space-y-5">
        <header className="rounded-[30px] border border-cyan-400/20 bg-gradient-to-br from-[#07152e] to-[#020817] p-6">
          <Link href="/sistema/central-corregedoria" className="inline-flex items-center gap-2 text-sm font-bold text-cyan-300">
            <ArrowLeft className="h-4 w-4" /> Voltar à Corregedoria
          </Link>
          <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">ÁREA RESTRITA</p>
              <h1 className="mt-1 text-3xl font-black">{config.titulo}</h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">{config.descricao}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => void carregar()} className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/10 px-4 font-black">
                <RefreshCw className="h-5 w-5" /> Atualizar
              </button>
              <button onClick={novo} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-cyan-400 px-5 font-black text-slate-950">
                <Plus className="h-5 w-5" /> Novo
              </button>
            </div>
          </div>
        </header>

        {erro ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">{erro}</div> : null}

        <section className="rounded-3xl border border-white/10 bg-[#071225] p-4">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#020817] px-4">
            <Search className="h-5 w-5 text-slate-500" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar..." className="h-12 w-full bg-transparent outline-none" />
          </label>
        </section>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#071225]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">Identificação</th>
                  {colunas.map((campo) => <th key={campo.nome} className="px-5 py-4">{campo.rotulo}</th>)}
                  <th className="px-5 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[.07]">
                {loading ? (
                  <tr><td colSpan={colunas.length+2} className="py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-300" /></td></tr>
                ) : visiveis.length === 0 ? (
                  <tr><td colSpan={colunas.length+2} className="py-16 text-center text-slate-500">Nenhum registro encontrado.</td></tr>
                ) : visiveis.map((registro) => (
                  <tr key={String(registro.id)}>
                    <td className="px-5 py-4 font-black">{String(registro[config.campoTitulo] ?? registro.id)}</td>
                    {colunas.map((campo) => <td key={campo.nome} className="px-5 py-4 text-slate-300">{String(registro[campo.nome] ?? "—")}</td>)}
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => editar(registro)} className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-300"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => void excluir(registro.id)} className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-2 text-rose-300"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {modal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[30px] border border-cyan-400/20 bg-[#071225] p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-xs font-black text-cyan-300">CORREGEDORIA</p><h2 className="mt-1 text-2xl font-black">{editando ? "Editar registro" : "Novo registro"}</h2></div>
              <button onClick={() => setModal(false)} className="rounded-xl border border-white/10 p-2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {config.campos.map((campo) => (
                <label key={campo.nome} className={campo.tipo === "textarea" ? "md:col-span-2" : ""}>
                  <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">{campo.rotulo}{campo.obrigatorio ? " *" : ""}</span>
                  {campo.tipo === "textarea" ? (
                    <textarea value={form[campo.nome] ?? ""} onChange={(e) => setForm((a) => ({...a,[campo.nome]:e.target.value}))} rows={4} className="w-full rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 outline-none" />
                  ) : campo.tipo === "select" ? (
                    <select value={form[campo.nome] ?? ""} onChange={(e) => setForm((a) => ({...a,[campo.nome]:e.target.value}))} className="h-12 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 outline-none">
                      <option value="">Selecione</option>
                      {(campo.opcoes ?? []).map((opcao) => <option key={opcao}>{opcao}</option>)}
                    </select>
                  ) : (
                    <input type={campo.tipo ?? "text"} value={form[campo.nome] ?? ""} onChange={(e) => setForm((a) => ({...a,[campo.nome]:e.target.value}))} className="h-12 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 outline-none" />
                  )}
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setModal(false)} className="h-12 rounded-2xl border border-white/10 px-5 font-black">Cancelar</button>
              <button onClick={() => void salvar()} disabled={salvando} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-cyan-400 px-6 font-black text-slate-950">
                {salvando ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />} Salvar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
