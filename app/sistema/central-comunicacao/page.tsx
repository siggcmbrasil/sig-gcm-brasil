"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCheck,
  ChevronRight,
  Clock3,
  MailOpen,
  Megaphone,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigPageHeader from "@/components/sig/SigPageHeader";
import { supabase } from "@/lib/supabase";

type UsuarioLocal = {
  id: string | number;
  nome?: string;
  perfil?: string;
  municipio_id?: number;
};

type Registro = Record<string, unknown>;

function usuarioLocal(): UsuarioLocal | null {
  try {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "null") as UsuarioLocal | null;
  } catch {
    return null;
  }
}

function txt(valor: unknown, padrao = "—") {
  if (valor === null || valor === undefined || valor === "") return padrao;
  return String(valor);
}

function dataCurta(valor: unknown) {
  const data = new Date(String(valor ?? ""));
  if (Number.isNaN(data.getTime())) return "Agora";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(data);
}

export default function CentralComunicacaoPage() {
  const [usuario, setUsuario] = useState<UsuarioLocal | null>(null);
  const [avisos, setAvisos] = useState<Registro[]>([]);
  const [notificacoes, setNotificacoes] = useState<Registro[]>([]);
  const [conversas, setConversas] = useState<Registro[]>([]);
  const [mensagens, setMensagens] = useState<Registro[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async (atual: UsuarioLocal) => {
    if (!atual.municipio_id) return;
    setCarregando(true);
    setErro("");

    const [a, n, c, m] = await Promise.all([
      supabase.from("avisos").select("*").eq("municipio_id", atual.municipio_id).order("fixado", { ascending: false }).order("created_at", { ascending: false }).limit(30),
      supabase.from("notificacoes").select("*").eq("municipio_id", atual.municipio_id).order("created_at", { ascending: false }).limit(60),
      supabase.from("comunicacao_conversas").select("*").eq("municipio_id", atual.municipio_id).eq("ativo", true).order("ultima_mensagem_em", { ascending: false }).limit(30),
      supabase.from("comunicacao_mensagens").select("*").eq("municipio_id", atual.municipio_id).order("created_at", { ascending: false }).limit(40),
    ]);

    const falha = [a.error, n.error, c.error, m.error].find(Boolean);
    if (falha) setErro(falha.message);
    setAvisos((a.data ?? []) as Registro[]);
    setNotificacoes((n.data ?? []) as Registro[]);
    setConversas((c.data ?? []) as Registro[]);
    setMensagens((m.data ?? []) as Registro[]);
    setCarregando(false);
  }, []);

  useEffect(() => {
    const atual = usuarioLocal();
    setUsuario(atual);
    if (!atual?.municipio_id) {
      setErro("Sessão ou município não identificado.");
      setCarregando(false);
      return;
    }
    void carregar(atual);

    const canal = supabase
      .channel(`comunicacao-${atual.municipio_id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notificacoes", filter: `municipio_id=eq.${atual.municipio_id}` }, () => void carregar(atual))
      .on("postgres_changes", { event: "*", schema: "public", table: "avisos", filter: `municipio_id=eq.${atual.municipio_id}` }, () => void carregar(atual))
      .on("postgres_changes", { event: "*", schema: "public", table: "comunicacao_mensagens", filter: `municipio_id=eq.${atual.municipio_id}` }, () => void carregar(atual))
      .subscribe();

    return () => { void supabase.removeChannel(canal); };
  }, [carregar]);

  const naoLidas = useMemo(() => notificacoes.filter((n) => n.lida !== true).length, [notificacoes]);
  const urgentes = useMemo(() => avisos.filter((a) => ["URGENTE", "ALTA"].includes(txt(a.prioridade).toUpperCase())).length, [avisos]);
  const mensagensHoje = useMemo(() => mensagens.filter((m) => txt(m.created_at).startsWith(new Date().toISOString().slice(0, 10))).length, [mensagens]);

  const atividade = useMemo(() => {
    const itens = [
      ...mensagens.map((m) => ({ id: `m-${m.id}`, tipo: "Mensagem", titulo: txt(m.remetente_nome, "Usuário"), detalhe: txt(m.conteudo, "Mensagem"), data: m.created_at, href: "/sistema/chat" })),
      ...notificacoes.map((n) => ({ id: `n-${n.id}`, tipo: "Notificação", titulo: txt(n.titulo, "Notificação"), detalhe: txt(n.mensagem), data: n.created_at ?? n.criado_em, href: "/sistema/notificacoes" })),
      ...avisos.map((a) => ({ id: `a-${a.id}`, tipo: "Aviso", titulo: txt(a.titulo, "Aviso"), detalhe: txt(a.descricao ?? a.mensagem), data: a.created_at ?? a.criado_em, href: "/sistema/avisos" })),
    ];
    const termo = busca.toLowerCase().trim();
    return itens
      .filter((i) => !termo || `${i.tipo} ${i.titulo} ${i.detalhe}`.toLowerCase().includes(termo))
      .sort((x, y) => new Date(String(y.data ?? 0)).getTime() - new Date(String(x.data ?? 0)).getTime())
      .slice(0, 15);
  }, [avisos, busca, mensagens, notificacoes]);

  return (
    <ProtecaoModulo modulo="avisos">
      <main className="min-h-screen bg-[#020817] p-4 pb-24 text-white md:p-6">
        <div className="mx-auto max-w-[1800px] space-y-5">
          <SigPageHeader titulo="Central de Comunicação" subtitulo="Mensagens, notificações e avisos em um único ambiente institucional." icone={MessageCircle} />

          <header className="rounded-[30px] border border-cyan-400/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.16),transparent_35%),linear-gradient(135deg,#081a34,#020817)] p-5 md:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">Comunicação integrada</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight">Tudo que precisa chegar, chega.</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Comunicação operacional em tempo real, avisos institucionais e notificações rastreáveis por usuário, perfil e município.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/sistema/chat" className="inline-flex h-12 items-center gap-2 rounded-2xl bg-cyan-400 px-5 font-black text-slate-950"><Send className="h-5 w-5" />Nova mensagem</Link>
                <Link href="/sistema/avisos" className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[.04] px-5 font-black"><Plus className="h-5 w-5" />Publicar aviso</Link>
                <button onClick={() => usuario && void carregar(usuario)} className="inline-flex h-12 items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 font-black text-cyan-200"><RefreshCw className={`h-5 w-5 ${carregando ? "animate-spin" : ""}`} />Atualizar</button>
              </div>
            </div>
          </header>

          {erro ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm font-bold text-rose-200">{erro}</div> : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Resumo titulo="Conversas" valor={conversas.length} detalhe="Canais disponíveis" icone={MessageCircle} />
            <Resumo titulo="Mensagens hoje" valor={mensagensHoje} detalhe="Movimentação interna" icone={Send} />
            <Resumo titulo="Não lidas" valor={naoLidas} detalhe="Notificações pendentes" icone={Bell} />
            <Resumo titulo="Avisos prioritários" valor={urgentes} detalhe="Alta e urgente" icone={Megaphone} />
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <Canal href="/sistema/chat" titulo="Mensagens e Chat" descricao="Converse com usuários, equipes, guarnições e canais." icone={MessageCircle} valor={`${conversas.length} conversas`} />
            <Canal href="/sistema/notificacoes" titulo="Notificações" descricao="Alertas automáticos, leitura e histórico de ações." icone={Bell} valor={`${naoLidas} não lidas`} />
            <Canal href="/sistema/avisos" titulo="Avisos institucionais" descricao="Comunicados com prioridade, validade e público-alvo." icone={Megaphone} valor={`${avisos.length} publicados`} />
          </section>

          <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#071225]">
              <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div><h2 className="font-black">Atividade recente</h2><p className="mt-1 text-xs text-slate-500">Mensagens, notificações e avisos em ordem cronológica.</p></div>
                <label className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar..." className="h-10 w-full rounded-xl border border-white/10 bg-[#020817] pl-10 pr-3 text-sm outline-none focus:border-cyan-400/40" /></label>
              </div>
              <div className="max-h-[560px] divide-y divide-white/[.07] overflow-y-auto">
                {atividade.length === 0 ? <div className="p-14 text-center text-slate-500">Nenhuma atividade encontrada.</div> : atividade.map((item) => (
                  <Link key={item.id} href={item.href} className="flex items-start gap-3 p-4 transition hover:bg-white/[.025]">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10"><MailOpen className="h-4 w-4 text-cyan-300" /></div>
                    <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="truncate text-sm font-black">{item.titulo}</p><span className="shrink-0 text-[10px] text-slate-600">{dataCurta(item.data)}</span></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.detalhe}</p><span className="mt-2 inline-flex rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-black uppercase text-slate-500">{item.tipo}</span></div>
                  </Link>
                ))}
              </div>
            </article>

            <aside className="space-y-4">
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[.06] p-5"><ShieldCheck className="h-6 w-6 text-emerald-300" /><h3 className="mt-4 font-black text-emerald-200">Comunicação rastreável</h3><p className="mt-2 text-sm leading-6 text-emerald-100/65">Mensagens e publicações são vinculadas ao município e ao responsável.</p></div>
              <div className="rounded-3xl border border-white/10 bg-[#071225] p-5"><div className="flex items-center gap-2"><CheckCheck className="h-5 w-5 text-cyan-300" /><h3 className="font-black">Boas práticas</h3></div><div className="mt-4 space-y-3 text-xs leading-5 text-slate-400"><p>Use prioridade urgente apenas quando houver necessidade operacional imediata.</p><p>Direcione mensagens restritas a usuários ou perfis específicos.</p><p>Evite compartilhar dados sensíveis em canais gerais.</p></div></div>
            </aside>
          </section>
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Resumo({ titulo, valor, detalhe, icone: Icone }: { titulo: string; valor: number; detalhe: string; icone: LucideIcon }) {
  return <div className="rounded-3xl border border-white/10 bg-[#071225] p-4"><Icone className="h-5 w-5 text-cyan-300" /><p className="mt-4 text-3xl font-black">{valor}</p><p className="mt-1 text-sm font-black">{titulo}</p><p className="mt-1 text-xs text-slate-500">{detalhe}</p></div>;
}

function Canal({ href, titulo, descricao, icone: Icone, valor }: { href: string; titulo: string; descricao: string; icone: LucideIcon; valor: string }) {
  return <Link href={href} className="group rounded-3xl border border-white/10 bg-[#071225] p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/30"><div className="flex items-start justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10"><Icone className="h-6 w-6 text-cyan-300" /></div><ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-cyan-300" /></div><h2 className="mt-5 font-black">{titulo}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{descricao}</p><p className="mt-4 text-xs font-black text-cyan-300">{valor}</p></Link>;
}
