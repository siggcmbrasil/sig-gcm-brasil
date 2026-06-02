"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NovaOcorrencia() {
  const router = useRouter();

  const [tipo, setTipo] = useState("");
  const [status, setStatus] = useState("Aberta");
  const [bairro, setBairro] = useState("");
  const [local, setLocal] = useState("");
  const [numero, setNumero] = useState("");
  const [envolvidos, setEnvolvidos] = useState("");
  const [descricao, setDescricao] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvarOcorrencia() {
    if (!tipo || !local || !descricao) {
      alert("Preencha tipo, local e descrição.");
      return;
    }

    setSalvando(true);

    const agora = new Date();
    const protocolo = "OC-" + Date.now();
    const data = agora.toISOString().split("T")[0];
    const hora = agora.toTimeString().slice(0, 8);

    let fotoUrl = "";

    if (foto) {
      const nomeArquivo = `${protocolo}-${foto.name}`;

      const { error: uploadError } = await supabase.storage
        .from("fotos-ocorrencias")
        .upload(nomeArquivo, foto);

      if (uploadError) {
        console.error(uploadError);
        alert("Erro ao enviar foto.");
        setSalvando(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("fotos-ocorrencias")
        .getPublicUrl(nomeArquivo);

      fotoUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("ocorrencias").insert([
      {
        protocolo,
        tipo,
        status,
        data,
        hora,
        bairro,
        local,
        numero,
        envolvidos,
        descricao,
        foto_url: fotoUrl,
      },
    ]);

    setSalvando(false);

    if (error) {
      console.error(error);
      alert("Erro ao salvar ocorrência.");
      return;
    }

    alert("Ocorrência salva com sucesso!");
    router.push("/sistema/ocorrencias");
  }

  return (
    <div className="p-6">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl font-bold">Nova Ocorrência</h1>
        <p className="text-slate-400">
          Preencha os dados da ocorrência registrada pela GCM.
        </p>
      </header>

      <form className="card space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Tipo de ocorrência</label>
            <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Selecione</option>
              <option value="Perturbação do sossego">Perturbação do sossego</option>
              <option value="Apoio ao cidadão">Apoio ao cidadão</option>
              <option value="Patrulhamento preventivo">Patrulhamento preventivo</option>
              <option value="Apoio a outro órgão">Apoio a outro órgão</option>
              <option value="Fiscalização">Fiscalização</option>
              <option value="Acidente">Acidente</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="label">Status</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Aberta">Aberta</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Finalizada">Finalizada</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Campo label="Bairro" valor={bairro} setValor={setBairro} placeholder="Ex: Centro" />
          <Campo label="Rua / Local" valor={local} setValor={setLocal} placeholder="Ex: Rua da Paz" />
          <Campo label="Número" valor={numero} setValor={setNumero} placeholder="S/N" />
        </div>

        <Campo
          label="Envolvidos"
          valor={envolvidos}
          setValor={setEnvolvidos}
          placeholder="Nome das pessoas envolvidas, se houver"
        />

        <div>
          <label className="label">Descrição da ocorrência</label>
          <textarea
            className="input h-36 resize-none"
            placeholder="Descreva o que aconteceu..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Foto da ocorrência</label>
          <input
            type="file"
            accept="image/*"
            className="input"
            onChange={(e) => setFoto(e.target.files?.[0] || null)}
          />
          <p className="text-xs text-slate-500 mt-2">
            Pode anexar uma foto tirada no celular ou no computador.
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-800 pt-6">
          <button
            type="button"
            onClick={() => router.push("/sistema/ocorrencias")}
            className="px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={salvarOcorrencia}
            disabled={salvando}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar Ocorrência"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Campo({
  label,
  valor,
  setValor,
  placeholder,
}: {
  label: string;
  valor: string;
  setValor: (valor: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />
    </div>
  );
}