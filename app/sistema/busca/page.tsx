"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BuscaPage() {
  const params = useSearchParams();
  const q = params.get("q") || "";

  const [resultados, setResultados] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (q.trim()) buscar();
  }, [q]);

  async function buscar() {
    setCarregando(true);

    const termo = `%${q}%`;

    const { data: guardas } = await supabase
      .from("guardas")
      .select("id, nome, status")
      .ilike("nome", termo)
      .limit(5);

    const { data: ocorrencias } = await supabase
      .from("ocorrencias")
      .select("id, protocolo, tipo, local, status")
      .or(`tipo.ilike.${termo},local.ilike.${termo},protocolo.ilike.${termo}`)
      .limit(5);

    const { data: viaturas } = await supabase
      .from("viaturas")
      .select("id, prefixo, modelo, status")
      .or(`prefixo.ilike.${termo},modelo.ilike.${termo}`)
      .limit(5);

    const { data: locais } = await supabase
      .from("locais")
      .select("id, nome, tipo")
      .ilike("nome", termo)
      .limit(5);

    setResultados([
      ...(guardas || []).map((i) => ({
        tipo: "Guarda",
        icone: "👮",
        titulo: i.nome,
        detalhe: i.status,
        href: "/sistema/guardas",
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
        href: "/sistema/viatura",
      })),
      ...(locais || []).map((i) => ({
        tipo: "Local",
        icone: "📍",
        titulo: i.nome,
        detalhe: i.tipo || "Local cadastrado",
        href: "/sistema/locais",
      })),
    ]);

    setCarregando(false);
  }

  return (
    <section className="p-6 text-white">
      <h1 className="text-3xl font-black mb-2">🔍 Busca Global</h1>

      <p className="text-slate-400 mb-6">
        Resultado para: <strong className="text-white">{q}</strong>
      </p>

      {carregando ? (
        <div className="painel-premium p-6">Buscando...</div>
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
              <span className="text-3xl">{item.icone}</span>

              <div>
                <p className="text-xs text-blue-400 font-bold uppercase">
                  {item.tipo}
                </p>
                <h2 className="font-black text-lg">{item.titulo}</h2>
                <p className="text-slate-400 text-sm">{item.detalhe}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}