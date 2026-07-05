"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  ClipboardCopy,
  FileText,
  Lightbulb,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { registrarAuditoria } from "@/lib/auditoria";

type UsuarioLogado = {
  id?: number | string;
  nome?: string;
  perfil?: string;
  municipio_id?: number | string;
};

type TipoConsulta = "relato" | "melhorar" | "providencias" | "natureza";

export default function IAOperacionalPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [texto, setTexto] = useState("");
  const [resposta, setResposta] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [carregandoCreditos, setCarregandoCreditos] = useState(true);
  const [creditos, setCreditos] = useState<number | null>(null);
  const [tipoAtual, setTipoAtual] = useState<TipoConsulta | null>(null);

  useEffect(() => {
    const dados = localStorage.getItem("usuarioLogado");

    if (!dados) {
      alert("Sessão expirada. Faça login novamente.");
      window.location.href = "/login";
      return;
    }

    const usuarioAtual = JSON.parse(dados || "{}");

    if (!usuarioAtual?.id || !usuarioAtual?.municipio_id) {
      alert("Usuário ou município não identificado.");
      window.location.href = "/login";
      return;
    }

    setUsuario(usuarioAtual);
    carregarCreditos(usuarioAtual);

    registrarAuditoria({
      modulo: "IA Operacional",
      acao: "ACESSO",
      tabela: "ia_creditos_municipio",
      descricao: "Acessou a tela da IA Operacional.",
      detalhes: {
        municipio_id: usuarioAtual.municipio_id,
      },
    });
  }, []);

  async function carregarCreditos(usuarioAtual: UsuarioLogado) {
    try {
      setCarregandoCreditos(true);

      const res = await fetch("/api/ia-creditos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          municipio_id: usuarioAtual.municipio_id,
        }),
      });

      const textoResposta = await res.text();

      let data: any = {};

      try {
        data = JSON.parse(textoResposta);
      } catch {
        console.error("Resposta inválida de /api/ia-creditos:", textoResposta);
        setCreditos(0);
        return;
      }

      if (!res.ok) {
        console.error("Erro em /api/ia-creditos:", data);
        setCreditos(0);
        return;
      }

      setCreditos(Number(data.saldo ?? 0));
    } catch (error) {
      console.error("Erro ao carregar créditos:", error);
      setCreditos(0);
    } finally {
      setCarregandoCreditos(false);
    }
  }

  function montarComando(tipo: TipoConsulta) {
    const conteudo = texto.trim();

    if (tipo === "relato") {
      return `
Você é uma IA Operacional da Guarda Civil Municipal.

Transforme as informações abaixo em um relato profissional de ocorrência.

Regras:
- Use linguagem formal.
- Seja objetivo.
- Não invente fatos.
- Não acuse ninguém sem confirmação.
- Organize o texto em parágrafos.
- Use termos adequados para relatório oficial.

Organize com:
1. Acionamento da guarnição
2. Deslocamento ao local
3. Situação encontrada
4. Providências adotadas
5. Encerramento

Informações da ocorrência:
${conteudo}
`;
    }

    if (tipo === "melhorar") {
      return `
Você é uma IA Operacional da Guarda Civil Municipal.

Melhore o texto abaixo para linguagem formal de ocorrência.

Regras:
- Corrija erros de escrita.
- Organize as frases.
- Mantenha o sentido original.
- Não invente fatos.
- Não acrescente informações não fornecidas.

Texto:
${conteudo}
`;
    }

    if (tipo === "providencias") {
      return `
Você é uma IA Operacional da Guarda Civil Municipal.

Com base nas informações abaixo, sugira providências operacionais adequadas para constar em uma ocorrência.

Regras:
- Seja objetivo.
- Não dê ordem ilegal.
- Não substitua decisão do guarda responsável.
- Responda como apoio operacional.

Informações:
${conteudo}
`;
    }

    return `
Você é uma IA Operacional da Guarda Civil Municipal.

Analise as informações abaixo e sugira a possível natureza/tipo da ocorrência.

Regras:
- Responda de forma orientativa.
- Não afirme crime sem elementos suficientes.
- Informe quando houver dúvida.
- Sugira uma ou mais naturezas possíveis.

Informações:
${conteudo}
`;
  }

  async function consultarIA(tipo: TipoConsulta) {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida. Faça login novamente.");
      return;
    }

    if (!texto.trim()) {
      alert("Digite as informações da ocorrência.");
      return;
    }

    if (texto.trim().length < 10) {
      alert("Digite mais detalhes para a IA analisar corretamente.");
      return;
    }

    if (texto.trim().length > 8000) {
      alert("O texto está muito grande. Reduza para no máximo 8000 caracteres.");
      return;
    }

    if (creditos !== null && creditos <= 0) {
      alert("Este município está sem créditos de IA.");
      return;
    }

    setCarregando(true);
    setTipoAtual(tipo);
    setResposta("");

    const comando = montarComando(tipo);

    try {
      await registrarAuditoria({
        modulo: "IA Operacional",
        acao: "CONSULTAR",
        tabela: "ia_creditos_municipio",
        descricao: `Consultou a IA Operacional no modo ${tipo}.`,
        detalhes: {
          tipo,
          tamanho_texto: texto.trim().length,
          municipio_id: usuario.municipio_id,
        },
      });

      const res = await fetch("/api/ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pergunta: comando,
          modo: "operacional",
          usuario,
        }),
      });

      const textoResposta = await res.text();

      let data: any = {};

      try {
        data = JSON.parse(textoResposta);
      } catch {
        console.error("Resposta inválida de /api/ia:", textoResposta);

        setResposta("Erro: a API da IA retornou uma resposta inválida.");

        await registrarAuditoria({
          modulo: "IA Operacional",
          acao: "ERRO",
          tabela: "ia_creditos_municipio",
          descricao: "A API da IA retornou resposta inválida.",
          detalhes: {
            tipo,
            municipio_id: usuario.municipio_id,
          },
        });

        return;
      }

      if (!res.ok) {
        const mensagem = data.erro || "Erro ao consultar a IA.";
        setResposta(mensagem);

        await registrarAuditoria({
          modulo: "IA Operacional",
          acao: "ERRO",
          tabela: "ia_creditos_municipio",
          descricao: "Erro ao consultar a IA Operacional.",
          detalhes: {
            tipo,
            erro: mensagem,
            municipio_id: usuario.municipio_id,
          },
        });

        return;
      }

      setResposta(data.resposta || data.erro || "Sem resposta.");

      if (data.creditos_restantes !== undefined) {
        setCreditos(Number(data.creditos_restantes));
      } else {
        await carregarCreditos(usuario);
      }
    } catch (error) {
      console.error("Erro ao conectar com a IA:", error);

      setResposta("Erro ao conectar com a IA.");

      await registrarAuditoria({
        modulo: "IA Operacional",
        acao: "ERRO",
        tabela: "ia_creditos_municipio",
        descricao: "Falha de conexão com a IA Operacional.",
        detalhes: {
          tipo,
          municipio_id: usuario.municipio_id,
        },
      });
    } finally {
      setCarregando(false);
      setTipoAtual(null);
    }
  }

  async function copiarResposta() {
    if (!resposta.trim()) return;

    await navigator.clipboard.writeText(resposta);

    await registrarAuditoria({
      modulo: "IA Operacional",
      acao: "COPIAR_RESPOSTA",
      tabela: "ia_creditos_municipio",
      descricao: "Copiou resposta gerada pela IA Operacional.",
      detalhes: {
        tamanho_resposta: resposta.length,
        municipio_id: usuario?.municipio_id || null,
      },
    });

    alert("Resposta copiada.");
  }

  return (
    <main className="min-h-screen bg-[#020b1c] text-white p-4 md:p-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        <section className="painel-premium p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
                <Bot className="w-10 h-10 text-blue-400" />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-blue-400 font-bold">
                  Inteligência Operacional
                </p>

                <h1 className="text-3xl md:text-4xl font-black text-white mt-1">
                  IA Operacional
                </h1>

                <p className="mt-3 text-slate-300 max-w-3xl">
                  Auxilia o guarda no preenchimento de ocorrências, relatos,
                  providências e classificação da natureza do fato.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 w-fit">
              <Sparkles className="w-5 h-5 text-blue-300" />
              <span className="font-bold text-blue-300">Créditos IA:</span>
              <span className="font-black text-white">
                {carregandoCreditos || creditos === null
                  ? "Carregando..."
                  : creditos}
              </span>
            </div>
          </div>
        </section>

        <section className="painel-premium p-6 space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-black text-white">
              Informações da ocorrência
            </h2>
          </div>

          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={8000}
            placeholder="Ex: Guarnição foi acionada para uma briga na Praça Municipal. Ao chegar, encontrou dois indivíduos discutindo. Foi feita abordagem, orientação e as partes foram liberadas..."
            className="input h-52 resize-none"
          />

          <div className="flex justify-between text-xs text-slate-500">
            <span>Informe apenas dados necessários para o apoio operacional.</span>
            <span>{texto.length}/8000</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <BotaoIA
              titulo="Gerar Relato"
              subtitulo="Relatório formal"
              carregando={carregando && tipoAtual === "relato"}
              disabled={carregando}
              onClick={() => consultarIA("relato")}
            />

            <BotaoIA
              titulo="Melhorar Texto"
              subtitulo="Corrigir e organizar"
              carregando={carregando && tipoAtual === "melhorar"}
              disabled={carregando}
              onClick={() => consultarIA("melhorar")}
            />

            <BotaoIA
              titulo="Providências"
              subtitulo="Apoio operacional"
              carregando={carregando && tipoAtual === "providencias"}
              disabled={carregando}
              onClick={() => consultarIA("providencias")}
            />

            <BotaoIA
              titulo="Sugerir Natureza"
              subtitulo="Classificação orientativa"
              carregando={carregando && tipoAtual === "natureza"}
              disabled={carregando}
              onClick={() => consultarIA("natureza")}
            />
          </div>
        </section>

        {carregando && (
          <section className="painel-premium p-6 text-center text-slate-300">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-400" />
            Gerando apoio operacional...
          </section>
        )}

        {resposta && (
          <section className="painel-premium p-6 border border-blue-500/30 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h2 className="text-2xl font-black text-white">
                Resultado da IA
              </h2>

              <button
                type="button"
                onClick={copiarResposta}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <ClipboardCopy className="w-5 h-5" />
                Copiar resposta
              </button>
            </div>

            <div className="whitespace-pre-wrap text-slate-200 leading-relaxed rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              {resposta}
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-300">
              <ShieldCheck className="w-5 h-5 mt-0.5" />
              <p className="text-sm">
                Texto gerado como apoio. O guarda responsável deve revisar antes
                de salvar na ocorrência. A IA não substitui a decisão operacional
                nem o relatório oficial do agente.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function BotaoIA({
  titulo,
  subtitulo,
  carregando,
  disabled,
  onClick,
}: {
  titulo: string;
  subtitulo: string;
  carregando: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-left hover:bg-blue-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-black text-white">{titulo}</p>
          <p className="text-xs text-slate-400 mt-1">{subtitulo}</p>
        </div>

        {carregando ? (
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
        ) : (
          <Sparkles className="w-5 h-5 text-blue-400" />
        )}
      </div>
    </button>
  );
}