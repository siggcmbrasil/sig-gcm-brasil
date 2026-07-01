"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function BuscaPage() {
  const params = useSearchParams();
  const q = params.get("q") || "";
  const router = useRouter();

  const usuarioLogado =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  const [termoBusca, setTermoBusca] = useState(q);
  const [resultados, setResultados] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    setTermoBusca(q);

    if (q.trim()) {
      buscar();
    } else {
      setResultados([]);
    }
  }, [q]);

  async function buscar() {
    if (!usuarioLogado.municipio_id) {
      alert("Município não identificado.");
      return;
    }

    const termoLimpo = q.toLowerCase().trim();
    const nomeUsuario =
      usuarioLogado?.nome?.toLowerCase().trim() || "";

    if (termoLimpo === nomeUsuario) {
      router.push("/sistema/perfil");
      return;
    }

    if (
      termoLimpo.includes("perfil") ||
      termoLimpo.includes("minha foto") ||
      termoLimpo.includes("minha conta")
    ) {
      const { data: meuGuarda } = await supabase
        .from("guardas")
        .select("id")
        .ilike("nome", `%${usuarioLogado.nome}%`)
        .eq("municipio_id", usuarioLogado.municipio_id)
        .limit(1)
        .single();

      if (meuGuarda?.id) {
        router.push(`/sistema/guardas/${meuGuarda.id}`);
        return;
      }

      router.push("/sistema/perfil");
      return;
    }

    setCarregando(true);

    const termo = `%${q}%`;

    try {
      const { data: guardas } = await supabase
        .from("guardas")
        .select("id, nome, status")
        .eq("municipio_id", usuarioLogado.municipio_id)
        .ilike("nome", termo)
        .limit(5);

      const { data: ocorrencias } = await supabase
        .from("ocorrencias")
        .select("id, protocolo, tipo, local, status")
        .eq("municipio_id", usuarioLogado.municipio_id)
        .or(
          `tipo.ilike.${termo},local.ilike.${termo},protocolo.ilike.${termo}`
        )
        .limit(5);

      const { data: viaturas } = await supabase
        .from("viaturas")
        .select("id, prefixo, modelo, status")
        .eq("municipio_id", usuarioLogado.municipio_id)
        .or(`prefixo.ilike.${termo},modelo.ilike.${termo}`)
        .limit(5);

      const { data: locais } = await supabase
        .from("locais")
        .select("id, nome, tipo")
        .eq("municipio_id", usuarioLogado.municipio_id)
        .ilike("nome", termo)
        .limit(5);

      setResultados([
        ...(guardas || []).map((i) => ({
          tipo: "Guarda",
          icone: "👮",
          titulo: i.nome,
          detalhe: i.status,
          href: `/sistema/guardas/${i.id}`,
        })),

        ...(ocorrencias || []).map((i) => ({
          tipo: "Ocorrência",
          icone: "🚨",
          titulo: i.tipo,
          detalhe: `${i.local} • ${i.status}`,
          href: `/sistema/ocorrencias/${i.id}`,
        })),

        ...(viaturas || []).map((i) => ({
          tipo: "Viatura",
          icone: "🚓",
          titulo: i.prefixo,
          detalhe: `${i.modelo} • ${i.status}`,
          href: "/sistema/frota",
        })),

        ...(locais || []).map((i) => ({
          tipo: "Local",
          icone: "📍",
          titulo: i.nome,
          detalhe: i.tipo || "Local cadastrado",
          href: "/sistema/locais",
        })),
      ]);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-3xl font-black">
          Busca Global
        </h1>

        <p className="text-slate-400 mt-2">
          Pesquise por guardas, ocorrências, viaturas e locais.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();

          if (!termoBusca.trim()) return;

          router.push(
            `/sistema/busca?q=${encodeURIComponent(
              termoBusca.trim()
            )}`
          );
        }}
        className="painel-premium p-4 flex gap-3"
      >
        <input
          className="input flex-1"
          placeholder="Digite sua pesquisa..."
          value={termoBusca}
          onChange={(e) =>
            setTermoBusca(e.target.value)
          }
        />

        <button
          type="submit"
          className="btn-primary inline-flex items-center gap-2"
        >
          <Search className="w-5 h-5" />
          Buscar
        </button>
      </form>

      {q && (
        <p className="text-slate-400">
          Resultado para:{" "}
          <strong className="text-white">
            {q}
          </strong>
        </p>
      )}

      {carregando ? (
        <div className="painel-premium p-6">
          Buscando...
        </div>
      ) : resultados.length === 0 ? (
        <div className="painel-premium p-6 text-slate-400">
          Nenhum resultado encontrado.
        </div>
      ) : (
        <div className="space-y-3">
          {resultados.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="painel-premium p-4 flex items-center gap-4 hover:bg-blue-950/30 transition"
            >
              <span className="text-3xl">
                {item.icone}
              </span>

              <div>
                <p className="text-xs text-blue-400 font-bold uppercase">
                  {item.tipo}
                </p>

                <h2 className="font-black text-lg">
                  {item.titulo}
                </h2>

                <p className="text-slate-400 text-sm">
                  {item.detalhe}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}