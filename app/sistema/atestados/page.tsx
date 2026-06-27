"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
};

export default function AtestadosPage() {
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [guardaId, setGuardaId] = useState("");
  const [tipo, setTipo] = useState("MEDICO");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [dias, setDias] = useState("");
  const [cid, setCid] = useState("");
  const [observacao, setObservacao] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    carregarGuardas();
  }, []);

  async function carregarGuardas() {
    const { data, error } = await supabase
      .from("guardas")
      .select("id, nome, matricula")
      .eq("municipio_id", usuario.municipio_id)
      .order("nome");

    if (error) {
      alert("Erro ao carregar guardas.");
      return;
    }

    setGuardas(data || []);
  }

  async function enviarArquivo() {
    if (!arquivo) return null;

    const extensao = arquivo.name.split(".").pop();
    const nomeArquivo = `atestados/${usuario.municipio_id}/${Date.now()}.${extensao}`;

    const { error } = await supabase.storage
      .from("documentos")
      .upload(nomeArquivo, arquivo);

    if (error) {
      alert(error.message);
      return null;
    }

    const { data } = supabase.storage
      .from("documentos")
      .getPublicUrl(nomeArquivo);

    return data.publicUrl;
  }

  async function salvar() {
    if (!guardaId || !dataInicio || !dias) {
      alert("Preencha guarda, data inicial e dias.");
      return;
    }

    setSalvando(true);

    const arquivoUrl = await enviarArquivo();

    const { error } = await supabase.from("atestados").insert([
      {
        municipio_id: usuario.municipio_id,
        guarda_id: Number(guardaId),
        tipo,
        data_inicio: dataInicio,
        data_fim: dataFim || null,
        dias: Number(dias),
        cid,
        observacao,
        arquivo_url: arquivoUrl,
        criado_por: usuario.id,
      },
    ]);

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Atestado registrado.");

    setGuardaId("");
    setTipo("MEDICO");
    setDataInicio("");
    setDataFim("");
    setDias("");
    setCid("");
    setObservacao("");
    setArquivo(null);
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-black">Atestados</h1>
        <p className="text-slate-400">
          Registro de atestados médicos e afastamentos temporários.
        </p>
      </div>

      <div className="painel-premium p-6 space-y-4">
        <select
          className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white"
          value={guardaId}
          onChange={(e) => setGuardaId(e.target.value)}
        >
          <option className="bg-white text-black" value="">
            Selecione o Guarda
          </option>

          {guardas.map((g) => (
            <option className="bg-white text-black" key={g.id} value={g.id}>
              {g.nome} - {g.matricula || "Sem matrícula"}
            </option>
          ))}
        </select>

        <select
          className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option className="bg-white text-black" value="MEDICO">
            Médico
          </option>
          <option className="bg-white text-black" value="ODONTOLOGICO">
            Odontológico
          </option>
          <option className="bg-white text-black" value="ACIDENTE">
            Acidente
          </option>
          <option className="bg-white text-black" value="OUTRO">
            Outro
          </option>
        </select>

        <div className="grid md:grid-cols-3 gap-4">
          <input
            type="date"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />

          <input
            type="date"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />

          <input
            type="number"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white placeholder:text-slate-400"
            placeholder="Dias"
            value={dias}
            onChange={(e) => setDias(e.target.value)}
          />
        </div>

        <input
          className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white placeholder:text-slate-400"
          placeholder="CID"
          value={cid}
          onChange={(e) => setCid(e.target.value)}
        />

        <textarea
          className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white min-h-32 resize-none placeholder:text-slate-400"
          placeholder="Observação"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white"
          onChange={(e) => setArquivo(e.target.files?.[0] || null)}
        />

        <button
          onClick={salvar}
          disabled={salvando}
          className="sig-btn-gold"
        >
          {salvando ? "Salvando..." : "Salvar Atestado"}
        </button>
      </div>
    </div>
  );
}