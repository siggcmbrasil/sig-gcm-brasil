"use client";

import { useEffect, useState } from "react";
import { MessageSquareText, Send, ShieldCheck } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function FeedSIGPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

 async function carregar() {
  if (!usuario?.municipio_id) return;

  const { data } = await supabase
      .from("feed_sig")
      .select("*")
      .eq("municipio_id", usuario?.municipio_id)
      .order("id", { ascending: false });

    setPosts(data || []);
  }

  useEffect(() => {
    carregar();
  }, []);

 async function publicar() {
  if (!usuario?.id || !usuario?.municipio_id) {
    alert("Sessão inválida.");
    return;
  }

  if (!texto.trim()) {
      alert("Digite uma mensagem antes de publicar.");
      return;
    }

    setCarregando(true);

    const { error } = await supabase.from("feed_sig").insert([
  {
    usuario_id: usuario.id,
    municipio_id: usuario.municipio_id,
    texto: texto.trim(),
  },
]);

if (error) {
  console.error(error);
  alert("Erro ao publicar.");
  setCarregando(false);
  return;
}

await registrarAuditoria({
  modulo: "Feed SIG",
  acao: "PUBLICAR",
  descricao: "Publicou no Feed SIG.",
  tabela: "feed_sig",
  detalhes: {
    texto: texto.trim().slice(0, 200),
  },
});

    setTexto("");
    await carregar();
    setCarregando(false);
  }

  return (
  <ProtecaoModulo modulo="feed_sig">
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Feed SIG-GCM Brasil"
        subtitulo="Comunicação interna e publicações institucionais do município."
        icone={MessageSquareText}
      />

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4">
            <ShieldCheck className="w-10 h-10 text-yellow-400" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-bold">
              Rede Interna
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Mural Operacional
            </h2>

            <p className="text-slate-400 mt-2 max-w-3xl leading-relaxed">
              Publique avisos, comunicados, orientações e atualizações internas
              para os integrantes do município.
            </p>
          </div>
        </div>
      </SigCard>

      <SigCard>
        <h3 className="text-xl font-black text-white mb-4">
          Nova Publicação
        </h3>

        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Digite um comunicado para o feed..."
          className="w-full min-h-32 rounded-2xl border border-slate-700 bg-slate-900 p-4 text-sm text-white outline-none focus:border-yellow-500"
        />

        <button
          onClick={publicar}
          disabled={carregando}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-6 py-3 text-sm font-black text-slate-950 hover:bg-yellow-400 transition disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
          {carregando ? "Publicando..." : "Publicar"}
        </button>
      </SigCard>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <SigCard>
            <p className="text-slate-400">
              Nenhuma publicação encontrada.
            </p>
          </SigCard>
        ) : (
          posts.map((post) => (
            <SigCard key={post.id}>
              <p className="text-white whitespace-pre-wrap">
                {post.texto}
              </p>

              <p className="text-xs text-slate-500 mt-4">
                Publicação #{post.id}
              </p>
            </SigCard>
          ))
        )}
      </div>
        </div>
  </ProtecaoModulo>
);
}