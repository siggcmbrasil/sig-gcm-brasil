"use client";

import { useEffect, useState } from "react";
import PainelSIGIA from "./PainelSIGIA";

type Mensagem = {
  autor: "usuario" | "sigia";
  texto: string;
  agente?: string;
};

type UsuarioLogado = {
  id: string;
  nome: string;
  matricula?: string;
  email: string;
  perfil: string;
  municipio_id?: number;
  foto_url?: string;
};

export default function SIGIAChat() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      autor: "sigia",
      texto: "Olá, Comandante. Sou a SIGIA, Inteligência Artificial do SIG-GCM Brasil. Como posso ajudar?",
    },
  ]);

  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);

function saudacao() {
  const hora = new Date().getHours();

  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";

  return "Boa noite";
}

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuarioLogado");

    if (usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo));
    }
  }, []);

  useEffect(() => {
  if (!usuario) return;

  <PainelSIGIA />

  setMensagens([
    {
      autor: "sigia",
      texto: `${saudacao()}, ${usuario.nome}.

Sou a SIGIA, Inteligência Artificial do SIG-GCM Brasil.

Perfil identificado: ${usuario.perfil}.

Como posso ajudar?`,
    },
  ]);
}, [usuario]);

  async function enviarMensagem(pergunta?: string) {
    const mensagem = pergunta || texto;

    if (!mensagem.trim()) return;

    setMensagens((atual) => [...atual, { autor: "usuario", texto: mensagem }]);
    setTexto("");
    setCarregando(true);

    try {
      const resposta = await fetch("/api/sigia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mensagem,
          usuario,
        }),
      });

      const dados = await resposta.json();

      setMensagens((atual) => [
        ...atual,
        {
          autor: "sigia",
          texto: dados.resposta || "Não consegui responder agora.",
          agente: dados.agente,
        },
      ]);
    } catch {
      setMensagens((atual) => [
        ...atual,
        {
          autor: "sigia",
          texto: "Erro ao conectar com a SIGIA.",
        },
      ]);
    } finally {
      setCarregando(false);
    }
  }

  const sugestoes = [
    "Quem está de plantão hoje?",
    "Gerar uma ocorrência",
    "Consultar legislação da GCM",
    "Criar relatório do plantão",
    "Analisar estatísticas",
    "Consultar viatura",
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <section className="max-w-6xl mx-auto">
        <div className="rounded-3xl border border-yellow-500/30 bg-slate-900/80 shadow-2xl overflow-hidden">
          <div className="p-6 md:p-8 border-b border-yellow-500/20 bg-gradient-to-r from-slate-950 to-blue-950">
            <p className="text-yellow-400 text-sm uppercase tracking-[0.3em]">
              Inteligência Artificial
            </p>

            <h1 className="text-4xl md:text-6xl font-bold mt-2">
              SIG<span className="text-yellow-400">IA</span>
            </h1>

            <p className="text-slate-300 mt-3 text-lg">
              Inteligência Artificial do SIG-GCM Brasil
            </p>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-slate-900 border border-green-500/30 p-4">
                <p className="text-xs text-slate-400">STATUS</p>
                <p className="text-green-400 font-bold mt-1">🟢 ONLINE</p>
              </div>

              <div className="rounded-2xl bg-slate-900 border border-blue-500/30 p-4">
                <p className="text-xs text-slate-400">AGENTES</p>
                <p className="text-blue-400 font-bold mt-1">7 Ativos</p>
              </div>

              <div className="rounded-2xl bg-slate-900 border border-yellow-500/30 p-4">
                <p className="text-xs text-slate-400">VERSÃO</p>
                <p className="text-yellow-400 font-bold mt-1">SIGIA v1.0</p>
              </div>

              <div className="rounded-2xl bg-slate-900 border border-cyan-500/30 p-4">
                <p className="text-xs text-slate-400">SISTEMA</p>
                <p className="text-cyan-400 font-bold mt-1">
                  SIG-GCM Brasil
                </p>
              </div>
            </div>

            {usuario && (
              <div className="mt-6 rounded-2xl border border-blue-500/20 bg-slate-950/60 p-4">
                <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
                  Usuário conectado
                </p>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Nome</p>
                    <p className="font-bold text-white">{usuario.nome}</p>
                  </div>

                  <div>
                    <p className="text-slate-500">Perfil</p>
                    <p className="font-bold text-yellow-400">
                      {usuario.perfil}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">Município</p>
                    <p className="font-bold text-cyan-400">
                      ID {usuario.municipio_id || "-"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
            <div className="p-4 md:p-6">
              <div className="h-[560px] overflow-y-auto space-y-4 pr-2">
                {mensagens.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.autor === "usuario" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm md:text-base ${
                        msg.autor === "usuario"
                          ? "bg-yellow-500 text-slate-950"
                          : "bg-slate-800 border border-slate-700 text-slate-100"
                      }`}
                    >
                      <p className="font-semibold mb-1">
                        {msg.autor === "usuario"
                          ? "Você"
                          : msg.agente
                          ? `SIGIA • Agente ${msg.agente}`
                          : "SIGIA"}
                      </p>

                      <p className="whitespace-pre-line">{msg.texto}</p>
                    </div>
                  </div>
                ))}

                {carregando && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800 border border-slate-700 w-fit">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce" />
                      <div
                        className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <div
                        className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce"
                        style={{ animationDelay: "0.30s" }}
                      />
                    </div>

                    <div>
                      <p className="font-semibold text-yellow-400">
                        SIGIA analisando...
                      </p>

                      <p className="text-xs text-slate-400">
                        Consultando agentes inteligentes...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-slate-900 p-3">
                <div className="flex gap-2">
                  <input
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") enviarMensagem();
                    }}
                    placeholder="Digite sua pergunta para a SIGIA..."
                    className="flex-1 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-yellow-400"
                  />

                  <button
                    type="button"
                    onClick={() => enviarMensagem()}
                    className="rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-5 py-3"
                  >
                    Enviar
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    🧠 SIGIA pode consultar os módulos autorizados do sistema.
                  </span>

                  <span>Enter ↵ para enviar</span>
                </div>
              </div>
            </div>

            <aside className="border-t lg:border-t-0 lg:border-l border-yellow-500/20 p-5 bg-slate-950/60">
              <h2 className="text-yellow-400 font-bold mb-4">
                Sugestões rápidas
              </h2>

              <div className="space-y-2">
                {sugestoes.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => enviarMensagem(item)}
                    className="w-full text-left rounded-xl border border-slate-700 bg-slate-900 hover:border-yellow-400 px-4 py-3 text-sm"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-slate-900 p-4">
                <p className="text-sm text-slate-300">Módulos futuros:</p>

                <p className="text-sm mt-2 text-slate-400">
                  Operacional, Jurídico, Relatórios, Estatísticas, Mapas e Voz.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}