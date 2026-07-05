"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Newspaper,
  Plus,
  Search,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigButton from "@/components/sig/SigButton";

type UsuarioLogado = {
  id: string;
  perfil: string;
  municipio_id: number;
};

type Noticia = {
  id: number;
  titulo: string;
  categoria: string | null;
  resumo: string | null;
  status: string | null;
  criado_em: string | null;
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

export default function NoticiasPage() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("TODAS");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    void carregar();
  }, []);

  async function carregar() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      setCarregando(false);
      return;
    }

    setCarregando(true);

    let query = supabase
      .from("noticias_cidadao")
      .select("id, titulo, categoria, resumo, status, criado_em")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false })
      .limit(100);

    if (status !== "TODAS") {
      query = query.eq("status", status);
    }

    if (busca.trim()) {
      const termo = busca.trim();

      query = query.or(
        `titulo.ilike.%${termo}%,categoria.ilike.%${termo}%,resumo.ilike.%${termo}%`
      );
    }

    const { data, error } = await query;

    setCarregando(false);

    if (error) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Notícias do Cidadão",
        acao: "ERRO",
        descricao: "Erro ao carregar notícias do cidadão.",
        tabela: "noticias_cidadao",
        detalhes: {
          erro: error.message,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao carregar notícias.");
      return;
    }

    setNoticias((data || []) as Noticia[]);
  }

  const rascunhos = noticias.filter((n) => n.status === "RASCUNHO").length;
  const publicadas = noticias.filter((n) => n.status === "PUBLICADA").length;
  const arquivadas = noticias.filter((n) => n.status === "ARQUIVADA").length;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Notícias"
        subtitulo="Publicações, comunicados e informações oficiais ao cidadão."
        icone={Newspaper}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          titulo="Notícias"
          valor={noticias.length}
          icone={<Newspaper className="w-7 h-7 text-blue-400" />}
        />

        <Card
          titulo="Rascunhos"
          valor={rascunhos}
          icone={<Clock className="w-7 h-7 text-yellow-400" />}
        />

        <Card
          titulo="Publicadas"
          valor={publicadas}
          icone={<CheckCircle className="w-7 h-7 text-green-400" />}
        />

        <Card
          titulo="Arquivadas"
          valor={arquivadas}
          icone={<AlertCircle className="w-7 h-7 text-red-400" />}
        />
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            className="input flex-1"
            placeholder="Pesquisar notícia..."
            value={busca}
            maxLength={80}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="input md:w-60"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="TODAS">Todas</option>
            <option value="RASCUNHO">Rascunho</option>
            <option value="PUBLICADA">Publicada</option>
            <option value="ARQUIVADA">Arquivada</option>
          </select>

          <SigButton type="gold" onClick={carregar}>
            <Search className="w-4 h-4" />
            Consultar
          </SigButton>

          <Link href="/sistema/portal-cidadao/noticias/nova">
            <SigButton type="blue">
              <Plus className="w-4 h-4" />
              Nova Notícia
            </SigButton>
          </Link>
        </div>
      </SigCard>

      <SigCard>
        {carregando ? (
          <p className="text-slate-400">Carregando notícias...</p>
        ) : noticias.length === 0 ? (
          <div className="text-center py-16">
            <Newspaper className="w-16 h-16 mx-auto text-slate-600 mb-4" />

            <h2 className="text-xl font-black text-white">
              Nenhuma notícia cadastrada
            </h2>

            <p className="text-slate-400 mt-2">
              As notícias e comunicados publicados aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {noticias.map((noticia) => (
              <div
                key={noticia.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="text-white font-black">{noticia.titulo}</p>

                    <p className="text-slate-400 text-sm">
                      {noticia.categoria || "Sem categoria"}
                    </p>
                  </div>

                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold text-slate-300">
                    {noticia.status || "RASCUNHO"}
                  </span>
                </div>

                {noticia.resumo && (
                  <p className="text-slate-300 mt-3 line-clamp-2">
                    {noticia.resumo}
                  </p>
                )}

                <p className="text-xs text-slate-500 mt-4">
                  Criada em:{" "}
                  {noticia.criado_em
                    ? new Date(noticia.criado_em).toLocaleString("pt-BR")
                    : "N/I"}
                </p>
              </div>
            ))}
          </div>
        )}
      </SigCard>
    </div>
  );
}

function Card({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: number;
  icone: React.ReactNode;
}) {
  return (
    <div className="painel-premium p-5">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-slate-400 text-sm">{titulo}</p>
          <h2 className="text-3xl font-black text-white">{valor}</h2>
        </div>

        {icone}
      </div>
    </div>
  );
}