"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  MessageCircle,
  Plus,
  Send,
  Users,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import { supabase } from "@/lib/supabase";

type Usuario = {
  id?: number | string;
  nome?: string;
  municipio_id?: number;
};

type Conversa = {
  id: number;
  titulo: string | null;
  tipo: string;
  atualizado_em: string;
};

type Mensagem = {
  id: number;
  conversa_id: number;
  usuario_id: number | string;
  texto: string | null;
  criado_em: string;
};

function localUsuario(): Usuario {
  try {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  } catch {
    return {};
  }
}

export default function FeedChatPage() {
  const [usuario] = useState<Usuario>(() => localUsuario());
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaAtiva, setConversaAtiva] = useState<number | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(true);

  async function carregarConversas() {
    if (!usuario.id) return;

    const participantes = await supabase
      .from("feed_sig_conversa_participantes")
      .select("conversa_id")
      .eq("usuario_id", usuario.id);

    const ids = (participantes.data || []).map((item: any) => item.conversa_id);

    if (!ids.length) {
      setConversas([]);
      setCarregando(false);
      return;
    }

    const resposta = await supabase
      .from("feed_sig_conversas")
      .select("id,titulo,tipo,atualizado_em")
      .in("id", ids)
      .order("atualizado_em", { ascending: false });

    setConversas((resposta.data as Conversa[] | null) || []);
    setConversaAtiva((atual) => atual || ids[0]);
    setCarregando(false);
  }

  async function carregarMensagens(id: number) {
    const resposta = await supabase
      .from("feed_sig_mensagens")
      .select("id,conversa_id,usuario_id,texto,criado_em")
      .eq("conversa_id", id)
      .is("apagado_em", null)
      .order("criado_em", { ascending: true })
      .limit(300);

    setMensagens((resposta.data as Mensagem[] | null) || []);
  }

  useEffect(() => {
    void carregarConversas();
  }, []);

  useEffect(() => {
    if (!conversaAtiva) return;

    void carregarMensagens(conversaAtiva);

    const canal = supabase
      .channel(`chat-${conversaAtiva}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "feed_sig_mensagens",
          filter: `conversa_id=eq.${conversaAtiva}`,
        },
        () => void carregarMensagens(conversaAtiva)
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(canal);
    };
  }, [conversaAtiva]);

  async function criarGrupoMunicipio() {
    if (!usuario.id || !usuario.municipio_id) return;

    const criado = await supabase
      .from("feed_sig_conversas")
      .insert({
        municipio_id: usuario.municipio_id,
        tipo: "MUNICIPIO",
        titulo: "Chat do Município",
        criado_por: usuario.id,
      })
      .select("id")
      .single();

    if (criado.error) {
      alert(criado.error.message);
      return;
    }

    await supabase.from("feed_sig_conversa_participantes").insert({
      conversa_id: criado.data.id,
      usuario_id: usuario.id,
      municipio_id: usuario.municipio_id,
    });

    await carregarConversas();
    setConversaAtiva(criado.data.id);
  }

  async function enviar() {
    const mensagem = texto.trim();

    if (!mensagem || !conversaAtiva || !usuario.id || !usuario.municipio_id) {
      return;
    }

    const resposta = await supabase.from("feed_sig_mensagens").insert({
      conversa_id: conversaAtiva,
      usuario_id: usuario.id,
      municipio_id: usuario.municipio_id,
      texto: mensagem,
    });

    if (resposta.error) {
      alert(resposta.error.message);
      return;
    }

    setTexto("");
    await carregarMensagens(conversaAtiva);
  }

  const conversa = useMemo(
    () => conversas.find((item) => item.id === conversaAtiva),
    [conversaAtiva, conversas]
  );

  return (
    <ProtecaoModulo modulo="feed_sig">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Chat Interno"
            subtitulo="Conversas privadas, da guarnição, do plantão e do município."
            detalhe="Comunicação em tempo real"
            icone={MessageCircle}
            acoes={
              <button
                type="button"
                onClick={() => void criarGrupoMunicipio()}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-black text-white"
              >
                <Plus className="h-4 w-4" />
                Novo chat
              </button>
            }
          />

          {carregando ? (
            <div className="sig-loading">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
            </div>
          ) : (
            <section className="grid min-h-[650px] gap-4 xl:grid-cols-12">
              <SigCard className="xl:col-span-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
                  <Users className="h-5 w-5 text-cyan-300" />
                  <h2 className="font-black text-white">Conversas</h2>
                </div>

                <div className="mt-4 space-y-2">
                  {conversas.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setConversaAtiva(item.id)}
                      className={`w-full rounded-2xl border p-4 text-left ${
                        conversaAtiva === item.id
                          ? "border-cyan-400/30 bg-cyan-400/10"
                          : "border-slate-800 bg-slate-950/50"
                      }`}
                    >
                      <p className="font-black text-white">
                        {item.titulo || item.tipo}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{item.tipo}</p>
                    </button>
                  ))}
                </div>
              </SigCard>

              <SigCard className="flex flex-col xl:col-span-8">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="font-black text-white">
                    {conversa?.titulo || "Selecione uma conversa"}
                  </h2>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto py-4">
                  {mensagens.map((mensagem) => {
                    const minha =
                      String(mensagem.usuario_id) === String(usuario.id);

                    return (
                      <div
                        key={mensagem.id}
                        className={`flex ${minha ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            minha
                              ? "bg-cyan-600 text-white"
                              : "bg-slate-900 text-slate-200"
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm leading-6">
                            {mensagem.texto}
                          </p>
                          <p className={`mt-1 text-[10px] ${minha ? "text-cyan-100" : "text-slate-600"}`}>
                            {new Date(mensagem.criado_em).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 border-t border-slate-800 pt-4">
                  <input
                    value={texto}
                    onChange={(evento) => setTexto(evento.target.value)}
                    onKeyDown={(evento) => {
                      if (evento.key === "Enter") {
                        evento.preventDefault();
                        void enviar();
                      }
                    }}
                    placeholder="Digite uma mensagem..."
                    className="h-12 min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 text-sm text-white outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => void enviar()}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-600 text-white"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </SigCard>
            </section>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}
