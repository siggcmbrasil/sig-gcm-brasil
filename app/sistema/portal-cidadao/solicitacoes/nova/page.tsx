"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Save } from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function NovaSolicitacaoPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [tipo, setTipo] = useState("");
  const [local, setLocal] = useState("");
  const [descricao, setDescricao] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!tipo || !descricao) {
      alert("Informe o tipo da solicitação e a descrição.");
      return;
    }

    setSalvando(true);

    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    const protocolo = `SOL-${new Date().getFullYear()}-${Date.now()}`;

    const { error } = await supabase.from("solicitacoes_cidadao").insert({
      municipio_id: usuario.municipio_id,
      protocolo,
      nome,
      telefone,
      email,
      tipo,
      local,
      descricao,
      status: "PENDENTE",
    });

    setSalvando(false);

    if (error) {
      console.error(error);
      alert("Erro ao salvar solicitação.");
      return;
    }

    alert(`Solicitação criada com sucesso. Protocolo: ${protocolo}`);
    router.push("/sistema/portal-cidadao/solicitacoes");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Nova Solicitação"
        subtitulo="Registrar pedido de apoio, serviço ou demanda do cidadão."
        icone={ClipboardList}
      />

      <SigCard>
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Campo label="Nome" value={nome} onChange={setNome} />
            <Campo label="Telefone" value={telefone} onChange={setTelefone} />
            <Campo label="E-mail" value={email} onChange={setEmail} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-slate-300">
                Tipo de solicitação
              </label>

              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-white"
              >
                <option value="">Selecione</option>
                <option value="Apoio em evento">Apoio em evento</option>
                <option value="Ronda preventiva">Ronda preventiva</option>
                <option value="Orientação ao cidadão">Orientação ao cidadão</option>
                <option value="Fiscalização de trânsito">Fiscalização de trânsito</option>
                <option value="Apoio escolar">Apoio escolar</option>
                <option value="Perturbação do sossego">Perturbação do sossego</option>
                <option value="Animais soltos">Animais soltos</option>
                <option value="Outros serviços">Outros serviços</option>
              </select>
            </div>

            <Campo label="Local" value={local} onChange={setLocal} />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-300">
              Descrição
            </label>

            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={6}
              placeholder="Descreva a solicitação..."
              className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-white"
            />
          </div>

          <button
            onClick={salvar}
            disabled={salvando}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            <Save size={18} />
            {salvando ? "Salvando..." : "Salvar Solicitação"}
          </button>
        </div>
      </SigCard>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-slate-300">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-white"
      />
    </div>
  );
}