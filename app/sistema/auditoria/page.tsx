"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, ChevronRight, Download, Eye, FileSearch, Filter, Loader2, RefreshCw, Search, ShieldCheck, User, X } from "lucide-react";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigPageHeader from "@/components/sig/SigPageHeader";
import { supabase } from "@/lib/supabase";

type Registro = Record<string, unknown>;

const txt = (v: unknown) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") {
    try { return JSON.stringify(v); } catch { return String(v); }
  }
  return String(v);
};

const pick = (r: Registro, campos: string[]) => {
  for (const c of campos) if (r[c] !== undefined && r[c] !== null && r[c] !== "") return r[c];
  return null;
};

const fmtData = (v: unknown) => {
  const s = txt(v);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(d);
};

const classeAcao = (v: unknown) => {
  const a = txt(v).toUpperCase();
  if (a.includes("INSERT") || a.includes("CRIAR") || a.includes("CADASTRAR")) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
  if (a.includes("DELETE") || a.includes("EXCLUIR") || a.includes("REMOVER")) return "border-rose-400/25 bg-rose-400/10 text-rose-300";
  if (a.includes("UPDATE") || a.includes("EDITAR") || a.includes("ALTERAR")) return "border-amber-400/25 bg-amber-400/10 text-amber-300";
  return "border-cyan-400/25 bg-cyan-400/10 text-cyan-300";
};

export default function AuditoriaPage() {
  const [dados, setDados] = useState<Registro[]>([]);
  const [selecionado, setSelecionado] = useState<Registro | null>(null);
  const [busca, setBusca] = useState("");
  const [modulo, setModulo] = useState("");
  const [acao, setAcao] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true); setErro("");
    const r = await supabase.from("central_auditoria_unificada").select("*").order("created_at", { ascending: false }).limit(1000);
    if (r.error) { setErro(r.error.message); setDados([]); } else setDados((r.data ?? []) as Registro[]);
    setLoading(false);
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  const modulos = useMemo(() => Array.from(new Set(dados.map(r => txt(pick(r,["modulo","tabela_origem","origem"]))).filter(v=>v!=="—"))).sort(), [dados]);
  const acoes = useMemo(() => Array.from(new Set(dados.map(r => txt(pick(r,["acao","tipo_acao","operacao"]))).filter(v=>v!=="—"))).sort(), [dados]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return dados.filter(r => {
      const m = txt(pick(r,["modulo","tabela_origem","origem"]));
      const a = txt(pick(r,["acao","tipo_acao","operacao"]));
      const dv = pick(r,["created_at","data_hora","registrado_em","data"]);
      const d = dv ? new Date(String(dv)) : null;
      return (!q || Object.values(r).some(v => txt(v).toLowerCase().includes(q)))
        && (!modulo || m===modulo)
        && (!acao || a===acao)
        && (!inicio || (d && !Number.isNaN(d.getTime()) && d >= new Date(`${inicio}T00:00:00`)))
        && (!fim || (d && !Number.isNaN(d.getTime()) && d <= new Date(`${fim}T23:59:59`)));
    });
  }, [dados,busca,modulo,acao,inicio,fim]);

  const hoje = new Date().toISOString().slice(0,10);
  const totalHoje = dados.filter(r => txt(pick(r,["created_at","data_hora","registrado_em","data"])).startsWith(hoje)).length;
  const usuarios = new Set(dados.map(r=>txt(pick(r,["usuario_nome","usuario_email","usuario_id","usuario_auth_id"])))).size;

  const exportar = () => {
    if (!filtrados.length) return;
    const colunas = Array.from(new Set(filtrados.flatMap(r=>Object.keys(r))));
    const esc = (v: unknown) => `"${txt(v).replaceAll('"','""')}"`;
    const csv = [colunas.map(esc).join(";"), ...filtrados.map(r=>colunas.map(c=>esc(r[c])).join(";"))].join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8"}));
    const a = document.createElement("a"); a.href=url; a.download=`auditoria-${hoje}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return <ProtecaoModulo modulo="auditoria">
    <main className="min-h-screen bg-[#020817] p-4 pb-24 text-white md:p-6">
      <div className="mx-auto max-w-[1800px] space-y-5">
        <SigPageHeader titulo="Central de Auditoria" subtitulo="Rastreabilidade completa de acessos e alterações." icone={FileSearch} />

        <header className="rounded-[30px] border border-cyan-400/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.16),transparent_34%),linear-gradient(135deg,#07152e,#020817)] p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10"><ShieldCheck className="h-8 w-8 text-cyan-300" /></div>
              <div><p className="text-xs font-black uppercase tracking-[.22em] text-cyan-300">Segurança institucional</p><h1 className="mt-1 text-3xl font-black">Auditoria Unificada</h1><p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">Consulte ações registradas, responsáveis, módulos, registros e municípios.</p></div>
            </div>
            <div className="flex gap-3"><button onClick={exportar} disabled={!filtrados.length} className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/10 px-4 font-black disabled:opacity-40"><Download className="h-5 w-5"/>Exportar CSV</button><button onClick={()=>void carregar()} className="inline-flex h-12 items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 font-black text-cyan-200"><RefreshCw className={`h-5 w-5 ${loading?'animate-spin':''}`}/>Atualizar</button></div>
          </div>
        </header>

        {erro && <div className="flex gap-3 rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200"><AlertTriangle className="h-5 w-5"/>{erro}</div>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Resumo titulo="Registros" valor={dados.length} detalhe="Eventos carregados" icone={FileSearch}/>
          <Resumo titulo="Hoje" valor={totalHoje} detalhe="Ações registradas" icone={CalendarDays}/>
          <Resumo titulo="Usuários" valor={usuarios} detalhe="Responsáveis identificados" icone={User}/>
          <Resumo titulo="Módulos" valor={modulos.length} detalhe="Áreas auditadas" icone={ShieldCheck}/>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#071225] p-4"><div className="grid gap-3 xl:grid-cols-[1.5fr_1fr_1fr_180px_180px_auto]">
          <label className="relative"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"/><input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Pesquisar em todos os campos..." className="h-12 w-full rounded-2xl border border-white/10 bg-[#020817] pl-12 pr-4 outline-none"/></label>
          <select value={modulo} onChange={e=>setModulo(e.target.value)} className="h-12 rounded-2xl border border-white/10 bg-[#020817] px-4"><option value="">Todos os módulos</option>{modulos.map(v=><option key={v}>{v}</option>)}</select>
          <select value={acao} onChange={e=>setAcao(e.target.value)} className="h-12 rounded-2xl border border-white/10 bg-[#020817] px-4"><option value="">Todas as ações</option>{acoes.map(v=><option key={v}>{v}</option>)}</select>
          <input type="date" value={inicio} onChange={e=>setInicio(e.target.value)} className="h-12 rounded-2xl border border-white/10 bg-[#020817] px-4"/>
          <input type="date" value={fim} onChange={e=>setFim(e.target.value)} className="h-12 rounded-2xl border border-white/10 bg-[#020817] px-4"/>
          <button onClick={()=>{setBusca("");setModulo("");setAcao("");setInicio("");setFim("");}} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 font-black"><Filter className="h-4 w-4"/>Limpar</button>
        </div></section>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#071225]"><div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Data</th><th className="px-5 py-4">Usuário</th><th className="px-5 py-4">Módulo</th><th className="px-5 py-4">Ação</th><th className="px-5 py-4">Registro</th><th className="px-5 py-4">Município</th><th className="px-5 py-4 text-right">Detalhes</th></tr></thead><tbody className="divide-y divide-white/[.07]">
          {loading ? <tr><td colSpan={7} className="py-20 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-300"/></td></tr> : filtrados.length===0 ? <tr><td colSpan={7} className="py-20 text-center text-slate-500">Nenhum registro encontrado.</td></tr> : filtrados.map((r,i)=>{
            const data=pick(r,["created_at","data_hora","registrado_em","data"]), usuario=pick(r,["usuario_nome","usuario_email","usuario_id","usuario_auth_id"]), mod=pick(r,["modulo","tabela_origem","origem"]), ac=pick(r,["acao","tipo_acao","operacao"]), reg=pick(r,["registro_id","entidade_id","id_registro"]), mun=pick(r,["municipio_nome","municipio_id"]);
            return <tr key={String(r.id??r.auditoria_id??`${txt(data)}-${i}`)} className="hover:bg-white/[.025]"><td className="px-5 py-4">{fmtData(data)}</td><td className="px-5 py-4 font-black">{txt(usuario)}</td><td className="px-5 py-4">{txt(mod)}</td><td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${classeAcao(ac)}`}>{txt(ac)}</span></td><td className="px-5 py-4 font-mono text-xs">{txt(reg)}</td><td className="px-5 py-4">{txt(mun)}</td><td className="px-5 py-4 text-right"><button onClick={()=>setSelecionado(r)} className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-300"><Eye className="h-4 w-4"/>Abrir<ChevronRight className="h-4 w-4"/></button></td></tr>
          })}
        </tbody></table></div></section>

        <section className="flex gap-3 rounded-3xl border border-emerald-400/20 bg-emerald-400/[.06] p-5"><CheckCircle2 className="h-5 w-5 text-emerald-300"/><div><p className="font-black text-emerald-200">Auditoria institucional ativa</p><p className="mt-1 text-sm text-emerald-100/70">A exportação contém apenas os registros filtrados.</p></div></section>
      </div>

      {selecionado && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[30px] border border-cyan-400/20 bg-[#071225] p-6"><div className="flex justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">Registro de auditoria</p><h2 className="mt-1 text-2xl font-black">Detalhes completos</h2></div><button onClick={()=>setSelecionado(null)} className="rounded-xl border border-white/10 p-2"><X className="h-5 w-5"/></button></div><div className="mt-6 grid gap-3 md:grid-cols-2">{Object.entries(selecionado).map(([k,v])=><div key={k} className={`rounded-2xl border border-white/10 bg-[#020817] p-4 ${typeof v==='object'?'md:col-span-2':''}`}><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{k.replaceAll('_',' ')}</p>{typeof v==='object'&&v!==null?<pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-slate-300">{JSON.stringify(v,null,2)}</pre>:<p className="mt-2 break-words text-sm">{txt(v)}</p>}</div>)}</div></div></div>}
    </main>
  </ProtecaoModulo>;
}

function Resumo({titulo,valor,detalhe,icone:Icone}:{titulo:string;valor:string|number;detalhe:string;icone:typeof FileSearch}) {
  return <div className="rounded-3xl border border-white/10 bg-[#071225] p-5"><Icone className="h-5 w-5 text-cyan-300"/><p className="mt-5 text-3xl font-black">{valor}</p><p className="mt-1 font-black">{titulo}</p><p className="mt-1 text-xs text-slate-500">{detalhe}</p></div>;
}
