"use client";

import { useEffect, useState } from "react";
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
      texto:
        "Olá. Sou a SIGIA, Inteligência Artificial do SIG-GCM Brasil. Como posso ajudar?",
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
  const [arquivoAnexado, setArquivoAnexado] = useState<File | null>(
    null
  );
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);

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

      const usuarioConvertido = JSON.parse(
        usuarioSalvo
      ) as UsuarioLogado;

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
        texto: `${saudacao()}, ${usuario.nome}.

Sou a SIGIA, Inteligência Artificial do SIG-GCM Brasil.

Perfil identificado: ${usuario.perfil}.

Como posso ajudar?`,
      },
    ]);
  }, [usuario]);

  function executarComando(comando: string): boolean {
    const comandoNormalizado = comando
      .trim()
      .toLocaleLowerCase("pt-BR");

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

  async function escreverSIGIA(
    respostaTexto: string,
    agente?: string
  ) {
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

  async function prepararAnexo(
    arquivo: File | null
  ): Promise<AnexoPreparado | null> {
    if (!arquivo) {
      return null;
    }

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

    if (!mensagem && !arquivoAnexado) {
      return;
    }

    if (
      mensagem &&
      !arquivoAnexado &&
      executarComando(mensagem)
    ) {
      return;
    }

    const textoExibido = arquivoAnexado
      ? `${mensagem || "Analise o arquivo anexado."}

📎 ${arquivoAnexado.name}`
      : mensagem;

    setMensagens((listaAtual) => [
      ...listaAtual,
      {
        autor: "usuario",
        texto: textoExibido,
      },
    ]);

    setHistorico((lista) => [
  ...lista,
  {
    autor: "usuario",
    texto: textoExibido,
  },
]);

    setTexto("");
    setCarregando(true);

    try {
      const anexoPreparado = await prepararAnexo(
        arquivoAnexado
      );

      const resposta = await fetch("/api/sigia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            mensagem:mensagem || "Analise o arquivo anexado.",
            usuario,
            contexto: {
            data: new Date().toLocaleDateString("pt-BR"),
            hora: new Date().toLocaleTimeString("pt-BR"),
            usuario_nome: usuario?.nome || "",
            perfil: usuario?.perfil || "",
            municipio_id: usuario?.municipio_id || null,
          },

          historico,
                    anexo: anexoPreparado,
        }),
      });

      const dados = (await resposta.json().catch(() => ({
        resposta:
          "A SIGIA recebeu uma resposta inválida do servidor.",
      }))) as RespostaSIGIA;

      if (!resposta.ok) {
        throw new Error(
          dados.resposta ||
            "Não foi possível processar a solicitação."
        );
      }

      await escreverSIGIA(
        dados.resposta || "Não consegui responder agora.",
        dados.agente
      );

      setArquivoAnexado(null);
    } catch (error) {
      const mensagemErro =
        error instanceof Error
          ? error.message
          : "Erro ao conectar com a SIGIA.";

      await escreverSIGIA(mensagemErro);
    } finally {
      setCarregando(false);
    }
  }

  function transformarEmOcorrencia(respostaTexto: string) {
    sessionStorage.setItem(
      "sigia_ocorrencia",
      respostaTexto
    );

    window.location.href = "/sistema/ocorrencias/nova";
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
    <main className="min-h-[100dvh] w-full bg-slate-950 text-white">
      <section className="flex min-h-[100dvh] w-full flex-col md:min-h-0">
        <div className="flex min-h-[100dvh] w-full flex-1 flex-col overflow-hidden bg-slate-900/80 md:min-h-0">
          <SIGIAHeader usuario={usuario} />

          <div className="flex min-h-0 w-full flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col p-3 sm:p-4 md:p-6 lg:p-8">
              <div className="flex-1 overflow-y-auto space-y-4 px-2 pb-28">
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
                  <div className="flex w-fit items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800 p-4">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-yellow-400" />

                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-yellow-400"
                        style={{
                          animationDelay: "0.15s",
                        }}
                      />

                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-yellow-400"
                        style={{
                          animationDelay: "0.30s",
                        }}
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

              <div className="mb-3 flex gap-2 overflow-x-auto lg:hidden">
  {sugestoes.map((item) => (
    <button
      key={item}
      onClick={() => void enviarMensagem(item)}
      className="shrink-0 rounded-full bg-slate-800 px-4 py-2 text-xs text-white"
    >
      {item}
    </button>
  ))}
</div>


              <div className="sticky bottom-0 z-20 mt-2 bg-slate-900/95 pt-2 backdrop-blur md:static md:mt-6 md:bg-transparent md:pt-0">
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

            <aside className="hidden lg:block lg:border-l lg:border-yellow-500/20 lg:bg-slate-950/60 lg:p-5">
<h2 className="mb-3 text-sm font-bold text-yellow-400 lg:text-base">
  Sugestões rápidas
</h2>

<div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
                {sugestoes.map((item) => (
                  <button
                    key={item}
                    type="button"
                    disabled={carregando}
                    onClick={() => {
                      void enviarMensagem(item);
                    }}
                    className="shrink-0 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-left text-xs transition hover:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-50 lg:w-full lg:py-3 lg:text-sm"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="mt-6 hidden rounded-2xl border border-yellow-500/20 bg-slate-900 p-4 lg:block">
                <p className="text-sm font-semibold text-slate-300">
                  Recursos disponíveis
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Voz, anexos, comandos operacionais, criação de
                  ocorrência, consultas, relatórios e análise
                  inteligente.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}