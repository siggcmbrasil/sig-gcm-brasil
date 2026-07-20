"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCheck, Loader2, MessageCircle, Plus, Search, Send, Users, X } from "lucide-react";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import { supabase } from "@/lib/supabase";

type Usuario = { id: string | number; nome?: string; perfil?: string; municipio_id?: number };
type Conversa = { id: number; titulo: string; tipo: string; ultima_mensagem_em?: string | null; criado_por?: string | null };
type Mensagem = { id: number; conversa_id: number; remetente_id: string; remetente_nome: string; conteudo: string; created_at: string; editado_em?: string | null };

function localUser(): Usuario | null { try { return JSON.parse(localStorage.getItem("usuarioLogado") || "null") as Usuario | null; } catch { return null; } }

export default function ChatPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [selecionada, setSelecionada] = useState<Conversa | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [novoModal, setNovoModal] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoTipo, setNovoTipo] = useState("GRUPO");
  const fimRef = useRef<HTMLDivElement>(null);

  const carregarConversas = useCallback(async (u: Usuario) => {
    if (!u.municipio_id) return;
    const { data } = await supabase.from("comunicacao_conversas").select("id,titulo,tipo,ultima_mensagem_em,criado_por").eq("municipio_id", u.municipio_id).eq("ativo", true).order("ultima_mensagem_em", { ascending: false });
    const lista = (data ?? []) as Conversa[];
    setConversas(lista);
    setSelecionada((atual) => atual ?? lista[0] ?? null);
    setCarregando(false);
  }, []);

  const carregarMensagens = useCallback(async (conversa: Conversa | null) => {
    if (!conversa) { setMensagens([]); return; }
    const { data } = await supabase.from("comunicacao_mensagens").select("id,conversa_id,remetente_id,remetente_nome,conteudo,created_at,editado_em").eq("conversa_id", conversa.id).is("excluido_em", null).order("created_at", { ascending: true }).limit(500);
    setMensagens((data ?? []) as Mensagem[]);
    window.setTimeout(() => fimRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  useEffect(() => {
    const u = localUser(); setUsuario(u);
    if (u) void carregarConversas(u); else setCarregando(false);
  }, [carregarConversas]);

  useEffect(() => { void carregarMensagens(selecionada); }, [carregarMensagens, selecionada]);

  useEffect(() => {
    if (!selecionada) return;
    const canal = supabase.channel(`chat-${selecionada.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "comunicacao_mensagens", filter: `conversa_id=eq.${selecionada.id}` }, () => void carregarMensagens(selecionada)).subscribe();
    return () => { void supabase.removeChannel(canal); };
  }, [carregarMensagens, selecionada]);

  const filtradas = useMemo(() => conversas.filter((c) => `${c.titulo} ${c.tipo}`.toLowerCase().includes(busca.toLowerCase())), [busca, conversas]);

  async function enviar() {
    if (!usuario?.municipio_id || !selecionada || !texto.trim()) return;
    setEnviando(true);
    const { error } = await supabase.from("comunicacao_mensagens").insert({ municipio_id: usuario.municipio_id, conversa_id: selecionada.id, remetente_id: String(usuario.id), remetente_nome: usuario.nome || "Usuário", conteudo: texto.trim(), tipo: "TEXTO" });
    setEnviando(false);
    if (!error) { setTexto(""); await carregarMensagens(selecionada); await carregarConversas(usuario); }
  }

  async function criarConversa() {
    if (!usuario?.municipio_id || !novoTitulo.trim()) return;
    const { data, error } = await supabase.from("comunicacao_conversas").insert({ municipio_id: usuario.municipio_id, titulo: novoTitulo.trim(), tipo: novoTipo, criado_por: String(usuario.id), ativo: true }).select("id,titulo,tipo,ultima_mensagem_em,criado_por").single();
    if (!error && data) { setNovoModal(false); setNovoTitulo(""); await carregarConversas(usuario); setSelecionada(data as Conversa); }
  }

  return (
    <ProtecaoModulo modulo="mensagens">
      <main className="min-h-screen bg-[#020817] p-3 text-white md:p-6">
        <div className="mx-auto grid h-[calc(100vh-2rem)] max-w-[1800px] overflow-hidden rounded-[28px] border border-white/10 bg-[#071225] shadow-2xl md:h-[calc(100vh-3rem)] md:grid-cols-[340px_1fr]">
          <aside className={`${selecionada ? "hidden md:flex" : "flex"} min-h-0 flex-col border-r border-white/10`}>
            <div className="border-b border-white/10 p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Comunicação</p><h1 className="mt-1 text-xl font-black">Mensagens</h1></div><button onClick={() => setNovoModal(true)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-slate-950"><Plus className="h-5 w-5" /></button></div><label className="relative mt-4 block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar conversa..." className="h-11 w-full rounded-xl border border-white/10 bg-[#020817] pl-10 pr-3 text-sm outline-none" /></label></div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">{carregando ? <Loader2 className="mx-auto mt-12 h-6 w-6 animate-spin text-cyan-300" /> : filtradas.map((c) => <button key={c.id} onClick={() => setSelecionada(c)} className={`mb-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left ${selecionada?.id === c.id ? "bg-cyan-400/10" : "hover:bg-white/[.035]"}`}><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">{c.tipo === "INDIVIDUAL" ? <MessageCircle className="h-5 w-5 text-cyan-300" /> : <Users className="h-5 w-5 text-cyan-300" />}</div><div className="min-w-0"><p className="truncate text-sm font-black">{c.titulo}</p><p className="mt-1 text-[10px] font-bold uppercase text-slate-600">{c.tipo}</p></div></button>)}</div>
          </aside>

          <section className={`${selecionada ? "flex" : "hidden md:flex"} min-h-0 flex-col`}>
            {selecionada ? <><header className="flex h-16 items-center gap-3 border-b border-white/10 px-4"><button onClick={() => setSelecionada(null)} className="md:hidden"><X className="h-5 w-5" /></button><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10"><MessageCircle className="h-5 w-5 text-cyan-300" /></div><div className="min-w-0"><h2 className="truncate font-black">{selecionada.titulo}</h2><p className="text-[10px] font-bold uppercase text-slate-600">{selecionada.tipo}</p></div></header>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.05),transparent_25rem)] p-4 md:p-6">{mensagens.map((m) => { const minha = String(m.remetente_id) === String(usuario?.id); return <div key={m.id} className={`flex ${minha ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 md:max-w-[68%] ${minha ? "rounded-br-md bg-cyan-400 text-slate-950" : "rounded-bl-md border border-white/10 bg-[#0a1a31]"}`}><p className={`text-[10px] font-black ${minha ? "text-slate-700" : "text-cyan-300"}`}>{m.remetente_nome}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{m.conteudo}</p><div className={`mt-2 flex items-center justify-end gap-1 text-[9px] ${minha ? "text-slate-700" : "text-slate-600"}`}>{new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}{minha ? <CheckCheck className="h-3.5 w-3.5" /> : null}</div></div></div>; })}<div ref={fimRef} /></div>
            <footer className="border-t border-white/10 p-3 md:p-4"><div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-[#020817] p-2"><textarea value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void enviar(); } }} placeholder="Digite uma mensagem..." rows={1} className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm outline-none" /><button onClick={() => void enviar()} disabled={enviando || !texto.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 disabled:opacity-40">{enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</button></div></footer></> : <div className="m-auto text-center"><MessageCircle className="mx-auto h-12 w-12 text-slate-700" /><p className="mt-4 font-black">Selecione uma conversa</p><p className="mt-1 text-sm text-slate-600">Escolha um canal ou crie uma nova conversa.</p></div>}
          </section>
        </div>

        {novoModal ? <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"><div className="w-full max-w-md rounded-[26px] border border-cyan-400/20 bg-[#071225] p-5"><div className="flex items-center justify-between"><h2 className="text-xl font-black">Nova conversa</h2><button onClick={() => setNovoModal(false)}><X className="h-5 w-5" /></button></div><label className="mt-5 block text-xs font-black uppercase text-slate-500">Título</label><input value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#020817] px-4 outline-none" /><label className="mt-4 block text-xs font-black uppercase text-slate-500">Tipo</label><select value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#020817] px-4"><option value="GRUPO">Grupo</option><option value="GUARNICAO">Guarnição</option><option value="CANAL">Canal</option><option value="INDIVIDUAL">Individual</option></select><button onClick={() => void criarConversa()} className="mt-5 h-12 w-full rounded-xl bg-cyan-400 font-black text-slate-950">Criar conversa</button></div></div> : null}
      </main>
    </ProtecaoModulo>
  );
}
