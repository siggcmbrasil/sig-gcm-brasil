"use client";

import { useEffect, useState } from "react";

export default function IAOperacionalPage() {
  const [texto, setTexto] = useState("");
  const [resposta, setResposta] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [creditos, setCreditos] = useState<number | null>(null);

  useEffect(() => {
  carregarCreditos();
}, []);

async function carregarCreditos() {
  const usuario = JSON.parse(
    localStorage.getItem("usuarioLogado") || "{}"
  );

  const res = await fetch("/api/ia-creditos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      municipio_id: usuario?.municipio_id,
    }),
  });

  const data = await res.json();

  setCreditos(data.saldo || 0);
}

  async function consultarIA(tipo: string) {
    if (!texto.trim()) {
      alert("Digite as informações da ocorrência.");
      return;
    }

    setCarregando(true);
    setResposta("");

    let comando = "";

    if (tipo === "relato") {
      comando = `
Você é uma IA Operacional da Guarda Civil Municipal.

Transforme as informações abaixo em um relato profissional de ocorrência.

Use linguagem formal, objetiva e adequada para relatório oficial.
Organize o texto com:
- Acionamento da guarnição
- Deslocamento ao local
- Situação encontrada
- Providências adotadas
- Encerramento

Informações da ocorrência:
${texto}
`;
    }

    if (tipo === "melhorar") {
      comando = `
Melhore o texto abaixo para linguagem formal de ocorrência da Guarda Civil Municipal.
Corrija erros, organize as frases e mantenha o sentido original.

Texto:
${texto}
`;
    }

    if (tipo === "providencias") {
      comando = `
Com base nas informações abaixo, sugira providências operacionais adequadas para constar em uma ocorrência da Guarda Civil Municipal.

Informações:
${texto}
`;
    }

    if (tipo === "natureza") {
      comando = `
Analise as informações abaixo e sugira a possível natureza/tipo da ocorrência.
Responda de forma orientativa.

Informações:
${texto}
`;
    }

    try {
      const res = await fetch("/api/ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pergunta: comando,
          modo: "operacional",
          usuario: JSON.parse(localStorage.getItem("usuarioLogado") || "{}"),
        }),
      });

      const data = await res.json();

      setResposta(data.resposta || data.erro || "Sem resposta.");

if (data.creditos_restantes !== undefined) {
  setCreditos(data.creditos_restantes);
}
    } catch {
      setResposta("Erro ao conectar com a IA.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020b1c] text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <section className="painel-premium p-6">
          <h1 className="text-4xl font-black text-blue-400">
            🤖 IA Operacional
          </h1>

<div className="mt-4 inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-2">
  <span>🤖</span>
  <span className="font-bold text-blue-300">
    Créditos IA:
  </span>
  <span className="font-black text-white">
    {creditos === null ? "Carregando..." : creditos}
  </span>
</div>

          <p className="mt-3 text-slate-300">
            Auxilia o guarda no preenchimento de ocorrências, relatos e providências.
          </p>
        </section>

        <section className="painel-premium p-6 space-y-4">
          <label className="block text-sm font-bold text-slate-300">
            Informações da ocorrência
          </label>

          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ex: Guarnição foi acionada para uma briga na Praça Municipal. Ao chegar, encontrou dois indivíduos discutindo. Foi feita abordagem, orientação e as partes foram liberadas..."
            className="input h-52"
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <button
              onClick={() => consultarIA("relato")}
              disabled={carregando}
              className="btn-primary disabled:opacity-50"
            >
              🚨 Gerar Relato
            </button>

            <button
              onClick={() => consultarIA("melhorar")}
              disabled={carregando}
              className="bg-green-700 hover:bg-green-800 px-4 py-3 rounded-xl font-bold disabled:opacity-50"
            >
              ✍️ Melhorar Texto
            </button>

            <button
              onClick={() => consultarIA("providencias")}
              disabled={carregando}
              className="bg-purple-700 hover:bg-purple-800 px-4 py-3 rounded-xl font-bold disabled:opacity-50"
            >
              📋 Providências
            </button>

            <button
              onClick={() => consultarIA("natureza")}
              disabled={carregando}
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-3 rounded-xl font-bold disabled:opacity-50"
            >
              🧠 Sugerir Natureza
            </button>
          </div>
        </section>

        {carregando && (
          <section className="painel-premium p-6 text-center text-slate-300">
            Gerando apoio operacional...
          </section>
        )}

        {resposta && (
          <section className="painel-premium p-6 border border-blue-500/30">
            <h2 className="text-2xl font-black mb-4">
              Resultado da IA
            </h2>

            <div className="whitespace-pre-wrap text-slate-200 leading-relaxed">
              {resposta}
            </div>

            <p className="text-xs text-yellow-400 mt-5">
              ⚠️ Texto gerado como apoio. O guarda responsável deve revisar antes de salvar na ocorrência.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}