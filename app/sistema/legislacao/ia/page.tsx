"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  ClipboardCopy,
  Loader2,
  Scale,
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

const perguntasRapidas = [
  "Explique de forma simples o Estatuto Geral das Guardas Municipais.",
  "A Guarda Municipal pode realizar abordagem preventiva em via pública?",
  "Quais são as principais atribuições da Guarda Municipal pela Lei 13.022/2014?",
  "Explique a atuação da Guarda Municipal em ocorrência de Maria da Penha.",
  "Explique a diferença entre crime, contravenção e infração administrativa.",
  "Quais cuidados o guarda deve tomar em uma abordagem para evitar abuso de autoridade?",
  "Explique a atuação da Guarda Municipal em infrações de trânsito.",
  "Resuma os principais pontos do ECA aplicáveis à atuação da Guarda Municipal.",
];

export default function IALegislacaoPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");
  const [creditos, setCreditos] = useState<number | null>(null);
  const [carregandoCreditos, setCarregandoCreditos] = useState(true);
  const [carregando, setCarregando] = useState(false);

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
      modulo: "IA Legislação",
      acao: "ACESSO",
      tabela: "ia_creditos_municipio",
      descricao: "Acessou a tela da IA Legislação.",
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

  function montarPerguntaLegislacao() {
    return `
Você é uma IA de Legislação aplicada à Guarda Civil Municipal.

Responda de forma orientativa, clara e responsável.

Regras obrigatórias:
- Não invente lei, artigo, jurisprudência ou decisão.
- Se não tiver certeza, diga que é necessário consultar fonte oficial.
- Use linguagem simples e operacional.
- Dê foco na atuação da Guarda Municipal.
- Quando possível, cite a norma relacionada de forma genérica.
- Não substitua advogado, procuradoria ou parecer jurídico oficial.
- Organize a resposta em tópicos.

Tema/pergunta:
${pergunta.trim()}
`;
  }

  async function consultarIA() {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida. Faça login novamente.");
      return;
    }

    if (!pergunta.trim()) {
      alert("Digite uma pergunta sobre legislação.");
      return;
    }

    if (pergunta.trim().length < 10) {
      alert("Digite uma pergunta mais detalhada.");
      return;
    }

    if (pergunta.trim().length > 6000) {
      alert("A pergunta está muito grande. Reduza para no máximo 6000 caracteres.");
      return;
    }

    if (creditos !== null && creditos <= 0) {
      alert("Este município está sem créditos de IA.");
      return;
    }

    setCarregando(true);
    setResposta("");

    try {
      await registrarAuditoria({
        modulo: "IA Legislação",
        acao: "CONSULTAR",
        tabela: "ia_creditos_municipio",
        descricao: "Consultou a IA Legislação.",
        detalhes: {
          tamanho_pergunta: pergunta.trim().length,
          municipio_id: usuario.municipio_id,
        },
      });

      const res = await fetch("/api/ia-legislacao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pergunta: montarPerguntaLegislacao(),
          usuario,
          modo: "legislacao",
        }),
      });

      const textoResposta = await res.text();

      let data: any = {};

      try {
        data = JSON.parse(textoResposta);
      } catch {
        console.error("Resposta inválida de /api/ia-legislacao:", textoResposta);
        setResposta("Erro: a API da IA Legislação retornou uma resposta inválida.");
        return;
      }

      if (!res.ok) {
        setResposta(data.erro || "Erro ao consultar IA Legislação.");
        return;
      }

      setResposta(data.resposta || data.erro || "Sem resposta.");

      if (data.creditos_restantes !== undefined) {
        setCreditos(Number(data.creditos_restantes));
      } else {
        await carregarCreditos(usuario);
      }
    } catch (error: any) {
      console.error("Erro ao consultar IA Legislação:", error);
      setResposta(error.message || "Erro inesperado ao consultar IA.");
    } finally {
      setCarregando(false);
    }
  }

  async function copiarResposta() {
    if (!resposta.trim()) return;

    await navigator.clipboard.writeText(resposta);

    await registrarAuditoria({
      modulo: "IA Legislação",
      acao: "COPIAR_RESPOSTA",
      tabela: "ia_creditos_municipio",
      descricao: "Copiou resposta gerada pela IA Legislação.",
      detalhes: {
        tamanho_resposta: resposta.length,
        municipio_id: usuario?.municipio_id || null,
      },
    });

    alert("Resposta copiada.");
  }

  function usarPerguntaRapida(texto: string) {
    setPergunta(texto);
  }

  return (
    <main className="min-h-screen bg-[#020b1c] text-white p-4 md:p-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        <section className="painel-premium p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                <BookOpen className="w-10 h-10 text-yellow-400" />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-bold">
                  Inteligência Legislativa
                </p>

                <h1 className="text-3xl md:text-4xl font-black text-white mt-1">
                  IA Legislação
                </h1>

                <p className="mt-3 text-slate-300 max-w-3xl">
                  Consulta orientativa sobre legislação aplicada à atuação da Guarda Municipal.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 w-fit">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="font-bold text-yellow-300">Créditos IA:</span>
              <span className="font-black text-white">
                {carregandoCreditos || creditos === null ? "Carregando..." : creditos}
              </span>
            </div>
          </div>
        </section>

        <section className="painel-premium p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Scale className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-black text-white">
              Pergunta sobre legislação
            </h2>
          </div>

          <textarea
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            maxLength={6000}
            placeholder="Ex: O que diz a Lei 13.022/2014 sobre as competências da Guarda Municipal?"
            className="input h-44 resize-none"
          />

          <div className="flex justify-between text-xs text-slate-500">
            <span>Use como orientação. Consulte sempre fonte oficial em caso de dúvida.</span>
            <span>{pergunta.length}/6000</span>
          </div>

          <button
            type="button"
            onClick={consultarIA}
            disabled={carregando}
            className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {carregando ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Consultando...
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5" />
                Consultar IA Legislação
              </>
            )}
          </button>
        </section>

        <section className="painel-premium p-6">
          <h2 className="text-xl font-black text-white mb-4">
            Perguntas rápidas
          </h2>

          <div className="grid md:grid-cols-2 gap-3">
            {perguntasRapidas.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => usarPerguntaRapida(item)}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left text-sm text-slate-300 hover:border-yellow-500/50 transition"
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {resposta && (
          <section className="painel-premium p-6 border border-yellow-500/30 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h2 className="text-2xl font-black text-white">
                Resposta da IA
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
                Resposta orientativa. Não substitui consulta à legislação oficial,
                parecer jurídico, advogado, procuradoria municipal ou decisão da
                autoridade competente.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}