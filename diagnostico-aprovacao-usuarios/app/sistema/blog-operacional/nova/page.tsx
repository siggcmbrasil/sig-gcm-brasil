"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Newspaper, Send } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
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

  async function publicar() {
    const usuario = pegarUsuario();

    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    if (!titulo.trim() || !resumo.trim() || !conteudo.trim()) {
      alert("Preencha título, resumo e conteúdo.");
      return;
    }

    if (titulo.length > 180) {
      alert("Título muito grande.");
      return;
    }

    if (resumo.length > 500) {
      alert("Resumo muito grande.");
      return;
    }

    if (conteudo.length > 10000) {
      alert("Conteúdo muito grande.");
      return;
    }

    setSalvando(true);

    const dadosPublicacao = {
      municipio_id: usuario.municipio_id,
      titulo: titulo.trim(),
      autor: usuario.nome || "SIG-GCM Brasil",
      categoria,
      resumo: resumo.trim(),
      conteudo: conteudo.trim(),
      publicado: true,
      criado_por: usuario.id,
      data_publicacao: new Date().toISOString().split("T")[0],
    };

    const { data, error } = await supabase
      .from("blog_operacional")
      .insert([dadosPublicacao])
      .select("id")
      .single();

    setSalvando(false);

    if (error) {
      await registrarAuditoria({
        modulo: "Blog Operacional",
        acao: "ERRO",
        descricao: "Erro ao criar publicação.",
        tabela: "blog_operacional",
        detalhes: {
          erro: error.message,
          dados: dadosPublicacao,
        },
      });

      alert("Erro ao publicar.");
      return;
    }

    await registrarAuditoria({
      modulo: "Blog Operacional",
      acao: "CRIAR",
      descricao: `Criou publicação: ${titulo.trim()}.`,
      tabela: "blog_operacional",
      registro_id: data?.id,
      detalhes: dadosPublicacao,
    });

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
            <label className="label">Título</label>
            <input
              className="input"
              placeholder="Ex: Guarda Municipal realiza operação preventiva"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Categoria</label>
            <select
              className="input"
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
            <label className="label">Resumo</label>
            <textarea
              className="input min-h-24"
              placeholder="Escreva um resumo curto da publicação..."
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Conteúdo da Publicação</label>
            <textarea
              className="input min-h-56"
              placeholder="Digite aqui o texto completo da publicação..."
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <SigButton icon={Send} onClick={publicar} disabled={salvando}>
              {salvando ? "Publicando..." : "Publicar"}
            </SigButton>
          </div>
        </div>
      </SigCard>
    </div>
  );
}