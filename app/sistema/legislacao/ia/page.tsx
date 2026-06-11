"use client";

import { useState } from "react";

export default function Page() {
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function consultarIA() {
    if (!pergunta.trim()) return;

    setCarregando(true);
    setResposta("");

    const response = await fetch("/api/ia-legislacao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pergunta }),
    });

    const data = await response.json();
    setResposta(data.resposta || data.erro || "Sem resposta.");
    setCarregando(false);
  }

  async function copiarResposta() {
    await navigator.clipboard.writeText(resposta);
    alert("Resposta copiada!");
  }

  return (
  <main className="min-h-screen bg-[#020b1c] text-white p-6">
    <div className="painel-premium p-10 text-center">
      <h1 className="text-4xl font-black text-yellow-400">
        ⚖️ IA Jurídica
      </h1>

      <p className="mt-4 text-xl text-slate-300">
        Módulo em desenvolvimento
      </p>

      <p className="mt-2 text-slate-500">
        Em breve o SIG-GCM Brasil contará com consultas inteligentes de legislação,
        Estatuto Geral das Guardas Municipais, CTB, Código Penal, ECA,
        Maria da Penha e demais normas aplicáveis.
      </p>
    </div>
  </main>
);
}