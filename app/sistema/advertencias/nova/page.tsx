"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

type Guarda = {
  id: string;
  nome: string;
  matricula: string;
};

export default function NovaAdvertenciaPage() {
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [guardaId, setGuardaId] = useState("");
  const [tipo, setTipo] = useState("Escrita");
  const [motivo, setMotivo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    carregarGuardas();
  }, []);

  async function carregarGuardas() {
    const { data } = await supabase
      .from("guardas")
      .select("id, nome, matricula")
      .order("nome");

    setGuardas(data || []);
  }

  async function salvar() {
  if (!guardaId) {
    alert("Selecione um guarda.");
    return;
  }

  if (!motivo.trim()) {
    alert("Informe o motivo.");
    return;
  }

  const guarda = guardas.find(
    (g) => String(g.id) === guardaId
  );

  const usuario = JSON.parse(
  localStorage.getItem("usuarioLogado") || "{}"
);

const { error } = await supabase
  .from("advertencias")
  .insert({
    municipio_id: usuario.municipio_id,
    criado_por: usuario.id,
    guarda_id: guardaId,
    tipo,
    motivo,
    descricao,
    data_advertencia: data,
    status: "ATIVA",
  });

  if (error) {
    alert(error.message);
    return;
  }

  await registrarAuditoria({
    modulo: "Advertências",
    acao: "CRIAR",
    descricao: `Criou uma advertência ${tipo} para ${guarda?.nome || guardaId}.`,
  });

  alert("Advertência cadastrada!");

  setGuardaId("");
  setMotivo("");
  setDescricao("");
}

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">
        Nova Advertência
      </h1>

      <div className="painel-premium p-6 space-y-4">

       <select
  value={guardaId}
  onChange={(e) => setGuardaId(e.target.value)}
  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white"
>
  <option className="bg-slate-900 text-white" value="">
    Selecione o Guarda
  </option>

  {guardas.map((g) => (
    <option
      className="bg-slate-900 text-white"
      key={g.id}
      value={g.id}
    >
      {g.nome} - {g.matricula}
    </option>
  ))}
</select>

        <select
  value={tipo}
  onChange={(e) => setTipo(e.target.value)}
  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white"
>
  <option className="bg-slate-900 text-white" value="Verbal">
    Verbal
  </option>

  <option className="bg-slate-900 text-white" value="Escrita">
    Escrita
  </option>

  <option className="bg-slate-900 text-white" value="Disciplinar">
    Disciplinar
  </option>
</select>

        <input
          type="date"
          className="input-premium w-full"
          value={data}
          onChange={(e) =>
            setData(e.target.value)
          }
        />

        <input
          className="input-premium w-full"
          placeholder="Motivo"
          value={motivo}
          onChange={(e) =>
            setMotivo(e.target.value)
          }
        />

        <textarea
          className="input-premium w-full min-h-40"
          placeholder="Descrição"
          value={descricao}
          onChange={(e) =>
            setDescricao(e.target.value)
          }
        />

        <button
          onClick={salvar}
          className="botao-premium"
        >
          Salvar Advertência
        </button>
      </div>
    </div>
  );
}