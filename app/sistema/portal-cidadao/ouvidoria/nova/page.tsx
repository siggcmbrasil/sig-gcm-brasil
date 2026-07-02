"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Save } from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function NovaOuvidoriaPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [tipo, setTipo] = useState("");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!tipo || !mensagem) {
      alert("Informe o tipo e a mensagem.");
      return;
    }

    setSalvando(true);

    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    const protocolo = `OUV-${new Date().getFullYear()}-${Date.now()}`;

    const { error } = await supabase.from("ouvidoria_cidadao").insert({
      municipio_id: usuario.municipio_id,
      protocolo,
      nome,
      telefone,
      email,
      tipo,
      assunto,
      mensagem,
      status: "PENDENTE",
    });

    setSalvando(false);

    if (error) {
      console.error(error);
      alert("Erro ao salvar registro.");
      return;
    }

    alert(`Registro criado com sucesso. Protocolo: ${protocolo}`);
    router.push("/sistema/portal-cidadao/ouvidoria");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Novo Registro"
        subtitulo="Registrar manifestação da ouvidoria."
        icone={MessageSquare}
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
                Tipo
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-white"
              >
                <option value="">Selecione</option>
                <option value="RECLAMACAO">Reclamação</option>
                <option value="SUGESTAO">Sugestão</option>
                <option value="ELOGIO">Elogio</option>
                <option value="DENUNCIA_ADMINISTRATIVA">
                  Denúncia Administrativa
                </option>
              </select>
            </div>

            <Campo label="Assunto" value={assunto} onChange={setAssunto} />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-300">
              Mensagem
            </label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={6}
              placeholder="Digite a manifestação..."
              className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-white"
            />
          </div>

          <button
            onClick={salvar}
            disabled={salvando}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            <Save size={18} />
            {salvando ? "Salvando..." : "Salvar Registro"}
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
      <label className="text-sm font-bold text-slate-300">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-white"
      />
    </div>
  );
}