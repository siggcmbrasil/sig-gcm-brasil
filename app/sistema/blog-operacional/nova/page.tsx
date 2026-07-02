"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Newspaper } from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigButton from "@/components/sig/SigButton";

export default function NovaPublicacaoPage() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("Operacional");
  const [resumo, setResumo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [salvando, setSalvando] = useState(false);

  function pegarUsuario() {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  }

  async function registrarAuditoria(acao: string, detalhes: string) {
    const usuario = pegarUsuario();

    await supabase.from("auditoria_sistema").insert({
      municipio_id: usuario.municipio_id,
      usuario_id: usuario.id,
      modulo: "BLOG_OPERACIONAL",
      acao,
      detalhes,
    });
  }

  async function publicar() {
    const usuario = pegarUsuario();

    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      return;
    }

    if (!titulo.trim() || !resumo.trim() || !conteudo.trim()) {
      alert("Preencha título, resumo e conteúdo.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("blog_operacional").insert({
      municipio_id: usuario.municipio_id,
      titulo: titulo.trim(),
      autor: usuario.nome || "SIG-GCM Brasil",
      categoria,
      resumo: resumo.trim(),
      conteudo: conteudo.trim(),
      publicado: true,
      criado_por: usuario.id,
      data_publicacao: new Date().toISOString().split("T")[0],
    });

    setSalvando(false);

    if (error) {
      alert("Erro ao publicar.");
      console.error(error);
      return;
    }

    await registrarAuditoria(
      "CRIAR_PUBLICACAO",
      `Criou publicação: ${titulo.trim()}`
    );

    alert("Publicação criada com sucesso.");
    router.push("/sistema/blog-operacional");
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <SigPageHeader
        titulo="Nova Publicação"
        subtitulo="Crie uma notícia, comunicado ou informativo operacional."
        icone={Newspaper}
      />

      <SigCard>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold">Título</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none"
              placeholder="Ex: Guarda Municipal realiza operação preventiva"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Categoria</label>
            <select
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="Operacional">Operacional</option>
              <option value="Comunicado">Comunicado</option>
              <option value="Institucional">Institucional</option>
              <option value="Treinamento">Treinamento</option>
              <option value="Legislação">Legislação</option>
              <option value="Evento">Evento</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Resumo</label>
            <textarea
              className="mt-1 min-h-24 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none"
              placeholder="Escreva um resumo curto da publicação..."
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold">
              Conteúdo da Publicação
            </label>
            <textarea
              className="mt-1 min-h-56 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none"
              placeholder="Digite aqui o texto completo da publicação..."
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <SigButton
              icon={Send}
              onClick={publicar}
              disabled={salvando}
            >
              {salvando ? "Publicando..." : "Publicar"}
            </SigButton>
          </div>
        </div>
      </SigCard>
    </div>
  );
}