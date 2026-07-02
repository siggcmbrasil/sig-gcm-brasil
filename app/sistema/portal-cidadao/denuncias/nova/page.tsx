"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareWarning, Save } from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function NovaDenunciaCidadaoPage() {
  const router = useRouter();

  const [anonima, setAnonima] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipo, setTipo] = useState("");
  const [local, setLocal] = useState("");
  const [relato, setRelato] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvarDenuncia() {
    if (!tipo || !relato) {
      alert("Informe o tipo da denúncia e o relato.");
      return;
    }

    setSalvando(true);

    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    const protocolo = `DEN-${new Date().getFullYear()}-${Date.now()}`;

    const { error } = await supabase
      .from("denuncias_cidadao")
      .insert({
        municipio_id: usuario.municipio_id,
        protocolo,
        anonima,
        nome: anonima ? null : nome,
        telefone: anonima ? null : telefone,
        tipo,
        local,
        relato,
        status: "PENDENTE",
      });

    setSalvando(false);

    if (error) {
      console.error(error);
      alert("Erro ao registrar denúncia.");
      return;
    }

    alert(`Denúncia registrada com sucesso. Protocolo: ${protocolo}`);
    router.push("/sistema/portal-cidadao/denuncias");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Nova Denúncia"
        subtitulo="Registre uma denúncia recebida pelo Portal do Cidadão."
        icone={MessageSquareWarning}
      />

      <SigCard>
        <div className="space-y-4">
          <label className="flex items-center gap-3 text-slate-200">
            <input
              type="checkbox"
              checked={anonima}
              onChange={(e) => setAnonima(e.target.checked)}
            />
            Denúncia anônima
          </label>

          {!anonima && (
            <div className="grid md:grid-cols-2 gap-4">
              <Campo
                label="Nome"
                value={nome}
                onChange={setNome}
                placeholder="Nome do cidadão"
              />

              <Campo
                label="Telefone"
                value={telefone}
                onChange={setTelefone}
                placeholder="Telefone para contato"
              />
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-slate-300">
                Tipo da denúncia
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-white"
              >
                <option value="">Selecione</option>
                <option value="Perturbação do sossego">
                  Perturbação do sossego
                </option>
                <option value="Trânsito">Trânsito</option>
                <option value="Maria da Penha">Maria da Penha</option>
                <option value="Violência">Violência</option>
                <option value="Patrimônio público">Patrimônio público</option>
                <option value="Iluminação pública">Iluminação pública</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <Campo
              label="Local"
              value={local}
              onChange={setLocal}
              placeholder="Rua, bairro ou referência"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-300">
              Relato da denúncia
            </label>
            <textarea
              value={relato}
              onChange={(e) => setRelato(e.target.value)}
              placeholder="Descreva a denúncia..."
              rows={6}
              className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-white"
            />
          </div>

          <button
            onClick={salvarDenuncia}
            disabled={salvando}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            <Save size={18} />
            {salvando ? "Salvando..." : "Registrar Denúncia"}
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-slate-300">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-white"
      />
    </div>
  );
}