"use client";

import { useEffect, useState } from "react";
import {
  ClipboardCopy,
  Gavel,
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

export default function IaJuridicaPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [carregandoCreditos, setCarregandoCreditos] = useState(true);
  const [creditos, setCreditos] = useState<number | null>(null);

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
      modulo: "IA Jurídica",
      acao: "ACESSO",
      tabela: "ia_creditos_municipio",
      descricao: "Acessou a tela da IA Jurídica.",
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

  function montarPerguntaJuridica() {
    return `
Você é uma IA Jurídica de apoio à Guarda Civil Municipal.

Responda de forma orientativa, clara e responsável.

Regras:
- Não substitua advogado, procuradoria ou parecer jurídico oficial.
- Não invente leis, artigos ou decisões.
- Quando houver dúvida, diga que é necessário consultar a assessoria jurídica.
- Use linguagem simples e aplicável à rotina da Guarda Municipal.
- Quando possível, organize a resposta em tópicos.

Pergunta do usuário:
${pergunta.trim()}
`;
  }

  async function consultarIA() {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida. Faça login novamente.");
      return;
    }

    if (!pergunta.trim()) {
      alert("Digite sua pergunta jurídica.");
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
        modulo: "IA Jurídica",
        acao: "CONSULTAR",
        tabela: "ia_creditos_municipio",
        descricao: "Consultou a IA Jurídica.",
        detalhes: {
          tamanho_pergunta: pergunta.trim().length,
          municipio_id: usuario.municipio_id,
        },
      });

      const res = await fetch("/api/ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pergunta: montarPerguntaJuridica(),
          modo: "juridica",
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
        return;
      }

      if (!res.ok) {
        setResposta(data.erro || "Erro ao consultar IA Jurídica.");
        return;
      }

      setResposta(data.resposta || data.erro || "Sem resposta.");

      if (data.creditos_restantes !== undefined) {
        setCreditos(Number(data.creditos_restantes));
      } else {
        await carregarCreditos(usuario);
      }
    } catch (error: any) {
      console.error("Erro ao consultar IA Jurídica:", error);
      setResposta(error.message || "Erro inesperado ao consultar IA.");
    } finally {
      setCarregando(false);
    }
  }

  async function copiarResposta() {
    if (!resposta.trim()) return;

    await navigator.clipboard.writeText(resposta);

    await registrarAuditoria({
      modulo: "IA Jurídica",
      acao: "COPIAR_RESPOSTA",
      tabela: "ia_creditos_municipio",
      descricao: "Copiou resposta gerada pela IA Jurídica.",
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
              <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                <Scale className="w-10 h-10 text-yellow-400" />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-bold">
                  Apoio Jurídico Orientativo
                </p>

                <h1 className="text-3xl md:text-4xl font-black text-white mt-1">
                  IA Jurídica
                </h1>

                <p className="mt-3 text-slate-300 max-w-3xl">
                  Consulta jurídica orientativa para apoio operacional da Guarda Municipal.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 w-fit">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="font-bold text-yellow-300">Créditos IA:</span>
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
            <Gavel className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-black text-white">
              Pergunta jurídica
            </h2>
          </div>

          <textarea
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            maxLength={6000}
            placeholder="Ex: A Guarda Municipal pode realizar abordagem preventiva em via pública?"
            className="input h-44 resize-none"
          />

          <div className="flex justify-between text-xs text-slate-500">
            <span>Use como orientação. Decisões formais devem passar pela assessoria jurídica.</span>
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
                <Scale className="w-5 h-5" />
                Consultar IA Jurídica
              </>
            )}
          </button>
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
                Resposta orientativa. Não substitui parecer jurídico oficial,
                advogado, procuradoria municipal ou decisão da autoridade competente.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}