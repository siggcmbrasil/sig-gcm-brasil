"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import { useRouter } from "next/navigation";

export default function NovoEventoOperacionalPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [local, setLocal] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [efetivoPrevisto, setEfetivoPrevisto] = useState("");
  const [descricao, setDescricao] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function salvar() {
  if (!usuario?.id || !usuario?.municipio_id) {
    alert("Sessão inválida.");
    return;
  }

  if (!nome.trim() || !local.trim() || !dataInicio) {
      alert("Preencha nome, local e data de início.");
      return;
    }

    const { error } = await supabase.from("eventos_operacionais").insert([
      {
        municipio_id: usuario.municipio_id,
        nome,
        tipo,
        local,
        data_inicio: dataInicio,
        data_fim: dataFim || null,
        efetivo_previsto: Number(efetivoPrevisto || 0),
        descricao,
        status: "PLANEJADO",
        criado_por: usuario.id ? String(usuario.id) : null,
      },
    ]);

    if (error) {
  console.error("Erro Supabase:", error);
  console.error("Mensagem:", error.message);
  console.error("Detalhes:", error.details);
  console.error("Código:", error.code);

  alert(error.message || "Erro ao salvar evento.");
  return;
}

await registrarAuditoria({
  modulo: "Eventos Operacionais",
  acao: "CRIAR",
  descricao: `Criou evento operacional: ${nome.trim()}.`,
  tabela: "eventos_operacionais",
  detalhes: {
    nome: nome.trim(),
    tipo,
    local: local.trim(),
    data_inicio: dataInicio,
    data_fim: dataFim || null,
    efetivo_previsto: Number(efetivoPrevisto || 0),
  },
});

    alert("Evento operacional cadastrado com sucesso.");
    router.push("/sistema/eventos-operacionais");
  }

  return (
    <div className="p-6 space-y-6">
      <div className="painel-premium p-6">
  <div className="flex items-center justify-between gap-4">
    <div>
      <h1 className="text-3xl font-black">
        Novo Evento Operacional
      </h1>

      <p className="text-slate-400 mt-2">
        Cadastre operações especiais, eventos municipais e ações planejadas.
      </p>
    </div>

    <button
      onClick={() => router.back()}
      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20"
    >
      Voltar
    </button>
  </div>
</div>
      <div className="painel-premium p-6 grid md:grid-cols-2 gap-4">
        <input
          className="input-premium"
          placeholder="Nome do evento"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <select
          className="input-premium"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="">Tipo de evento</option>
          <option value="FESTA_MUNICIPAL">Festa Municipal</option>
          <option value="EVENTO_ESPORTIVO">Evento Esportivo</option>
          <option value="OPERACAO_ESPECIAL">Operação Especial</option>
          <option value="EVENTO_RELIGIOSO">Evento Religioso</option>
          <option value="VISITA_AUTORIDADE">Visita de Autoridade</option>
          <option value="OUTRO">Outro</option>
        </select>

        <input
          className="input-premium"
          placeholder="Local"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
        />

        <input
          className="input-premium"
          type="number"
          placeholder="Efetivo previsto"
          value={efetivoPrevisto}
          onChange={(e) => setEfetivoPrevisto(e.target.value)}
        />

        <input
          className="input-premium"
          type="datetime-local"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
        />

        <input
          className="input-premium"
          type="datetime-local"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
        />

        <textarea
          className="input-premium md:col-span-2 min-h-32"
          placeholder="Descrição / planejamento operacional"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <button
          onClick={salvar}
          className="md:col-span-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl"
        >
          Salvar Evento Operacional
        </button>
      </div>
    </div>
  );
}