"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Newspaper, Save } from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function NovaNoticiaPage() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [resumo, setResumo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [status, setStatus] = useState("RASCUNHO");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!titulo || !categoria) {
      alert("Informe o título e a categoria.");
      return;
    }

    setSalvando(true);

    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    const { error } = await supabase.from("noticias_cidadao").insert({
      municipio_id: usuario.municipio_id,
      titulo,
      categoria,
      resumo,
      conteudo,
      status,
    });

    setSalvando(false);

    if (error) {
      console.error(error);
      alert("Erro ao salvar notícia.");
      return;
    }

    alert("Notícia cadastrada com sucesso.");
    router.push("/sistema/portal-cidadao/noticias");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Nova Notícia"
        subtitulo="Cadastrar comunicado, notícia ou informação oficial."
        icone={Newspaper}
      />

      <SigCard>
        <div className="space-y-4">
          <Campo label="Título" value={titulo} onChange={setTitulo} />

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-slate-300">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-white"
              >
                <option value="">Selecione</option>
                <option value="Comunicado oficial">Comunicado oficial</option>
                <option value="Ação da Guarda">Ação da Guarda</option>
                <option value="Educação preventiva">Educação preventiva</option>
                <option value="Trânsito">Trânsito</option>
                <option value="Eventos">Eventos</option>
                <option value="Serviços públicos">Serviços públicos</option>
                <option value="Alerta à população">Alerta à população</option>
                <option value="Outros assuntos">Outros assuntos</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-300">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-white"
              >
                <option value="RASCUNHO">Rascunho</option>
                <option value="PUBLICADA">Publicada</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-300">
              Resumo
            </label>
            <textarea
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-white"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-300">
              Conteúdo
            </label>
            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={8}
              className="mt-2 w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-white"
            />
          </div>

          <button
            onClick={salvar}
            disabled={salvando}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            <Save size={18} />
            {salvando ? "Salvando..." : "Salvar Notícia"}
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