"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Newspaper, Save, XCircle } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

type UsuarioLogado = {
  id: string;
  perfil: string;
  municipio_id: number;
};

function obterUsuarioLogado(): UsuarioLogado | null {
  try {
    const salvo = localStorage.getItem("usuarioLogado");

    if (!salvo) return null;

    const usuario = JSON.parse(salvo);

    if (!usuario?.id || !usuario?.perfil || !usuario?.municipio_id) {
      return null;
    }

    return {
      id: String(usuario.id),
      perfil: usuario.perfil,
      municipio_id: Number(usuario.municipio_id),
    };
  } catch {
    return null;
  }
}

export default function NovaNoticiaPage() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [resumo, setResumo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [status, setStatus] = useState("RASCUNHO");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      alert("Sessão inválida.");
      return;
    }

    if (
      ![
        "DESENVOLVEDOR",
        "ADMIN",
        "COMANDANTE",
        "DIRETOR",
        "PLANTONISTA",
      ].includes(usuario.perfil)
    ) {
      alert("Você não possui permissão para cadastrar notícia.");
      return;
    }

    if (!titulo.trim()) {
      alert("Informe o título.");
      return;
    }

    if (titulo.trim().length < 5) {
      alert("Título muito curto.");
      return;
    }

    if (!categoria.trim()) {
      alert("Informe a categoria.");
      return;
    }

    if (status === "PUBLICADA" && conteudo.trim().length < 20) {
      alert("Para publicar, informe um conteúdo com pelo menos 20 caracteres.");
      return;
    }

    setSalvando(true);

    const { data, error } = await supabase
      .from("noticias_cidadao")
      .insert({
        municipio_id: usuario.municipio_id,
        criado_por: usuario.id,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
        titulo: titulo.trim(),
        categoria: categoria.trim(),
        resumo: resumo.trim() || null,
        conteudo: conteudo.trim() || null,
        status,
      })
      .select("id, titulo")
      .single();

    setSalvando(false);

    if (error) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Notícias do Cidadão",
        acao: "ERRO",
        descricao: "Erro ao cadastrar notícia do cidadão.",
        tabela: "noticias_cidadao",
        detalhes: {
          erro: error.message,
          titulo: titulo.trim(),
          categoria: categoria.trim(),
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao salvar notícia.");
      return;
    }

    await registrarAuditoria({
      modulo: "Notícias do Cidadão",
      acao: "CRIAR",
      descricao: `Cadastrou a notícia ${data?.titulo}.`,
      tabela: "noticias_cidadao",
      registro_id: data?.id,
      detalhes: {
        titulo: data?.titulo,
        categoria: categoria.trim(),
        status,
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
      },
    });

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
              <label className="label">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="input mt-2"
              >
                <option value="">Selecione</option>
                <option value="COMUNICADO_OFICIAL">Comunicado oficial</option>
                <option value="ACAO_DA_GUARDA">Ação da Guarda</option>
                <option value="EDUCACAO_PREVENTIVA">
                  Educação preventiva
                </option>
                <option value="TRANSITO">Trânsito</option>
                <option value="EVENTOS">Eventos</option>
                <option value="SERVICOS_PUBLICOS">Serviços públicos</option>
                <option value="ALERTA_POPULACAO">Alerta à população</option>
                <option value="OUTROS_ASSUNTOS">Outros assuntos</option>
              </select>
            </div>

            <div>
              <label className="label">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input mt-2"
              >
                <option value="RASCUNHO">Rascunho</option>
                <option value="PUBLICADA">Publicada</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Resumo</label>
            <textarea
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              rows={3}
              maxLength={500}
              className="input mt-2"
              placeholder="Resumo curto da notícia..."
            />
          </div>

          <div>
            <label className="label">Conteúdo</label>
            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={8}
              maxLength={5000}
              className="input mt-2"
              placeholder="Conteúdo completo da notícia..."
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <button
              type="button"
              onClick={salvar}
              disabled={salvando}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              <Save size={18} />
              {salvando ? "Salvando..." : "Salvar Notícia"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/sistema/portal-cidadao/noticias")}
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <XCircle size={18} />
              Cancelar
            </button>
          </div>
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
  onChange: (valor: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>

      <input
        value={value}
        maxLength={180}
        onChange={(e) => onChange(e.target.value)}
        className="input mt-2"
      />
    </div>
  );
}