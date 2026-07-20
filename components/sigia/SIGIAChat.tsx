"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  FileText,
  Sparkles,
} from "lucide-react";
import SIGIAHeader from "./SIGIAHeader";
import SIGIAInput from "./SIGIAInput";
import SIGIAMessage from "./SIGIAMessage";

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

type AnexoPreparado = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo_texto: string;
};

type RespostaSIGIA = {
  resposta?: string;
  agente?: string;
};

export default function SIGIAChat() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      autor: "sigia",
      texto: "Olá. Sou a SIGIA, Inteligência Artificial do SIG-GCM Brasil. Como posso ajudar?",
    },
  ]);

  const [historico, setHistorico] = useState<
    {
      autor: string;
      texto: string;
    }[]
  >([]);

  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [arquivoAnexado, setArquivoAnexado] = useState<File | null>(null);
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const listaRef = useRef<HTMLDivElement | null>(null);

  function saudacao() {
    const hora = new Date().getHours();

    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";

    return "Boa noite";
  }

  useEffect(() => {
    try {
      const usuarioSalvo = localStorage.getItem("usuarioLogado");
      if (!usuarioSalvo) return;
      const usuarioConvertido = JSON.parse(usuarioSalvo) as UsuarioLogado;
      setUsuario(usuarioConvertido);
    } catch (error) {
      console.error("Erro ao carregar usuário da SIGIA:", error);
      setUsuario(null);
    }
  }, []);

  useEffect(() => {
    if (!usuario) return;

    setMensagens([
      {
        autor: "sigia",
        texto: `${saudacao()}, ${usuario.nome}.\n\nSou a SIGIA, Inteligência Artificial do SIG-GCM Brasil.\n\nPerfil identificado: ${usuario.perfil}.\n\nComo posso ajudar?`,
      },
    ]);
  }, [usuario]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight, behavior: "smooth" });
    }, 80);
    return () => window.clearTimeout(id);
  }, [mensagens, carregando]);

  function executarComando(comando: string): boolean {
    const comandoNormalizado = comando.trim().toLocaleLowerCase("pt-BR");

    if (
      comandoNormalizado.includes("nova ocorrência") ||
      comandoNormalizado.includes("criar ocorrência") ||
      comandoNormalizado.includes("registrar ocorrência")
    ) {
      window.location.href = "/sistema/ocorrencias/nova";
      return true;
    }

    if (
      comandoNormalizado.includes("ocorrência expressa") ||
      comandoNormalizado.includes("ocorrencia expressa")
    ) {
      window.location.href = "/sistema/ocorrencias/expressa";
      return true;
    }

    if (
      comandoNormalizado.includes("abrir patrulhamento") ||
      comandoNormalizado.includes("iniciar patrulhamento")
    ) {
      window.location.href = "/sistema/patrulhamento";
      return true;
    }

    if (
      comandoNormalizado.includes("abrir visitas") ||
      comandoNormalizado.includes("registrar visita")
    ) {
      window.location.href = "/sistema/visitas";
      return true;
    }

    if (
      comandoNormalizado.includes("abrir mapa") ||
      comandoNormalizado.includes("mapa operacional")
    ) {
      window.location.href = "/sistema/mapa-operacional";
      return true;
    }

    if (
      comandoNormalizado.includes("abrir feed") ||
      comandoNormalizado.includes("central de feeds")
    ) {
      window.location.href = "/sistema/central-feeds";
      return true;
    }

    if (
      comandoNormalizado.includes("abrir escala") ||
      comandoNormalizado.includes("consultar escala")
    ) {
      window.location.href = "/sistema/escalas";
      return true;
    }

    return false;
  }

  async function escreverSIGIA(respostaTexto: string, agente?: string) {
    let textoAtual = "";

    setMensagens((listaAtual) => [
      ...listaAtual,
      {
        autor: "sigia",
        texto: "",
        agente,
      },
    ]);

    for (const caractere of respostaTexto) {
      textoAtual += caractere;

      setMensagens((listaAtual) => {
        const copia = [...listaAtual];
        const ultimoIndice = copia.length - 1;

        copia[ultimoIndice] = {
          autor: "sigia",
          texto: textoAtual,
          agente,
        };

        return copia;
      });

      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 5);
      });
    }
  }

  async function prepararAnexo(arquivo: File | null): Promise<AnexoPreparado | null> {
    if (!arquivo) return null;

    let conteudoTexto = "";
    if (arquivo.type === "text/plain") {
      conteudoTexto = await arquivo.text();
    }

    return {
      nome: arquivo.name,
      tipo: arquivo.type,
      tamanho: arquivo.size,
      conteudo_texto: conteudoTexto.slice(0, 20000),
    };
  }

  async function enviarMensagem(pergunta?: string) {
    if (carregando) return;

    const mensagem = String(pergunta ?? texto).trim();

    if (!mensagem && !arquivoAnexado) return;

    if (mensagem && !arquivoAnexado && executarComando(mensagem)) return;

    const textoExibido = arquivoAnexado
      ? `${mensagem || "Analise o arquivo anexado."}\n\n📎 ${arquivoAnexado.name}`
      : mensagem;

    setMensagens((listaAtual) => [
      ...listaAtual,
      {
        autor: "usuario",
        texto: textoExibido,
      },
    ]);

    const proximoHistorico = [
      ...historico,
      {
        autor: "usuario",
        texto: textoExibido,
      },
    ];

    setHistorico(proximoHistorico);
    setTexto("");
    setCarregando(true);

    try {
      const anexoPreparado = await prepararAnexo(arquivoAnexado);

      const resposta = await fetch("/api/sigia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mensagem: mensagem || "Analise o arquivo anexado.",
          usuario,
          contexto: {
            data: new Date().toLocaleDateString("pt-BR"),
            hora: new Date().toLocaleTimeString("pt-BR"),
            usuario_nome: usuario?.nome || "",
            perfil: usuario?.perfil || "",
            municipio_id: usuario?.municipio_id || null,
          },
          historico: proximoHistorico,
          anexo: anexoPreparado,
        }),
      });

      const dados = (await resposta.json().catch(() => ({
        resposta: "A SIGIA recebeu uma resposta inválida do servidor.",
      }))) as RespostaSIGIA;

      if (!resposta.ok) {
        throw new Error(dados.resposta || "Não foi possível processar a solicitação.");
      }

      await escreverSIGIA(dados.resposta || "Não consegui responder agora.", dados.agente);
      setArquivoAnexado(null);
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : "Erro ao conectar com a SIGIA.";
      await escreverSIGIA(mensagemErro);
    } finally {
      setCarregando(false);
    }
  }

  function transformarEmOcorrencia(respostaTexto: string) {
    sessionStorage.setItem("sigia_ocorrencia", respostaTexto);
    window.location.href = "/sistema/ocorrencias/nova";
  }

  const sugestoes = useMemo(
    () => [
      "Quem está de plantão hoje?",
      "Gerar uma ocorrência",
      "Consultar legislação da GCM",
      "Criar relatório do plantão",
      "Analisar estatísticas",
      "Consultar viatura",
    ],
    [],
  );

  return (
    <main className="min-h-[100dvh] w-full bg-transparent text-white">
      <section className="flex min-h-[100dvh] w-full flex-col md:min-h-0">
        <div className="flex min-h-[100dvh] w-full flex-1 flex-col overflow-hidden bg-transparent md:min-h-0">
          <SIGIAHeader usuario={usuario} />

          <div className="flex min-h-0 w-full flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col px-3 pb-3 pt-3 sm:px-4 md:px-6 lg:px-8 lg:pb-6">
              <div className="mb-4 grid gap-3 md:grid-cols-3">
                <MiniCard titulo="Perfil" valor={usuario?.perfil || 'Assistente'} subtitulo="Contexto ativo" />
                <MiniCard titulo="Recursos" valor="Chat + Anexos" subtitulo="Voz, PDF, imagem e texto" />
                <MiniCard titulo="Modo" valor="Super IA" subtitulo="Resposta inteligente premium" />
              </div>

              <div
                ref={listaRef}
                className="custom-scrollbar flex-1 space-y-4 overflow-y-auto rounded-[28px] border border-white/10 bg-[#020817]/60 p-3 sm:p-4 md:p-5"
              >
                {mensagens.map((mensagem, index) => (
                  <SIGIAMessage
                    key={`${mensagem.autor}-${index}`}
                    autor={mensagem.autor}
                    texto={mensagem.texto}
                    agente={mensagem.agente}
                    onOcorrencia={transformarEmOcorrencia}
                  />
                ))}

                {carregando && (
                  <div className="flex w-fit items-center gap-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/[.06] px-4 py-3">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-300" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-300" style={{ animationDelay: "0.15s" }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-300" style={{ animationDelay: "0.30s" }} />
                    </div>

                    <div>
                      <p className="font-black text-cyan-200">SIGIA analisando...</p>
                      <p className="text-xs text-slate-500">Processando contexto, consulta e resposta.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
                {sugestoes.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      void enviarMensagem(item);
                    }}
                    className="shrink-0 rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-xs font-bold text-slate-200 transition hover:border-cyan-400/25 hover:bg-cyan-400/[.06]"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="sticky bottom-0 z-20 mt-4 rounded-[26px] bg-[#061122]/90 backdrop-blur md:static md:bg-transparent">
                <SIGIAInput
                  texto={texto}
                  setTexto={setTexto}
                  carregando={carregando}
                  enviar={() => {
                    void enviarMensagem();
                  }}
                  anexar={(arquivo) => {
                    setArquivoAnexado(arquivo);
                  }}
                />
              </div>
            </div>

            <aside className="hidden border-l border-white/10 bg-[#040b18]/65 p-5 lg:block">
              <div className="rounded-[24px] border border-white/10 bg-white/[.03] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white">Sugestões inteligentes</h2>
                    <p className="text-xs text-slate-500">Comece com um prompt rápido</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {sugestoes.map((item) => (
                    <button
                      key={item}
                      type="button"
                      disabled={carregando}
                      onClick={() => {
                        void enviarMensagem(item);
                      }}
                      className="w-full rounded-2xl border border-white/10 bg-[#020817]/75 px-4 py-3 text-left text-sm font-semibold text-slate-200 transition hover:border-cyan-400/25 hover:bg-cyan-400/[.05] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[.03] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Capacidades</h3>
                    <p className="text-xs text-slate-500">O que a SIGIA faz por você</p>
                  </div>
                </div>

                <ul className="mt-4 space-y-3 text-sm text-slate-300">
                  {[
                    'Consultas operacionais e jurídicas',
                    'Apoio na redação de relatórios',
                    'Análise de anexos e textos',
                    'Comandos rápidos para módulos do sistema',
                    'Transformação de resposta em ocorrência',
                  ].map((item) => (
                    <li key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-[#020817]/70 px-3 py-3">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-300" />
                      <span className="leading-6">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 rounded-[24px] border border-cyan-400/15 bg-cyan-400/[.05] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">Modo institucional</p>
                    <p className="text-xs text-cyan-100/70">Experiência premium para apresentação e uso real</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function MiniCard({ titulo, valor, subtitulo }: { titulo: string; valor: string; subtitulo: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
      <p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{titulo}</p>
      <p className="mt-2 text-lg font-black text-white">{valor}</p>
      <p className="mt-1 text-xs text-slate-500">{subtitulo}</p>
    </div>
  );
}
