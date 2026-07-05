"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Filter, Newspaper, Plus, Search } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigButton from "@/components/sig/SigButton";

type UsuarioLogado = {
  id: number;
  municipio_id: number;
  perfil?: string;
};

type Publicacao = {
  id: number;
  titulo: string | null;
  autor: string | null;
  categoria: string | null;
  resumo: string | null;
  data_publicacao: string | null;
  created_at: string | null;
};

export default function BlogOperacionalPage() {
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function iniciar() {
      const usuario = JSON.parse(
        localStorage.getItem("usuarioLogado") || "{}"
      ) as UsuarioLogado;

      if (!usuario?.id || !usuario?.municipio_id) {
        alert("Sessão inválida.");
        setCarregando(false);
        return;
      }

      await registrarAuditoria({
        modulo: "Blog Operacional",
        acao: "ACESSO",
        descricao: "Acessou o Blog Operacional.",
        tabela: "blog_operacional",
        detalhes: {
          usuario_id: usuario.id,
          municipio_id: usuario.municipio_id,
        },
      });

      await carregarPublicacoes(usuario);
    }

    iniciar();
  }, []);

  async function carregarPublicacoes(usuario: UsuarioLogado) {
    setCarregando(true);

    const { data, error } = await supabase
      .from("blog_operacional")
      .select("id, titulo, autor, categoria, resumo, data_publicacao, created_at")
      .eq("municipio_id", usuario.municipio_id)
      .order("created_at", { ascending: false })
      .range(0, 99);

    setCarregando(false);

    if (error) {
      await registrarAuditoria({
        modulo: "Blog Operacional",
        acao: "ERRO",
        descricao: "Erro ao carregar publicações.",
        tabela: "blog_operacional",
        detalhes: {
          erro: error.message,
          usuario_id: usuario.id,
          municipio_id: usuario.municipio_id,
        },
      });

      alert("Erro ao carregar publicações.");
      return;
    }

    setPublicacoes(data || []);
  }

  const lista = useMemo(() => {
    return publicacoes.filter((item) => {
      const texto = `
        ${item.titulo || ""}
        ${item.autor || ""}
        ${item.categoria || ""}
        ${item.resumo || ""}
      `.toLowerCase();

      return texto.includes(busca.toLowerCase());
    });
  }, [publicacoes, busca]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <SigPageHeader
        titulo="Blog Operacional"
        subtitulo="Notícias, comunicados e informativos da Guarda Municipal."
        icone={Newspaper}
      />

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 border border-slate-700 rounded-xl px-3 py-2">
              <Search size={18} />

              <input
                className="w-full bg-transparent outline-none"
                placeholder="Pesquisar publicação..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>

          <SigButton icon={Filter}>Filtrar</SigButton>

          <Link href="/sistema/blog-operacional/nova">
            <SigButton icon={Plus}>Nova Publicação</SigButton>
          </Link>
        </div>
      </SigCard>

      <div className="space-y-4">
        {carregando ? (
          <SigCard>
            <p className="text-center text-slate-400 py-10">
              Carregando publicações...
            </p>
          </SigCard>
        ) : lista.length === 0 ? (
          <SigCard>
            <p className="text-center text-slate-400 py-10">
              Nenhuma publicação encontrada.
            </p>
          </SigCard>
        ) : (
          lista.map((item) => (
            <SigCard key={item.id}>
              <div className="space-y-3">
                <div>
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                    {item.categoria || "Geral"}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-white">
                  {item.titulo || "Sem título"}
                </h2>

                <p className="text-sm text-slate-400">
                  {item.autor || "SIG-GCM Brasil"} •{" "}
                  {item.data_publicacao
                    ? new Date(item.data_publicacao).toLocaleDateString("pt-BR")
                    : item.created_at
                      ? new Date(item.created_at).toLocaleDateString("pt-BR")
                      : "Data não informada"}
                </p>

                <p className="text-slate-300 whitespace-pre-wrap break-words">
                  {item.resumo || "Sem resumo."}
                </p>

                <Link
                  href={`/sistema/blog-operacional/${item.id}`}
                  className="text-emerald-400 font-semibold inline-block"
                >
                  Ler matéria →
                </Link>
              </div>
            </SigCard>
          ))
        )}
      </div>
    </div>
  );
}