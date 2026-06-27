"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function OficiosRecebidosPage() {
  const [oficios, setOficios] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [numero, setNumero] = useState("");
  const [orgao, setOrgao] = useState("");
  const [assunto, setAssunto] = useState("");
  const [tipo, setTipo] = useState("EVENTO");
  const [status, setStatus] = useState("RECEBIDO");
  const [dataRecebimento, setDataRecebimento] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [observacao, setObservacao] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    const { data, error } = await supabase
      .from("oficios_recebidos")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    if (error) {
      alert("Erro ao carregar ofícios recebidos.");
      return;
    }

    setOficios(data || []);
  }

  useEffect(() => {
    if (usuario?.municipio_id) carregar();
  }, []);

  async function salvar() {
    if (!numero || !orgao || !assunto) {
      alert("Preencha número, órgão remetente e assunto.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("oficios_recebidos").insert([
      {
        municipio_id: usuario.municipio_id,
        criado_por: usuario.id,
        numero,
        orgao_remetente: orgao,
        assunto,
        tipo,
        status,
        data_recebimento: dataRecebimento || null,
        data_inicio: dataInicio || null,
        data_fim: dataFim || null,
        observacao,
      },
    ]);

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    setNumero("");
    setOrgao("");
    setAssunto("");
    setTipo("EVENTO");
    setStatus("RECEBIDO");
    setDataRecebimento("");
    setDataInicio("");
    setDataFim("");
    setObservacao("");

    carregar();
  }

  function corStatus(s: string) {
    if (s === "CONCLUIDO") return "bg-green-700";
    if (s === "EM_ANDAMENTO") return "bg-blue-700";
    if (s === "ARQUIVADO") return "bg-slate-700";
    return "bg-yellow-700";
  }

  return (
    <div className="p-6">
      <div className="painel-premium p-6 mb-6">
        <h1 className="text-3xl font-black">Ofícios Recebidos</h1>
        <p className="text-slate-400 mt-2">
          Controle de ofícios, eventos, solicitações e comunicações externas.
        </p>
      </div>

      <div className="painel-premium p-6 mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <input
            className="input"
            placeholder="Número do ofício"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
          />

          <input
            className="input"
            placeholder="Órgão remetente"
            value={orgao}
            onChange={(e) => setOrgao(e.target.value)}
          />

          <input
            className="input"
            placeholder="Assunto"
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
          />

          <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="EVENTO">Evento</option>
            <option value="OPERACAO">Operação</option>
            <option value="SOLICITACAO">Solicitação</option>
            <option value="CONVITE">Convite</option>
            <option value="DETERMINACAO">Determinação</option>
            <option value="REUNIAO">Reunião</option>
            <option value="OUTRO">Outro</option>
          </select>

          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="RECEBIDO">Recebido</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="ARQUIVADO">Arquivado</option>
          </select>

          <input
            className="input"
            type="date"
            value={dataRecebimento}
            onChange={(e) => setDataRecebimento(e.target.value)}
          />

          <input
            className="input"
            type="datetime-local"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />

          <input
            className="input"
            type="datetime-local"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>

        <textarea
          className="input mt-4 min-h-32"
          placeholder="Observações"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />

        <button onClick={salvar} disabled={salvando} className="sig-btn-gold mt-4">
          {salvando ? "Salvando..." : "Cadastrar Ofício Recebido"}
        </button>
      </div>

      <div className="space-y-4">
        {oficios.map((item) => (
          <div key={item.id} className="painel-premium p-5">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                {item.tipo}
              </span>

              <span className={`${corStatus(item.status)} px-3 py-1 rounded-full text-xs font-bold`}>
                {item.status}
              </span>
            </div>

            <h2 className="text-xl font-black">
              Ofício nº {item.numero}
            </h2>

            <p className="text-yellow-400 font-bold mt-1">
              {item.orgao_remetente}
            </p>

            <p className="text-slate-200 mt-2">
              {item.assunto}
            </p>

            {item.observacao && (
              <p className="text-slate-400 mt-3 whitespace-pre-wrap">
                {item.observacao}
              </p>
            )}

            <p className="text-xs text-slate-500 mt-4">
              Recebido em:{" "}
              {item.data_recebimento
                ? new Date(item.data_recebimento).toLocaleDateString("pt-BR")
                : "Não informado"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}